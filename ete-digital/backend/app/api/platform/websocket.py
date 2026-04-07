"""
WebSocket — Real-Time Notification Manager

Authentication flow (Fix for audit issues #3 & #4):
  1. Client connects — connection is ACCEPTED before auth check.
  2. Client MUST send {"type": "auth", "token": "<access_token>"} within 10 seconds.
  3. Server verifies the JWT, binds the connection to the user, then sends {"type": "connected"}.
  4. Connections that fail to authenticate within the timeout are closed with 1008.

NOTE on multi-worker scaling (audit issue #4):
  The in-memory dict works correctly for single-worker development deployments.
  For production with multiple Uvicorn workers, replace with a Redis pub/sub backend:
    - Each worker subscribes to "ws:notify:{user_id}" on connect/disconnect.
    - `send_to_user` publishes to that channel; the worker holding the socket delivers it.
  REDIS_URL is now a required production setting (enforced in config.py).
"""
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, status
from typing import Dict, Optional
import asyncio
import json
import logging

from app.core.security import decode_access_token

logger = logging.getLogger(__name__)

router = APIRouter()

AUTH_TIMEOUT_SECONDS = 10


class ConnectionManager:
    """Manages active WebSocket connections keyed by user_id (str)."""

    def __init__(self):
        self.active: Dict[str, WebSocket] = {}

    async def connect(self, user_id: str, ws: WebSocket):
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
):
    """
    WebSocket endpoint for real-time notifications.

    Connect: ws://localhost:8000/api/ws/{user_id}
    Authenticate: After connecting, immediately send:
        {"type": "auth", "token": "<JWT access token>"}
    Do NOT pass the token in the URL — it would be logged by every proxy/server.
    """
    # Accept the connection before authentication so we can send a close frame
    # with a proper status code if auth fails.
    await websocket.accept()

    # ---- Auth gate: wait for the client to send the token as the first message ----
    try:
        raw = await asyncio.wait_for(
            websocket.receive_text(), timeout=AUTH_TIMEOUT_SECONDS
        )
        msg = json.loads(raw)
    except asyncio.TimeoutError:
        logger.warning(f"[WS] Auth timeout for user_id={user_id}")
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return
    except Exception as e:
        logger.warning(f"[WS] Invalid auth message for user_id={user_id}: {e}")
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    if msg.get("type") != "auth" or not msg.get("token"):
        logger.warning(f"[WS] Missing auth message from user_id={user_id}")
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    token = msg["token"]
    payload = decode_access_token(token)
    if not payload or payload.get("sub") != user_id:
        logger.warning(f"[WS] Invalid JWT for user_id={user_id}")
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    # ---- Authenticated: register the connection ----
    await ws_manager.connect(user_id, websocket)

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
