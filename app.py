import os
from werkzeug.utils import secure_filename  # type: ignore
from flask import Flask, request, jsonify, send_from_directory, send_file  # type: ignore
from flask_cors import CORS  # type: ignore
from dotenv import load_dotenv  # type: ignore

from models import db, Meeting, ActionItem
from whisper_service import transcribe_audio
from llm_service import generate_meeting_summary

# Load environment variables
load_dotenv()

app = Flask(__name__, static_folder="frontend/dist", static_url_path="")
CORS(app)

# Configuration
UPLOAD_FOLDER = os.path.join(os.path.abspath(os.path.dirname(__file__)), 'uploads')
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 100 * 1024 * 1024  # 100MB limit

# Database configuration: fallback to SQLite if DATABASE_URL is missing or psycopg2 is not installed
database_url = os.getenv('DATABASE_URL')
if database_url and ("postgres" in database_url):
    try:
        import psycopg2  # type: ignore
        if database_url.startswith("postgres://"):
            database_url = database_url.replace("postgres://", "postgresql://", 1)
    except ImportError:
        print("Note: psycopg2 driver not found. Falling back to local SQLite database.")
        database_url = None

app.config['SQLALCHEMY_DATABASE_URI'] = database_url or f"sqlite:///{os.path.join(os.path.abspath(os.path.dirname(__file__)), 'meeting_summarizer.db')}"
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db.init_app(app)

ALLOWED_EXTENSIONS = {'mp3', 'wav', 'm4a', 'ogg', 'flac', 'aac', 'webm'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

with app.app_context():
    db.create_all()


@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({
        "status": "healthy",
        "service": "Meeting Summarizer API",
        "database": "connected"
    }), 200


@app.route('/api/upload', methods=['POST'])
def upload_audio():
    if 'file' not in request.files:
        return jsonify({"error": "No file part in request"}), 400

    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400

    if not allowed_file(file.filename):
        return jsonify({"error": f"Invalid file type. Allowed: {', '.join(ALLOWED_EXTENSIONS)}"}), 400

    original_filename = secure_filename(file.filename)
    title = request.form.get('title', '').strip() or os.path.splitext(original_filename)[0].replace('_', ' ').replace('-', ' ').title()

    meeting = Meeting(
        title=title,
        filename="",
        original_filename=original_filename,
        status="uploaded"
    )
    db.session.add(meeting)
    db.session.commit()

    saved_filename = f"{meeting.id}_{original_filename}"
    file_path = os.path.join(app.config['UPLOAD_FOLDER'], saved_filename)
    file.save(file_path)

    meeting.filename = saved_filename
    meeting.file_size = os.path.getsize(file_path)
    db.session.commit()

    # Automatically trigger processing pipeline
    process_meeting_pipeline(meeting, file_path)

    return jsonify(meeting.to_dict()), 201


def process_meeting_pipeline(meeting, file_path):
    """Pipeline: Transcribe audio with Whisper -> Summarize with LLM -> Store in DB"""
    try:
        # Step 1: Transcribe
        meeting.status = "transcribing"
        db.session.commit()

        transcript = transcribe_audio(file_path)
        meeting.transcript = transcript
        meeting.status = "summarizing"
        db.session.commit()

        # Step 2: Summarize
        summary_result = generate_meeting_summary(transcript)
        meeting.summary = summary_result.get("summary", "")
        meeting.key_decisions = summary_result.get("key_decisions", [])
        meeting.status = "completed"

        # Save action items
        raw_items = summary_result.get("action_items", [])
        for item in raw_items:
            action_item = ActionItem(
                meeting_id=meeting.id,
                task=item.get("task", ""),
                owner=item.get("owner", "Unassigned"),
                due_date=item.get("due_date", "TBD"),
                status="pending"
            )
            db.session.add(action_item)

        db.session.commit()

    except Exception as e:
        db.session.rollback()
        meeting.status = "failed"
        meeting.error_message = str(e)
        db.session.commit()


@app.route('/api/meetings/<meeting_id>/process', methods=['POST'])
def process_meeting_endpoint(meeting_id):
    meeting = Meeting.query.get_or_404(meeting_id)
    file_path = os.path.join(app.config['UPLOAD_FOLDER'], meeting.filename)
    
    if not os.path.exists(file_path):
        return jsonify({"error": "Audio file missing from server"}), 404

    # Clear existing action items before re-processing
    ActionItem.query.filter_by(meeting_id=meeting.id).delete()
    process_meeting_pipeline(meeting, file_path)

    return jsonify(meeting.to_dict()), 200


@app.route('/api/meetings', methods=['GET'])
def list_meetings():
    meetings = Meeting.query.order_by(Meeting.created_at.desc()).all()
    return jsonify([m.to_dict() for m in meetings]), 200


@app.route('/api/meetings/<meeting_id>', methods=['GET'])
def get_meeting(meeting_id):
    meeting = Meeting.query.get_or_404(meeting_id)
    return jsonify(meeting.to_dict()), 200


@app.route('/api/meetings/<meeting_id>', methods=['DELETE'])
def delete_meeting(meeting_id):
    meeting = Meeting.query.get_or_404(meeting_id)
    
    # Remove file from disk
    if meeting.filename:
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], meeting.filename)
        if os.path.exists(file_path):
            try:
                os.remove(file_path)
            except Exception:
                pass

    db.session.delete(meeting)
    db.session.commit()
    return jsonify({"message": "Meeting deleted successfully"}), 200


@app.route('/api/action-items/<int:item_id>', methods=['PATCH'])
def update_action_item(item_id):
    item = ActionItem.query.get_or_404(item_id)
    data = request.get_json() or {}
    
    if 'status' in data:
        item.status = data['status']
    if 'task' in data:
        item.task = data['task']
    if 'owner' in data:
        item.owner = data['owner']
    if 'due_date' in data:
        item.due_date = data['due_date']

    db.session.commit()
    return jsonify(item.to_dict()), 200


@app.route('/api/audio/<filename>', methods=['GET'])
def get_audio_file(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)


# Serve frontend static files if present
@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve_frontend(path):
    dist_dir = os.path.join(app.root_path, 'frontend', 'dist')
    if path != "" and os.path.exists(os.path.join(dist_dir, path)):
        return send_from_directory(dist_dir, path)
    elif os.path.exists(os.path.join(dist_dir, 'index.html')):
        return send_from_directory(dist_dir, 'index.html')
    else:
        return jsonify({"message": "Meeting Summarizer API server is running."}), 200


if __name__ == '__main__':
    port = int(os.getenv('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=True)
