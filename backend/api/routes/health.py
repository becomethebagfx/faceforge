"""Health check endpoints."""

from datetime import datetime
from typing import Dict, Any

from fastapi import APIRouter

router = APIRouter(tags=["Health"])


@router.get("/health", response_model=Dict[str, Any])
async def health_check() -> Dict[str, Any]:
    """
    Health check endpoint.

    Returns:
        Health status with timestamp and version.
    """
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "version": "0.1.0",
    }


@router.get("/ready", response_model=Dict[str, Any])
async def readiness_check() -> Dict[str, Any]:
    """
    Readiness check for Kubernetes/container orchestration.

    Returns:
        Ready status indicating the service can accept traffic.
    """
    # Add dependency checks here (database, redis, etc.)
    return {
        "ready": True,
        "timestamp": datetime.utcnow().isoformat(),
    }
