"""Custom exceptions for the FaceForge API."""

from typing import Any, Dict, Optional


class FaceForgeError(Exception):
    """Base exception for FaceForge API."""

    def __init__(
        self,
        message: str,
        status_code: int = 500,
        details: Optional[Dict[str, Any]] = None,
    ):
        self.message = message
        self.status_code = status_code
        self.details = details or {}
        super().__init__(self.message)


class JobNotFoundError(FaceForgeError):
    """Raised when a job is not found."""

    def __init__(self, job_id: str):
        super().__init__(
            message=f"Job not found: {job_id}",
            status_code=404,
            details={"job_id": job_id},
        )


class InvalidFileError(FaceForgeError):
    """Raised when an uploaded file is invalid."""

    def __init__(self, message: str, filename: Optional[str] = None):
        super().__init__(
            message=message,
            status_code=400,
            details={"filename": filename} if filename else {},
        )


class FileTooLargeError(FaceForgeError):
    """Raised when an uploaded file exceeds the size limit."""

    def __init__(self, size_bytes: int, max_bytes: int):
        super().__init__(
            message=f"File too large. Maximum size: {max_bytes / (1024 * 1024):.1f}MB",
            status_code=413,
            details={"size_bytes": size_bytes, "max_bytes": max_bytes},
        )


class ProcessingError(FaceForgeError):
    """Raised when video processing fails."""

    def __init__(self, job_id: str, reason: str):
        super().__init__(
            message=f"Processing failed for job {job_id}: {reason}",
            status_code=500,
            details={"job_id": job_id, "reason": reason},
        )
