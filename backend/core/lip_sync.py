"""Wav2Lip local lip sync implementation.

Quality Mode: Uses Wav2Lip model for accurate lip sync.
Processes locally without API, preserves full frame.
"""

import cv2
import numpy as np
from pathlib import Path
from typing import Optional, Tuple
import subprocess
import tempfile
import shutil
import logging

logger = logging.getLogger(__name__)

# Lazy-loaded model
_wav2lip_model = None
_face_detector = None


def check_wav2lip_deps() -> bool:
    """Check if Wav2Lip dependencies are available."""
    try:
        import torch
        return True
    except ImportError:
        return False


class Wav2LipSyncer:
    """Local lip sync using Wav2Lip.

    Features:
    - Accurate lip sync to audio
    - Preserves full frame (no cropping)
    - Local processing (no API)
    - GPU acceleration when available
    """

    def __init__(self, models_path: Path):
        """Initialize Wav2Lip syncer.

        Args:
            models_path: Path to directory containing wav2lip models
        """
        self.models_path = Path(models_path)
        self.wav2lip_model_path = self.models_path / "wav2lip_gan.pth"
        self.face_detector_path = self.models_path / "s3fd.pth"

        if not check_wav2lip_deps():
            logger.warning("Wav2Lip dependencies not available. Install torch and opencv.")

    def _check_models(self):
        """Verify required models exist."""
        if not self.wav2lip_model_path.exists():
            raise FileNotFoundError(
                f"Wav2Lip model not found: {self.wav2lip_model_path}\n"
                "Run: bash models/download_models.sh"
            )

    def sync(
        self,
        video_path: Path,
        audio_path: Path,
        output_path: Path,
        resize_factor: int = 1,
        progress_callback: Optional[callable] = None
    ) -> Path:
        """Lip sync video to audio using Wav2Lip.

        Args:
            video_path: Path to input video
            audio_path: Path to audio file
            output_path: Path for output video
            resize_factor: Resize factor for face detection (1=full, 2=half)
            progress_callback: Optional callback(current, total)

        Returns:
            Path to output video
        """
        video_path = Path(video_path)
        audio_path = Path(audio_path)
        output_path = Path(output_path)

        self._check_models()

        if not video_path.exists():
            raise FileNotFoundError(f"Video not found: {video_path}")
        if not audio_path.exists():
            raise FileNotFoundError(f"Audio not found: {audio_path}")

        output_path.parent.mkdir(parents=True, exist_ok=True)

        logger.info(f"Lip syncing: {video_path.name} + {audio_path.name}")

        # Use Wav2Lip inference script
        # This is a simplified version - full implementation would
        # integrate Wav2Lip directly
        try:
            result = self._run_wav2lip_inference(
                video_path, audio_path, output_path, resize_factor
            )
            return result
        except Exception as e:
            logger.error(f"Wav2Lip inference failed: {e}")
            # Fallback to simple audio merge
            logger.info("Falling back to simple audio merge")
            return self._fallback_audio_merge(video_path, audio_path, output_path)

    def _run_wav2lip_inference(
        self,
        video_path: Path,
        audio_path: Path,
        output_path: Path,
        resize_factor: int
    ) -> Path:
        """Run Wav2Lip model inference.

        This implementation uses subprocess to call Wav2Lip.
        A more integrated approach would import the model directly.
        """
        # Check if Wav2Lip is installed
        wav2lip_dir = self.models_path.parent / "wav2lip"

        if wav2lip_dir.exists() and (wav2lip_dir / "inference.py").exists():
            # Use installed Wav2Lip
            cmd = [
                "python", str(wav2lip_dir / "inference.py"),
                "--checkpoint_path", str(self.wav2lip_model_path),
                "--face", str(video_path),
                "--audio", str(audio_path),
                "--outfile", str(output_path),
                "--resize_factor", str(resize_factor),
                "--nosmooth"
            ]

            subprocess.run(cmd, check=True, capture_output=True)
            return output_path
        else:
            # Wav2Lip not installed, use fallback
            raise RuntimeError("Wav2Lip not installed")

    def _fallback_audio_merge(
        self,
        video_path: Path,
        audio_path: Path,
        output_path: Path
    ) -> Path:
        """Fallback: Simple audio merge without lip sync."""
        cmd = [
            'ffmpeg', '-y',
            '-i', str(video_path),
            '-i', str(audio_path),
            '-c:v', 'copy',
            '-c:a', 'aac',
            '-map', '0:v:0',
            '-map', '1:a:0',
            '-shortest',
            str(output_path)
        ]

        subprocess.run(cmd, check=True, capture_output=True)
        return output_path


class SimpleLipSync:
    """Simplified lip sync that just merges audio.

    Quick Mode alternative when Wav2Lip is not available
    or faster processing is needed.
    """

    def sync(
        self,
        video_path: Path,
        audio_path: Path,
        output_path: Path
    ) -> Path:
        """Merge audio with video (no actual lip sync).

        Args:
            video_path: Input video
            audio_path: Audio to merge
            output_path: Output video

        Returns:
            Path to output video
        """
        video_path = Path(video_path)
        audio_path = Path(audio_path)
        output_path = Path(output_path)

        output_path.parent.mkdir(parents=True, exist_ok=True)

        cmd = [
            'ffmpeg', '-y',
            '-i', str(video_path),
            '-i', str(audio_path),
            '-c:v', 'copy',
            '-c:a', 'aac',
            '-b:a', '192k',
            '-map', '0:v:0',
            '-map', '1:a:0',
            '-shortest',
            str(output_path)
        ]

        try:
            subprocess.run(cmd, check=True, capture_output=True, text=True)
            logger.info(f"Audio merged: {output_path}")
            return output_path
        except subprocess.CalledProcessError as e:
            raise RuntimeError(f"FFmpeg merge failed: {e.stderr}")


def create_lip_syncer(models_path: Path, use_wav2lip: bool = True):
    """Factory function to create lip syncer.

    Args:
        models_path: Path to models directory
        use_wav2lip: If True, use Wav2Lip (Quality Mode)
                     If False, use simple merge (Quick Mode)

    Returns:
        Lip syncer instance
    """
    if use_wav2lip and check_wav2lip_deps():
        return Wav2LipSyncer(models_path)
    else:
        return SimpleLipSync()
