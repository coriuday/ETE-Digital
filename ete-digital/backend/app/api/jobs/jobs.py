"""
Job posting and application API endpoints
"""

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional
import uuid

from app.core.database import get_db
from app.core.security import require_role
from app.models.users import UserRole
from app.schemas.jobs import (
    JobCreate,
    JobUpdate,
    JobResponse,
    JobListResponse,
    ApplicationCreate,
    ApplicationResponse,
    ApplicationListResponse,
    ApplicationDetailResponse,
    ApplicationStatusUpdate,
    ApplicationReopenRequest,
    StatusHistoryEntry,
    CandidateProfileForEmployer,
)
from app.services.jobs import job_service, application_service
from app.services.notification_service import notification_service
from app.services.application_pipeline import (
    get_available_actions,
    is_locked,
    build_pipeline_progress,
    get_status_history,
    notification_for_status,
    notification_for_reopen,
)
from app.services.audit import log_audit_event, get_org_id_for_user
from app.models.notifications import AuditAction
from app.core.security import get_optional_current_user, get_current_user  # may be None for unauthenticated

router = APIRouter()


def _history_to_entries(history) -> list[StatusHistoryEntry]:
    return [
        StatusHistoryEntry(
            old_status=h.old_status,
            new_status=h.new_status,
            changed_by=str(h.changed_by),
            changed_at=h.changed_at,
            notes=h.notes,
        )
        for h in history
    ]


def _application_to_response(app, **extra) -> ApplicationResponse:
    return ApplicationResponse(
        id=str(app.id),
        job_id=str(app.job_id),
        candidate_id=str(app.candidate_id),
        cover_letter=app.cover_letter,
        vault_share_token=app.vault_share_token,
        custom_answers=app.custom_answers,
        status=app.status,
        match_score=app.match_score,
        match_explanation=app.match_explanation,
        employer_notes=app.employer_notes,
        available_actions=get_available_actions(app.status),
        is_locked=is_locked(app.status),
        pipeline_progress=build_pipeline_progress(app.status),
        created_at=app.created_at,
        updated_at=app.updated_at,
        **extra,
    )


async def _send_status_email_async(
    candidate_id: uuid.UUID,
    candidate_email: str,
    candidate_name: str,
    job_title: str,
    company: str,
    new_status: str,
) -> None:
    """Background task: email candidate if preferences allow."""
    try:
        from app.core.database import AsyncSessionLocal  # noqa: PLC0415
        from app.models.users import UserProfile  # noqa: PLC0415
        from app.services.email import email_service  # noqa: PLC0415

        async with AsyncSessionLocal() as session:
            result = await session.execute(select(UserProfile).where(UserProfile.user_id == candidate_id))
            profile = result.scalar_one_or_none()
            prefs = (profile.preferences or {}) if profile else {}
            notifications = prefs.get("notifications") or {}
            if notifications.get("email_applications", True) is False:
                return

        if candidate_email:
            email_service.send_application_status_email(
                candidate_email,
                candidate_name or "Candidate",
                job_title,
                company,
                new_status,
            )
    except Exception as exc:
        import logging  # noqa: PLC0415

        logging.getLogger(__name__).warning("Status email failed: %s", exc)


# --------------------------------------------------------------------------- #
# Helper: convert Job ORM → JobResponse                                        #
# --------------------------------------------------------------------------- #


def _job_to_response(job, match_score: int = None, match_hint: str = None, employer_verified: bool = None):
    """Convert a Job ORM object to a JobResponse, optionally injecting match score."""
    from app.schemas.jobs import JobResponse  # noqa: PLC0415 (avoid circular at module level)

    base = JobResponse(
        id=str(job.id),
        employer_id=str(job.employer_id),
        title=job.title,
        company=job.company,
        description=job.description,
        requirements=job.requirements,
        job_type=job.job_type,
        location=job.location,
        remote_ok=job.remote_ok,
        salary_min=job.salary_min,
        salary_max=job.salary_max,
        salary_currency=job.salary_currency,
        skills_required=job.skills_required or [],
        experience_required=job.experience_required,
        has_tryout=job.has_tryout,
        tryout_config=job.tryout_config,
        outcome_terms=job.outcome_terms,
        custom_questions=job.custom_questions,
        status=job.status,
        views_count=job.views_count,
        applications_count=job.applications_count,
        created_at=job.created_at,
        updated_at=job.updated_at,
        published_at=job.published_at,
        expires_at=job.expires_at,
    )
    # Inject match metadata when available
    if match_score is not None:
        base.match_score = match_score
    if match_hint:
        base.match_hint = match_hint
    if employer_verified is not None:
        base.employer_verified = employer_verified
    return base


