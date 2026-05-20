# RipSave 🎬

> **No fluff. Just files.**

A social media video/audio downloader supporting YouTube, TikTok, Instagram, Twitter/X, Facebook, and 1000+ platforms.

## Stack

| Layer | Technology |
|---|---|
| Backend | FastAPI + yt-dlp + ffmpeg + asyncpg (PostgreSQL) |
| Frontend | React + Tailwind CSS + lucide-react + react-icons + sonner |
| Database | NeonDB (PostgreSQL) |
| Design | Neo-Brutalist — hard shadows, electric blue, mustard yellow |

---

## Quick Start

### Prerequisites

- Python 3.9+
- Node.js 18+
- PostgreSQL database (NeonDB) connection string
- ffmpeg installed:
  - **Linux**: `sudo apt-get install -y ffmpeg`
  - **macOS**: `brew install ffmpeg`
  - **Windows**: Download from [ffmpeg.org](https://ffmpeg.org/download.html) and add to PATH

---

### Backend

```bash
cd backend
pip install -r requirements.txt
pip install yt-dlp

# Start server (port 8001)
python server.py
# OR
uvicorn server:app --host 0.0.0.0 --port 8001 --reload
```

API docs available at: http://localhost:8001/docs

### Frontend

```bash
cd frontend
npm install

# Start dev server (port 3000)
npm start
```

Open: http://localhost:3000

---

## API Endpoints

| Method | Path | Description |
|---|---|---|
| GET | `/api/` | Health check |
| POST | `/api/info` | Fetch video metadata from URL |
| GET | `/api/download` | Stream download (mp4/mp3) |
| POST | `/api/history` | Save download history item |
| GET | `/api/history` | List last 50 history items |
| DELETE | `/api/history` | Clear all history |

### POST `/api/info`

```json
{
  "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
}
```

Response:
```json
{
  "id": "dQw4w9WgXcQ",
  "title": "Rick Astley - Never Gonna Give You Up",
  "thumbnail": "https://...",
  "duration": 212,
  "uploader": "Rick Astley",
  "webpage_url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  "extractor": "youtube",
  "available_qualities": ["360p", "720p", "1080p"],
  "is_audio_supported": true
}
```

### GET `/api/download`

```
GET /api/download?url=https://...&format=mp4&quality=720p
GET /api/download?url=https://...&format=mp3&quality=audio
```

---

## Tests

### Backend
```bash
cd backend
pytest tests/test_api.py -v
```

### Frontend
```bash
cd frontend
npm test
```

---

## Environment Variables

### Backend (`backend/.env`)
```
MONGO_URL=mongodb://localhost:27017
DB_NAME=ripsave
CORS_ORIGINS=http://localhost:3000
PORT=8001
```

### Frontend (`frontend/.env`)
```
REACT_APP_BACKEND_URL=http://localhost:8001
```

---

## Project Structure

```
linktodownload/
├── backend/
│   ├── server.py          # FastAPI app + all routes
│   ├── models.py          # Pydantic models
│   ├── requirements.txt
│   ├── .env
│   └── tests/
│       └── test_api.py
├── frontend/
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── App.js
│   │   ├── index.js
│   │   ├── index.css
│   │   ├── api/
│   │   │   └── ripsave.js
│   │   └── components/
│   │       ├── Header.jsx
│   │       ├── HeroSection.jsx
│   │       ├── UrlInputCard.jsx
│   │       ├── MediaCard.jsx
│   │       ├── DownloadCard.jsx
│   │       ├── BrutalistSlider.jsx
│   │       ├── HowItWorks.jsx
│   │       ├── RecentRips.jsx
│   │       └── Footer.jsx
│   └── tailwind.config.js
└── README.md
```

---

## Legal

For personal use only. Respect content creators and copyright laws. This tool uses [yt-dlp](https://github.com/yt-dlp/yt-dlp).
