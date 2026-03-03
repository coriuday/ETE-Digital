"""
User management and profile API endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.users import User, UserProfile
from app.schemas.users import UserProfileUpdate, UserProfileResponse, UserResponse


router = APIRouter()


@router.get("/me", response_model=UserResponse)
async def get_current_user_profile(
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get current user's profile
    """
    user_id = current_user["user_id"]
    
    result = await db.execute(
        select(User).where(User.id == user_id)
    )
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    profile_result = await db.execute(
        select(UserProfile).where(UserProfile.user_id == user_id)
    )
    profile = profile_result.scalar_one_or_none()
    
    user_response = UserResponse(
        id=str(user.id),
        email=user.email,
        role=user.role,
        is_verified=user.is_verified,
        is_active=user.is_active,
        created_at=user.created_at
    )
    
    if profile:
        user_response.profile = UserProfileResponse(
            user_id=str(profile.user_id),
            full_name=profile.full_name,
            phone=profile.phone,
            location=profile.location,
            bio=profile.bio,
            avatar_url=profile.avatar_url,
            resume_url=profile.resume_url,
            skills=profile.skills or [],
            experience_years=profile.experience_years,
            social_links=profile.social_links or {},
            preferences=profile.preferences or {},
            created_at=profile.created_at,
            updated_at=profile.updated_at
        )
    
    return user_response


@router.put("/me", response_model=UserProfileResponse)
async def update_current_user_profile(
    profile_data: UserProfileUpdate,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Update current user's profile
    """
    user_id = current_user["user_id"]
    
    result = await db.execute(
        select(UserProfile).where(UserProfile.user_id == user_id)
    )
    profile = result.scalar_one_or_none()
    
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profile not found"
        )
    
    update_data = profile_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(profile, field, value)
    
    await db.commit()
    await db.refresh(profile)
    
    return UserProfileResponse(
        user_id=str(profile.user_id),
        full_name=profile.full_name,
        phone=profile.phone,
        location=profile.location,
        bio=profile.bio,
        avatar_url=profile.avatar_url,
        resume_url=profile.resume_url,
        skills=profile.skills or [],
        experience_years=profile.experience_years,
        social_links=profile.social_links or {},
        preferences=profile.preferences or {},
        created_at=profile.created_at,
        updated_at=profile.updated_at
    )


@router.delete("/me", response_model=dict)
async def delete_current_user_account(
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Request account deletion (GDPR compliance)
    """
    user_id = current_user["user_id"]
    
    result = await db.execute(
        select(User).where(User.id == user_id)
    )
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    user.is_active = False
    await db.commit()
    
    return {
        "message": "Account marked for deletion. You have 30 days to cancel this request."
    }
