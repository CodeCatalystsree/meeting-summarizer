import json
import uuid
from datetime import datetime
import importlib

try:
    from flask_sqlalchemy import SQLAlchemy  # type: ignore
except ImportError:
    try:
        SQLAlchemy = importlib.import_module("flask_sqlalchemy").SQLAlchemy  # type: ignore
    except Exception:
        SQLAlchemy = object  # Fallback stub for static linter analysis

db = SQLAlchemy()

class Meeting(db.Model):
    __tablename__ = 'meetings'

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    title = db.Column(db.String(255), nullable=False, default="Untitled Meeting")
    filename = db.Column(db.String(255), nullable=False)
    original_filename = db.Column(db.String(255), nullable=False)
    file_size = db.Column(db.Integer, nullable=True)
    duration = db.Column(db.Float, nullable=True)
    status = db.Column(db.String(50), nullable=False, default="uploaded")  # uploaded, transcribing, summarizing, completed, failed
    transcript = db.Column(db.Text, nullable=True)
    summary = db.Column(db.Text, nullable=True)
    key_decisions_json = db.Column(db.Text, nullable=True, default="[]")
    error_message = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    action_items = db.relationship('ActionItem', backref='meeting', lazy=True, cascade="all, delete-orphan")

    @property
    def key_decisions(self):
        if not self.key_decisions_json:
            return []
        try:
            return json.loads(self.key_decisions_json)
        except Exception:
            return []

    @key_decisions.setter
    def key_decisions(self, value):
        if isinstance(value, list):
            self.key_decisions_json = json.dumps(value)
        else:
            self.key_decisions_json = json.dumps([])

    def to_dict(self):
        return {
            "id": self.id,
            "title": self.title,
            "filename": self.filename,
            "original_filename": self.original_filename,
            "file_size": self.file_size,
            "duration": self.duration,
            "status": self.status,
            "transcript": self.transcript or "",
            "summary": self.summary or "",
            "key_decisions": self.key_decisions,
            "action_items": [item.to_dict() for item in self.action_items],
            "error_message": self.error_message,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }

class ActionItem(db.Model):
    __tablename__ = 'action_items'

    id = db.Column(db.Integer, primary_key=True)
    meeting_id = db.Column(db.String(36), db.ForeignKey('meetings.id'), nullable=False)
    task = db.Column(db.Text, nullable=False)
    owner = db.Column(db.String(100), nullable=True, default="Unassigned")
    due_date = db.Column(db.String(50), nullable=True, default="TBD")
    status = db.Column(db.String(20), nullable=False, default="pending")  # pending, completed
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "meeting_id": self.meeting_id,
            "task": self.task,
            "owner": self.owner or "Unassigned",
            "due_date": self.due_date or "TBD",
            "status": self.status,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }
