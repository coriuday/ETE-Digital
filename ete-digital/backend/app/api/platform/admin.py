"""
Admin API endpoints (admin users only)
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc
from typing import List, Optional
import uuid

from app.core.database import get_db
from app.core.security import require_role
from app.models.users import User, UserProfile, UserRole
from app.models.jobs import Job, JobStatus, Application, ApplicationStatus
from app.models.notifications import AuditLog, AuditAction
from app.services.audit import log_audit_event
from app.services.jobs import application_service
from pydantic import BaseModel, ConfigDict, Field
from datetime import datetime, timezone

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
    total_candidates = (await db.execute(select(func.count(User.id)).where(User.role == UserRole.CANDIDATE))).scalar() or 0
    total_employers = (await db.execute(select(func.count(User.id)).where(User.role == UserRole.HR))).scalar() or 0
    total_jobs = (await db.execute(select(func.count(Job.id)))).scalar() or 0
    active_jobs = (await db.execute(select(func.count(Job.id)).where(Job.status == JobStatus.ACTIVE))).scalar() or 0
    total_applications = (await db.execute(select(func.count(Application.id)))).scalar() or 0

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
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Invalid role: {role}")
    if search:
        query = query.where(User.email.ilike(f"%{search}%"))

    total = (await db.execute(select(func.count()).select_from(query.subquery()))).scalar() or 0
    result = await db.execute(query.order_by(User.created_at.desc()).offset((page - 1) * page_size).limit(page_size))
    users = result.scalars().all()

    user_ids = [u.id for u in users]
    profiles_result = await db.execute(select(UserProfile).where(UserProfile.user_id.in_(user_ids)))
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
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
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


class AdminRoleUpdate(BaseModel):
    role: str = Field(..., pattern="^(candidate|employer|admin)$")


@router.patch("/users/{user_id}/role", response_model=dict)
async def update_user_role(
    user_id: str,
    body: AdminRoleUpdate,
    current_user: dict = Depends(require_role(UserRole.ADMIN)),
    db: AsyncSession = Depends(get_db),
):
    """Change a user's platform role (Admin only)."""
    result = await db.execute(select(User).where(User.id == uuid.UUID(user_id)))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    if str(user.id) == current_user["user_id"]:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot change your own role")

    old_role = user.role.value
    user.role = UserRole(body.role)
    await log_audit_event(
        db=db,
        action=AuditAction.ADMIN_ACTION,
        user_id=current_user["user_id"],
        resource_type="user",
        resource_id=user.id,
        details={"action": "role_changed", "old_role": old_role, "new_role": body.role},
    )
    await db.commit()
    return {"message": f"Role updated to {body.role}", "role": body.role}


@router.delete("/users/{user_id}", response_model=dict)
async def remove_user(
    user_id: str,
    current_user: dict = Depends(require_role(UserRole.ADMIN)),
    db: AsyncSession = Depends(get_db),
):
    """Soft-delete and anonymize a user (Admin only). Preserves audit/application history."""
    result = await db.execute(select(User).where(User.id == uuid.UUID(user_id)))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    if str(user.id) == current_user["user_id"]:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot remove your own account")

    profile_result = await db.execute(select(UserProfile).where(UserProfile.user_id == user.id))
    profile = profile_result.scalar_one_or_none()

    user.is_active = False
    user.email = f"removed_{user.id}@deleted.jobsrow.local"
    user.password_hash = "!"
    user.totp_enabled = False
    user.totp_secret = None

    if profile:
        profile.full_name = "Removed User"
        profile.phone = None
        profile.bio = None
        profile.avatar_url = None
        profile.resume_url = None

    await log_audit_event(
        db=db,
        action=AuditAction.ADMIN_ACTION,
        user_id=current_user["user_id"],
        resource_type="user",
        resource_id=user.id,
        details={"action": "user_removed", "previous_email_hash": str(user.id)},
    )
    await db.commit()
    return {"message": "User removed and anonymized successfully"}


class AdminApplicationStatusUpdate(BaseModel):
    status: ApplicationStatus
    reason: Optional[str] = None


