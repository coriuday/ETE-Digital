"""
User management and profile API endpoints
"""

from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from typing import Optional

from app.core.database import get_db
from app.core.security import get_current_user
import uuid
from app.models.users import User, UserProfile
from app.schemas.users import (
    UserProfileUpdate,
    UserProfileResponse,
    UserResponse,
    ChangePasswordRequest,
    PreferencesUpdate,
)

router = APIRouter()


@router.get("/me", response_model=UserResponse)
async def get_current_user_profile(current_user: dict = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    """Get current user's profile"""
    user_id = uuid.UUID(current_user["user_id"])

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
        onboarding_complete=user.onboarding_complete,
        created_at=user.created_at,
    )

    if profile:
        user_response.profile = UserProfileResponse(
            user_id=str(profile.user_id),
            full_name=profile.full_name,
            headline=profile.headline,
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
    user_id = uuid.UUID(current_user["user_id"])

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


class DeleteAccountRequest(BaseModel):
    reason: Optional[str] = None


@router.delete("/me", response_model=dict)
@router.delete("/account", response_model=dict)
async def delete_current_user_account(
    body: DeleteAccountRequest = DeleteAccountRequest(),
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Permanently delete the current user's account and all associated data."""
    user_id = uuid.UUID(current_user["user_id"])

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    # Hard-delete profile first (FK constraint), then the user row
    await db.execute(delete(UserProfile).where(UserProfile.user_id == user_id))
    await db.execute(delete(User).where(User.id == user_id))
    await db.commit()

    return {"message": "Your account has been permanently deleted."}


@router.post("/me/resume", response_model=dict)
async def upload_resume(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Upload or replace resume (PDF or DOCX only, max 5 MB) to MinIO/S3"""
    import io
    from app.services.storage import storage_service

    # Validate file type
    allowed_exts = (".pdf", ".doc", ".docx")
    fname = (file.filename or "resume.pdf").lower()
    if not any(fname.endswith(ext) for ext in allowed_exts):
        raise HTTPException(status_code=400, detail="Only PDF and DOCX files are allowed.")

    # Read and validate size (5 MB max)
    contents = await file.read()
    file_size = len(contents)
    if file_size > 5 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File size must be under 5 MB.")

    user_id = current_user["user_id"]

    # Build S3 storage path
    file_path = storage_service.get_file_path("resumes", user_id, file.filename or "resume.pdf")

    # Upload to MinIO/S3
    resume_url = storage_service.upload_file(
        file_data=io.BytesIO(contents),
        file_path=file_path,
        content_type=file.content_type or "application/pdf",
        file_size=file_size,
    )

    if resume_url is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="File storage is not available. Configure MinIO/S3 to enable uploads.",
        )

    # Update UserProfile
    user_uuid = uuid.UUID(user_id)
    result = await db.execute(select(UserProfile).where(UserProfile.user_id == user_uuid))
    profile = result.scalar_one_or_none()
    if not profile:
        profile = UserProfile(user_id=user_uuid)
        db.add(profile)
    profile.resume_url = resume_url
    await db.commit()

    return {"resume_url": resume_url, "filename": file.filename}


@router.post("/me/avatar", response_model=dict)
async def upload_avatar(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Upload or replace profile avatar (JPEG/PNG/WebP, max 2 MB) to MinIO/S3"""
    import io
    from app.services.storage import storage_service

    allowed_exts = (".jpg", ".jpeg", ".png", ".webp")
    fname = (file.filename or "avatar.jpg").lower()
    if not any(fname.endswith(ext) for ext in allowed_exts):
        raise HTTPException(status_code=400, detail="Only JPG, PNG, and WebP images are allowed.")

    contents = await file.read()
    file_size = len(contents)
    if file_size > 2 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Image must be under 2 MB.")

    user_id = current_user["user_id"]
    file_path = storage_service.get_file_path("avatars", user_id, file.filename or "avatar.jpg")

    content_types = {
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".png": "image/png",
        ".webp": "image/webp",
    }
    ext = next((e for e in allowed_exts if fname.endswith(e)), ".jpg")
    avatar_url = storage_service.upload_file(
        file_data=io.BytesIO(contents),
        file_path=file_path,
        content_type=file.content_type or content_types.get(ext, "image/jpeg"),
        file_size=file_size,
    )

    if avatar_url is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="File storage is not available. Configure MinIO/S3 to enable uploads.",
        )

    user_uuid = uuid.UUID(user_id)
    result = await db.execute(select(UserProfile).where(UserProfile.user_id == user_uuid))
    profile = result.scalar_one_or_none()
    if not profile:
        profile = UserProfile(user_id=user_uuid)
        db.add(profile)
    profile.avatar_url = avatar_url
    await db.commit()

    return {"avatar_url": avatar_url, "filename": file.filename}


# ─── Onboarding Endpoints (Task 1.3) ──────────────────────────────────────────


class OnboardingPayload(BaseModel):
    """Payload from the 5-step onboarding wizard."""

    full_name: Optional[str] = None
    headline: Optional[str] = None
    location: Optional[str] = None
    bio: Optional[str] = None
    skills: Optional[list] = None
    experience_years: Optional[str] = None


@router.get("/me/onboarding-status")
async def get_onboarding_status(
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Return whether the current user has completed onboarding."""
    user_id = uuid.UUID(current_user["user_id"])
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return {"onboarding_complete": user.onboarding_complete, "role": user.role}


@router.post("/me/onboarding-complete", response_model=dict)
async def complete_onboarding(
    payload: OnboardingPayload,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Mark onboarding as done and upsert profile fields collected during the wizard.
    Idempotent — safe to call multiple times.
    """
    user_id = uuid.UUID(current_user["user_id"])

    # Update User.onboarding_complete
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.onboarding_complete = True

    # Upsert UserProfile with wizard data
    profile_result = await db.execute(select(UserProfile).where(UserProfile.user_id == user_id))
    profile = profile_result.scalar_one_or_none()
    if not profile:
        profile = UserProfile(user_id=user_id)
        db.add(profile)

    fields = payload.model_dump(exclude_unset=True, exclude_none=True)
    for field, value in fields.items():
        if hasattr(profile, field):
            setattr(profile, field, value)

    await db.commit()
    return {"success": True, "onboarding_complete": True}


DEFAULT_PREFERENCES = {
    "profile_visible": True,
    "remote_preferred": False,
    "preferred_job_types": [],
    "preferred_locations": [],
    "salary_min": None,
    "salary_max": None,
    "hidden_companies": [],
    "hidden_job_types": [],
    "qualifications": {"education": [], "certifications": []},
    "resume_builder": {},
    "notifications": {
        "email_applications": True,
        "email_tryouts": True,
        "email_messages": True,
        "email_marketing": False,
        "push_applications": True,
        "push_tryouts": True,
        "push_messages": True,
    },
}


def _merge_preferences(stored: dict | None) -> dict:
    merged = {**DEFAULT_PREFERENCES}
    if stored:
        merged.update(stored)
    return merged


async def _get_or_create_profile(db: AsyncSession, user_id: uuid.UUID) -> UserProfile:
    result = await db.execute(select(UserProfile).where(UserProfile.user_id == user_id))
    profile = result.scalar_one_or_none()
    if not profile:
        profile = UserProfile(user_id=user_id)
        db.add(profile)
        await db.flush()
    return profile


@router.post("/change-password", response_model=dict)
async def change_password(
    body: ChangePasswordRequest,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Change password for the authenticated user."""
    from app.core.security import verify_password, hash_password

    user_id = uuid.UUID(current_user["user_id"])
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    if not verify_password(body.current_password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Current password is incorrect")

    user.password_hash = hash_password(body.new_password)
    await db.commit()
    return {"message": "Password changed successfully"}


@router.get("/me/preferences", response_model=dict)
async def get_my_preferences(
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get merged candidate preferences from UserProfile.preferences JSONB."""
    user_id = uuid.UUID(current_user["user_id"])
    profile = await _get_or_create_profile(db, user_id)
    return _merge_preferences(profile.preferences)


@router.patch("/me/preferences", response_model=dict)
async def update_my_preferences(
    body: PreferencesUpdate,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Partially update candidate preferences."""
    user_id = uuid.UUID(current_user["user_id"])
    profile = await _get_or_create_profile(db, user_id)

    current = _merge_preferences(profile.preferences)
    updates = body.model_dump(exclude_unset=True)

    allowed_job_types = {"full_time", "part_time", "contract", "internship", "freelance"}
    if "preferred_job_types" in updates and updates["preferred_job_types"] is not None:
        invalid = set(updates["preferred_job_types"]) - allowed_job_types
        if invalid:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid job types: {', '.join(sorted(invalid))}",
            )

    if "salary_min" in updates and "salary_max" in updates:
        smin, smax = updates.get("salary_min"), updates.get("salary_max")
        if smin is not None and smax is not None and smin > smax:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="salary_min cannot exceed salary_max",
            )

    current.update(updates)
    profile.preferences = current
    await db.commit()
    await db.refresh(profile)
    return _merge_preferences(profile.preferences)
