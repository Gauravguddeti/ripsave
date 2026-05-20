"""
RipSave — FastAPI Backend
Social media video/audio downloader powered by yt-dlp + ffmpeg
"""

import os
import asyncio
import tempfile
import shutil
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

import yt_dlp
from fastapi import FastAPI, HTTPException, Query, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

from models import (
    InfoRequest,
    InfoResponse,
    HistoryRequest,
    HistoryItem,
    HealthResponse,
)

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------

load_dotenv()

MONGO_URL: str = os.getenv("MONGO_URL", "mongodb://localhost:27017")
DB_NAME: str = os.getenv("DB_NAME", "ripsave")
CORS_ORIGINS: list[str] = os.getenv("CORS_ORIGINS", "*").split(",")
COOKIE_FILE: Optional[str] = os.getenv("COOKIE_FILE", None)

VALID_QUALITIES = {"360p", "720p", "1080p"}
MEP3_BITRATES = {"128k", "192k", "320k"}
QUALITY_HEIGHT = {"360p": 360, "720p": 720, "1080p": 1080}

# ---------------------------------------------------------------------------
# Lifespan (startup/shutdown)
# ---------------------------------------------------------------------------

mongo_client: Optional[AsyncIOMotorClient] = None
db = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    global mongo_client, db
    try:
        mongo_client = AsyncIOMotorClient(MONGO_URL, serverSelectionTimeoutMS=3000)
        await mongo_client.server_info()
        db = mongo_client[DB_NAME]
        await db["history"].create_index("downloaded_at")
        print(f"[RipSave] MongoDB connected: {MONGO_URL}/{DB_NAME}")
    except Exception as exc:
        print(f"[RipSave] MongoDB not available: {exc}  — history persistence disabled")
        db = None
    yield
    if mongo_client:
        mongo_client.close()


# ---------------------------------------------------------------------------
# App + CORS
# ---------------------------------------------------------------------------

app = FastAPI(
    title="RipSave API",
    description="Social media video/audio downloader — no fluff, just files.",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],          # tighten in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _mp4_format_selector(height: int) -> str:
    h = height
    return (
        f"bestvideo[height<={h}][ext=mp4]+bestaudio[ext=m4a]"
        f"/bestvideo[height<={h}]+bestaudio"
        f"/best[height<={h}][ext=mp4]"
        f"/best[height<={h}]"
        f"/best"
    )


def _extract_info_sync(url: str) -> dict:
    """Runs yt-dlp info extraction synchronously (called in executor)."""
    ydl_opts = {
        "quiet": True,
        "no_warnings": True,
        "skip_download": True,
        "noplaylist": True,
    }
    if COOKIE_FILE and os.path.exists(COOKIE_FILE):
        ydl_opts["cookiefile"] = COOKIE_FILE

    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        info = ydl.extract_info(url, download=False)
    return info


def _determine_available_qualities(info: dict) -> list[str]:
    """Inspect available formats and return which quality tiers are present."""
    formats = info.get("formats", [])
    if not formats:
        return ["360p", "720p", "1080p"]   # optimistic default

    heights = set()
    for f in formats:
        h = f.get("height")
        if h:
            heights.add(h)

    available = []
    for label, threshold in [("360p", 360), ("720p", 720), ("1080p", 1080)]:
        # Include quality tier if any format meets or exceeds it
        if any(h >= threshold for h in heights) or not heights:
            available.append(label)

    return available if available else ["360p", "720p", "1080p"]


def _download_file_sync(url: str, fmt: str, quality: str, tmpdir: str) -> Path:
    """Download to tmpdir and return the output file path."""
    if fmt == "mp3":
        # quality is one of: 128k, 192k, 320k (strip the 'k' for yt-dlp)
        bitrate = quality.replace("k", "") if quality and quality.endswith("k") else "192"
        ydl_opts = {
            "quiet": True,
            "no_warnings": True,
            "noplaylist": True,
            "format": "bestaudio/best",
            "outtmpl": os.path.join(tmpdir, "%(title)s.%(ext)s"),
            "postprocessors": [
                {
                    "key": "FFmpegExtractAudio",
                    "preferredcodec": "mp3",
                    "preferredquality": bitrate,
                }
            ],
        }
    else:
        height = QUALITY_HEIGHT[quality]
        ydl_opts = {
            "quiet": True,
            "no_warnings": True,
            "noplaylist": True,
            "format": _mp4_format_selector(height),
            "outtmpl": os.path.join(tmpdir, "%(title)s.%(ext)s"),
            "merge_output_format": "mp4",
            "postprocessors": [
                {"key": "FFmpegVideoConvertor", "preferedformat": "mp4"}
            ],
        }

    if COOKIE_FILE and os.path.exists(COOKIE_FILE):
        ydl_opts["cookiefile"] = COOKIE_FILE

    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        ydl.download([url])

    # Return the first file in the tmpdir
    files = list(Path(tmpdir).iterdir())
    if not files:
        raise RuntimeError("yt-dlp produced no output file")
    return files[0]


