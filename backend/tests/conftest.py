"""Pytest configuration and fixtures for API tests."""

import pytest
from fastapi.testclient import TestClient
from httpx import ASGITransport, AsyncClient
import asyncio
import sys
import os

# Add backend to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from api.main import app


@pytest.fixture
def client():
    """Synchronous test client."""
    return TestClient(app)


@pytest.fixture
async def async_client():
    """Asynchronous test client for async endpoints."""
    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test"
    ) as ac:
        yield ac


@pytest.fixture
def sample_video_bytes():
    """Sample video bytes for testing (minimal valid mp4 header)."""
    # Minimal ftyp box for mp4
    return bytes([
        0x00, 0x00, 0x00, 0x14,  # Box size
        0x66, 0x74, 0x79, 0x70,  # 'ftyp'
        0x69, 0x73, 0x6F, 0x6D,  # 'isom'
        0x00, 0x00, 0x00, 0x00,  # Minor version
        0x69, 0x73, 0x6F, 0x6D,  # Compatible brand
    ])


@pytest.fixture
def sample_image_bytes():
    """Sample image bytes for testing (minimal JPEG)."""
    # Minimal JPEG header
    return bytes([
        0xFF, 0xD8, 0xFF, 0xE0,
        0x00, 0x10, 0x4A, 0x46,
        0x49, 0x46, 0x00, 0x01,
        0x01, 0x00, 0x00, 0x01,
        0x00, 0x01, 0x00, 0x00,
        0xFF, 0xD9
    ])


@pytest.fixture
def upload_dir(tmp_path):
    """Temporary upload directory."""
    upload = tmp_path / "uploads"
    upload.mkdir()
    return upload


@pytest.fixture
def output_dir(tmp_path):
    """Temporary output directory."""
    output = tmp_path / "outputs"
    output.mkdir()
    return output
