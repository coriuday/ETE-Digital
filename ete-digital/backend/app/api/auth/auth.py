"""
Authentication API endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional

from app.core.database import get_db
from app.core.config import settings
from app.schemas.users import (
    UserRegister,
    UserLogin,
    TokenResponse,
    RefreshTokenRequest,
    EmailVerificationRequest,
    PasswordResetRequest,
    PasswordResetConfirm,
    UserResponse
)
from app.services.auth import auth_service
from app.main import limiter
from pydantic import BaseModel


router = APIRouter()


class OptionalRefreshRequest(BaseModel):
    """Optional refresh token body — used for logout"""
    refresh_token: Optional[str] = None


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
@limiter.limit("5/minute")
async def register(
    request: Request,
    user_data: UserRegister,
    db: AsyncSession = Depends(get_db)
):
    """
    Register a new user
    
    - **email**: Valid email address
    - **password**: Strong password (min 8 chars, uppercase, lowercase, digit, special char)
    - **role**: User role (candidate or employer)
    - **full_name**: Optional full name
    """
    user = await auth_service.register_user(
        db=db,
        email=user_data.email,
        password=user_data.password,
        role=user_data.role,
        full_name=user_data.full_name
    )
    
    return UserResponse(
        id=str(user.id),
        email=user.email,
        role=user.role,
        is_verified=user.is_verified,
        is_active=user.is_active,
        created_at=user.created_at
    )


@router.post("/verify-email", response_model=dict)
async def verify_email(
    verification_data: EmailVerificationRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Verify email address with token sent to email
    """
    await auth_service.verify_email(db, verification_data.token)
    return {"message": "Email verified successfully"}


@router.post("/login", response_model=TokenResponse)
@limiter.limit("5/minute")
async def login(
    request: Request,
    login_data: UserLogin,
    db: AsyncSession = Depends(get_db)
):
    """
    Login with email and password

    Returns access token and refresh token
    """
    ip_address = request.client.host if request.client else None
    user_agent = request.headers.get("user-agent")
    
    access_token, refresh_token, user = await auth_service.login(
        db=db,
        email=login_data.email,
        password=login_data.password,
        ip_address=ip_address,
        user_agent=user_agent
    )
    
    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        expires_in=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES * 60
    )


@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(
    refresh_data: RefreshTokenRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Refresh access token using refresh token
    """
    access_token, refresh_token = await auth_service.refresh_access_token(
        db=db,
        refresh_token_str=refresh_data.refresh_token
    )
    
    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        expires_in=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES * 60
    )


@router.post("/forgot-password", response_model=dict)
@limiter.limit("3/minute")
async def forgot_password(
    request: Request,
    reset_data: PasswordResetRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Request password reset email
    """
    await auth_service.request_password_reset(db, reset_data.email)
    return {"message": "If the email exists, a password reset link has been sent"}


@router.post("/reset-password", response_model=dict)
async def reset_password(
    reset_data: PasswordResetConfirm,
    db: AsyncSession = Depends(get_db)
):
    """
    Reset password with token from email
    """
    await auth_service.reset_password(
        db=db,
        token=reset_data.token,
        new_password=reset_data.new_password
    )
    return {"message": "Password reset successfully"}


@router.post("/logout", response_model=dict)
async def logout(
    refresh_data: Optional[OptionalRefreshRequest] = None,
    db: AsyncSession = Depends(get_db)
):
    """
    Logout by revoking refresh token.
    Body is optional — if no refresh_token provided, returns success anyway.
    """
    if refresh_data and refresh_data.refresh_token:
        await auth_service.logout(db, refresh_data.refresh_token)
    return {"message": "Logged out successfully"}
