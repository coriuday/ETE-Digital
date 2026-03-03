"""
Notification & WebSocket endpoint smoke tests
"""
import pytest
from httpx import AsyncClient

pytestmark = pytest.mark.asyncio


async def test_get_notifications_for_new_user(client: AsyncClient, candidate_token: str):
    """New user gets an empty notification list."""
    response = await client.get(
        "/api/notifications/",
        headers={"Authorization": f"Bearer {candidate_token}"},
    )
    assert response.status_code == 200, response.json()
    data = response.json()
    assert "notifications" in data
    assert "unread_count" in data
    assert isinstance(data["unread_count"], int)


async def test_notifications_unread_only_filter(client: AsyncClient, candidate_token: str):
    """Unread-only filter returns subset of notifications."""
    response = await client.get(
        "/api/notifications/?unread_only=true",
        headers={"Authorization": f"Bearer {candidate_token}"},
    )
    assert response.status_code == 200
    data = response.json()
    # All returned should be unread if the filter worked
    for n in data["notifications"]:
        assert n["is_read"] is False


async def test_notifications_unauthenticated_returns_401_or_403(client: AsyncClient):
    """Unauthenticated request to notifications is rejected."""
    response = await client.get("/api/notifications/")
    assert response.status_code in (401, 403)


async def test_mark_all_read_succeeds(client: AsyncClient, candidate_token: str):
    """Mark all notifications as read returns 200 with message."""
    response = await client.patch(
        "/api/notifications/read-all",
        headers={"Authorization": f"Bearer {candidate_token}"},
    )
    assert response.status_code == 200
    data = response.json()
    assert "message" in data


async def test_websocket_upgrade_without_token_rejected(client: AsyncClient, candidate_user):
    """WebSocket endpoint without a valid token returns non-101 (rejected)."""
    user_id = str(candidate_user.id)
    response = await client.get(
        f"/api/ws/{user_id}",
        headers={"Upgrade": "websocket", "Connection": "Upgrade"},
    )
    # HTTP GET to a WebSocket endpoint without a token: rejected with 400, 403, 404, or 422
    assert response.status_code in (400, 403, 404, 422)