@router.post("/applications/{application_id}/status", response_model=dict)
async def force_application_status(
    application_id: str,
    body: AdminApplicationStatusUpdate,
    current_user: dict = Depends(require_role(UserRole.ADMIN)),
    db: AsyncSession = Depends(get_db),
):
    """Force an application status change (Admin override)."""
    from app.services.application_pipeline import transition_application_status  # noqa: PLC0415

    application = await application_service.get_application(db, uuid.UUID(application_id))
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")

    if application.status == ApplicationStatus.HIRED:
        raise HTTPException(status_code=400, detail="Hired applications cannot be modified.")

    job_result = await db.execute(select(Job).where(Job.id == application.job_id))
    job = job_result.scalar_one_or_none()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    old_status = application.status
    special = None
    if body.status == ApplicationStatus.PENDING and old_status == ApplicationStatus.REJECTED:
        special = "reapply"
    elif body.status == ApplicationStatus.REOPENED and old_status == ApplicationStatus.REJECTED:
        special = "reopen"
    elif body.status == ApplicationStatus.PENDING and old_status == ApplicationStatus.REOPENED:
        special = "reopened_to_pending"

    try:
        await transition_application_status(
            db=db,
            application=application,
            job=job,
            new_status=body.status,
            changed_by=uuid.UUID(current_user["user_id"]),
            employer_notes=body.reason,
            special=special,
        )
    except HTTPException:
        if old_status not in {ApplicationStatus.HIRED, ApplicationStatus.WITHDRAWN}:
            now = datetime.now(timezone.utc)
            application.status = body.status
            application.stage_entered_at = now
            if body.status == ApplicationStatus.REJECTED:
                application.rejected_at = now
            elif body.status == ApplicationStatus.PENDING:
                application.rejected_at = None
            from app.models.application_status_history import ApplicationStatusHistory  # noqa: PLC0415

            db.add(
                ApplicationStatusHistory(
                    application_id=application.id,
                    old_status=old_status,
                    new_status=body.status,
                    changed_by=uuid.UUID(current_user["user_id"]),
                    changed_at=now,
                    notes=body.reason or "Admin override",
                )
            )
        else:
            raise

    await log_audit_event(
        db=db,
        action=AuditAction.ADMIN_ACTION,
        user_id=current_user["user_id"],
        resource_type="application",
        resource_id=application.id,
        details={
            "action": "force_status",
            "old_status": old_status.value,
            "new_status": body.status.value,
            "reason": body.reason,
        },
    )
    await db.commit()
    return {"message": "Application status updated", "status": body.status.value}


class AdminAuditLogResponse(BaseModel):
    id: str
    action: str
    resource_type: Optional[str]
    resource_id: Optional[str]
    ip_address: Optional[str]
    user_email: Optional[str]
    org_id: Optional[str]
    details: dict
    timestamp: datetime


@router.get("/audit", response_model=List[AdminAuditLogResponse])
async def list_platform_audit_logs(
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    action: Optional[str] = None,
    current_user: dict = Depends(require_role(UserRole.ADMIN)),
    db: AsyncSession = Depends(get_db),
):
    """Platform-wide audit log (Admin only)."""
    query = select(AuditLog, User.email).outerjoin(User, AuditLog.user_id == User.id).order_by(desc(AuditLog.timestamp))
    if action:
        query = query.where(AuditLog.action == action)

    result = await db.execute(query.limit(limit).offset(offset))
    rows = result.all()

    return [
        AdminAuditLogResponse(
            id=str(log.id),
            action=log.action.value if hasattr(log.action, "value") else str(log.action),
            resource_type=log.resource_type,
            resource_id=str(log.resource_id) if log.resource_id else None,
            ip_address=log.ip_address,
            user_email=email,
            org_id=str(log.org_id) if log.org_id else None,
            details=log.details or {},
            timestamp=log.timestamp,
        )
        for log, email in rows
    ]


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
        query = query.where(Job.title.ilike(f"%{search}%") | Job.company.ilike(f"%{search}%"))

    total = (await db.execute(select(func.count()).select_from(query.subquery()))).scalar() or 0
    result = await db.execute(query.order_by(Job.created_at.desc()).offset((page - 1) * page_size).limit(page_size))
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
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found")
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

    total = (await db.execute(select(func.count()).select_from(query.subquery()))).scalar() or 0
    result = await db.execute(query.order_by(Application.created_at.desc()).offset((page - 1) * page_size).limit(page_size))
    applications = result.scalars().all()

    candidate_ids = [a.candidate_id for a in applications]
    job_ids_list = [a.job_id for a in applications]

    users_map = {u.id: u for u in (await db.execute(select(User).where(User.id.in_(candidate_ids)))).scalars().all()}
    profiles_map = {
        p.user_id: p
        for p in (await db.execute(select(UserProfile).where(UserProfile.user_id.in_(candidate_ids)))).scalars().all()
    }
    jobs_map = {j.id: j for j in (await db.execute(select(Job).where(Job.id.in_(job_ids_list)))).scalars().all()}

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
                created_at=a.created_at,
            )
            for a in applications
        ],
        total=total,
    )


