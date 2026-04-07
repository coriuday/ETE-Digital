"""
Admin API endpoints (admin users only)
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import List, Optional
import uuid

from app.core.database import get_db
from app.core.security import require_role
from app.models.users import User, UserProfile, UserRole
from app.models.jobs import Job, JobStatus, Application, ApplicationStatus
from pydantic import BaseModel, ConfigDict
from datetime import datetime


router = APIRouter()


# ---- Schemas ----


class AdminUserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    email: str
    full_name: Optional[str] = None
    role: str
    is_verified: bool
    is_active: bool
    created_at: datetime


class AdminUserListResponse(BaseModel):
    users: List[AdminUserResponse]
    total: int


class AdminJobResponse(BaseModel):
    id: str
    title: str
    company: str
    employer_id: str
    status: str
    job_type: str
    location: Optional[str]
    applications_count: int
    views_count: int
    created_at: datetime


class AdminJobListResponse(BaseModel):
    jobs: List[AdminJobResponse]
    total: int


class AdminApplicationResponse(BaseModel):
    id: str
    job_id: str
    candidate_id: str
    candidate_email: Optional[str] = None
    candidate_name: Optional[str] = None
    job_title: Optional[str] = None
    company: Optional[str] = None
    status: str
    match_score: Optional[int] = None
    created_at: datetime


class AdminApplicationListResponse(BaseModel):
    applications: List[AdminApplicationResponse]
    total: int


class PlatformStats(BaseModel):
    total_users: int
    total_candidates: int
    total_employers: int
    total_jobs: int
    active_jobs: int
    total_applications: int


# ---- Endpoints ----


@router.get("/stats", response_model=PlatformStats)
async def get_platform_stats(
    current_user: dict = Depends(require_role(UserRole.ADMIN)),
    db: AsyncSession = Depends(get_db),
):
    """Get platform-wide statistics (Admin only)"""
    total_users = (await db.execute(select(func.count(User.id)))).scalar() or 0
    total_candidates = (
        await db.execute(
            select(func.count(User.id)).where(User.role == UserRole.CANDIDATE)
        )
    ).scalar() or 0
    total_employers = (
        await db.execute(
            select(func.count(User.id)).where(User.role == UserRole.EMPLOYER)
        )
    ).scalar() or 0
    total_jobs = (await db.execute(select(func.count(Job.id)))).scalar() or 0
    active_jobs = (
        await db.execute(
            select(func.count(Job.id)).where(Job.status == JobStatus.ACTIVE)
        )
    ).scalar() or 0
    total_applications = (
        await db.execute(select(func.count(Application.id)))
    ).scalar() or 0

    return PlatformStats(
        total_users=total_users,
        total_candidates=total_candidates,
        total_employers=total_employers,
        total_jobs=total_jobs,
        active_jobs=active_jobs,
        total_applications=total_applications,
    )


@router.get("/users", response_model=AdminUserListResponse)
async def list_users(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    role: Optional[str] = None,
    search: Optional[str] = None,
    current_user: dict = Depends(require_role(UserRole.ADMIN)),
    db: AsyncSession = Depends(get_db),
):
    """List all users with filtering (Admin only)"""
    query = select(User)
    if role:
        try:
            query = query.where(User.role == UserRole(role))
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, detail=f"Invalid role: {role}"
            )
    if search:
        query = query.where(User.email.ilike(f"%{search}%"))

    total = (
        await db.execute(select(func.count()).select_from(query.subquery()))
    ).scalar() or 0
    result = await db.execute(
        query.order_by(User.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    )
    users = result.scalars().all()

    user_ids = [u.id for u in users]
    profiles_result = await db.execute(
        select(UserProfile).where(UserProfile.user_id.in_(user_ids))
    )
    profiles = {p.user_id: p for p in profiles_result.scalars().all()}

    return AdminUserListResponse(
        users=[
            AdminUserResponse(
                id=str(u.id),
                email=u.email,
                full_name=profiles.get(u.id, None) and profiles[u.id].full_name,
                role=u.role.value,
                is_verified=u.is_verified,
                is_active=u.is_active,
                created_at=u.created_at,
            )
            for u in users
        ],
        total=total,
    )


@router.patch("/users/{user_id}/toggle-active", response_model=dict)
async def toggle_user_active(
    user_id: str,
    current_user: dict = Depends(require_role(UserRole.ADMIN)),
    db: AsyncSession = Depends(get_db),
):
    """Activate or deactivate a user account (Admin only)"""
    result = await db.execute(select(User).where(User.id == uuid.UUID(user_id)))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
        )
    if str(user.id) == current_user["user_id"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot deactivate your own account",
        )
    user.is_active = not user.is_active
    await db.commit()
    return {
        "message": f"User {'activated' if user.is_active else 'deactivated'} successfully",
        "is_active": user.is_active,
    }


@router.get("/jobs", response_model=AdminJobListResponse)
async def list_all_jobs(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    status_filter: Optional[str] = Query(default=None, alias="status"),
    search: Optional[str] = None,
    current_user: dict = Depends(require_role(UserRole.ADMIN)),
    db: AsyncSession = Depends(get_db),
):
    """List all job postings across all employers (Admin only)"""
    query = select(Job)
    if status_filter:
        try:
            query = query.where(Job.status == JobStatus(status_filter))
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid status: {status_filter}",
            )
    if search:
        query = query.where(
            Job.title.ilike(f"%{search}%") | Job.company.ilike(f"%{search}%")
        )

    total = (
        await db.execute(select(func.count()).select_from(query.subquery()))
    ).scalar() or 0
    result = await db.execute(
        query.order_by(Job.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    )
    jobs = result.scalars().all()

    return AdminJobListResponse(
        jobs=[
            AdminJobResponse(
                id=str(j.id),
                title=j.title,
                company=j.company or "",
                employer_id=str(j.employer_id),
                status=j.status.value,
                job_type=j.job_type.value,
                location=j.location,
                applications_count=j.applications_count or 0,
                views_count=j.views_count or 0,
                created_at=j.created_at,
            )
            for j in jobs
        ],
        total=total,
    )


@router.patch("/jobs/{job_id}/moderate", response_model=dict)
async def moderate_job(
    job_id: str,
    action: str = Query(pattern="^(close|reopen)$"),
    current_user: dict = Depends(require_role(UserRole.ADMIN)),
    db: AsyncSession = Depends(get_db),
):
    """Moderate a job posting (Admin only) - close or reopen"""
    result = await db.execute(select(Job).where(Job.id == uuid.UUID(job_id)))
    job = result.scalar_one_or_none()
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Job not found"
        )
    job.status = JobStatus.CLOSED if action == "close" else JobStatus.ACTIVE
    await db.commit()
    return {"message": f"Job {action}d successfully", "status": job.status.value}


@router.get("/applications", response_model=AdminApplicationListResponse)
async def list_all_applications(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    status_filter: Optional[str] = Query(default=None, alias="status"),
    current_user: dict = Depends(require_role(UserRole.ADMIN)),
    db: AsyncSession = Depends(get_db),
):
    """List all applications platform-wide (Admin only)"""
    query = select(Application)
    if status_filter:
        try:
            query = query.where(Application.status == ApplicationStatus(status_filter))
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid status: {status_filter}",
            )

    total = (
        await db.execute(select(func.count()).select_from(query.subquery()))
    ).scalar() or 0
    result = await db.execute(
        query.order_by(Application.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    )
    applications = result.scalars().all()

    candidate_ids = [a.candidate_id for a in applications]
    job_ids_list = [a.job_id for a in applications]

    users_map = {
        u.id: u
        for u in (await db.execute(select(User).where(User.id.in_(candidate_ids))))
        .scalars()
        .all()
    }
    profiles_map = {
        p.user_id: p
        for p in (
            await db.execute(
                select(UserProfile).where(UserProfile.user_id.in_(candidate_ids))
            )
        )
        .scalars()
        .all()
    }
    jobs_map = {
        j.id: j
        for j in (await db.execute(select(Job).where(Job.id.in_(job_ids_list))))
        .scalars()
        .all()
    }

    return AdminApplicationListResponse(
        applications=[
            AdminApplicationResponse(
                id=str(a.id),
                job_id=str(a.job_id),
                candidate_id=str(a.candidate_id),
                candidate_email=users_map.get(a.candidate_id, None)
                and users_map[a.candidate_id].email,
                candidate_name=profiles_map.get(a.candidate_id, None)
                and profiles_map[a.candidate_id].full_name,
                job_title=jobs_map.get(a.job_id, None) and jobs_map[a.job_id].title,
                company=jobs_map.get(a.job_id, None) and jobs_map[a.job_id].company,
                status=a.status.value,
                match_score=a.match_score,
                created_at=a.created_at,
            )
            for a in applications
        ],
        total=total,
    )
