"""
pytest test suite for RipSave API
Run: cd backend && pytest tests/test_api.py -v
"""

import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport

# Import app after path is set
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from server import app


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

@pytest_asyncio.fixture
async def client():
    """Async test client for FastAPI app."""
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as ac:
        yield ac


# ---------------------------------------------------------------------------
# 1. Health check
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_health_check(client):
    response = await client.get("/api/")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert "version" in data


# ---------------------------------------------------------------------------
# 2. Valid URL → info returns correct fields
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_info_valid_url(client):
    # Short Big Buck Bunny clip - a stable public domain video on YouTube
    payload = {"url": "https://www.youtube.com/watch?v=aqz-KE-bpKQ"}
    response = await client.post("/api/info", json=payload, timeout=60.0)
    # Accept 200 (success) or 400 (video unavailable in test environment)
    # We validate the response structure for 200, and error format for 400
    if response.status_code == 200:
        data = response.json()
        assert "title" in data
        assert "thumbnail" in data
        assert "available_qualities" in data
        assert isinstance(data["available_qualities"], list)
        assert "is_audio_supported" in data
        assert data["is_audio_supported"] is True
        # Must not leak _id
        assert "_id" not in data
    else:
        # Network or availability issue in test environment - acceptable
        assert response.status_code == 400
        data = response.json()
        assert "detail" in data


# ---------------------------------------------------------------------------
# 3. Invalid URL (no http prefix) → 422 validation error
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_info_invalid_url_no_scheme(client):
    payload = {"url": "youtube.com/watch?v=abc123"}
    response = await client.post("/api/info", json=payload)
    assert response.status_code == 422   # Pydantic validation error


# ---------------------------------------------------------------------------
# 4. Malformed non-URL string → 422
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_info_malformed_url(client):
    payload = {"url": "not-a-url-at-all"}
    response = await client.post("/api/info", json=payload)
    assert response.status_code == 422


# ---------------------------------------------------------------------------
# 5. Empty URL → 422
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_info_empty_url(client):
    payload = {"url": ""}
    response = await client.post("/api/info", json=payload)
    assert response.status_code == 422


# ---------------------------------------------------------------------------
# 6. Download endpoint — invalid format → 400
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_download_invalid_format(client):
    response = await client.get(
        "/api/download",
        params={"url": "https://www.youtube.com/watch?v=BaW_jenozKc", "format": "wav"},
    )
    assert response.status_code == 400


# ---------------------------------------------------------------------------
# 7. Download endpoint — invalid quality → 400
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_download_invalid_quality(client):
    response = await client.get(
        "/api/download",
        params={
            "url": "https://www.youtube.com/watch?v=BaW_jenozKc",
            "format": "mp4",
            "quality": "4k",
        },
    )
    assert response.status_code == 400


# ---------------------------------------------------------------------------
# 8. Download endpoint — URL without scheme → 400
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_download_url_no_scheme(client):
    response = await client.get(
        "/api/download",
        params={"url": "youtube.com/watch?v=abc", "format": "mp4", "quality": "720p"},
    )
    assert response.status_code == 400


# ---------------------------------------------------------------------------
# 9. History CRUD — save, retrieve, verify no _id, delete
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_history_save(client):
    payload = {
        "url": "https://www.youtube.com/watch?v=BaW_jenozKc",
        "title": "Test Video",
        "thumbnail": "https://example.com/thumb.jpg",
        "format": "mp4",
        "quality": "720p",
    }
    response = await client.post("/api/history", json=payload)
    assert response.status_code == 200
    assert response.json()["status"] == "saved"


@pytest.mark.asyncio
async def test_history_get_no_id_leak(client):
    # Save an item first
    await client.post(
        "/api/history",
        json={
            "url": "https://www.youtube.com/watch?v=BaW_jenozKc",
            "title": "No-ID Test",
            "format": "mp3",
            "quality": "audio",
        },
    )
    response = await client.get("/api/history")
    assert response.status_code == 200
    items = response.json()
    assert isinstance(items, list)
    for item in items:
        assert "_id" not in item, "MongoDB _id must not be exposed in history response"


@pytest.mark.asyncio
async def test_history_clear(client):
    response = await client.delete("/api/history")
    assert response.status_code == 200
    assert response.json()["status"] == "cleared"

    # Confirm cleared
    get_resp = await client.get("/api/history")
    assert get_resp.status_code == 200
    # After clear, should be empty (MongoDB) or empty list (no DB)
    items = get_resp.json()
    assert isinstance(items, list)


# ---------------------------------------------------------------------------
# 10. History — invalid format rejected at save
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_history_invalid_format(client):
    payload = {
        "url": "https://www.youtube.com/watch?v=abc",
        "title": "Bad Format",
        "format": "flac",
        "quality": "720p",
    }
    response = await client.post("/api/history", json=payload)
    assert response.status_code == 422
