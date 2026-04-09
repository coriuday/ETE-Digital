"""
User management and profile API endpoints
"""

from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.users import User, UserProfile
from app.schemas.users import UserProfileUpdate, UserProfileResponse, UserResponse


router = APIRouter()


@router.get("/me", response_model=UserResponse)
async def get_current_user_profile(current_user: dict = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    """Get current user's profile"""
    user_id = current_user["user_id"]

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    profile_result = await db.execute(select(UserProfile).where(UserProfile.user_id == user_id))
    profile = profile_result.scalar_one_or_none()

    user_response = UserResponse(
        id=str(user.id),
        email=user.email,
        role=user.role,
        is_verified=user.is_verified,
        is_active=user.is_active,
        created_at=user.created_at,
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
            updated_at=profile.updated_at,
        )

    return user_response


@router.put("/me", response_model=UserProfileResponse)
@router.patch("/me", response_model=UserProfileResponse)
@router.patch("/profile", response_model=UserProfileResponse)
async def update_current_user_profile(
    profile_data: UserProfileUpdate,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update (or create) current user's profile — upsert behaviour."""
    user_id = current_user["user_id"]

    result = await db.execute(select(UserProfile).where(UserProfile.user_id == user_id))
    profile = result.scalar_one_or_none()

    if not profile:
        profile = UserProfile(user_id=user_id)
        db.add(profile)

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
        updated_at=profile.updated_at,
    )


@router.delete("/me", response_model=dict)
@router.delete("/account", response_model=dict)
async def delete_current_user_account(current_user: dict = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    """Request account deletion (GDPR compliance)"""
    user_id = current_user["user_id"]
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    user.is_active = False
    await db.commit()
    return {"message": "Account marked for deletion. You have 30 days to cancel this request."}


@router.post("/me/resume", response_model=dict)
async def upload_resume(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Upload or replace resume (PDF or DOCX only, max 5 MB)"""
    import os
    import uuid as uuid_lib

    # Validate file type
    allowed_exts = (".pdf", ".doc", ".docx")
    fname = (file.filename or "resume.pdf").lower()
    if not any(fname.endswith(ext) for ext in allowed_exts):
        raise HTTPException(status_code=400, detail="Only PDF and DOCX files are allowed.")

    # Read and validate size (5 MB max)
    contents = await file.read()
    if len(contents) > 5 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File size must be under 5 MB.")

    # Save to disk — uploads/ relative to backend root
    backend_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    upload_dir = os.path.join(backend_root, "uploads", "resumes")
    os.makedirs(upload_dir, exist_ok=True)

    ext = os.path.splitext(file.filename or "resume.pdf")[1].lower() or ".pdf"
    filename = f"{current_user['user_id']}_{uuid_lib.uuid4().hex[:8]}{ext}"
    filepath = os.path.join(upload_dir, filename)

    with open(filepath, "wb") as f:
        f.write(contents)

    resume_url = f"/uploads/resumes/{filename}"

    # Update UserProfile
    result = await db.execute(select(UserProfile).where(UserProfile.user_id == current_user["user_id"]))
    profile = result.scalar_one_or_none()
    if not profile:
        profile = UserProfile(user_id=current_user["user_id"])
        db.add(profile)
    profile.resume_url = resume_url
    await db.commit()

    return {"resume_url": resume_url, "filename": file.filename}
