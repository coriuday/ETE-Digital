"""
User and Authentication Models
"""

from sqlalchemy import Column, String, Boolean, DateTime, Integer, Enum as SQLEnum, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import uuid
import enum

from app.core.database import Base


class UserRole(str, enum.Enum):
    """User role enumeration"""

    CANDIDATE = "candidate"
    EMPLOYER = "employer"
    ADMIN = "admin"


class User(Base):
    """User model for authentication and profile"""

    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    role = Column(
        SQLEnum(UserRole, values_callable=lambda x: [e.value for e in x]),
        nullable=False,
        index=True,
    )
    is_verified = Column(Boolean, default=False, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    last_login_at = Column(DateTime(timezone=True))

    # Email verification
    verification_token = Column(String(255))
    verification_token_expires = Column(DateTime(timezone=True))

    # Password reset
    reset_token = Column(String(255))
    reset_token_expires = Column(DateTime(timezone=True))

    # ORM relationships
    profile = relationship(
        "UserProfile",
        back_populates="user",
        uselist=False,
        cascade="all, delete-orphan",
    )
    refresh_tokens = relationship("RefreshToken", back_populates="user", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<User {self.email}>"


class UserProfile(Base):
    """User profile with additional information"""

    __tablename__ = "user_profiles"

    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)

    # Basic info
    full_name = Column(String(255))
    phone = Column(String(20))
    location = Column(String(255))
    bio = Column(String(1000))
    avatar_url = Column(String(500))
    resume_url = Column(String(500))

    # Skills and experience (JSONB for flexibility)
    skills = Column(JSONB, default=list)  # ['Python', 'React', 'PostgreSQL']
    experience_years = Column(String(20))  # '2-3', '5-7', '10+'

    # Encrypted sensitive fields
    phone_encrypted = Column(String(500))  # Encrypted phone number
    ssn_encrypted = Column(String(500))  # Encrypted SSN (for payment/tax)

    # Social links (JSONB)
    social_links = Column(JSONB, default=dict)  # {'linkedin': 'url', 'github': 'url'}

    # Preferences (JSONB)
    preferences = Column(JSONB, default=dict)  # Job preferences, notification settings

    # AI Matching fields — populated from Profile Settings page
    salary_expectation_min = Column(Integer, nullable=True)  # Candidate's floor salary
    salary_expectation_max = Column(Integer, nullable=True)  # Candidate's ceiling salary
    preferred_job_types = Column(JSONB, default=list)  # ['full_time', 'contract']
    preferred_locations = Column(JSONB, default=list)  # ['Mumbai', 'Remote', 'Bangalore']

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # ORM inverse relationship
    user = relationship("User", back_populates="profile")

    def __repr__(self):
        return f"<UserProfile {self.full_name}>"


class RefreshToken(Base):
    """Refresh tokens for JWT authentication"""

    __tablename__ = "refresh_tokens"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    token = Column(String(500), unique=True, nullable=False, index=True)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    is_revoked = Column(Boolean, default=False, nullable=False)

    # Client info for security
    ip_address = Column(String(45))
    user_agent = Column(String(500))

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # ORM inverse relationship
    user = relationship("User", back_populates="refresh_tokens")

    def __repr__(self):
        return f"<RefreshToken {self.id}>"
