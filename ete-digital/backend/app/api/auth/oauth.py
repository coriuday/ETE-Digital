"""
Google OAuth 2.0 Authentication
=================================
GET  /api/auth/oauth/google           → Redirect to Google consent screen
GET  /api/auth/oauth/google/callback  → Handle Google callback, issue JWT
POST /api/auth/oauth/google/mobile    → For React Native / mobile (exchange id_token)

Flow:
  1. User clicks "Sign in with Google"
  2. Frontend opens /api/auth/oauth/google (redirects to Google)
  3. Google redirects back to /callback with ?code=...
  4. Backend exchanges code for tokens, fetches user info
  5. Upserts user in DB (creates if new, updates if returning)
  6. Issues Jobrows JWT, redirects frontend to dashboard

Requirements (set in .env):
  GOOGLE_CLIENT_ID=your_client_id
  GOOGLE_CLIENT_SECRET=your_client_secret
  GOOGLE_REDIRECT_URI=https://your-backend.com/api/auth/oauth/google/callback
"""

import base64
import json
import uuid
from typing import Optional

import httpx
from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from fastapi.responses import RedirectResponse
from pydantic import BaseModel
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.database import get_db
from app.core.security import create_access_token, create_refresh_token
from app.models.users import User, UserProfile, UserRole

router = APIRouter(prefix="/api/auth/oauth", tags=["oauth"])

GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v3/userinfo"


def _google_configured() -> bool:
    return bool(settings.GOOGLE_CLIENT_ID and settings.GOOGLE_CLIENT_SECRET)


# ─── Redirect to Google ──────────────────────────────────────

@router.get("/google")
async def google_login(
    role: str = Query(default="candidate", regex="^(candidate|employer)$"),
):
    """
    Redirect user to Google OAuth2 consent screen.
    Accepts ?role=candidate (default) or ?role=employer
    and encodes it in the OAuth state param so it survives the round-trip.
    """
    if not _google_configured():
        raise HTTPException(
            status_code=503,
            detail="Google OAuth is not configured on this server. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.",
        )

    import urllib.parse

    # Encode the desired role in the state param (base64 JSON)
    state_payload = base64.urlsafe_b64encode(
        json.dumps({"role": role}).encode()
    ).decode()

    params = {
        "client_id": settings.GOOGLE_CLIENT_ID,
        "redirect_uri": settings.GOOGLE_REDIRECT_URI,
        "response_type": "code",
        "scope": "openid email profile",
        "access_type": "offline",
        "prompt": "select_account",  # Always show account picker
        "state": state_payload,
    }
    url = f"{GOOGLE_AUTH_URL}?{urllib.parse.urlencode(params)}"
    return RedirectResponse(url=url)


# ─── Handle Google Callback ──────────────────────────────────

@router.get("/google/callback")
async def google_callback(
    code: Optional[str] = None,
    error: Optional[str] = None,
    state: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
):
    """
    Google redirects here after user grants/denies consent.
    Exchanges authorization code for tokens, upserts user, issues JWT.
    """
    if error:
        # User denied consent — redirect to login with error
        return RedirectResponse(
            url=f"{settings.FRONTEND_URL}/login?error=oauth_denied"
        )

    if not code:
        return RedirectResponse(
            url=f"{settings.FRONTEND_URL}/login?error=oauth_no_code"
        )

    if not _google_configured():
        raise HTTPException(status_code=503, detail="Google OAuth not configured.")

    # Decode role from state param (defaults to candidate if missing/invalid)
    desired_role = UserRole.CANDIDATE
    if state:
        try:
            state_data = json.loads(base64.urlsafe_b64decode(state.encode()).decode())
            role_str = state_data.get("role", "candidate")
            if role_str == "employer":
                desired_role = UserRole.EMPLOYER
        except Exception:
            pass  # Malformed state — fall back to candidate

    # Exchange code for tokens
    async with httpx.AsyncClient() as client:
        token_response = await client.post(
            GOOGLE_TOKEN_URL,
            data={
                "code": code,
                "client_id": settings.GOOGLE_CLIENT_ID,
                "client_secret": settings.GOOGLE_CLIENT_SECRET,
                "redirect_uri": settings.GOOGLE_REDIRECT_URI,
                "grant_type": "authorization_code",
            },
        )

        if token_response.status_code != 200:
            return RedirectResponse(
                url=f"{settings.FRONTEND_URL}/login?error=oauth_token_exchange_failed"
            )

        token_data = token_response.json()
        access_token = token_data.get("access_token")

        # Fetch user info from Google
        userinfo_response = await client.get(
            GOOGLE_USERINFO_URL,
            headers={"Authorization": f"Bearer {access_token}"},
        )

        if userinfo_response.status_code != 200:
            return RedirectResponse(
                url=f"{settings.FRONTEND_URL}/login?error=oauth_userinfo_failed"
            )

        google_user = userinfo_response.json()

    # Extract Google user data
    google_id = google_user.get("sub")
    email = google_user.get("email")
    name = google_user.get("name", "")
    avatar_url = google_user.get("picture")
    email_verified_by_google = google_user.get("email_verified", False)

    if not email or not google_id:
        return RedirectResponse(
            url=f"{settings.FRONTEND_URL}/login?error=oauth_missing_data"
        )

    # ── Upsert User ──────────────────────────────────────────
    # Check if user exists (by OAuth ID or email)
    result = await db.execute(
        select(User).where(
            (User.oauth_provider == "google") & (User.oauth_provider_id == google_id)
        )
    )
    user = result.scalars().first()

    if not user:
        # Try by email (may have registered with email/password before OAuth)
        result = await db.execute(select(User).where(User.email == email))
        user = result.scalars().first()

    if user:
        # Existing user — update OAuth binding and avatar
        await db.execute(
            update(User)
            .where(User.id == user.id)
            .values(
                oauth_provider="google",
                oauth_provider_id=google_id,
                avatar_url=avatar_url,
                email_verified=email_verified_by_google,
                is_verified=email_verified_by_google,
            )
        )
        await db.commit()
    else:
        # New user — create account with the role passed via state
        new_user_id = uuid.uuid4()
        user = User(
            id=new_user_id,
            email=email,
            password_hash="OAUTH_NO_PASSWORD",  # Sentinel — cannot be used for password login
            role=desired_role,                   # Candidate or Employer, from OAuth state
            is_verified=email_verified_by_google,
            email_verified=email_verified_by_google,
            is_active=True,
            oauth_provider="google",
            oauth_provider_id=google_id,
            avatar_url=avatar_url,
        )
        db.add(user)
        await db.flush()  # Get the user.id before creating profile

        # Create associated profile
        profile = UserProfile(
            user_id=new_user_id,
            full_name=name,
            avatar_url=avatar_url,
        )
        db.add(profile)
        await db.commit()
        await db.refresh(user)

    # Issue Jobrows JWT tokens
    role_value = user.role.value if hasattr(user.role, "value") else str(user.role)
    jwt_access = create_access_token(
        data={"sub": str(user.id), "email": user.email, "role": role_value}
    )
    jwt_refresh = create_refresh_token(data={"sub": str(user.id)})

    # Redirect to frontend with tokens in URL fragment (never in QS — stays client-side)
    # The frontend JS picks these up and stores in authStore.
    frontend_redirect = (
        f"{settings.FRONTEND_URL}/auth/callback"
        f"?access_token={jwt_access}"
        f"&refresh_token={jwt_refresh}"
        f"&role={role_value}"
    )
    return RedirectResponse(url=frontend_redirect)


