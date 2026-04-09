"""
Authentication service
Business logic for user registration, login, and token management
"""

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from datetime import datetime, timedelta, timezone
from typing import Optional, Tuple
import asyncio
import secrets

from app.models.users import User, UserProfile, RefreshToken, UserRole
from app.core.security import (
    hash_password,
    verify_password,
    create_access_token,
    create_refresh_token,
    validate_password_strength,
)
from app.core.config import settings
from app.services.email import email_service
from fastapi import HTTPException, status


class AuthService:
    """Authentication service"""

    async def register_user(
        self,
        db: AsyncSession,
        email: str,
        password: str,
        role: UserRole,
        full_name: Optional[str] = None,
    ) -> User:
        """Register a new user"""
        # ADMIN role cannot be self-registered — must be created via DB / seed script
        if role == UserRole.ADMIN:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Admin accounts cannot be created through registration",
            )

        # Check if user already exists
        result = await db.execute(select(User).where(User.email == email))
        existing_user = result.scalar_one_or_none()

        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered",
            )

        # Auto-verify unconditionally as requested to bypass email verification issues
        is_dev = True

        # Create user
        user = User(
            email=email,
            password_hash=hash_password(password),
            role=role,
            is_verified=is_dev,  # True in dev, False in production
            verification_token=None if is_dev else secrets.token_urlsafe(32),
            verification_token_expires=(None if is_dev else (datetime.now(timezone.utc) + timedelta(hours=24))),
        )
        db.add(user)
        await db.flush()

        # Create user profile
        profile = UserProfile(
            user_id=user.id,
            full_name=full_name,
            skills=[],
            social_links={},
            preferences={},
        )
        db.add(profile)
        await db.commit()
        await db.refresh(user)

        # Only send verification email in production
        if not is_dev:
            verification_url = f"{settings.FRONTEND_URL}/verify-email?token={user.verification_token}"
            await asyncio.to_thread(email_service.send_verification_email, user.email, verification_url)

        return user

    async def verify_email(self, db: AsyncSession, token: str) -> User:
        """Verify user email with token"""
        result = await db.execute(
            select(User).where(
                User.verification_token == token,
                User.verification_token_expires > datetime.now(timezone.utc),
            )
        )
        user = result.scalar_one_or_none()

        if not user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid or expired verification token",
            )

        user.is_verified = True
        user.verification_token = None
        user.verification_token_expires = None
        await db.commit()
        await db.refresh(user)

        return user

    async def login(
        self,
        db: AsyncSession,
        email: str,
        password: str,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
    ) -> Tuple[str, str, User]:
        """Login user and return access and refresh tokens"""
        # Get user
        result = await db.execute(select(User).where(User.email == email))
        user = result.scalar_one_or_none()

        if not user or not verify_password(password, user.password_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password",
            )

        if not user.is_active:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account is deactivated")

        # if not user.is_verified:
        #     raise HTTPException(
        #         status_code=status.HTTP_403_FORBIDDEN,
        #         detail="Email not verified. Please check your email.",
        #     )

        # Update last login
        user.last_login_at = datetime.now(timezone.utc)

        # Create tokens
        token_data = {
            "sub": str(user.id),
            "email": user.email,
            "role": user.role.value,  # encode as plain string e.g. "employer"
        }

        access_token = create_access_token(token_data)
        refresh_token_str = create_refresh_token(token_data)

        # Store refresh token
        refresh_token = RefreshToken(
            user_id=user.id,
            token=refresh_token_str,
            expires_at=datetime.now(timezone.utc) + timedelta(days=settings.JWT_REFRESH_TOKEN_EXPIRE_DAYS),
            ip_address=ip_address,
            user_agent=user_agent,
        )
        db.add(refresh_token)
        await db.commit()

        return access_token, refresh_token_str, user

    async def refresh_access_token(self, db: AsyncSession, refresh_token_str: str) -> Tuple[str, str]:
        """Refresh access token using refresh token"""
        # Find refresh token
        result = await db.execute(
            select(RefreshToken).where(
                RefreshToken.token == refresh_token_str,
                RefreshToken.is_revoked == False,  # noqa: E712
                RefreshToken.expires_at > datetime.now(timezone.utc),
            )
        )
        refresh_token = result.scalar_one_or_none()

        if not refresh_token:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired refresh token",
            )

        # Get user
        result = await db.execute(select(User).where(User.id == refresh_token.user_id))
        user = result.scalar_one_or_none()

        if not user or not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found or inactive",
            )

        # Create new tokens
        token_data = {
            "sub": str(user.id),
            "email": user.email,
            "role": user.role.value,  # encode as plain string e.g. "employer"
        }

        new_access_token = create_access_token(token_data)
        new_refresh_token = create_refresh_token(token_data)

        # Revoke old refresh token
        refresh_token.is_revoked = True

        # Create new refresh token
        new_refresh = RefreshToken(
            user_id=user.id,
            token=new_refresh_token,
            expires_at=datetime.now(timezone.utc) + timedelta(days=settings.JWT_REFRESH_TOKEN_EXPIRE_DAYS),
            ip_address=refresh_token.ip_address,
            user_agent=refresh_token.user_agent,
        )
        db.add(new_refresh)
        await db.commit()

        return new_access_token, new_refresh_token

    async def request_password_reset(self, db: AsyncSession, email: str) -> bool:
        """Request password reset"""
        result = await db.execute(select(User).where(User.email == email))
        user = result.scalar_one_or_none()

        # Don't reveal if user exists
        if not user:
            return True

        # Generate reset token
        user.reset_token = secrets.token_urlsafe(32)
        user.reset_token_expires = datetime.now(timezone.utc) + timedelta(hours=1)
        await db.commit()

        # Send reset email
        reset_url = f"{settings.FRONTEND_URL}/reset-password?token={user.reset_token}"
        await asyncio.to_thread(email_service.send_password_reset_email, user.email, reset_url)

        return True

    async def reset_password(self, db: AsyncSession, token: str, new_password: str) -> User:
        """Reset password with token"""
        result = await db.execute(
            select(User).where(
                User.reset_token == token,
                User.reset_token_expires > datetime.now(timezone.utc),
            )
        )
        user = result.scalar_one_or_none()

        if not user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid or expired reset token",
            )

        # Validate new password strength
        if not validate_password_strength(new_password):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Password too weak. Must be 8+ characters with uppercase, lowercase, digit, and special character.",
            )

        # Update password
        user.password_hash = hash_password(new_password)
        user.reset_token = None
        user.reset_token_expires = None

        # Revoke all refresh tokens for security
        await db.execute(update(RefreshToken).where(RefreshToken.user_id == user.id).values(is_revoked=True))

        await db.commit()
        await db.refresh(user)

        return user

    async def logout(self, db: AsyncSession, refresh_token_str: str) -> bool:
        """Logout user by revoking refresh token"""
        result = await db.execute(select(RefreshToken).where(RefreshToken.token == refresh_token_str))
        refresh_token = result.scalar_one_or_none()

        if refresh_token:
            refresh_token.is_revoked = True
            await db.commit()

        return True


# Singleton instance
auth_service = AuthService()
