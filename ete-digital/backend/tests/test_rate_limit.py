"""
Rate limiting tests — verifies SlowAPI returns 429 after limit is exceeded.
"""

import pytest
from httpx import AsyncClient

pytestmark = pytest.mark.asyncio


async def test_login_rate_limited(client: AsyncClient, candidate_user):
    """
    After hitting login 5 times with wrong password, the 6th request
    should receive HTTP 429 Too Many Requests.
    """
    payload = {"email": candidate_user.email, "password": "WrongPass!"}

    responses = []
    for _ in range(6):
        r = await client.post("/api/auth/login", json=payload)
        responses.append(r.status_code)

    # The last response should be 429 (rate limited)
    assert 429 in responses, f"Expected 429 in responses, got: {responses}"


async def test_register_rate_limited(client: AsyncClient):
    """
    After hitting register 5 times, the 6th should return 429.
    """
    responses = []
    for i in range(6):
        r = await client.post(
            "/api/auth/register",
            json={
                "email": f"ratelimit_{i}@test.com",
                "password": "SecurePass1!",
                "role": "candidate",
            },
        )
        responses.append(r.status_code)

    assert 429 in responses, f"Expected 429 in responses, got: {responses}"
