"""Security tests for payment webhooks and OAuth MFA."""

import uuid

import pytest
from httpx import AsyncClient

from app.api.auth.oauth import _oauth_callback_hash, _oauth_mobile_tokens
from app.models.users import User, UserRole


def test_oauth_mfa_gate_returns_partial_token_only():
    """OAuth must not issue full JWTs when TOTP is enabled."""
    user = User(
        id=uuid.uuid4(),
        email="mfa@example.com",
        password_hash="hash",
        role=UserRole.CANDIDATE,
        totp_enabled=True,
        is_verified=True,
        is_active=True,
    )
    mobile = _oauth_mobile_tokens(user)
    assert mobile["requires_2fa"] is True
    assert mobile.get("partial_token")
    assert "access_token" not in mobile

    callback_hash = _oauth_callback_hash(user)
    assert "partial_token=" in callback_hash
    assert "requires_2fa=1" in callback_hash
    assert "access_token=" not in callback_hash


@pytest.mark.asyncio
async def test_payment_webhook_rejects_unsigned_in_production(client: AsyncClient, monkeypatch):
    """Production must not accept forged webhook payloads."""
    from app.core import config

    monkeypatch.setattr(config.settings, "ENVIRONMENT", "production")
    monkeypatch.setattr(config.settings, "STRIPE_SECRET_KEY", "")

    response = await client.post(
        "/api/payments/webhook",
        content=b'{"type":"payment_intent.succeeded","data":{"object":{"id":"pi_test"}}}',
        headers={"Content-Type": "application/json"},
    )
    assert response.status_code == 503


@pytest.mark.asyncio
async def test_billing_webhook_rejects_missing_secret_in_production(client: AsyncClient, monkeypatch):
    from app.core import config

    monkeypatch.setattr(config.settings, "ENVIRONMENT", "production")
    monkeypatch.setattr(config.settings, "STRIPE_WEBHOOK_SECRET", "")

    response = await client.post(
        "/api/billing/webhook",
        content=b"{}",
        headers={"Content-Type": "application/json", "stripe-signature": "t=1,v1=fake"},
    )
    assert response.status_code == 503
