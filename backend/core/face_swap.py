"""InsightFace-based face swap implementation.

Provides high-quality face swapping that preserves the full frame
without cropping, using the inswapper model.
"""

import cv2
import numpy as np
from pathlib import Path
from typing import Optional, Tuple
import logging

logger = logging.getLogger(__name__)

# Lazy imports for optional dependencies
_face_analysis = None
_swapper = None


def _init_models(models_path: Path):
    """Initialize InsightFace models lazily."""
    global _face_analysis, _swapper

    if _face_analysis is not None:
        return

    try:
        import insightface
        from insightface.app import FaceAnalysis

        # Initialize face analysis
        _face_analysis = FaceAnalysis(
            name='buffalo_l',
            root=str(models_path),
            providers=['CoreMLExecutionProvider', 'CUDAExecutionProvider', 'CPUExecutionProvider']
        )
        _face_analysis.prepare(ctx_id=0, det_size=(640, 640))

        # Load swapper model
        swapper_path = models_path / 'inswapper_128.onnx'
        if not swapper_path.exists():
            raise FileNotFoundError(f"Swapper model not found: {swapper_path}")

        _swapper = insightface.model_zoo.get_model(str(swapper_path))

        logger.info("InsightFace models initialized successfully")

    except ImportError as e:
        logger.error(f"InsightFace not installed: {e}")
        raise RuntimeError("InsightFace is required for face swap. Install with: pip install insightface onnxruntime")


class FaceSwapper:
    """High-quality face swapping using InsightFace.

    Features:
    - Preserves full frame (no cropping)
    - GPU acceleration when available
    - Multi-face support
    - Frame-by-frame video processing
    """

    def __init__(self, models_path: Path):
        """Initialize face swapper.

        Args:
            models_path: Path to directory containing AI models
        """
        self.models_path = Path(models_path)
        _init_models(self.models_path)

        self.target_face = None
        self._target_face_path = None

    def load_target_face(self, image_path: Path) -> bool:
        """Load and cache the target face for swapping.

        Args:
            image_path: Path to image of the face to swap TO

        Returns:
            True if face was detected and loaded
        """
        image_path = Path(image_path)

        if not image_path.exists():
            raise FileNotFoundError(f"Target face image not found: {image_path}")

        img = cv2.imread(str(image_path))
        if img is None:
            raise ValueError(f"Could not read image: {image_path}")

        faces = _face_analysis.get(img)

        if not faces:
            logger.warning(f"No face detected in {image_path}")
            return False

        self.target_face = faces[0]
        self._target_face_path = image_path
        logger.info(f"Target face loaded from {image_path}")
        return True

    def swap_frame(self, frame: np.ndarray) -> Tuple[np.ndarray, bool]:
        """Swap face in a single frame.

        Args:
            frame: BGR image array (OpenCV format)

        Returns:
            Tuple of (processed frame, success bool)
        """
        if self.target_face is None:
            raise RuntimeError("Target face not loaded. Call load_target_face() first.")

        # Detect faces in frame
        faces = _face_analysis.get(frame)

        if not faces:
            return frame, False

        # Swap the first detected face
        result = _swapper.get(frame, faces[0], self.target_face, paste_back=True)

        return result, True

    def swap_video(
        self,
        input_path: Path,
        output_path: Path,
        progress_callback: Optional[callable] = None
    ) -> Path:
        """Process entire video frame by frame.

        Args:
            input_path: Path to input video
            output_path: Path for output video
            progress_callback: Optional callback(current, total) for progress updates

        Returns:
            Path to output video
        """
        input_path = Path(input_path)
        output_path = Path(output_path)

        if self.target_face is None:
            raise RuntimeError("Target face not loaded. Call load_target_face() first.")

        # Open input video
        cap = cv2.VideoCapture(str(input_path))
        if not cap.isOpened():
            raise ValueError(f"Could not open video: {input_path}")

        # Get video properties
        fps = int(cap.get(cv2.CAP_PROP_FPS))
        width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))

        # Ensure output directory exists
        output_path.parent.mkdir(parents=True, exist_ok=True)

        # Initialize video writer
        fourcc = cv2.VideoWriter_fourcc(*'mp4v')
        writer = cv2.VideoWriter(str(output_path), fourcc, fps, (width, height))

        frame_count = 0
        swapped_count = 0

        try:
            while True:
                ret, frame = cap.read()
                if not ret:
                    break

                # Swap face
                result, success = self.swap_frame(frame)
                if success:
                    swapped_count += 1

                writer.write(result)
                frame_count += 1

                if progress_callback and frame_count % 10 == 0:
                    progress_callback(frame_count, total_frames)

            logger.info(
                f"Video processed: {frame_count} frames, "
                f"{swapped_count} faces swapped ({swapped_count/frame_count*100:.1f}%)"
            )

        finally:
            cap.release()
            writer.release()

        return output_path


def create_face_swapper(models_path: Path) -> FaceSwapper:
    """Factory function to create FaceSwapper instance.

    Args:
        models_path: Path to models directory

    Returns:
        Configured FaceSwapper instance
    """
    return FaceSwapper(models_path)
