# Meeting Summarizer AI

> Transcribe meeting audio and generate action-oriented summaries, key decisions, and structured deliverables using ASR (OpenAI Whisper) and LLMs (Claude / OpenAI).

![Meeting Summarizer Architecture](https://img.shields.io/badge/Architecture-Flask%20%7C%20React%20%7C%20Whisper%20%7C%20Claude-indigo)
![License](https://img.shields.io/badge/License-MIT-blue.svg)

---

## Executive Overview

**Meeting Summarizer** is an automated end-to-end intelligence tool designed for modern teams. It converts raw audio recordings into:
1. **Verbatim & High-Accuracy Transcript**: Powered by OpenAI Whisper ASR.
2. **Executive Summary**: High-level synthesis of meeting topics and outcomes.
3. **Key Decisions**: Bulleted list of strategic decisions reached during discussion.
4. **Action Items & Deliverables**: Structured tasks with assigned owners, due dates, and interactive completion tracking.

---

## Demo Video

Watch a complete video walkthrough of audio upload, transcript generation, LLM summarization, and task tracking:
- [Watch Demo Video on Loom](https://www.loom.com/share/58f123327cb64dea9788ff168b91119d)

---

## Architecture & Data Pipeline

```
  ┌─────────────────┐
  │ Audio Recording │ (.mp3, .wav, .m4a, .webm)
  └────────┬────────┘
           │
           ▼
  ┌─────────────────┐
  │  Flask Backend  │ ──► Saves file to uploads/
  └────────┬────────┘
           │
           ▼
┌─────────────────────┐
│  Whisper ASR Engine │ ──► Transcribes speech to text
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│    LLM Service      │ ──► Formats transcript into structured JSON
│ (Claude 3.5 Sonnet) │     (Summary + Key Decisions + Action Items)
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Database Storage   │ ──► SQLite (default zero-config) / PostgreSQL
│ (Flask-SQLAlchemy)  │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│   React Dashboard   │ ──► Audio player, summary box, interactive
│  (Modern Web UI)    │     task checklist & transcript view
└─────────────────────┘
```

---

## Key Features & Highlights

- **Multi-Format Audio Support**: Transcribe `.mp3`, `.wav`, `.m4a`, `.ogg`, `.flac`, and `.webm` files.
- **Zero-Config Out-of-the-Box Local Execution**: Automatically defaults to SQLite (`sqlite:///meeting_summarizer.db`) so no database setup or Docker container is required for local execution.
- **Structured LLM Prompting**: Guarantees parseable JSON output separating executive summary, key decisions, and action items with `owner` and `due_date`.
- **Interactive Deliverable Tracking**: Toggle task completion status in real-time from the web interface.
- **Evaluation Ready Demo Mode**: Includes 1-click audio demo generator to evaluate transcription & summarization pipeline without requiring audio file uploads.

---

## Technology Stack

| Layer | Component | Description |
|---|---|---|
| **Frontend** | React + Vite + CSS Glassmorphism | Dark-themed, responsive dashboard with drag & drop uploader |
| **Backend** | Flask (Python 3.9+) | RESTful API server handling audio upload & async processing |
| **ASR** | OpenAI Whisper | Local/API Speech-to-Text transcription model |
| **LLM** | Anthropic Claude API / OpenAI | Structured JSON meeting summary and task parser |
| **Database** | SQLAlchemy (SQLite / PostgreSQL) | Persistent storage for meetings, transcripts, and action items |

---

## Installation & Setup Instructions

### Prerequisites
- **Python 3.9+**
- **Node.js 18+**

### 1. Clone Repository
```bash
git clone https://github.com/your-username/meeting-summarizer.git
cd meeting-summarizer
```

### 2. Backend Setup
```bash
# Install Python dependencies
pip install -r requirements.txt

# (Optional) Environment Variables
cp .env.example .env
```

Set optional keys in `.env`:
```env
ANTHROPIC_API_KEY=your_claude_api_key_here
OPENAI_API_KEY=your_openai_api_key_here
DATABASE_URL=sqlite:///meeting_summarizer.db
```

### 3. Run Backend Server
```bash
python app.py
```
The Flask API server starts on **`http://localhost:5000`**.

### 4. Frontend Setup & Run
In a new terminal tab:
```bash
cd frontend
npm install
npm run dev
```
The React web application opens on **`http://localhost:3000`**.

---

## LLM Prompting Strategy

The LLM summarization pipeline in `llm_service.py` uses system instructions with JSON schema enforcement:

```text
You are an expert executive meeting assistant.
Given a meeting transcript, produce a structured summary in valid JSON format.

The output MUST strictly be a valid JSON object matching this schema:
{
  "summary": "Concise paragraph summarizing core outcomes...",
  "key_decisions": ["Key decision 1", "Key decision 2"],
  "action_items": [
    {
      "task": "Action description",
      "owner": "Person responsible or 'Unassigned'",
      "due_date": "YYYY-MM-DD or TBD"
    }
  ]
}
```

---

## REST API Endpoint Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Health check endpoint |
| `POST` | `/api/upload` | Upload audio file and run ASR + LLM pipeline |
| `GET` | `/api/meetings` | Retrieve list of all meeting sessions |
| `GET` | `/api/meetings/<id>` | Fetch full meeting transcript, summary & tasks |
| `POST` | `/api/meetings/<id>/process` | Re-run ASR and LLM pipeline for a meeting |
| `PATCH` | `/api/action-items/<id>` | Toggle action item status (`pending` / `completed`) |
| `DELETE` | `/api/meetings/<id>` | Delete meeting session and stored audio |
| `GET` | `/api/audio/<filename>` | Stream audio recording |

---

## Repository Cleanliness Checklist

- [x] Branch: `main`
- [x] Excluded `node_modules/`
- [x] Excluded `.env` and API secrets
- [x] Excluded database artifacts (`*.db`)
- [x] Excluded build outputs (`dist/`, `build/`)
- [x] Excluded IDE config files (`.vscode/`, `.idea/`)
- [x] Clean modular directory structure
