"""
Admin API endpoints (admin users only)
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, update
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
    db: AsyncSession = Depends(get_db)
):
    """Get platform-wide statistics (Admin only)"""
    # User counts
    total_result = await db.execute(select(func.count(User.id)))
    total_users = total_result.scalar() or 0

    candidate_result = await db.execute(
        select(func.count(User.id)).where(User.role == UserRole.CANDIDATE)
    )
    total_candidates = candidate_result.scalar() or 0

    employer_result = await db.execute(
        select(func.count(User.id)).where(User.role == UserRole.EMPLOYER)
    )
    total_employers = employer_result.scalar() or 0

    # Job counts
    total_jobs_result = await db.execute(select(func.count(Job.id)))
    total_jobs = total_jobs_result.scalar() or 0

    active_jobs_result = await db.execute(
        select(func.count(Job.id)).where(Job.status == JobStatus.ACTIVE)
    )
    active_jobs = active_jobs_result.scalar() or 0

    # Application count
    total_apps_result = await db.execute(select(func.count(Application.id)))
    total_applications = total_apps_result.scalar() or 0

    return PlatformStats(
        total_users=total_users,
        total_candidates=total_candidates,
        total_employers=total_employers,
        total_jobs=total_jobs,
        active_jobs=active_jobs,
        total_applications=total_applications
    )


@router.get("/users", response_model=AdminUserListResponse)
async def list_users(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    role: Optional[str] = None,
    search: Optional[str] = None,
    current_user: dict = Depends(require_role(UserRole.ADMIN)),
    db: AsyncSession = Depends(get_db)
):
    """List all users with filtering (Admin only)"""
    query = select(User)

    if role:
        try:
            user_role = UserRole(role)
            query = query.where(User.role == user_role)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid role: {role}"
            )

    if search:
        query = query.where(User.email.ilike(f"%{search}%"))

    # Count
    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0

    # Paginate
    paginated = query.order_by(User.created_at.desc()).offset((page - 1) * page_size).limit(page_size)
    result = await db.execute(paginated)
    users = result.scalars().all()

    # Get profiles for full_name
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
                created_at=u.created_at
            )
            for u in users
        ],
        total=total
    )


@router.patch("/users/{user_id}/toggle-active", response_model=dict)
async def toggle_user_active(
    user_id: str,
    current_user: dict = Depends(require_role(UserRole.ADMIN)),
    db: AsyncSession = Depends(get_db)
):
    """Activate or deactivate a user account (Admin only)"""
    result = await db.execute(select(User).where(User.id == uuid.UUID(user_id)))
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    # Prevent deactivating yourself
    if str(user.id) == current_user["user_id"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot deactivate your own account"
        )

    user.is_active = not user.is_active
    await db.commit()

    return {
        "message": f"User {'activated' if user.is_active else 'deactivated'} successfully",
        "is_active": user.is_active
    }


@router.get("/jobs", response_model=AdminJobListResponse)
async def list_all_jobs(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    status_filter: Optional[str] = Query(default=None, alias="status"),
    search: Optional[str] = None,
    current_user: dict = Depends(require_role(UserRole.ADMIN)),
    db: AsyncSession = Depends(get_db)
):
    """List all job postings across all employers (Admin only)"""
    query = select(Job)

    if status_filter:
        try:
            job_status = JobStatus(status_filter)
            query = query.where(Job.status == job_status)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid status: {status_filter}"
            )

    if search:
        query = query.where(
            Job.title.ilike(f"%{search}%") | Job.company.ilike(f"%{search}%")
        )

    # Count
    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0

    # Paginate
    paginated = query.order_by(Job.created_at.desc()).offset((page - 1) * page_size).limit(page_size)
    result = await db.execute(paginated)
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
                created_at=j.created_at
            )
            for j in jobs
        ],
        total=total
    )


@router.patch("/jobs/{job_id}/moderate", response_model=dict)
async def moderate_job(
    job_id: str,
    action: str = Query(pattern="^(close|reopen)$"),
    current_user: dict = Depends(require_role(UserRole.ADMIN)),
    db: AsyncSession = Depends(get_db)
):
    """Moderate a job posting (Admin only) - close or reopen"""
    result = await db.execute(select(Job).where(Job.id == uuid.UUID(job_id)))
    job = result.scalar_one_or_none()

    if not job:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found")

    if action == "close":
        job.status = JobStatus.CLOSED
    elif action == "reopen":
        job.status = JobStatus.ACTIVE

    await db.commit()

    return {"message": f"Job {action}d successfully", "status": job.status.value}


@router.get("/applications", response_model=AdminApplicationListResponse)
async def list_all_applications(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    status_filter: Optional[str] = Query(default=None, alias="status"),
    current_user: dict = Depends(require_role(UserRole.ADMIN)),
    db: AsyncSession = Depends(get_db)
):
    """List all applications platform-wide (Admin only)"""
    query = select(Application)

    if status_filter:
        try:
            app_status = ApplicationStatus(status_filter)
            query = query.where(Application.status == app_status)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid status: {status_filter}"
            )

    # Count
    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0

    # Paginate
    paginated = query.order_by(Application.created_at.desc()).offset((page - 1) * page_size).limit(page_size)
    result = await db.execute(paginated)
    applications = result.scalars().all()

    # Enrich with user/job info
    candidate_ids = [a.candidate_id for a in applications]
    job_ids = [a.job_id for a in applications]

    users_result = await db.execute(select(User).where(User.id.in_(candidate_ids)))
    users_map = {u.id: u for u in users_result.scalars().all()}

    profiles_result = await db.execute(select(UserProfile).where(UserProfile.user_id.in_(candidate_ids)))
    profiles_map = {p.user_id: p for p in profiles_result.scalars().all()}

    jobs_result = await db.execute(select(Job).where(Job.id.in_(job_ids)))
    jobs_map = {j.id: j for j in jobs_result.scalars().all()}

    return AdminApplicationListResponse(
        applications=[
            AdminApplicationResponse(
                id=str(a.id),
                job_id=str(a.job_id),
                candidate_id=str(a.candidate_id),
                candidate_email=users_map.get(a.candidate_id, None) and users_map[a.candidate_id].email,
                candidate_name=profiles_map.get(a.candidate_id, None) and profiles_map[a.candidate_id].full_name,
                job_title=jobs_map.get(a.job_id, None) and jobs_map[a.job_id].title,
                company=jobs_map.get(a.job_id, None) and jobs_map[a.job_id].company,
                status=a.status.value,
                match_score=a.match_score,
                created_at=a.created_at
            )
            for a in applications
        ],
        total=total
    )
