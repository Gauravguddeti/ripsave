"""
Pydantic models for RipSave API
"""
import re
from typing import Optional, List
from pydantic import BaseModel, field_validator


# ---------------------------------------------------------------------------
# Validators
# ---------------------------------------------------------------------------

URL_REGEX = re.compile(r"^https?://", re.IGNORECASE)


def validate_url(v: str) -> str:
    v = v.strip()
    if not URL_REGEX.match(v):
        raise ValueError("URL must start with http:// or https://")
    return v


# ---------------------------------------------------------------------------
# Request models
# ---------------------------------------------------------------------------

class InfoRequest(BaseModel):
    url: str

    @field_validator("url")
    @classmethod
    def url_must_be_valid(cls, v: str) -> str:
        return validate_url(v)


class HistoryRequest(BaseModel):
    url: str
    title: str
    thumbnail: Optional[str] = None
    format: str          # "mp4" | "mp3"
    quality: str         # "360p" | "720p" | "1080p" | "audio"

    @field_validator("url")
    @classmethod
    def url_must_be_valid(cls, v: str) -> str:
        return validate_url(v)

    @field_validator("format")
    @classmethod
    def format_must_be_valid(cls, v: str) -> str:
        if v not in ("mp4", "mp3"):
            raise ValueError("format must be 'mp4' or 'mp3'")
        return v


# ---------------------------------------------------------------------------
# Response models
# ---------------------------------------------------------------------------

class InfoResponse(BaseModel):
    id: Optional[str] = None
    title: str
    thumbnail: Optional[str] = None
    duration: Optional[int] = None          # seconds
    uploader: Optional[str] = None
    webpage_url: Optional[str] = None
    extractor: Optional[str] = None
    available_qualities: List[str] = ["360p", "720p", "1080p"]
    is_audio_supported: bool = True


class HistoryItem(BaseModel):
    url: str
    title: str
    thumbnail: Optional[str] = None
    format: str
    quality: str
    downloaded_at: str                      # ISO 8601 string


class HealthResponse(BaseModel):
    status: str = "ok"
    version: str = "1.0.0"
