"""WebSocket routes for real-time streaming."""

import uuid
from fastapi import APIRouter, WebSocket, Query

from realtime.stream_handler import websocket_stream_handler, stream_manager

router = APIRouter(tags=["WebSocket"])


@router.websocket("/ws/stream")
async def stream_endpoint(
    websocket: WebSocket,
    session_id: str = Query(default=None)
):
    """
    WebSocket endpoint for real-time video streaming.

    Connect with optional session_id for session persistence.
    If no session_id provided, a new one is generated.

    Protocol:
    - Send binary data prefixed with "FACE" to set target face
    - Send binary data (JPEG frame) to process
    - Receive binary data (processed JPEG frame)
    - Send JSON {"command": "stats"} to get session stats
    - Send JSON {"command": "ping"} for keepalive
    """
    if not session_id:
        session_id = str(uuid.uuid4())

    await websocket_stream_handler(websocket, session_id)


@router.get("/stream/sessions")
async def list_stream_sessions():
    """List active streaming sessions (admin/debug)."""
    return {
        "active_sessions": len(stream_manager.sessions),
        "sessions": [
            {
                "session_id": sid,
                "stats": stream_manager.get_stats(sid)
            }
            for sid in stream_manager.sessions
        ]
    }