# ========== Job Posting Endpoints ==========


@router.get("/feed", response_model=JobListResponse)
async def get_ranked_job_feed(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=50),
    job_type: Optional[str] = None,
    remote_ok: Optional[bool] = None,
    location: Optional[str] = None,
    has_tryout: Optional[bool] = None,
    current_user: Optional[dict] = Depends(get_optional_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Personalized, AI-ranked job feed for candidates.

    - Authenticated candidates: jobs sorted by their 5-factor match score (skills,
      experience, location, salary, recency). Scores are Redis-cached for 6 hours.
    - Anonymous / non-candidate users: returns jobs sorted by recency (same as /search).
    """
    from sqlalchemy import select as sa_select  # noqa: PLC0415
    from app.models.jobs import Job, JobStatus  # noqa: PLC0415
    from app.models.users import UserProfile  # noqa: PLC0415
    from app.services.matching import (  # noqa: PLC0415
        CandidateProfile,
        JobSnapshot,
        compute_match_score,
        job_snapshot_from_orm,
        profile_from_orm,
        rank_jobs_for_candidate,
    )

    # --- Fetch jobs from DB (unranked; apply basic filters) ---
    q = sa_select(Job).where(Job.status == JobStatus.ACTIVE)
    if job_type:
        q = q.where(Job.job_type == job_type)
    if remote_ok is not None:
        q = q.where(Job.remote_ok == remote_ok)
    if location:
        q = q.where(Job.location.ilike(f"%{location}%"))
    if has_tryout is not None:
        q = q.where(Job.has_tryout == has_tryout)

    # For ranking we fetch a broader window (up to 200) then sort in Python
    fetch_limit = min(200, page_size * 5)
    result = await db.execute(q.order_by(Job.created_at.desc()).limit(fetch_limit))
    all_jobs = result.scalars().all()

    total = len(all_jobs)

    # --- Personalized ranking (candidates only) ---
    is_candidate = current_user is not None and current_user.get("role") == "candidate"

    if is_candidate:
        profile_result = await db.execute(
            sa_select(UserProfile).where(UserProfile.user_id == uuid.UUID(current_user["user_id"]))
        )
        profile_orm = profile_result.scalar_one_or_none()
        candidate_profile = profile_from_orm(profile_orm, current_user["user_id"])

        job_snaps = [job_snapshot_from_orm(j) for j in all_jobs]
        ranked = rank_jobs_for_candidate(candidate_profile, job_snaps)

        # Build lookup: job_id → (score, hint)
        score_map = {r[0].job_id: (r[1].total, r[1].explanation_hint) for r in ranked}
        # Sort ORM objects by rank
        sorted_jobs = sorted(
            all_jobs,
            key=lambda j: score_map.get(str(j.id), (0, ""))[0],
            reverse=True,
        )
    else:
        sorted_jobs = all_jobs
        score_map = {}

    # Apply pagination AFTER ranking
    offset = (page - 1) * page_size
    page_jobs = sorted_jobs[offset : offset + page_size]

    def _to_resp(job):
        score, hint = score_map.get(str(job.id), (None, None))
        return _job_to_response(job, match_score=score, match_hint=hint)

    return JobListResponse(
        jobs=[_to_resp(j) for j in page_jobs],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.post("/", response_model=JobResponse, status_code=status.HTTP_201_CREATED)
async def create_job(
    job_data: JobCreate,
    current_user: dict = Depends(require_role(UserRole.HR)),
    db: AsyncSession = Depends(get_db),
):
    """
    Create a new job posting (Employers only)

    Job will be created in DRAFT status. Use /jobs/{id}/publish to make it active.
    """
    job = await job_service.create_job(
        db=db,
        employer_id=uuid.UUID(current_user["user_id"]),
        job_data=job_data.model_dump(),
    )

    return JobResponse(
        id=str(job.id),
        employer_id=str(job.employer_id),
        title=job.title,
        company=job.company,
        description=job.description,
        requirements=job.requirements,
        job_type=job.job_type,
        location=job.location,
        remote_ok=job.remote_ok,
        salary_min=job.salary_min,
        salary_max=job.salary_max,
        salary_currency=job.salary_currency,
        skills_required=job.skills_required or [],
        experience_required=job.experience_required,
        has_tryout=job.has_tryout,
        tryout_config=job.tryout_config,
        outcome_terms=job.outcome_terms,
        custom_questions=job.custom_questions,
        status=job.status,
        views_count=job.views_count,
        applications_count=job.applications_count,
        created_at=job.created_at,
        updated_at=job.updated_at,
        published_at=job.published_at,
        expires_at=job.expires_at,
    )


@router.get("/search", response_model=JobListResponse)
async def search_jobs(
    query: Optional[str] = None,
    job_type: Optional[str] = None,
    remote_ok: Optional[bool] = None,
    location: Optional[str] = None,
    skills: Optional[str] = None,
    salary_min: Optional[int] = None,
    has_tryout: Optional[bool] = None,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    sort_by: str = Query(default="created_at", pattern="^(created_at|salary|title)$"),
    sort_order: str = Query(default="desc", pattern="^(asc|desc)$"),
    db: AsyncSession = Depends(get_db),
):
    """Search job postings with filters"""
    filters = {
        "query": query,
        "job_type": job_type,
        "remote_ok": remote_ok,
        "location": location,
        "skills": skills.split(",") if skills else None,
        "salary_min": salary_min,
        "has_tryout": has_tryout,
        "sort_by": sort_by,
        "sort_order": sort_order,
    }

    jobs, total = await job_service.search_jobs(db=db, filters=filters, page=page, page_size=page_size)

    from app.services.organization_service import get_employer_verified_map  # noqa: PLC0415

    employer_ids = list({j.employer_id for j in jobs})
    verified_map = await get_employer_verified_map(db, employer_ids)

    def to_response(job):
        return JobResponse(
            id=str(job.id),
            employer_id=str(job.employer_id),
            title=job.title,
            company=job.company,
            description=job.description,
            requirements=job.requirements,
            job_type=job.job_type,
            location=job.location,
            remote_ok=job.remote_ok,
            salary_min=job.salary_min,
            salary_max=job.salary_max,
            salary_currency=job.salary_currency,
            skills_required=job.skills_required or [],
            experience_required=job.experience_required,
            has_tryout=job.has_tryout,
            tryout_config=job.tryout_config,
            outcome_terms=job.outcome_terms,
            custom_questions=job.custom_questions,
            status=job.status,
            views_count=job.views_count,
            applications_count=job.applications_count,
            created_at=job.created_at,
            updated_at=job.updated_at,
            published_at=job.published_at,
            expires_at=job.expires_at,
            employer_verified=verified_map.get(job.employer_id, False),
        )

    return JobListResponse(jobs=[to_response(j) for j in jobs], total=total, page=page, page_size=page_size)


@router.get("/my-jobs", response_model=JobListResponse)
async def get_my_jobs(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    current_user: dict = Depends(require_role(UserRole.HR)),
    db: AsyncSession = Depends(get_db),
):
    """Get all jobs posted by current employer"""
    jobs, total = await job_service.get_employer_jobs(
        db=db,
        employer_id=uuid.UUID(current_user["user_id"]),
        page=page,
        page_size=page_size,
    )

    def to_response(job):
        return JobResponse(
            id=str(job.id),
            employer_id=str(job.employer_id),
            title=job.title,
            company=job.company,
            description=job.description,
            requirements=job.requirements,
            job_type=job.job_type,
            location=job.location,
            remote_ok=job.remote_ok,
            salary_min=job.salary_min,
            salary_max=job.salary_max,
            salary_currency=job.salary_currency,
            skills_required=job.skills_required or [],
            experience_required=job.experience_required,
            has_tryout=job.has_tryout,
            tryout_config=job.tryout_config,
            outcome_terms=job.outcome_terms,
            custom_questions=job.custom_questions,
            status=job.status,
            views_count=job.views_count,
            applications_count=job.applications_count,
            created_at=job.created_at,
            updated_at=job.updated_at,
            published_at=job.published_at,
            expires_at=job.expires_at,
        )

    return JobListResponse(jobs=[to_response(j) for j in jobs], total=total, page=page, page_size=page_size)


# ========== Candidate Application Routes (must come before /{job_id} dynamic routes) ==========


@router.get("/applications/my-applications", response_model=ApplicationListResponse)
async def get_my_applications(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    current_user: dict = Depends(require_role(UserRole.CANDIDATE)),
    db: AsyncSession = Depends(get_db),
):
    """Get all applications for current candidate"""
    from sqlalchemy import select as sa_select
    from app.models.jobs import Application, Job

    offset = (page - 1) * page_size
    stmt = (
        sa_select(Application, Job.title, Job.company)
        .outerjoin(Job, Job.id == Application.job_id)
        .where(Application.candidate_id == uuid.UUID(current_user["user_id"]))
        .order_by(Application.created_at.desc())
        .offset(offset)
        .limit(page_size)
    )
    result = await db.execute(stmt)
    rows = result.all()

    # Total count
    from sqlalchemy import func

    count_stmt = (
        sa_select(func.count()).select_from(Application).where(Application.candidate_id == uuid.UUID(current_user["user_id"]))
    )
    total = (await db.execute(count_stmt)).scalar_one()

    def to_app_response(app, job_title, company):
        return _application_to_response(
            app,
            job_title=job_title,
            company_name=company,
        )

    return ApplicationListResponse(
        applications=[to_app_response(row[0], row[1], row[2]) for row in rows],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.get("/applications/{application_id}", response_model=ApplicationDetailResponse)
async def get_application_detail(
    application_id: str,
    current_user: dict = Depends(require_role(UserRole.HR)),
    db: AsyncSession = Depends(get_db),
):
    """Get full application detail (Employer only) — includes candidate name, email, job title"""
    from sqlalchemy import select as sa_select
    from app.models.jobs import Application, Job
    from app.models.users import User, UserProfile

    stmt = (
        sa_select(
            Application,
            Job.title,
            User.email,
            UserProfile.full_name,
            UserProfile.headline,
            UserProfile.location,
            UserProfile.skills,
            UserProfile.resume_url,
        )
        .outerjoin(Job, Job.id == Application.job_id)
        .outerjoin(User, User.id == Application.candidate_id)
        .outerjoin(UserProfile, UserProfile.user_id == Application.candidate_id)
        .where(Application.id == uuid.UUID(application_id))
    )
    result = await db.execute(stmt)
    row = result.first()

    if not row:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Application not found")

    app, job_title, candidate_email, candidate_name, headline, location, skills, resume_url = row

    # Verify this employer owns the job
    if str(app.job_id) not in [
        str(j.id)
        for j in (await db.execute(sa_select(Job).where(Job.employer_id == uuid.UUID(current_user["user_id"]))))
        .scalars()
        .all()
    ]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    history = await get_status_history(db, app.id)

    return ApplicationDetailResponse(
        id=str(app.id),
        job_id=str(app.job_id),
        candidate_id=str(app.candidate_id),
        cover_letter=app.cover_letter,
        vault_share_token=app.vault_share_token,
        custom_answers=app.custom_answers,
        status=app.status,
        match_score=app.match_score,
        match_explanation=app.match_explanation,
        employer_notes=app.employer_notes,
        candidate_name=candidate_name or "Unknown Candidate",
        candidate_email=candidate_email or "",
        job_title=job_title or "Unknown Job",
        candidate_headline=headline,
        candidate_location=location,
        candidate_skills=list(skills or []),
        candidate_resume_url=resume_url,
        status_history=_history_to_entries(history),
        available_actions=get_available_actions(app.status),
        is_locked=is_locked(app.status),
        created_at=app.created_at,
        updated_at=app.updated_at,
    )


@router.get("/applications/{application_id}/candidate-profile", response_model=CandidateProfileForEmployer)
async def get_application_candidate_profile(
    application_id: str,
    current_user: dict = Depends(require_role(UserRole.HR)),
    db: AsyncSession = Depends(get_db),
):
    """Full candidate profile for employer reviewing an application."""
    from sqlalchemy import select as sa_select
    from app.models.jobs import Application, Job
    from app.models.users import User, UserProfile

    stmt = (
        sa_select(Application, Job.title, User.email, UserProfile)
        .outerjoin(Job, Job.id == Application.job_id)
        .outerjoin(User, User.id == Application.candidate_id)
        .outerjoin(UserProfile, UserProfile.user_id == Application.candidate_id)
        .where(Application.id == uuid.UUID(application_id))
    )
    result = await db.execute(stmt)
    row = result.first()

    if not row:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Application not found")

    app, job_title, candidate_email, profile = row

    if str(app.job_id) not in [
        str(j.id)
        for j in (await db.execute(sa_select(Job).where(Job.employer_id == uuid.UUID(current_user["user_id"]))))
        .scalars()
        .all()
    ]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    return CandidateProfileForEmployer(
        candidate_id=str(app.candidate_id),
        application_id=str(app.id),
        full_name=profile.full_name if profile else None,
        email=candidate_email,
        phone=profile.phone if profile else None,
        location=profile.location if profile else None,
        bio=profile.bio if profile else None,
        headline=profile.headline if profile else None,
        skills=list(profile.skills or []) if profile else [],
        experience_years=profile.experience_years if profile else None,
        resume_url=profile.resume_url if profile else None,
        social_links=profile.social_links if profile else None,
        vault_share_token=app.vault_share_token,
        has_shared_vault=bool(app.vault_share_token),
        job_title=job_title or "Unknown Job",
    )


@router.put("/applications/{application_id}/status", response_model=ApplicationDetailResponse)
async def update_application_status(
    application_id: str,
    status_data: ApplicationStatusUpdate,
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(require_role(UserRole.HR)),
    db: AsyncSession = Depends(get_db),
):
    """Update application status (Employer only, must own the job)"""
    from sqlalchemy import select as sa_select
    from app.models.users import User, UserProfile

    transition = await application_service.update_application_status(
        db=db,
        application_id=uuid.UUID(application_id),
        employer_id=uuid.UUID(current_user["user_id"]),
        new_status=status_data.status,
        employer_notes=status_data.employer_notes,
    )

    application = transition.application
    job = transition.job

    # Audit trail (org-level)
    org_id = await get_org_id_for_user(db, current_user["user_id"])
    await log_audit_event(
        db=db,
        action=AuditAction.APPLICATION_STATUS_CHANGED,
        user_id=current_user["user_id"],
        org_id=org_id,
        resource_type="application",
        resource_id=application.id,
        details={
            "old_status": transition.old_status.value,
            "new_status": transition.new_status.value,
            "application_id": str(application.id),
            "job_id": str(job.id),
        },
    )
    notif_copy = notification_for_status(transition.new_status)
    notification = None
    if notif_copy:
        title, message = notif_copy
        notification = await notification_service.create_in_session(
            db=db,
            user_id=str(application.candidate_id),
            notif_type="application",
            title=title,
            message=message,
            link="/dashboard/applications",
        )

    await db.commit()

    if notification:
        await notification_service.push_notification(application.candidate_id, notification)

    cand_result = await db.execute(
        sa_select(User.email, UserProfile.full_name)
        .select_from(User)
        .outerjoin(UserProfile, UserProfile.user_id == User.id)
        .where(User.id == application.candidate_id)
    )
    cand_row = cand_result.first()
    candidate_email = cand_row[0] if cand_row else ""
    candidate_name = (cand_row[1] if cand_row else None) or "Candidate"

    if notif_copy:
        background_tasks.add_task(
            _send_status_email_async,
            application.candidate_id,
            candidate_email,
            candidate_name,
            job.title,
            job.company,
            transition.new_status.value,
        )

    history = await get_status_history(db, application.id)

    return ApplicationDetailResponse(
        id=str(application.id),
        job_id=str(application.job_id),
        candidate_id=str(application.candidate_id),
        cover_letter=application.cover_letter,
        vault_share_token=application.vault_share_token,
        custom_answers=application.custom_answers,
        status=application.status,
        match_score=application.match_score,
        match_explanation=application.match_explanation,
        employer_notes=application.employer_notes,
        candidate_name=candidate_name,
        candidate_email=candidate_email,
        job_title=job.title,
        status_history=_history_to_entries(history),
        available_actions=get_available_actions(application.status),
        is_locked=is_locked(application.status),
        created_at=application.created_at,
        updated_at=application.updated_at,
    )


@router.post("/applications/{application_id}/reopen", response_model=ApplicationDetailResponse)
async def reopen_application(
    application_id: str,
    body: ApplicationReopenRequest,
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(require_role(UserRole.HR)),
    db: AsyncSession = Depends(get_db),
):
    """Reopen a rejected application (HR only)."""
    from sqlalchemy import select as sa_select
    from app.models.users import User, UserProfile

    reopen_result = await application_service.reopen_application(
        db=db,
        application_id=uuid.UUID(application_id),
        employer_id=uuid.UUID(current_user["user_id"]),
        reason=body.reason,
    )

    application = reopen_result.application
    job = reopen_result.job

    org_id = await get_org_id_for_user(db, current_user["user_id"])
    await log_audit_event(
        db=db,
        action=AuditAction.APPLICATION_REOPENED,
        user_id=current_user["user_id"],
        org_id=org_id,
        resource_type="application",
        resource_id=application.id,
        details={
            "old_status": reopen_result.old_status.value,
            "new_status": application.status.value,
            "application_id": str(application.id),
            "job_id": str(job.id),
            "reason": body.reason,
        },
    )

    title, message = notification_for_reopen()
    notification = await notification_service.create_in_session(
        db=db,
        user_id=str(application.candidate_id),
        notif_type="application",
        title=title,
        message=message,
        link="/dashboard/applications",
    )

    await db.commit()

    if notification:
        await notification_service.push_notification(application.candidate_id, notification)

    cand_result = await db.execute(
        sa_select(User.email, UserProfile.full_name)
        .select_from(User)
        .outerjoin(UserProfile, UserProfile.user_id == User.id)
        .where(User.id == application.candidate_id)
    )
    cand_row = cand_result.first()
    candidate_email = cand_row[0] if cand_row else ""
    candidate_name = (cand_row[1] if cand_row else None) or "Candidate"

    background_tasks.add_task(
        _send_status_email_async,
        application.candidate_id,
        candidate_email,
        candidate_name,
        job.title,
        job.company,
        "reopened",
    )

    history = await get_status_history(db, application.id)

    return ApplicationDetailResponse(
        id=str(application.id),
        job_id=str(application.job_id),
        candidate_id=str(application.candidate_id),
        cover_letter=application.cover_letter,
        vault_share_token=application.vault_share_token,
        custom_answers=application.custom_answers,
        status=application.status,
        match_score=application.match_score,
        match_explanation=application.match_explanation,
        employer_notes=application.employer_notes,
        candidate_name=candidate_name,
        candidate_email=candidate_email,
        job_title=job.title,
        status_history=_history_to_entries(history),
        available_actions=get_available_actions(application.status),
        is_locked=is_locked(application.status),
        created_at=application.created_at,
        updated_at=application.updated_at,
    )


@router.get("/{job_id}", response_model=JobResponse)
async def get_job(job_id: str, db: AsyncSession = Depends(get_db)):
    """Get job details by ID (public — active jobs only)"""
    from app.models.jobs import JobStatus  # noqa: PLC0415

    job = await job_service.get_job(db, uuid.UUID(job_id))

    if not job or job.status != JobStatus.ACTIVE:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found")

    from app.services.organization_service import get_employer_verified_map  # noqa: PLC0415

    verified_map = await get_employer_verified_map(db, [job.employer_id])
    employer_verified = verified_map.get(job.employer_id, False)

    # Build the response BEFORE calling increment_view_count.
    # increment_view_count commits, which expires all ORM objects in the session.
    # Accessing job.status after expiry triggers a lazy load → MissingGreenlet in async.
    response = JobResponse(
        id=str(job.id),
        employer_id=str(job.employer_id),
        title=job.title,
        company=job.company,
        description=job.description,
        requirements=job.requirements,
        job_type=job.job_type,
        location=job.location,
        remote_ok=job.remote_ok,
        salary_min=job.salary_min,
        salary_max=job.salary_max,
        salary_currency=job.salary_currency,
        skills_required=job.skills_required or [],
        experience_required=job.experience_required,
        has_tryout=job.has_tryout,
        tryout_config=job.tryout_config,
        outcome_terms=job.outcome_terms,
        custom_questions=job.custom_questions,
        status=job.status,
        views_count=job.views_count,
        applications_count=job.applications_count,
        created_at=job.created_at,
        updated_at=job.updated_at,
        published_at=job.published_at,
        expires_at=job.expires_at,
        employer_verified=employer_verified,
    )

    # Fire view count increment after response is built (commit will expire the job object)
    await job_service.increment_view_count(db, uuid.UUID(job_id))

    return response


@router.put("/{job_id}", response_model=JobResponse)
async def update_job(
    job_id: str,
    job_data: JobUpdate,
    current_user: dict = Depends(require_role(UserRole.HR)),
    db: AsyncSession = Depends(get_db),
):
    """Update job posting (Employer only, must own the job)"""
    job = await job_service.update_job(
        db=db,
        job_id=uuid.UUID(job_id),
        employer_id=uuid.UUID(current_user["user_id"]),
        update_data=job_data.model_dump(exclude_unset=True),
    )

    return JobResponse(
        id=str(job.id),
        employer_id=str(job.employer_id),
        title=job.title,
        company=job.company,
        description=job.description,
        requirements=job.requirements,
        job_type=job.job_type,
        location=job.location,
        remote_ok=job.remote_ok,
        salary_min=job.salary_min,
        salary_max=job.salary_max,
        salary_currency=job.salary_currency,
        skills_required=job.skills_required or [],
        experience_required=job.experience_required,
        has_tryout=job.has_tryout,
        tryout_config=job.tryout_config,
        outcome_terms=job.outcome_terms,
        custom_questions=job.custom_questions,
        status=job.status,
        views_count=job.views_count,
        applications_count=job.applications_count,
        created_at=job.created_at,
        updated_at=job.updated_at,
        published_at=job.published_at,
        expires_at=job.expires_at,
    )


@router.post("/{job_id}/publish", response_model=JobResponse)
async def publish_job(
    job_id: str,
    current_user: dict = Depends(require_role(UserRole.HR)),
    db: AsyncSession = Depends(get_db),
):
    """Publish a draft job (make it active and visible to candidates)"""
    job = await job_service.publish_job(db=db, job_id=uuid.UUID(job_id), employer_id=uuid.UUID(current_user["user_id"]))

    return JobResponse(
        id=str(job.id),
        employer_id=str(job.employer_id),
        title=job.title,
        company=job.company,
        description=job.description,
        requirements=job.requirements,
        job_type=job.job_type,
        location=job.location,
        remote_ok=job.remote_ok,
        salary_min=job.salary_min,
        salary_max=job.salary_max,
        salary_currency=job.salary_currency,
        skills_required=job.skills_required or [],
        experience_required=job.experience_required,
        has_tryout=job.has_tryout,
        tryout_config=job.tryout_config,
        outcome_terms=job.outcome_terms,
        custom_questions=job.custom_questions,
        status=job.status,
        views_count=job.views_count,
        applications_count=job.applications_count,
        created_at=job.created_at,
        updated_at=job.updated_at,
        published_at=job.published_at,
        expires_at=job.expires_at,
    )


@router.delete("/{job_id}", response_model=dict)
async def delete_job(
    job_id: str,
    current_user: dict = Depends(require_role(UserRole.HR)),
    db: AsyncSession = Depends(get_db),
):
    """Delete job posting (soft delete - marks as CLOSED)"""
    await job_service.delete_job(db=db, job_id=uuid.UUID(job_id), employer_id=uuid.UUID(current_user["user_id"]))

    return {"message": "Job closed successfully"}


# ========== Application Endpoints ==========


@router.post(
    "/{job_id}/apply",
    response_model=ApplicationResponse,
    status_code=status.HTTP_201_CREATED,
)
async def apply_to_job(
    job_id: str,
    application_data: ApplicationCreate,
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(require_role(UserRole.CANDIDATE)),
    db: AsyncSession = Depends(get_db),
):
    """Apply to a job (Candidates only)"""
    app_dict = application_data.model_dump()
    app_dict["job_id"] = uuid.UUID(job_id)

    application = await application_service.create_application(
        db=db,
        candidate_id=uuid.UUID(current_user["user_id"]),
        application_data=app_dict,
    )

    # Trigger Gemini LLM explanation as a background task (non-blocking)
    # The explanation will be written to applications.match_explanation after response is sent.
    background_tasks.add_task(
        _generate_and_store_explanation,
        application_id=str(application.id),
        candidate_id=current_user["user_id"],
        job_id=job_id,
    )
    background_tasks.add_task(_run_fraud_eval, application_id=str(application.id))

    return ApplicationResponse(
        id=str(application.id),
        job_id=str(application.job_id),
        candidate_id=str(application.candidate_id),
        cover_letter=application.cover_letter,
        vault_share_token=application.vault_share_token,
        custom_answers=application.custom_answers,
        status=application.status,
        match_score=application.match_score,
        match_explanation=application.match_explanation,
        employer_notes=application.employer_notes,
        created_at=application.created_at,
        updated_at=application.updated_at,
    )


async def _run_fraud_eval(application_id: str) -> None:
    """BackgroundTask: evaluate application fraud score in a fresh DB session."""
    import logging as _log  # noqa: PLC0415

    _logger = _log.getLogger(__name__)
    try:
        from app.core.database import AsyncSessionLocal  # noqa: PLC0415
        from app.services.fraud import evaluate_application_fraud  # noqa: PLC0415

        async with AsyncSessionLocal() as session:
            await evaluate_application_fraud(session, uuid.UUID(application_id))
    except Exception as exc:
        _logger.warning("Fraud evaluation failed for application %s: %s", application_id, exc)


async def _generate_and_store_explanation(application_id: str, candidate_id: str, job_id: str) -> None:
    """
    BackgroundTask: Calls Gemini to generate a natural language match explanation
    and stores it in applications.match_explanation['llm_summary'].

    Runs AFTER the response is returned to the client — never blocks the hot path.
    """
    import logging as _log  # noqa: PLC0415

    _logger = _log.getLogger(__name__)
    try:
        from sqlalchemy import select as _sel  # noqa: PLC0415
        from app.core.database import AsyncSessionLocal  # noqa: PLC0415
        from app.models.jobs import Application, Job  # noqa: PLC0415
        from app.models.users import UserProfile  # noqa: PLC0415
        from app.services.matching import (  # noqa: PLC0415
            compute_match_score,
            generate_llm_explanation,
            job_snapshot_from_orm,
            profile_from_orm,
        )

        async with AsyncSessionLocal() as session:
            # Fetch fresh objects in a new session
            app_row = (
                await session.execute(_sel(Application).where(Application.id == uuid.UUID(application_id)))
            ).scalar_one_or_none()

            if not app_row:
                return

            job_row = (await session.execute(_sel(Job).where(Job.id == uuid.UUID(job_id)))).scalar_one_or_none()

            profile_row = (
                await session.execute(_sel(UserProfile).where(UserProfile.user_id == uuid.UUID(candidate_id)))
            ).scalar_one_or_none()

            if not job_row:
                return

            candidate_profile = profile_from_orm(profile_row, candidate_id)
            job_snap = job_snapshot_from_orm(job_row)
            breakdown = compute_match_score(candidate_profile, job_snap)

            explanation = await generate_llm_explanation(candidate_profile, job_snap, breakdown)

            # Merge with existing match_explanation JSONB
            existing = app_row.match_explanation or {}
            existing["llm_summary"] = explanation
            app_row.match_explanation = existing

            await session.commit()
            _logger.info("LLM explanation stored for application %s", application_id)

    except Exception as exc:
        _logger.warning("Background LLM explanation failed for %s: %s", application_id, exc)


@router.get("/{job_id}/applications", response_model=ApplicationListResponse)
async def get_job_applications(
    job_id: str,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    current_user: dict = Depends(require_role(UserRole.HR)),
    db: AsyncSession = Depends(get_db),
):
    """Get all applications for a job (Employer only, must own the job)"""
    applications, total = await application_service.get_job_applications(
        db=db,
        job_id=uuid.UUID(job_id),
        employer_id=uuid.UUID(current_user["user_id"]),
        page=page,
        page_size=page_size,
    )

    return ApplicationListResponse(
        applications=[
            ApplicationResponse(
                id=str(app.id),
                job_id=str(app.job_id),
                candidate_id=str(app.candidate_id),
                cover_letter=app.cover_letter,
                vault_share_token=app.vault_share_token,
                custom_answers=app.custom_answers,
                status=app.status,
                match_score=app.match_score,
                match_explanation=app.match_explanation,
                employer_notes=app.employer_notes,
                created_at=app.created_at,
                updated_at=app.updated_at,
            )
            for app in applications
        ],
        total=total,
        page=page,
        page_size=page_size,
    )
