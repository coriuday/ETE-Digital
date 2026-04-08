"""
User-related Pydantic schemas
"""

from pydantic import BaseModel, EmailStr, Field, field_validator, ConfigDict
from typing import Optional, List
from datetime import datetime
from app.models.users import UserRole


# ========== Registration & Authentication ==========


class UserRegister(BaseModel):
    """User registration request"""

    email: EmailStr
    password: str = Field(..., min_length=8, max_length=100)
    role: UserRole
    full_name: Optional[str] = Field(None, max_length=255)

    @field_validator("password")
    def validate_password_strength(cls, v):
        from app.core.security import validate_password_strength

        if not validate_password_strength(v):
            raise ValueError(
                "Password must contain uppercase, lowercase, digit, and special character"
            )
        return v


class UserLogin(BaseModel):
    """User login request"""

    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    """Token response"""

    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int  # seconds


class RefreshTokenRequest(BaseModel):
    """Refresh token request"""

    refresh_token: str


class EmailVerificationRequest(BaseModel):
    """Email verification request"""

    token: str


class PasswordResetRequest(BaseModel):
    """Password reset request"""

    email: EmailStr


class PasswordResetConfirm(BaseModel):
    """Password reset confirmation"""

    token: str
    new_password: str = Field(..., min_length=8, max_length=100)

    @field_validator("new_password")
    def validate_password_strength(cls, v):
        from app.core.security import validate_password_strength

        if not validate_password_strength(v):
            raise ValueError(
                "Password must contain uppercase, lowercase, digit, and special character"
            )
        return v


# ========== User Profile ==========


class UserProfileUpdate(BaseModel):
    """User profile update request"""

    full_name: Optional[str] = Field(None, max_length=255)
    phone: Optional[str] = Field(None, max_length=20)
    location: Optional[str] = Field(None, max_length=255)
    bio: Optional[str] = Field(None, max_length=1000)
    skills: Optional[List[str]] = None
    experience_years: Optional[str] = None
    social_links: Optional[dict] = None
    preferences: Optional[dict] = None


class UserProfileResponse(BaseModel):
    """User profile response"""

    user_id: str
    full_name: Optional[str]
    phone: Optional[str]
    location: Optional[str]
    bio: Optional[str]
    avatar_url: Optional[str]
    resume_url: Optional[str]
    skills: List[str]
    experience_years: Optional[str]
    social_links: dict
    preferences: dict
    created_at: datetime
    updated_at: Optional[datetime]

    model_config = ConfigDict(from_attributes=True)


class UserResponse(BaseModel):
    """User response (without password)"""

    id: str
    email: str
    role: UserRole
    is_verified: bool
    is_active: bool
    created_at: datetime
    profile: Optional[UserProfileResponse] = None

    model_config = ConfigDict(from_attributes=True)


# ========== Admin ==========


class UserListResponse(BaseModel):
    """Paginated user list response"""

    users: List[UserResponse]
    total: int
    page: int
    page_size: int
