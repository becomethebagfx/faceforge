"""Application configuration using pydantic-settings."""

from functools import lru_cache
from pathlib import Path
from typing import List

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # API Settings
    api_title: str = "FaceForge API"
    api_version: str = "0.1.0"
    api_description: str = "Video face processing API"
    debug: bool = False

    # Server Settings
    host: str = "0.0.0.0"
    port: int = 8000

    # CORS Settings
    cors_origins: List[str] = ["*"]
    cors_allow_credentials: bool = True
    cors_allow_methods: List[str] = ["*"]
    cors_allow_headers: List[str] = ["*"]

    # Upload Settings
    upload_dir: Path = Path("uploads")
    max_upload_size_mb: int = 500
    allowed_video_extensions: List[str] = [".mp4", ".avi", ".mov", ".mkv", ".webm"]

    # Processing Settings
    output_dir: Path = Path("outputs")

    @property
    def max_upload_size_bytes(self) -> int:
        """Return max upload size in bytes."""
        return self.max_upload_size_mb * 1024 * 1024


@lru_cache
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()
