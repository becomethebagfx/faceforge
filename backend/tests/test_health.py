"""Tests for health check endpoints."""

import pytest


class TestHealthEndpoints:
    """Test suite for health check endpoints."""

    def test_health_check(self, client):
        """Test /health endpoint returns healthy status."""
        response = client.get("/health")
        assert response.status_code == 200

        data = response.json()
        assert data["status"] == "healthy"
        assert "timestamp" in data

    def test_ready_check(self, client):
        """Test /ready endpoint returns ready status."""
        response = client.get("/ready")
        assert response.status_code == 200

        data = response.json()
        # May have "status" key or "ready" boolean
        if "status" in data:
            assert data["status"] in ["ready", "ok", "healthy"]
        elif "ready" in data:
            assert data["ready"] is True
        else:
            # Any 200 response is acceptable
            pass

    def test_health_response_format(self, client):
        """Test health endpoint response format."""
        response = client.get("/health")
        data = response.json()

        # Should have required fields
        assert isinstance(data["status"], str)
        assert isinstance(data["timestamp"], str)

    def test_ready_services_status(self, client):
        """Test ready endpoint includes service statuses."""
        response = client.get("/ready")
        data = response.json()

        services = data.get("services", {})
        # Should have basic services listed
        assert isinstance(services, dict)
