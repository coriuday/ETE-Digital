"""
Authentication endpoint tests
"""

import uuid
import pytest
from httpx import AsyncClient

pytestmark = pytest.mark.asyncio


def unique_email(prefix: str = "user") -> str:
    """Generate a guaranteed-unique email for each test run."""
    return f"{prefix}_{uuid.uuid4().hex[:10]}@example.com"


async def test_register_success(client: AsyncClient):
    """Registering a new user returns 201 with user data."""
    email = unique_email("new")
    response = await client.post(
        "/api/auth/register",
        json={
            "email": email,
            "password": "SecurePass1!",
            "role": "candidate",
            "full_name": "New User",
        },
    )
    assert response.status_code == 201, response.json()
    data = response.json()
    assert data["email"] == email
    assert data["role"] == "candidate"
    assert "id" in data


async def test_register_duplicate_email(client: AsyncClient):
    """Registering with an existing email returns 409."""
    email = unique_email("dup")
    payload = {
        "email": email,
        "password": "SecurePass1!",
        "role": "candidate",
        "full_name": "Dup User",
    }
    # First registration — should succeed
    first = await client.post("/api/auth/register", json=payload)
    assert first.status_code == 201, first.json()
    # Second registration — should return 400 or 409 (duplicate email conflict)
    response = await client.post("/api/auth/register", json=payload)
    assert response.status_code in (400, 409), response.json()


async def test_register_weak_password(client: AsyncClient):
    """Registering with a weak password returns 422 or 400."""
    response = await client.post(
        "/api/auth/register",
        json={
            "email": unique_email("weak"),
            "password": "short",
            "role": "candidate",
        },
    )
    assert response.status_code in (400, 422)


async def test_login_success(client: AsyncClient, candidate_user):
    """Login with correct credentials returns access and refresh tokens."""
    response = await client.post(
        "/api/auth/login",
        json={
            "email": candidate_user.email,
            "password": "TestPass1!",
        },
    )
    assert response.status_code == 200, response.json()
    data = response.json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["token_type"] == "bearer"


async def test_login_wrong_password(client: AsyncClient, candidate_user):
    """Login with wrong password returns 401."""
    response = await client.post(
        "/api/auth/login",
        json={
            "email": candidate_user.email,
            "password": "WrongPass99!",
        },
    )
    assert response.status_code == 401


async def test_login_nonexistent_user(client: AsyncClient):
    """Login with unknown email returns 401."""
    response = await client.post(
        "/api/auth/login",
        json={
            "email": "nobody@example.com",
            "password": "AnyPass1!",
        },
    )
    assert response.status_code == 401


async def test_logout_no_token(client: AsyncClient):
    """Logout without a token body still returns 200."""
    response = await client.post("/api/auth/logout", json={})
    assert response.status_code == 200


async def test_forgot_password_always_succeeds(client: AsyncClient):
    """Forgot password endpoint always returns 200 to prevent user enumeration."""
    response = await client.post("/api/auth/forgot-password", json={"email": "doesnotexist@example.com"})
    assert response.status_code == 200


async def test_resend_verification_always_returns_generic_message(client: AsyncClient):
    """Resend verification must not reveal whether the email exists."""
    response = await client.post(
        "/api/auth/resend-verification",
        json={"email": "doesnotexist@example.com"},
    )
    assert response.status_code == 200, response.json()
    assert "verification link has been sent" in response.json()["message"].lower()


async def test_resend_verification_for_unverified_user(client: AsyncClient, _db, monkeypatch):
    """Resend verification regenerates token for unverified users."""
    from datetime import datetime, timedelta, timezone
    from app.models.users import User, UserRole
    from app.core.security import hash_password

    email = unique_email("unverified")
    user = User(
        email=email,
        password_hash=hash_password("SecurePass1!"),
        role=UserRole.CANDIDATE,
        is_active=True,
        is_verified=False,
        verification_token="old-token",
        verification_token_expires=datetime.now(timezone.utc) + timedelta(hours=1),
    )
    _db.add(user)
    await _db.commit()

    sent = []

    def fake_send(to_email, verification_url):
        sent.append((to_email, verification_url))
        return True

    monkeypatch.setattr("app.services.auth.email_service.send_verification_email", fake_send)

    response = await client.post("/api/auth/resend-verification", json={"email": email})
    assert response.status_code == 200
    assert len(sent) == 1
    assert sent[0][0] == email
    assert "token=" in sent[0][1]


async def test_login_blocks_unverified_in_production(client: AsyncClient, _db, monkeypatch):
    """Production login returns 403 when email is not verified."""
    from app.models.users import User, UserRole
    from app.core.security import hash_password
    from app.core.config import settings

    email = unique_email("produnverified")
    user = User(
        email=email,
        password_hash=hash_password("SecurePass1!"),
        role=UserRole.CANDIDATE,
        is_active=True,
        is_verified=False,
    )
    _db.add(user)
    await _db.commit()

    monkeypatch.setattr(settings, "ENVIRONMENT", "production")

    response = await client.post(
        "/api/auth/login",
        json={"email": email, "password": "SecurePass1!"},
    )
    assert response.status_code == 403
    assert "email not verified" in response.json()["detail"].lower()
