"""
User and Authentication Models
Includes: 2FA (TOTP), Google OAuth, email/phone verification, RLS-safe fields.
"""

from __future__ import annotations

import enum
import uuid
from datetime import datetime
from typing import Any, List, Optional

from sqlalchemy import Boolean, DateTime, Enum as SQLEnum, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from app.core.database import Base


class UserRole(str, enum.Enum):
    """User role enumeration"""

    CANDIDATE = "candidate"
    EMPLOYER = "employer"
    ADMIN = "admin"


class User(Base):
    """User model for authentication and profile"""

    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[UserRole] = mapped_column(
        SQLEnum(UserRole, values_callable=lambda x: [e.value for e in x]),
        nullable=False,
        index=True,
    )
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), onupdate=func.now())
    last_login_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))

    # Email verification
    verification_token: Mapped[Optional[str]] = mapped_column(String(255))
    verification_token_expires: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    email_verified: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    # Phone verification
    phone_verified: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    # Password reset
    reset_token: Mapped[Optional[str]] = mapped_column(String(255))
    reset_token_expires: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))

    # Two-Factor Authentication — TOTP (RFC 6238, Google Authenticator compatible)
    totp_secret: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)  # Base32 secret (encrypted)
    totp_enabled: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    totp_backup_codes: Mapped[Optional[List[Any]]] = mapped_column(JSONB, default=list)  # Hashed one-time codes

    # OAuth / Social Login
    oauth_provider: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    oauth_provider_id: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    avatar_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)

    # ORM relationships
    profile: Mapped[Optional["UserProfile"]] = relationship(
        "UserProfile",
        back_populates="user",
        uselist=False,
        cascade="all, delete-orphan",
    )
    refresh_tokens: Mapped[List["RefreshToken"]] = relationship(
        "RefreshToken", back_populates="user", cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<User {self.email}>"


class UserProfile(Base):
    """User profile with additional information"""

    __tablename__ = "user_profiles"

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), primary_key=True
    )

    # Basic info
    full_name: Mapped[Optional[str]] = mapped_column(String(255))
    phone: Mapped[Optional[str]] = mapped_column(String(20))
    location: Mapped[Optional[str]] = mapped_column(String(255))
    bio: Mapped[Optional[str]] = mapped_column(String(1000))
    avatar_url: Mapped[Optional[str]] = mapped_column(String(500))
    resume_url: Mapped[Optional[str]] = mapped_column(String(500))

    # Skills and experience (JSONB for flexibility)
    skills: Mapped[Optional[List[Any]]] = mapped_column(JSONB, default=list)  # ['Python', 'React', 'PostgreSQL']
    experience_years: Mapped[Optional[str]] = mapped_column(String(20))  # '2-3', '5-7', '10+'

    # Encrypted sensitive fields
    phone_encrypted: Mapped[Optional[str]] = mapped_column(String(500))  # Encrypted phone number
    ssn_encrypted: Mapped[Optional[str]] = mapped_column(String(500))  # Encrypted SSN (for payment/tax)

    # Social links (JSONB)
    social_links: Mapped[Optional[dict[str, Any]]] = mapped_column(JSONB, default=dict)  # {'linkedin': 'url', ...}

    # Preferences (JSONB)
    preferences: Mapped[Optional[dict[str, Any]]] = mapped_column(JSONB, default=dict)  # Job prefs, notification settings

    # AI Matching fields — populated from Profile Settings page
    salary_expectation_min: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    salary_expectation_max: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    preferred_job_types: Mapped[Optional[List[Any]]] = mapped_column(JSONB, default=list)  # ['full_time', 'contract']
    preferred_locations: Mapped[Optional[List[Any]]] = mapped_column(JSONB, default=list)  # ['Mumbai', 'Remote']

    # Phone verification timestamp
    phone_verified_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), onupdate=func.now())

    # ORM inverse relationship
    user: Mapped["User"] = relationship("User", back_populates="profile")

    def __repr__(self) -> str:
        return f"<UserProfile {self.full_name}>"


class RefreshToken(Base):
    """Refresh tokens for JWT authentication"""

    __tablename__ = "refresh_tokens"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    token: Mapped[str] = mapped_column(String(500), unique=True, nullable=False, index=True)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    is_revoked: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    # Client info for security
    ip_address: Mapped[Optional[str]] = mapped_column(String(45))
    user_agent: Mapped[Optional[str]] = mapped_column(String(500))

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # ORM inverse relationship
    user: Mapped["User"] = relationship("User", back_populates="refresh_tokens")

    def __repr__(self) -> str:
        return f"<RefreshToken {self.id}>"
