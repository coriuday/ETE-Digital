"""
WebSocket — Real-Time Notification Manager

Authenticated via JWT query param: ws://host/api/ws/{user_id}?token=<access_token>
"""

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query, status
from typing import Dict, Optional
import asyncio
import json
import logging

from app.core.security import decode_access_token

logger = logging.getLogger(__name__)

router = APIRouter()


class ConnectionManager:
    """Manages active WebSocket connections keyed by user_id (str)."""

    def __init__(self):
        self.active: Dict[str, WebSocket] = {}

    async def connect(self, user_id: str, ws: WebSocket):
        await ws.accept()
        self.active[user_id] = ws
        logger.info(f"[WS] Connected: {user_id}  active={len(self.active)}")

    def disconnect(self, user_id: str):
        self.active.pop(user_id, None)
        logger.info(f"[WS] Disconnected: {user_id}  active={len(self.active)}")

    async def send_to_user(self, user_id: str, payload: dict) -> bool:
        """Send JSON payload to a specific user. Returns True if sent."""
        ws = self.active.get(str(user_id))
        if ws:
            try:
                await ws.send_text(json.dumps(payload))
                return True
            except Exception as e:
                logger.warning(f"[WS] Failed to send to {user_id}: {e}")
                self.disconnect(str(user_id))
        return False

    async def broadcast(self, payload: dict):
        """Broadcast to all connected users."""
        dead = []
        for uid, ws in self.active.items():
            try:
                await ws.send_text(json.dumps(payload))
            except Exception:
                dead.append(uid)
        for uid in dead:
            self.disconnect(uid)


# Singleton — importable by notification_service
ws_manager = ConnectionManager()


@router.websocket("/{user_id}")
async def websocket_endpoint(
    websocket: WebSocket,
    user_id: str,
    token: Optional[str] = Query(default=None),
):
    """
    WebSocket endpoint for real-time notifications.

    Connect: ws://localhost:8000/api/ws/{user_id}?token=<JWT>
    The JWT must belong to the same user_id.
    """
    # ---- Auth gate ----
    if not token:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    payload = decode_access_token(token)
    if not payload or payload.get("sub") != user_id:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    await ws_manager.connect(user_id, websocket)
    # Send initial welcome
    await ws_manager.send_to_user(
        user_id, {"type": "connected", "message": "Real-time notifications active"}
    )

    try:
        while True:
            # Keep-alive: echo client pings, send server heartbeat every 30s
            try:
                data = await asyncio.wait_for(websocket.receive_text(), timeout=30.0)
                msg = json.loads(data)
                if msg.get("type") == "ping":
                    await ws_manager.send_to_user(user_id, {"type": "pong"})
            except asyncio.TimeoutError:
                # Send heartbeat
                await ws_manager.send_to_user(user_id, {"type": "ping"})
    except WebSocketDisconnect:
        ws_manager.disconnect(user_id)
    except Exception as e:
        logger.error(f"[WS] Unexpected error for {user_id}: {e}")
        ws_manager.disconnect(user_id)
