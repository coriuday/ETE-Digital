"""
Two-Factor Authentication (TOTP) API Endpoints
================================================
POST /api/auth/2fa/setup    → Initiate 2FA setup, get QR code URI
POST /api/auth/2fa/enable   → Verify TOTP code and activate 2FA
POST /api/auth/2fa/disable  → Disable 2FA (requires current TOTP code)
POST /api/auth/2fa/backup   → Use a backup code to complete login
GET  /api/auth/2fa/status   → Check if 2FA is enabled for current user
"""

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update

from app.core.database import get_db
from app.core.security import (
    get_current_user,
    generate_totp_secret,
    verify_totp_code,
    generate_backup_codes,
    verify_backup_code,
    generate_totp_qr_url,
    encrypt_field,
    decrypt_field,
)
from app.models.users import User

router = APIRouter(prefix="/api/auth/2fa", tags=["two-factor-auth"])


# ─── Schemas ────────────────────────────────────────────────

class TOTPSetupResponse(BaseModel):
    qr_uri: str
    secret: str  # Show to user once for manual entry fallback
    message: str = "Scan the QR code with your authenticator app, then call /enable to activate."


class TOTPVerifyRequest(BaseModel):
    code: str = Field(..., min_length=6, max_length=6, description="6-digit TOTP code")


class TOTPEnableResponse(BaseModel):
    enabled: bool
    backup_codes: list[str]  # Shown ONCE — user must save these
    message: str


class TOTPDisableRequest(BaseModel):
    code: str = Field(..., description="Current TOTP code to confirm identity")


class TOTPBackupLoginRequest(BaseModel):
    backup_code: str = Field(..., description="One-time backup recovery code")
    partial_token: str = Field(..., description="Partial JWT issued after password validation")


class TOTPStatusResponse(BaseModel):
    enabled: bool
    backup_codes_remaining: int


# ─── Endpoints ──────────────────────────────────────────────

@router.get("/status", response_model=TOTPStatusResponse)
async def totp_status(
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Check 2FA status for the current user."""
    result = await db.execute(
        select(User).where(User.id == current_user["user_id"])
    )
    user = result.scalars().first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    backup_count = len(user.totp_backup_codes or [])
    return TOTPStatusResponse(enabled=user.totp_enabled, backup_codes_remaining=backup_count)


@router.post("/setup", response_model=TOTPSetupResponse)
async def totp_setup(
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Initiate 2FA setup. Generates a new TOTP secret and returns the QR URI.
    The secret is saved (unactivated) until the user verifies with /enable.
    """
    result = await db.execute(
        select(User).where(User.id == current_user["user_id"])
    )
    user = result.scalars().first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if user.totp_enabled:
        raise HTTPException(
            status_code=400,
            detail="2FA is already enabled. Disable it first before re-setting up.",
        )

    # Generate new secret
    secret = generate_totp_secret()
    encrypted_secret = encrypt_field(secret)

    # Save the unactivated secret (will be activated in /enable)
    await db.execute(
        update(User)
        .where(User.id == user.id)
        .values(totp_secret=encrypted_secret, totp_enabled=False)
    )
    await db.commit()

    qr_uri = generate_totp_qr_url(email=user.email, secret=secret)
    return TOTPSetupResponse(qr_uri=qr_uri, secret=secret)


@router.post("/enable", response_model=TOTPEnableResponse)
async def totp_enable(
    body: TOTPVerifyRequest,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Verify the TOTP code and activate 2FA.
    Also generates backup codes — shown ONCE, user must save them.
    """
    result = await db.execute(
        select(User).where(User.id == current_user["user_id"])
    )
    user = result.scalars().first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if not user.totp_secret:
        raise HTTPException(
            status_code=400,
            detail="Run /setup first to generate a TOTP secret.",
        )

    if user.totp_enabled:
        raise HTTPException(status_code=400, detail="2FA is already active.")

    # Decrypt stored secret and verify code
    secret = decrypt_field(user.totp_secret)
    if not verify_totp_code(secret, body.code):
        raise HTTPException(
            status_code=400,
            detail="Invalid TOTP code. Check your authenticator app and try again.",
        )

    # Generate backup codes
    plaintext_codes, hashed_codes = generate_backup_codes(count=8)

    # Enable 2FA and store hashed backup codes
    await db.execute(
        update(User)
        .where(User.id == user.id)
        .values(totp_enabled=True, totp_backup_codes=hashed_codes)
    )
    await db.commit()

    return TOTPEnableResponse(
        enabled=True,
        backup_codes=plaintext_codes,
        message=(
            "2FA enabled successfully! Save these backup codes in a secure place. "
            "They will NOT be shown again."
        ),
    )


@router.post("/disable")
async def totp_disable(
    body: TOTPDisableRequest,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Disable 2FA. Requires current TOTP code to confirm identity."""
    result = await db.execute(
        select(User).where(User.id == current_user["user_id"])
    )
    user = result.scalars().first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if not user.totp_enabled:
        raise HTTPException(status_code=400, detail="2FA is not enabled.")

    secret = decrypt_field(user.totp_secret)
    if not verify_totp_code(secret, body.code):
        raise HTTPException(
            status_code=400,
            detail="Invalid TOTP code. Cannot disable 2FA without valid verification.",
        )

    await db.execute(
        update(User)
        .where(User.id == user.id)
        .values(totp_enabled=False, totp_secret=None, totp_backup_codes=[])
    )
    await db.commit()

    return {"message": "2FA has been disabled.", "enabled": False}


@router.post("/verify-backup")
async def verify_backup(
    body: TOTPBackupLoginRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Use a one-time backup code to complete 2FA login.
    Called when user loses access to their authenticator app.
    """
    import jwt as pyjwt
    from app.core.config import settings

    # Decode partial token (issued by login endpoint when 2FA is required)
    try:
        payload = pyjwt.decode(
            body.partial_token,
            settings.JWT_SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM],
        )
        if payload.get("type") != "2fa_partial":
            raise HTTPException(status_code=401, detail="Invalid partial token.")
        user_id = payload.get("sub")
    except pyjwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired partial token.")

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalars().first()
    if not user or not user.totp_enabled:
        raise HTTPException(status_code=400, detail="2FA not enabled for this user.")

    hashed_codes = user.totp_backup_codes or []
    is_valid, remaining_codes = verify_backup_code(body.backup_code, hashed_codes)

    if not is_valid:
        raise HTTPException(
            status_code=400,
            detail="Invalid backup code.",
        )

    # Remove used backup code
    await db.execute(
        update(User)
        .where(User.id == user.id)
        .values(totp_backup_codes=remaining_codes)
    )
    await db.commit()

    # Issue full JWT
    from app.core.security import create_access_token, create_refresh_token
    from datetime import timedelta

    access_token = create_access_token(
        data={"sub": str(user.id), "email": user.email, "role": user.role.value}
    )
    refresh_token = create_refresh_token(
        data={"sub": str(user.id)}
    )

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "backup_codes_remaining": len(remaining_codes),
        "message": f"Login successful via backup code. {len(remaining_codes)} backup codes remaining.",
    }
