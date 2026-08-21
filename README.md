# meeting-summarizer
# Meeting Summarizer

Transcribe meeting audio and generate action-oriented summaries using ASR + LLM.

## Overview

This project takes a meeting audio file as input and produces:
- A full text transcript
- A concise summary
- Key decisions made during the meeting
- A structured list of action items (task, owner, due date)

## Architecture

```
Audio File
   │
   ▼
[Whisper ASR] ── transcribes audio → transcript
   │
   ▼
[LLM (Claude API)] ── summarizes transcript → summary + key decisions + action items
   │
   ▼
[PostgreSQL] ── stores meeting + transcript + summary + action items
   │
   ▼
[React Frontend] ── upload audio, view transcript/summary/action items
```

**Flow:**
1. User uploads audio via React frontend
2. Flask backend saves the file and creates a `Meeting` record
3. Whisper transcribes the audio → transcript saved to DB
4. Transcript sent to Claude with a summarization prompt → structured JSON returned
5. Summary, key decisions, and action items saved to DB
6. Frontend displays all results

## Tech Stack

| Layer | Tool |
|---|---|
| ASR | OpenAI Whisper |
| LLM | Claude API (Anthropic) |
| Backend | Flask + Flask-SQLAlchemy |
| Database | PostgreSQL |
| Frontend | React |
| Version Control | GitHub |

## Project Structure

```
meeting-summarizer/
├── app.py                  # Flask app & API routes
├── models.py                # SQLAlchemy models (Meeting, ActionItem)
├── whisper_service.py        # Whisper transcription logic
├── llm_service.py            # Claude API summarization logic
├── requirements.txt
├── .env.example
├── uploads/                  # Uploaded audio files (gitignored)
└── frontend/                 # React app
    └── src/
        ├── App.js
        └── App.css
```

## Setup Instructions

### Prerequisites
- Python 3.9+
- Node.js 16+
- PostgreSQL (or Docker)
- Anthropic API key

### 1. Clone the repo
```bash
git clone https://github.com/<your-username>/meeting-summarizer.git
cd meeting-summarizer
```

### 2. Backend setup
```bash
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 3. Database setup
```bash
docker run --name meeting-db -e POSTGRES_PASSWORD=yourpassword \
  -e POSTGRES_DB=meeting_summarizer -p 5432:5432 -d postgres
```

### 4. Environment variables
Copy `.env.example` to `.env` and fill in your values:
```bash
cp .env.example .env
```
```
DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/meeting_summarizer
ANTHROPIC_API_KEY=your_key_here
```

### 5. Run the backend
```bash
python app.py
```
Backend runs on `http://localhost:5000`

### 6. Frontend setup
```bash
cd frontend
npm install
npm start
```
Frontend runs on `http://localhost:3000`

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | `/upload` | Upload an audio file, creates a meeting record |
| POST | `/transcribe/<meeting_id>` | Runs Whisper transcription on the uploaded audio |
| POST | `/summarize/<meeting_id>` | Generates summary + key decisions + action items via LLM |
| GET | `/meetings/<meeting_id>` | Returns full meeting data (transcript, summary, action items) |

## Sample Input/Output

**Input:** Short meeting audio clip (`.mp3`/`.wav`/`.m4a`)

**Output:**
```json
{
  "summary": "The team discussed Q3 roadmap priorities and agreed on shipping the new dashboard feature first.",
  "key_decisions": [
    "Dashboard feature will be prioritized over mobile redesign",
    "Release target moved to end of Q3"
  ],
  "action_items": [
    {"task": "Finalize dashboard wireframes", "owner": "Priya", "due_date": "2026-09-01"},
    {"task": "Set up staging environment", "owner": "Alex", "due_date": "2026-08-28"}
  ]
}
```

## Known Limitations

- Whisper transcription accuracy drops with heavy background noise, overlapping speakers, or strong accents
- Very long audio files may take significant time to transcribe on CPU-only machines
- LLM-generated action items depend on transcript quality — garbled transcripts produce weaker summaries
- No speaker diarization (doesn't distinguish who said what)

## Demo Video

[Link to demo video] — walkthrough of upload → transcript → summary → action items → DB records

## Evaluation Focus

- Transcription accuracy
- Summary quality
- LLM prompt effectiveness
- Code structure
