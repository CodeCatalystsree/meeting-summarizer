import React, { useState, useEffect } from 'react';

// SVG Icon Helpers
const MicIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"/>
    <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
    <line x1="12" y1="19" x2="12" y2="22"/>
  </svg>
);

const PlusIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);

const CheckCircleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
    <polyline points="22 4 12 14.01 9 11.01"/>
  </svg>
);

const ListTodoIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="5" width="6" height="6" rx="1"/>
    <path d="m3 17 2 2 4-4"/>
    <path d="M13 6h8"/><path d="M13 12h8"/><path d="M13 18h8"/>
  </svg>
);

const FileTextIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
    <polyline points="14 2 14 8 20 8"/>
    <line x1="16" y1="13" x2="8" y2="13"/>
    <line x1="16" y1="17" x2="8" y2="17"/>
    <line x1="10" y1="9" x2="8" y2="9"/>
  </svg>
);

const TrashIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/>
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
  </svg>
);

const RefreshIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 4 23 10 17 10"/>
    <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
  </svg>
);

const UploadCloudIcon = () => (
  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#818cf8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"/>
    <path d="M12 12v9"/><path d="m16 16-4-4-4 4"/>
  </svg>
);

export default function App() {
  const [meetings, setMeetings] = useState([]);
  const [selectedMeeting, setSelectedMeeting] = useState(null);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadFile, setUploadFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState('summary');

  const fetchMeetings = async () => {
    try {
      const res = await fetch('/api/meetings');
      if (res.ok) {
        const data = await res.json();
        setMeetings(data);
        if (data.length > 0 && !selectedMeeting) {
          setSelectedMeeting(data[0]);
        } else if (selectedMeeting) {
          // Keep current selected meeting updated
          const updated = data.find(m => m.id === selectedMeeting.id);
          if (updated) setSelectedMeeting(updated);
        }
      }
    } catch (err) {
      console.error("Failed to fetch meetings:", err);
    }
  };

  useEffect(() => {
    fetchMeetings();
    const interval = setInterval(fetchMeetings, 3000); // Auto-refresh for status updates
    return () => clearInterval(interval);
  }, []);

  const handleFileUpload = async (e) => {
    e.preventDefault();
    if (!uploadFile) return;

    setIsProcessing(true);
    const formData = new FormData();
    formData.append('file', uploadFile);
    if (uploadTitle) formData.append('title', uploadTitle);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        const newMeeting = await res.json();
        setIsUploadOpen(false);
        setUploadFile(null);
        setUploadTitle('');
        await fetchMeetings();
        setSelectedMeeting(newMeeting);
      } else {
        const errData = await res.json();
        alert(`Upload error: ${errData.error || 'Failed to upload'}`);
      }
    } catch (err) {
      alert(`Upload error: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCreateDemoMeeting = async () => {
    setIsProcessing(true);
    // Create a demo WAV audio blob using Web Audio API buffer
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const buffer = audioCtx.createBuffer(1, audioCtx.sampleRate * 2, audioCtx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < buffer.length; i++) {
        data[i] = Math.sin(i * 0.05) * 0.1; // simple tone wave
      }
      
      // Convert buffer to WAV blob
      const blob = await audioBufferToWavBlob(buffer);
      const file = new File([blob], "q3_strategy_meeting.wav", { type: "audio/wav" });

      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', 'Q3 Product Strategy & Roadmap');

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });

      if (res.ok) {
        const newMeeting = await res.json();
        setIsUploadOpen(false);
        await fetchMeetings();
        setSelectedMeeting(newMeeting);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleToggleActionItem = async (itemId, currentStatus) => {
    const newStatus = currentStatus === 'completed' ? 'pending' : 'completed';
    try {
      const res = await fetch(`/api/action-items/${itemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        fetchMeetings();
      }
    } catch (err) {
      console.error("Failed to update item:", err);
    }
  };

  const handleDeleteMeeting = async (meetingId) => {
    if (!window.confirm("Are you sure you want to delete this meeting?")) return;
    try {
      const res = await fetch(`/api/meetings/${meetingId}`, { method: 'DELETE' });
      if (res.ok) {
        setSelectedMeeting(null);
        fetchMeetings();
      }
    } catch (err) {
      console.error("Failed to delete meeting:", err);
    }
  };

  const handleReprocess = async (meetingId) => {
    setIsProcessing(true);
    try {
      const res = await fetch(`/api/meetings/${meetingId}/process`, { method: 'POST' });
      if (res.ok) {
        const updated = await res.json();
        setSelectedMeeting(updated);
        fetchMeetings();
      }
    } catch (err) {
      console.error("Reprocess failed:", err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="app-container">
      {/* Header Bar */}
      <header className="app-header glass-panel">
        <div className="brand">
          <div className="brand-icon">
            <MicIcon />
          </div>
          <div>
            <h1 className="brand-title">Meeting Summarizer AI</h1>
            <p className="brand-subtitle">Automated ASR Transcription & Action-Oriented Summaries</p>
          </div>
        </div>
        <button className="btn-primary" onClick={() => setIsUploadOpen(true)}>
          <PlusIcon /> New Meeting Upload
        </button>
      </header>

      {/* Main Content Layout */}
      <div className="main-grid">
        {/* Sidebar Meetings History */}
        <aside className="sidebar glass-panel">
          <div className="sidebar-header">
            <h3>Meeting Sessions</h3>
            <span className="badge badge-completed">{meetings.length} Total</span>
          </div>

          <div className="meeting-list">
            {meetings.length === 0 ? (
              <div style={{ padding: '20px 10px', textAlign: 'center', color: 'var(--text-muted)' }}>
                <p>No meetings uploaded yet.</p>
                <button 
                  className="btn-secondary" 
                  style={{ marginTop: '12px', fontSize: '0.8rem' }}
                  onClick={handleCreateDemoMeeting}
                >
                  Load Demo Meeting
                </button>
              </div>
            ) : (
              meetings.map((m) => (
                <div
                  key={m.id}
                  className={`meeting-item ${selectedMeeting?.id === m.id ? 'active' : ''}`}
                  onClick={() => setSelectedMeeting(m)}
                >
                  <div className="meeting-item-title">{m.title}</div>
                  <div className="meeting-item-meta">
                    <span className={`badge badge-${m.status}`}>{m.status}</span>
                    <span>{m.created_at ? new Date(m.created_at).toLocaleDateString() : ''}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </aside>

        {/* Main Details View */}
        <main className="detail-area">
          {selectedMeeting ? (
            <>
              {/* Meeting Header Card */}
              <div className="detail-card glass-panel">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '4px' }}>{selectedMeeting.title}</h2>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                      File: {selectedMeeting.original_filename} • Status: <span className={`badge badge-${selectedMeeting.status}`}>{selectedMeeting.status}</span>
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button className="btn-secondary" title="Reprocess Transcript & Summary" onClick={() => handleReprocess(selectedMeeting.id)}>
                      <RefreshIcon /> Reprocess
                    </button>
                    <button className="btn-danger" title="Delete Meeting" onClick={() => handleDeleteMeeting(selectedMeeting.id)}>
                      <TrashIcon /> Delete
                    </button>
                  </div>
                </div>

                {/* Audio Streaming Player */}
                {selectedMeeting.filename && (
                  <div className="audio-player-wrapper">
                    <audio controls src={`/api/audio/${selectedMeeting.filename}`}>
                      Your browser does not support audio playback.
                    </audio>
                  </div>
                )}
              </div>

              {/* Summary Card */}
              <div className="detail-card glass-panel">
                <div className="card-title">
                  <span className="card-title-icon"><CheckCircleIcon /></span>
                  Executive Summary
                </div>
                <div className="summary-box">
                  {selectedMeeting.summary || (
                    <span style={{ color: 'var(--text-muted)', italic: 'true' }}>
                      {selectedMeeting.status === 'completed' ? 'No summary generated.' : 'Processing summary...'}
                    </span>
                  )}
                </div>
              </div>

              {/* Key Decisions Card */}
              <div className="detail-card glass-panel">
                <div className="card-title">
                  <span className="card-title-icon"><ListTodoIcon /></span>
                  Key Decisions Reached
                </div>
                {selectedMeeting.key_decisions && selectedMeeting.key_decisions.length > 0 ? (
                  <ul className="decisions-list">
                    {selectedMeeting.key_decisions.map((dec, idx) => (
                      <li key={idx} className="decision-item">
                        <span className="decision-icon">✓</span>
                        <span>{dec}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No key decisions recorded.</p>
                )}
              </div>

              {/* Action Items Card */}
              <div className="detail-card glass-panel">
                <div className="card-title">
                  <span className="card-title-icon"><ListTodoIcon /></span>
                  Action Items & Deliverables ({selectedMeeting.action_items?.length || 0})
                </div>
                <div className="action-items-list">
                  {selectedMeeting.action_items && selectedMeeting.action_items.length > 0 ? (
                    selectedMeeting.action_items.map((item) => (
                      <div key={item.id} className={`action-item-card ${item.status === 'completed' ? 'completed' : ''}`}>
                        <div className="action-left">
                          <div 
                            className={`checkbox-custom ${item.status === 'completed' ? 'checked' : ''}`}
                            onClick={() => handleToggleActionItem(item.id, item.status)}
                          >
                            {item.status === 'completed' && <span style={{ color: '#fff', fontSize: '12px' }}>✓</span>}
                          </div>
                          <span className="action-task-text">{item.task}</span>
                        </div>
                        <div className="action-meta">
                          <span className="tag-owner">👤 {item.owner}</span>
                          <span className="tag-due">📅 {item.due_date}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No action items extracted.</p>
                  )}
                </div>
              </div>

              {/* Full Transcript Card */}
              <div className="detail-card glass-panel">
                <div className="card-title">
                  <span className="card-title-icon"><FileTextIcon /></span>
                  Full ASR Transcript (OpenAI Whisper)
                </div>
                <div className="transcript-box">
                  {selectedMeeting.transcript || 'Transcript is being generated...'}
                </div>
              </div>
            </>
          ) : (
            <div className="detail-card glass-panel" style={{ textAlign: 'center', padding: '60px 20px' }}>
              <MicIcon />
              <h2 style={{ marginTop: '16px', color: 'var(--text-main)' }}>Select or Upload a Meeting</h2>
              <p style={{ color: 'var(--text-muted)', maxWidth: '400px', margin: '8px auto 20px' }}>
                Upload an audio file (.mp3, .wav, .m4a) to generate a full transcript and action items.
              </p>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                <button className="btn-primary" onClick={() => setIsUploadOpen(true)}>
                  <PlusIcon /> Upload Audio File
                </button>
                <button className="btn-secondary" onClick={handleCreateDemoMeeting}>
                  Try Demo Meeting
                </button>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Upload Modal Overlay */}
      {isUploadOpen && (
        <div className="modal-overlay">
          <div className="modal-card glass-panel">
            <h2 style={{ fontSize: '1.3rem', fontWeight: '700' }}>Upload Meeting Audio</h2>
            <form onSubmit={handleFileUpload} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
                  Meeting Title (Optional)
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Q3 Architecture Review"
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                />
              </div>

              <div 
                className="dropzone"
                onClick={() => document.getElementById('audio-input').click()}
              >
                <UploadCloudIcon />
                <p style={{ fontWeight: '600', marginTop: '12px' }}>
                  {uploadFile ? uploadFile.name : 'Click or Drag audio file to upload'}
                </p>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Supports MP3, WAV, M4A, OGG, FLAC (Max 100MB)
                </p>
                <input
                  id="audio-input"
                  type="file"
                  accept="audio/*"
                  style={{ display: 'none' }}
                  onChange={(e) => setUploadFile(e.target.files[0])}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
                <button 
                  type="button" 
                  className="btn-secondary" 
                  onClick={() => setIsUploadOpen(false)}
                  disabled={isProcessing}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn-primary" 
                  disabled={!uploadFile || isProcessing}
                >
                  {isProcessing ? 'Processing ASR...' : 'Transcribe & Summarize'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// Helper to convert Web Audio API AudioBuffer to WAV Blob
async function audioBufferToWavBlob(buffer) {
  const numOfChan = buffer.numberOfChannels;
  const length = buffer.length * numOfChan * 2 + 44;
  const out = new DataView(new ArrayBuffer(length));
  let channels = [], sampleRate = buffer.sampleRate, offset = 0, pos = 0;

  function setUint16(data) { out.setUint16(pos, data, true); pos += 2; }
  function setUint32(data) { out.setUint32(pos, data, true); pos += 4; }

  setUint32(0x46464952); // "RIFF"
  setUint32(length - 8);
  setUint32(0x45564157); // "WAVE"
  setUint32(0x20746d66); // "fmt " chunk
  setUint32(16); // length = 16
  setUint16(1); // PCM (uncompressed)
  setUint16(numOfChan);
  setUint32(sampleRate);
  setUint32(sampleRate * 2 * numOfChan); // avg. bytes/sec
  setUint16(numOfChan * 2); // block-align
  setUint16(16); // 16-bit
  setUint32(0x61746164); // "data" chunk
  setUint32(length - pos - 4);

  for (let i = 0; i < buffer.numberOfChannels; i++) channels.push(buffer.getChannelData(i));

  while (offset < buffer.length) {
    for (let i = 0; i < numOfChan; i++) {
      let sample = Math.max(-1, Math.min(1, channels[i][offset]));
      sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767) | 0;
      out.setInt16(pos, sample, true);
      pos += 2;
    }
    offset++;
  }
  return new Blob([out], { type: 'audio/wav' });
}
