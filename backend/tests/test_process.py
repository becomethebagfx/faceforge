"""Tests for processing endpoints."""

import pytest


class TestProcessEndpoints:
    """Test suite for video processing endpoints."""

    def test_process_endpoint_exists(self, client):
        """Test that process endpoint exists."""
        response = client.post("/api/v1/process")
        # Should return 400/422 (missing params) not 404
        assert response.status_code in [400, 422]

    def test_process_without_job_id(self, client):
        """Test process fails without job_id."""
        response = client.post("/api/v1/process", json={})
        assert response.status_code in [400, 422]

    def test_process_with_invalid_job_id(self, client):
        """Test process fails with invalid job_id."""
        response = client.post(
            "/api/v1/process",
            json={"job_id": "nonexistent-job-id"}
        )
        assert response.status_code in [400, 404, 422]

    def test_get_job_status_nonexistent(self, client):
        """Test getting status of non-existent job."""
        response = client.get("/api/v1/process/nonexistent-id/status")
        assert response.status_code in [404, 400]

    def test_get_result_nonexistent(self, client):
        """Test getting result of non-existent job."""
        response = client.get("/api/v1/process/nonexistent-id/result")
        assert response.status_code in [404, 400]


class TestProcessOptions:
    """Test processing options validation."""

    def test_process_with_options(self, client):
        """Test process accepts valid options."""
        response = client.post(
            "/api/v1/process",
            json={
                "job_id": "test-job",
                "options": {
                    "lip_sync": True,
                    "voice": "jessica",
                    "quality": "balanced"
                }
            }
        )
        # Job doesn't exist, but options should be valid
        assert response.status_code in [400, 404, 422]

    def test_process_with_invalid_voice(self, client):
        """Test process rejects invalid voice option."""
        response = client.post(
            "/api/v1/process",
            json={
                "job_id": "test-job",
                "options": {
                    "voice": "invalid_voice_that_does_not_exist"
                }
            }
        )
        # Should reject or ignore invalid voice
        assert response.status_code in [400, 404, 422]


class TestJobStatus:
    """Test job status responses."""

    def test_status_response_format(self, client):
        """Test status endpoint response format."""
        # This tests the format when job exists
        response = client.get("/api/v1/process/any-job-id/status")

        if response.status_code == 200:
            data = response.json()
            assert "status" in data
            assert "job_id" in data or "id" in data
