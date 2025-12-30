"""Audio synchronization using FFmpeg.

Quick Mode: Simply replaces the audio track without any lip sync.
Fast, preserves video quality, but mouth won't match words.
"""

import subprocess
import shutil
from pathlib import Path
from typing import Optional
import logging

logger = logging.getLogger(__name__)


def check_ffmpeg() -> bool:
    """Check if FFmpeg is available."""
    return shutil.which('ffmpeg') is not None


class AudioSyncer:
    """FFmpeg-based audio replacement (Quick Mode).

    Simply replaces the audio track in a video without
    modifying the video frames. Fast and quality-preserving.
    """

    def __init__(self):
        if not check_ffmpeg():
            raise RuntimeError("FFmpeg not found. Please install FFmpeg.")

    def sync(
        self,
        video_path: Path,
        audio_path: Path,
        output_path: Path,
        audio_offset: float = 0.0
    ) -> Path:
        """Replace video audio with new audio track.

        Args:
            video_path: Path to input video
            audio_path: Path to audio file
            output_path: Path for output video
            audio_offset: Offset audio by N seconds (positive = delay)

        Returns:
            Path to output video
        """
        video_path = Path(video_path)
        audio_path = Path(audio_path)
        output_path = Path(output_path)

        if not video_path.exists():
            raise FileNotFoundError(f"Video not found: {video_path}")
        if not audio_path.exists():
            raise FileNotFoundError(f"Audio not found: {audio_path}")

        # Ensure output directory exists
        output_path.parent.mkdir(parents=True, exist_ok=True)

        # Build FFmpeg command
        cmd = [
            'ffmpeg', '-y',
            '-i', str(video_path),
            '-i', str(audio_path),
            '-c:v', 'copy',  # Copy video stream (no re-encoding)
            '-c:a', 'aac',   # Encode audio as AAC
            '-b:a', '192k',  # Audio bitrate
            '-map', '0:v:0', # Use video from first input
            '-map', '1:a:0', # Use audio from second input
            '-shortest',     # End when shortest stream ends
        ]

        # Add audio offset if specified
        if audio_offset != 0:
            cmd.extend(['-af', f'adelay={int(audio_offset * 1000)}|{int(audio_offset * 1000)}'])

        cmd.append(str(output_path))

        logger.info(f"Syncing audio: {audio_path.name} → {video_path.name}")

        try:
            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                check=True
            )
            logger.info(f"Audio sync complete: {output_path}")
            return output_path

        except subprocess.CalledProcessError as e:
            logger.error(f"FFmpeg error: {e.stderr}")
            raise RuntimeError(f"Audio sync failed: {e.stderr}")

    def extract_audio(
        self,
        video_path: Path,
        output_path: Path,
        format: str = 'mp3'
    ) -> Path:
        """Extract audio track from video.

        Args:
            video_path: Path to input video
            output_path: Path for output audio
            format: Audio format (mp3, wav, aac)

        Returns:
            Path to extracted audio
        """
        video_path = Path(video_path)
        output_path = Path(output_path)

        output_path.parent.mkdir(parents=True, exist_ok=True)

        cmd = [
            'ffmpeg', '-y',
            '-i', str(video_path),
            '-vn',  # No video
            '-acodec', 'libmp3lame' if format == 'mp3' else format,
            '-q:a', '2',  # High quality
            str(output_path)
        ]

        try:
            subprocess.run(cmd, capture_output=True, text=True, check=True)
            return output_path
        except subprocess.CalledProcessError as e:
            raise RuntimeError(f"Audio extraction failed: {e.stderr}")

    def get_video_duration(self, video_path: Path) -> float:
        """Get video duration in seconds."""
        cmd = [
            'ffprobe',
            '-v', 'error',
            '-show_entries', 'format=duration',
            '-of', 'default=noprint_wrappers=1:nokey=1',
            str(video_path)
        ]

        result = subprocess.run(cmd, capture_output=True, text=True)
        return float(result.stdout.strip())


def create_audio_syncer() -> AudioSyncer:
    """Factory function to create AudioSyncer."""
    return AudioSyncer()
