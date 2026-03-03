"""
Admin endpoint tests — platform stats, user management, job moderation
"""
import pytest
import uuid as _uuid
from httpx import AsyncClient

pytestmark = pytest.mark.asyncio

# ---- Admin user fixture is defined in conftest.py ----


async def test_get_platform_stats(client: AsyncClient, admin_token: str):
    """Admin can retrieve platform-wide statistics."""
    response = await client.get(
        "/api/admin/stats",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert response.status_code == 200, response.json()
    data = response.json()
    assert "total_users" in data
    assert "total_jobs" in data
    assert "total_applications" in data
    assert isinstance(data["total_users"], int)


async def test_get_platform_stats_candidate_forbidden(client: AsyncClient, candidate_token: str):
    """Non-admin cannot access platform stats."""
    response = await client.get(
        "/api/admin/stats",
        headers={"Authorization": f"Bearer {candidate_token}"},
    )
    assert response.status_code == 403


async def test_list_users(client: AsyncClient, admin_token: str):
    """Admin can list all users with pagination."""
    response = await client.get(
        "/api/admin/users",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert response.status_code == 200, response.json()
    data = response.json()
    assert "users" in data
    assert "total" in data
    assert isinstance(data["users"], list)


async def test_list_users_filter_by_role(client: AsyncClient, admin_token: str):
    """Admin can filter users by role."""
    response = await client.get(
        "/api/admin/users?role=candidate",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert response.status_code == 200
    data = response.json()
    for user in data["users"]:
        assert user["role"] == "candidate"


async def test_toggle_user_active(client: AsyncClient, admin_token: str, candidate_user):
    """Admin can toggle a user's active status."""
    user_id = str(candidate_user.id)
    original_status = candidate_user.is_active

    response = await client.patch(
        f"/api/admin/users/{user_id}/toggle-active",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert response.status_code == 200, response.json()
    data = response.json()
    assert "is_active" in data
    assert data["is_active"] != original_status


async def test_list_all_jobs(client: AsyncClient, admin_token: str):
    """Admin can list all jobs on the platform."""
    response = await client.get(
        "/api/admin/jobs",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert response.status_code == 200, response.json()
    data = response.json()
    assert "jobs" in data
    assert "total" in data
