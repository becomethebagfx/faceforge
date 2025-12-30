"""WebSocket handler for real-time video streaming."""

import asyncio
import base64
import logging
import time
from typing import Optional, Dict, Any
from dataclasses import dataclass

import cv2
import numpy as np
from fastapi import WebSocket, WebSocketDisconnect

logger = logging.getLogger(__name__)


@dataclass
class StreamSession:
    """Active streaming session."""
    websocket: WebSocket
    target_face: Optional[np.ndarray] = None
    is_processing: bool = False
    frames_processed: int = 0
    last_frame_time: float = 0
    fps: float = 0


class StreamManager:
    """Manages WebSocket streaming sessions."""

    def __init__(self):
        self.sessions: Dict[str, StreamSession] = {}
        self._face_swapper = None

    async def connect(self, websocket: WebSocket, session_id: str) -> StreamSession:
        """Accept WebSocket connection and create session."""
        await websocket.accept()
        session = StreamSession(websocket=websocket)
        self.sessions[session_id] = session
        logger.info(f"Stream session connected: {session_id}")
        return session

    def disconnect(self, session_id: str):
        """Remove session on disconnect."""
        if session_id in self.sessions:
            del self.sessions[session_id]
            logger.info(f"Stream session disconnected: {session_id}")

    async def set_target_face(self, session_id: str, face_data: bytes) -> bool:
        """Set target face for face swapping."""
        if session_id not in self.sessions:
            return False

        try:
            # Decode image from base64
            nparr = np.frombuffer(face_data, np.uint8)
            img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

            if img is None:
                logger.error("Failed to decode target face image")
                return False

            self.sessions[session_id].target_face = img
            logger.info(f"Target face set for session: {session_id}")
            return True

        except Exception as e:
            logger.error(f"Error setting target face: {e}")
            return False

    async def process_frame(
        self,
        session_id: str,
        frame_data: bytes
    ) -> Optional[bytes]:
        """Process a single frame with face swap."""
        session = self.sessions.get(session_id)
        if not session:
            return None

        if session.is_processing:
            return None  # Skip if previous frame still processing

        session.is_processing = True
        start_time = time.time()

        try:
            # Decode incoming frame
            nparr = np.frombuffer(frame_data, np.uint8)
            frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

            if frame is None:
                return None

            # Process frame (placeholder - add actual face swap)
            processed = await self._process_frame_internal(session, frame)

            # Encode result as JPEG
            _, buffer = cv2.imencode('.jpg', processed, [cv2.IMWRITE_JPEG_QUALITY, 85])

            # Update session stats
            session.frames_processed += 1
            now = time.time()
            if session.last_frame_time > 0:
                session.fps = 1.0 / (now - session.last_frame_time)
            session.last_frame_time = now

            return buffer.tobytes()

        except Exception as e:
            logger.error(f"Frame processing error: {e}")
            return None

        finally:
            session.is_processing = False

    async def _process_frame_internal(
        self,
        session: StreamSession,
        frame: np.ndarray
    ) -> np.ndarray:
        """Internal frame processing with face swap."""
        # If no target face set, return original frame
        if session.target_face is None:
            return frame

        try:
            # Import face swapper lazily
            from core.face_swap import _face_analysis, _swapper, _init_models
            from pathlib import Path

            # Initialize models if needed
            models_path = Path(__file__).parent.parent.parent / "models"
            if _face_analysis is None:
                _init_models(models_path)

            # Detect target face embedding (cache this)
            if not hasattr(session, '_target_embedding'):
                faces = _face_analysis.get(session.target_face)
                if faces:
                    session._target_embedding = faces[0]
                else:
                    return frame

            # Detect faces in current frame
            faces = _face_analysis.get(frame)
            if not faces:
                return frame

            # Swap face
            result = _swapper.get(
                frame,
                faces[0],
                session._target_embedding,
                paste_back=True
            )

            return result

        except ImportError:
            # Face swap not available, return original
            return frame
        except Exception as e:
            logger.warning(f"Face swap failed: {e}")
            return frame

    def get_stats(self, session_id: str) -> Dict[str, Any]:
        """Get session statistics."""
        session = self.sessions.get(session_id)
        if not session:
            return {}

        return {
            "frames_processed": session.frames_processed,
            "fps": round(session.fps, 1),
            "has_target_face": session.target_face is not None,
        }


# Global stream manager instance
stream_manager = StreamManager()


async def websocket_stream_handler(
    websocket: WebSocket,
    session_id: str
):
    """Main WebSocket handler for video streaming."""
    session = await stream_manager.connect(websocket, session_id)

    try:
        while True:
            # Receive message
            message = await websocket.receive()

            if message["type"] == "websocket.disconnect":
                break

            if "bytes" in message:
                # Binary data - process as frame
                frame_data = message["bytes"]

                # Check for command prefix
                if frame_data[:4] == b"FACE":
                    # Set target face
                    success = await stream_manager.set_target_face(
                        session_id,
                        frame_data[4:]
                    )
                    await websocket.send_json({"type": "face_set", "success": success})
                else:
                    # Process frame
                    result = await stream_manager.process_frame(session_id, frame_data)
                    if result:
                        await websocket.send_bytes(result)

            elif "text" in message:
                # JSON command
                import json
                try:
                    data = json.loads(message["text"])
                    cmd = data.get("command")

                    if cmd == "stats":
                        stats = stream_manager.get_stats(session_id)
                        await websocket.send_json({"type": "stats", **stats})
                    elif cmd == "ping":
                        await websocket.send_json({"type": "pong"})

                except json.JSONDecodeError:
                    pass

    except WebSocketDisconnect:
        pass
    finally:
        stream_manager.disconnect(session_id)
