"""
GDPR Tools API
==============
Allows users to export their data and delete their accounts.
"""

import uuid
import json
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
import io

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.users import User, UserProfile
from app.models.jobs import Application

router = APIRouter()


class DatetimeEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, datetime):
            return obj.isoformat()
        return super().default(obj)


@router.get("/export")
async def export_data(
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Export all personal data associated with the user as JSON (GDPR Right to Access).
    """
    user_id = uuid.UUID(current_user["user_id"])

    user_result = await db.execute(select(User).where(User.id == user_id))
    user = user_result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    profile_result = await db.execute(select(UserProfile).where(UserProfile.user_id == user_id))
    profile = profile_result.scalar_one_or_none()

    apps_result = await db.execute(select(Application).where(Application.candidate_id == user_id))
    applications = apps_result.scalars().all()

    export_data = {
        "user_account": {
            "id": str(user.id),
            "email": user.email,
            "role": user.role.value,
            "is_active": user.is_active,
            "is_verified": user.is_verified,
            "onboarding_complete": user.onboarding_complete,
            "created_at": user.created_at,
            "last_login_at": user.last_login_at,
        },
        "profile": {},
        "applications": [],
    }

    if profile:
        export_data["profile"] = {
            "full_name": profile.full_name,
            "headline": profile.headline,
            "bio": profile.bio,
            "location": profile.location,
            "phone": profile.phone,
            "social_links": profile.social_links,
            "skills": profile.skills,
            "experience_years": profile.experience_years,
            "resume_url": profile.resume_url,
            "preferred_job_types": profile.preferred_job_types,
            "preferred_locations": profile.preferred_locations,
        }

    for app in applications:
        export_data["applications"].append(
            {
                "id": str(app.id),
                "job_id": str(app.job_id),
                "status": app.status.value,
                "applied_at": app.created_at,
                "cover_letter": app.cover_letter,
                "custom_answers": app.custom_answers,
                "match_score": app.match_score,
                "match_explanation": app.match_explanation,
            }
        )

    json_bytes = json.dumps(export_data, cls=DatetimeEncoder, indent=2).encode("utf-8")
    stream = io.BytesIO(json_bytes)

    timestamp = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
    filename = f"jobsrow_data_export_{timestamp}.json"

    return StreamingResponse(
        stream,
        media_type="application/json",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )


@router.delete("/account", status_code=status.HTTP_204_NO_CONTENT)
async def delete_account(
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Permanently delete the user account and all associated personal data (GDPR Right to Erasure).
    """
    user_id = uuid.UUID(current_user["user_id"])

    user_result = await db.execute(select(User).where(User.id == user_id))
    user = user_result.scalar_one_or_none()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    await db.delete(user)
    await db.commit()