# ─── Mobile / SPA Flow (exchange id_token directly) ─────────

class GoogleMobileTokenRequest(BaseModel):
    id_token: str  # Google ID token from client SDK


@router.post("/google/mobile")
async def google_mobile_auth(
    body: GoogleMobileTokenRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    For React Native / mobile or SPA flows where Google SDK on the
    client side provides an id_token directly.
    Backend verifies the token, then upserts user and returns JWT.
    """
    if not _google_configured():
        raise HTTPException(status_code=503, detail="Google OAuth not configured.")

    # Verify id_token with Google
    async with httpx.AsyncClient() as client:
        resp = await client.get(
            f"https://oauth2.googleapis.com/tokeninfo?id_token={body.id_token}"
        )

    if resp.status_code != 200:
        raise HTTPException(status_code=401, detail="Invalid Google ID token.")

    info = resp.json()

    # Verify audience matches our client ID
    if info.get("aud") != settings.GOOGLE_CLIENT_ID:
        raise HTTPException(status_code=401, detail="Token audience mismatch.")

    google_id = info.get("sub")
    email = info.get("email")
    name = info.get("name", "")
    avatar_url = info.get("picture")
    email_verified = info.get("email_verified") == "true"

    if not email or not google_id:
        raise HTTPException(status_code=400, detail="Missing email or user ID from Google token.")

    # Upsert user (same logic as callback)
    result = await db.execute(
        select(User).where(
            (User.oauth_provider == "google") & (User.oauth_provider_id == google_id)
        )
    )
    user = result.scalars().first()

    if not user:
        result = await db.execute(select(User).where(User.email == email))
        user = result.scalars().first()

    if user:
        await db.execute(
            update(User)
            .where(User.id == user.id)
            .values(oauth_provider="google", oauth_provider_id=google_id,
                    avatar_url=avatar_url, email_verified=email_verified)
        )
        await db.commit()
    else:
        new_id = uuid.uuid4()
        user = User(
            id=new_id, email=email, password_hash="OAUTH_NO_PASSWORD",
            role=UserRole.CANDIDATE, is_verified=email_verified,
            email_verified=email_verified, is_active=True,
            oauth_provider="google", oauth_provider_id=google_id, avatar_url=avatar_url,
        )
        db.add(user)
        await db.flush()
        db.add(UserProfile(user_id=new_id, full_name=name, avatar_url=avatar_url))
        await db.commit()
        await db.refresh(user)

    role_value = user.role.value if hasattr(user.role, "value") else str(user.role)
    return {
        "access_token": create_access_token(
            data={"sub": str(user.id), "email": user.email, "role": role_value}
        ),
        "refresh_token": create_refresh_token(data={"sub": str(user.id)}),
        "token_type": "bearer",
        "role": role_value,
        "is_new_user": not user,
    }
