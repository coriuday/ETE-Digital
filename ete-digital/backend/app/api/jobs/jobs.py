"""
Job posting and application API endpoints
"""

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
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
)
from app.services.jobs import job_service, application_service
from app.services.notification_service import notification_service
from app.core.security import get_optional_current_user  # may be None for unauthenticated


router = APIRouter()


# --------------------------------------------------------------------------- #
# Helper: convert Job ORM → JobResponse                                        #
# --------------------------------------------------------------------------- #


def _job_to_response(job, match_score: int = None, match_hint: str = None):
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
    current_user: dict = Depends(require_role(UserRole.EMPLOYER)),
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


@router.get("/my-jobs", response_model=JobListResponse)
async def get_my_jobs(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    current_user: dict = Depends(require_role(UserRole.EMPLOYER)),
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
            job_title=job_title,
            company_name=company,
            created_at=app.created_at,
            updated_at=app.updated_at,
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
    current_user: dict = Depends(require_role(UserRole.EMPLOYER)),
    db: AsyncSession = Depends(get_db),
):
    """Get full application detail (Employer only) — includes candidate name, email, job title"""
    from sqlalchemy import select as sa_select
    from app.models.jobs import Application, Job
    from app.models.users import User, UserProfile

    stmt = (
        sa_select(Application, Job.title, User.email, UserProfile.full_name)
        .outerjoin(Job, Job.id == Application.job_id)
        .outerjoin(User, User.id == Application.candidate_id)
        .outerjoin(UserProfile, UserProfile.user_id == Application.candidate_id)
        .where(Application.id == uuid.UUID(application_id))
    )
    result = await db.execute(stmt)
    row = result.first()

    if not row:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Application not found")

    app, job_title, candidate_email, candidate_name = row

    # Verify this employer owns the job
    if str(app.job_id) not in [
        str(j.id)
        for j in (await db.execute(sa_select(Job).where(Job.employer_id == uuid.UUID(current_user["user_id"]))))
        .scalars()
        .all()
    ]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

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
        created_at=app.created_at,
        updated_at=app.updated_at,
    )


@router.put("/applications/{application_id}/status", response_model=ApplicationResponse)
async def update_application_status(
    application_id: str,
    status_data: ApplicationStatusUpdate,
    current_user: dict = Depends(require_role(UserRole.EMPLOYER)),
    db: AsyncSession = Depends(get_db),
):
    """Update application status (Employer only, must own the job)"""
    application = await application_service.update_application_status(
        db=db,
        application_id=uuid.UUID(application_id),
        employer_id=uuid.UUID(current_user["user_id"]),
        new_status=status_data.status,
        employer_notes=status_data.employer_notes,
    )

    # Push real-time notification to candidate
    await notification_service.create_and_push(
        db=db,
        user_id=str(application.candidate_id),
        notif_type="application",
        title="Application Status Updated",
        message=f"Your application status has been updated to: {application.status.value}",
        link="/dashboard/applications",
    )

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


@router.get("/{job_id}", response_model=JobResponse)
async def get_job(job_id: str, db: AsyncSession = Depends(get_db)):
    """Get job details by ID"""
    job = await job_service.get_job(db, uuid.UUID(job_id))

    if not job:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found")

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
    )

    # Fire view count increment after response is built (commit will expire the job object)
    await job_service.increment_view_count(db, uuid.UUID(job_id))

    return response


@router.put("/{job_id}", response_model=JobResponse)
async def update_job(
    job_id: str,
    job_data: JobUpdate,
    current_user: dict = Depends(require_role(UserRole.EMPLOYER)),
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
    current_user: dict = Depends(require_role(UserRole.EMPLOYER)),
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
    current_user: dict = Depends(require_role(UserRole.EMPLOYER)),
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
    current_user: dict = Depends(require_role(UserRole.EMPLOYER)),
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