# ---- Organisation admin (standard-path approval) ----


class AdminOrgResponse(BaseModel):
    id: str
    company_name: str
    domain: str
    website: str
    owner_email: Optional[str] = None
    trust_tier: str
    registration_path: str
    is_verified: bool
    industry: Optional[str] = None
    company_size: Optional[str] = None
    created_at: datetime


class AdminOrgListResponse(BaseModel):
    organizations: List[AdminOrgResponse]
    total: int


@router.get("/organizations", response_model=AdminOrgListResponse)
async def list_organizations_admin(
    trust_tier: Optional[str] = Query(None),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    current_user: dict = Depends(require_role(UserRole.ADMIN)),
    db: AsyncSession = Depends(get_db),
):
    from app.models.organization import Organization  # noqa: PLC0415

    query = select(Organization)
    if trust_tier:
        query = query.where(Organization.trust_tier == trust_tier)
    count_q = select(func.count()).select_from(query.subquery())
    total = (await db.execute(count_q)).scalar_one()
    offset = (page - 1) * page_size
    result = await db.execute(query.order_by(Organization.created_at.desc()).offset(offset).limit(page_size))
    orgs = result.scalars().all()
    owner_ids = [o.owner_id for o in orgs]
    users_result = await db.execute(select(User).where(User.id.in_(owner_ids))) if owner_ids else None
    owners_map = {u.id: u for u in users_result.scalars().all()} if users_result else {}

    return AdminOrgListResponse(
        organizations=[
            AdminOrgResponse(
                id=str(o.id),
                company_name=o.company_name,
                domain=o.domain,
                website=o.website,
                owner_email=owners_map.get(o.owner_id).email if owners_map.get(o.owner_id) else None,
                trust_tier=o.trust_tier,
                registration_path=o.registration_path,
                is_verified=o.is_verified,
                industry=o.industry,
                company_size=o.company_size,
                created_at=o.created_at,
            )
            for o in orgs
        ],
        total=total,
    )


@router.post("/organizations/{org_id}/approve")
async def approve_organization(
    org_id: str,
    current_user: dict = Depends(require_role(UserRole.ADMIN)),
    db: AsyncSession = Depends(get_db),
):
    from app.models.organization import Organization  # noqa: PLC0415

    result = await db.execute(select(Organization).where(Organization.id == uuid.UUID(org_id)))
    org = result.scalar_one_or_none()
    if not org:
        raise HTTPException(status_code=404, detail="Organisation not found.")
    org.trust_tier = "verified"
    org.is_verified = True
    org.verified_at = datetime.now(timezone.utc)
    org.admin_reviewed_at = datetime.now(timezone.utc)
    org.admin_reviewed_by = uuid.UUID(current_user["user_id"])
    await db.commit()
    return {"message": f"Organisation '{org.company_name}' approved.", "trust_tier": "verified"}


@router.post("/organizations/{org_id}/reject")
async def reject_organization(
    org_id: str,
    current_user: dict = Depends(require_role(UserRole.ADMIN)),
    db: AsyncSession = Depends(get_db),
):
    from app.models.organization import Organization  # noqa: PLC0415

    result = await db.execute(select(Organization).where(Organization.id == uuid.UUID(org_id)))
    org = result.scalar_one_or_none()
    if not org:
        raise HTTPException(status_code=404, detail="Organisation not found.")
    org.trust_tier = "unverified"
    org.is_verified = False
    org.admin_reviewed_at = datetime.now(timezone.utc)
    org.admin_reviewed_by = uuid.UUID(current_user["user_id"])
    await db.commit()
    return {"message": f"Organisation '{org.company_name}' marked unverified.", "trust_tier": "unverified"}
