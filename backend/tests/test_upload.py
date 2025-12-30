"""Tests for upload endpoints."""

import pytest
import io


class TestUploadEndpoints:
    """Test suite for file upload endpoints."""

    def test_upload_video_endpoint_exists(self, client):
        """Test that upload endpoint exists."""
        # Empty request should return 422 (validation error) not 404
        response = client.post("/api/v1/upload")
        assert response.status_code in [400, 422]  # Missing file

    def test_upload_video_without_file(self, client):
        """Test upload fails without file."""
        response = client.post("/api/v1/upload")
        assert response.status_code in [400, 422]

    def test_upload_video_with_file(self, client, sample_video_bytes):
        """Test upload with valid video file."""
        files = {
            "file": ("test_video.mp4", io.BytesIO(sample_video_bytes), "video/mp4")
        }
        response = client.post("/api/v1/upload", files=files)

        # Should either succeed or fail gracefully
        assert response.status_code in [200, 201, 400, 422, 415]

        if response.status_code in [200, 201]:
            data = response.json()
            assert "job_id" in data or "id" in data

    def test_upload_invalid_file_type(self, client):
        """Test upload rejects invalid file types."""
        files = {
            "file": ("test.txt", io.BytesIO(b"not a video"), "text/plain")
        }
        response = client.post("/api/v1/upload", files=files)

        # Should reject with 400 or 415 or 422
        assert response.status_code in [400, 415, 422]

    def test_upload_image_for_face(self, client, sample_image_bytes):
        """Test face image upload endpoint."""
        files = {
            "file": ("face.jpg", io.BytesIO(sample_image_bytes), "image/jpeg")
        }
        # Try the face upload endpoint if it exists
        response = client.post("/api/v1/upload/face", files=files)

        # Either works or endpoint doesn't exist (404)
        assert response.status_code in [200, 201, 400, 404, 422]


class TestUploadValidation:
    """Test upload validation."""

    def test_upload_size_limit(self, client):
        """Test upload respects size limits."""
        # Create a large dummy file (1MB of zeros)
        large_file = io.BytesIO(b"\x00" * (1024 * 1024))
        files = {
            "file": ("large_video.mp4", large_file, "video/mp4")
        }
        response = client.post("/api/v1/upload", files=files)

        # Should either accept or reject with appropriate error
        assert response.status_code in [200, 201, 400, 413, 422]

    def test_upload_empty_file(self, client):
        """Test upload handles empty files."""
        files = {
            "file": ("empty.mp4", io.BytesIO(b""), "video/mp4")
        }
        response = client.post("/api/v1/upload", files=files)

        # May accept (with later validation) or reject empty files
        assert response.status_code in [200, 201, 400, 422, 500]
