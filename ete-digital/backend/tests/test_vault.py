"""
Talent Vault endpoint tests
"""

import pytest
from httpx import AsyncClient

pytestmark = pytest.mark.asyncio

VAULT_ITEM_PAYLOAD = {
    "type": "project",  # VaultItemType enum value (lowercase)
    "title": "My Portfolio Project",
    "description": "An awesome project built with FastAPI and React",
    "file_url": "https://github.com/example/project",
    "tags": ["Python", "React"],
}


async def test_add_vault_item(client: AsyncClient, candidate_token: str):
    """Candidate can add a vault item and get 201."""
    response = await client.post(
        "/api/vault/items",
        json=VAULT_ITEM_PAYLOAD,
        headers={"Authorization": f"Bearer {candidate_token}"},
    )
    assert response.status_code == 201, response.json()
    data = response.json()
    assert data["title"] == "My Portfolio Project"
    assert "id" in data


async def test_get_vault_items(client: AsyncClient, candidate_token: str):
    """Candidate can list their vault items."""
    await client.post(
        "/api/vault/items",
        json=VAULT_ITEM_PAYLOAD,
        headers={"Authorization": f"Bearer {candidate_token}"},
    )
    response = await client.get(
        "/api/vault/items",
        headers={"Authorization": f"Bearer {candidate_token}"},
    )
    assert response.status_code == 200
    data = response.json()
    assert "items" in data
    assert len(data["items"]) >= 1


async def test_employer_cannot_access_vault(client: AsyncClient, employer_token: str):
    """Employer cannot list candidate vault items — 403."""
    response = await client.get(
        "/api/vault/items",
        headers={"Authorization": f"Bearer {employer_token}"},
    )
    assert response.status_code == 403


async def test_create_share_token(client: AsyncClient, candidate_token: str):
    """Candidate can create share tokens for vault items — returns a list."""
    # First add a vault item
    add_resp = await client.post(
        "/api/vault/items",
        json=VAULT_ITEM_PAYLOAD,
        headers={"Authorization": f"Bearer {candidate_token}"},
    )
    assert add_resp.status_code == 201, add_resp.json()
    item_id = add_resp.json()["id"]

    # Create share tokens (returns a list)
    response = await client.post(
        "/api/vault/share",
        json={
            "vault_item_ids": [item_id],
            "expires_hours": 24,
            "max_views": 5,
            "shared_with_company": "TestCorp",
        },
        headers={"Authorization": f"Bearer {candidate_token}"},
    )
    assert response.status_code == 201, response.json()
    data = response.json()
    # Endpoint returns a list of share tokens
    assert isinstance(data, list)
    assert len(data) > 0
    assert "token" in data[0]
    return data[0]["token"]


async def test_access_shared_vault_public(client: AsyncClient, candidate_token: str):
    """Shared vault page is accessible via token without auth."""
    # Add item
    add_resp = await client.post(
        "/api/vault/items",
        json=VAULT_ITEM_PAYLOAD,
        headers={"Authorization": f"Bearer {candidate_token}"},
    )
    item_id = add_resp.json()["id"]

    # Create share
    share_resp = await client.post(
        "/api/vault/share",
        json={"vault_item_ids": [item_id], "expires_hours": 24, "max_views": 10},
        headers={"Authorization": f"Bearer {candidate_token}"},
    )
    tokens_list = share_resp.json()
    assert len(tokens_list) > 0
    token = tokens_list[0]["token"]

    # Access publicly
    response = await client.get(f"/api/vault/shared/{token}")
    assert response.status_code == 200
    data = response.json()
    assert "item" in data
