"""Upload endpoints for video file handling."""

import uuid
from datetime import datetime
from enum import Enum
from pathlib import Path
from typing import Dict, Any, Optional

import aiofiles
from fastapi import APIRouter, File, UploadFile, HTTPException, Depends
from pydantic import BaseModel

from core.config import Settings, get_settings
from core.exceptions import InvalidFileError, FileTooLargeError, JobNotFoundError


class JobStatus(str, Enum):
    """Job status enumeration."""
    PENDING = "pending"
    UPLOADING = "uploading"
    UPLOADED = "uploaded"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


class JobInfo(BaseModel):
    """Job information model."""
    job_id: str
    status: JobStatus
    filename: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    file_size: Optional[int] = None
    error: Optional[str] = None
    progress: Optional[float] = None


class UploadResponse(BaseModel):
    """Response model for upload endpoint."""
    job_id: str
    status: JobStatus
    message: str


# In-memory job storage (replace with Redis/DB in production)
_jobs: Dict[str, JobInfo] = {}


def get_job(job_id: str) -> JobInfo:
    """Get a job by ID or raise JobNotFoundError."""
    if job_id not in _jobs:
        raise JobNotFoundError(job_id)
    return _jobs[job_id]


def update_job(job_id: str, **kwargs) -> JobInfo:
    """Update a job's fields."""
    job = get_job(job_id)
    for key, value in kwargs.items():
        if hasattr(job, key):
            setattr(job, key, value)
    job.updated_at = datetime.utcnow()
    _jobs[job_id] = job
    return job


router = APIRouter(prefix="/upload", tags=["Upload"])


@router.post("", response_model=UploadResponse)
async def upload_video(
    file: UploadFile = File(...),
    settings: Settings = Depends(get_settings),
) -> UploadResponse:
    """
    Upload a video file for processing.

    Args:
        file: The video file to upload.
        settings: Application settings.

    Returns:
        Upload response with job_id for tracking.

    Raises:
        HTTPException: If file validation fails.
    """
    # Validate file extension
    if not file.filename:
        raise HTTPException(status_code=400, detail="Filename is required")

    file_ext = Path(file.filename).suffix.lower()
    if file_ext not in settings.allowed_video_extensions:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type. Allowed: {', '.join(settings.allowed_video_extensions)}",
        )

    # Generate job ID
    job_id = str(uuid.uuid4())
    now = datetime.utcnow()

    # Create job record
    job = JobInfo(
        job_id=job_id,
        status=JobStatus.UPLOADING,
        filename=file.filename,
        created_at=now,
        updated_at=now,
    )
    _jobs[job_id] = job

    # Ensure upload directory exists
    upload_path = settings.upload_dir / job_id
    upload_path.mkdir(parents=True, exist_ok=True)

    # Save file with streaming
    file_path = upload_path / file.filename
    total_size = 0

    try:
        async with aiofiles.open(file_path, "wb") as out_file:
            while chunk := await file.read(1024 * 1024):  # 1MB chunks
                total_size += len(chunk)

                # Check file size limit
                if total_size > settings.max_upload_size_bytes:
                    # Clean up partial file
                    file_path.unlink(missing_ok=True)
                    update_job(job_id, status=JobStatus.FAILED, error="File too large")
                    raise HTTPException(
                        status_code=413,
                        detail=f"File too large. Maximum: {settings.max_upload_size_mb}MB",
                    )

                await out_file.write(chunk)

        # Update job with success
        update_job(
            job_id,
            status=JobStatus.UPLOADED,
            file_size=total_size,
        )

        return UploadResponse(
            job_id=job_id,
            status=JobStatus.UPLOADED,
            message=f"File uploaded successfully ({total_size / (1024 * 1024):.2f}MB)",
        )

    except HTTPException:
        raise
    except Exception as e:
        update_job(job_id, status=JobStatus.FAILED, error=str(e))
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")


@router.get("/status/{job_id}", response_model=JobInfo)
async def get_job_status(job_id: str) -> JobInfo:
    """
    Get the status of an upload job.

    Args:
        job_id: The unique job identifier.

    Returns:
        Job information including status and progress.

    Raises:
        HTTPException: If job is not found.
    """
    try:
        return get_job(job_id)
    except JobNotFoundError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)


# Export job storage for use by other modules
def get_jobs() -> Dict[str, JobInfo]:
    """Get the jobs dictionary for cross-module access."""
    return _jobs