def _file_streamer(filepath: Path, chunk_size: int = 1024 * 512):
    """Yield file chunks for StreamingResponse."""
    with open(filepath, "rb") as f:
        while chunk := f.read(chunk_size):
            yield chunk


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@app.get("/api/", response_model=HealthResponse, tags=["health"])
async def health_check():
    """Health check endpoint."""
    return HealthResponse(status="ok", version="1.0.0")


@app.post("/api/info", response_model=InfoResponse, tags=["info"])
async def get_video_info(body: InfoRequest):
    """
    Extract video metadata from a social media URL.
    Returns title, thumbnail, duration, uploader, and available qualities.
    """
    try:
        loop = asyncio.get_event_loop()
        info = await loop.run_in_executor(None, _extract_info_sync, body.url)
    except yt_dlp.utils.DownloadError as exc:
        raise HTTPException(status_code=400, detail=f"Could not fetch video info: {str(exc)}")
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Failed to process URL: {str(exc)}")

    available_qualities = _determine_available_qualities(info)

    return InfoResponse(
        id=info.get("id"),
        title=info.get("title", "Unknown Title"),
        thumbnail=info.get("thumbnail"),
        duration=round(info["duration"]) if info.get("duration") is not None else None,
        uploader=info.get("uploader") or info.get("channel") or info.get("creator"),
        webpage_url=info.get("webpage_url", body.url),
        extractor=info.get("extractor"),
        available_qualities=available_qualities,
        is_audio_supported=True,
    )


@app.get("/api/download", tags=["download"])
async def download_media(
    background_tasks: BackgroundTasks,
    url: str = Query(..., description="Source media URL"),
    format: str = Query("mp4", description="Output format: mp4 or mp3"),
    quality: str = Query("720p", description="Video quality: 360p, 720p, or 1080p"),
):
    """
    Download media and stream it to the client.
    Cleans up the temp directory after streaming.
    """
    # Validate format
    if format not in ("mp4", "mp3"):
        raise HTTPException(status_code=400, detail="format must be 'mp4' or 'mp3'")

    # Validate quality based on format
    if format == "mp4" and quality not in VALID_QUALITIES:
        raise HTTPException(
            status_code=400,
            detail=f"MP4 quality must be one of: {', '.join(sorted(VALID_QUALITIES))}",
        )
    if format == "mp3" and quality not in {"128k", "192k", "320k"}:
        # Default to 192k if an old/invalid value is passed
        quality = "192k"

    # Validate URL
    import re
    if not re.match(r"^https?://", url, re.IGNORECASE):
        raise HTTPException(status_code=400, detail="URL must start with http:// or https://")

    tmpdir = tempfile.mkdtemp(prefix="ripsave_")

    try:
        loop = asyncio.get_event_loop()
        filepath = await loop.run_in_executor(
            None, _download_file_sync, url, format, quality, tmpdir
        )
    except Exception as exc:
        shutil.rmtree(tmpdir, ignore_errors=True)
        raise HTTPException(status_code=400, detail=f"Download failed: {str(exc)}")

    filename = filepath.name
    media_type = "audio/mpeg" if format == "mp3" else "video/mp4"

    # Clean up temp dir after response is sent
    background_tasks.add_task(shutil.rmtree, tmpdir, True)

    return StreamingResponse(
        _file_streamer(filepath),
        media_type=media_type,
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
            "Content-Length": str(filepath.stat().st_size),
            "X-Filename": filename,
        },
    )


@app.post("/api/history", tags=["history"])
async def save_history(item: HistoryRequest):
    """Save a download history record."""
    record = {
        **item.model_dump(),
        "downloaded_at": datetime.now(timezone.utc).isoformat(),
    }
    if db is not None:
        try:
            await db["history"].insert_one(record)
        except Exception as exc:
            print(f"[RipSave] History save failed: {exc}")
    return {"status": "saved"}


@app.get("/api/history", tags=["history"])
async def get_history():
    """Return last 50 download history records (no MongoDB _id)."""
    if db is None:
        return []
    try:
        cursor = (
            db["history"]
            .find({}, {"_id": 0})
            .sort("downloaded_at", -1)
            .limit(50)
        )
        records = await cursor.to_list(length=50)
        return records
    except Exception as exc:
        print(f"[RipSave] History fetch failed: {exc}")
        return []


@app.delete("/api/history", tags=["history"])
async def clear_history():
    """Delete all download history records."""
    if db is not None:
        try:
            await db["history"].delete_many({})
        except Exception as exc:
            print(f"[RipSave] History clear failed: {exc}")
    return {"status": "cleared"}


# ---------------------------------------------------------------------------
# Entrypoint
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8001))
    uvicorn.run("server:app", host="0.0.0.0", port=port, reload=True)
