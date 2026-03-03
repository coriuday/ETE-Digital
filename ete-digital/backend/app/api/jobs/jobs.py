"""
Job posting and application API endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional, List
import uuid

from app.core.database import get_db
from app.core.security import get_current_user, require_role
from app.models.users import UserRole
from app.schemas.jobs import (
    JobCreate,
    JobUpdate,
    JobResponse,
    JobListResponse,
    JobSearchFilters,
    ApplicationCreate,
    ApplicationUpdate,
    ApplicationResponse,
    ApplicationListResponse,
    ApplicationStatusUpdate
)
from app.services.jobs import job_service, application_service


router = APIRouter()


# ========== Job Posting Endpoints ==========

@router.post("/", response_model=JobResponse, status_code=status.HTTP_201_CREATED)
async def create_job(
    job_data: JobCreate,
    current_user: dict = Depends(require_role(UserRole.EMPLOYER)),
    db: AsyncSession = Depends(get_db)
):
    """
    Create a new job posting (Employers only)

    Job will be created in DRAFT status. Use /jobs/{id}/publish to make it active.
    """
    job = await job_service.create_job(
        db=db,
        employer_id=uuid.UUID(current_user["user_id"]),
        job_data=job_data.model_dump()
    )

    return JobResponse(
        id=str(job.id), employer_id=str(job.employer_id), title=job.title, company=job.company,
        description=job.description, requirements=job.requirements, job_type=job.job_type,
        location=job.location, remote_ok=job.remote_ok, salary_min=job.salary_min,
        salary_max=job.salary_max, salary_currency=job.salary_currency,
        skills_required=job.skills_required or [], experience_required=job.experience_required,
        has_tryout=job.has_tryout, tryout_config=job.tryout_config, outcome_terms=job.outcome_terms,
        custom_questions=job.custom_questions, status=job.status, views_count=job.views_count,
        applications_count=job.applications_count, created_at=job.created_at,
        updated_at=job.updated_at, published_at=job.published_at, expires_at=job.expires_at
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
    db: AsyncSession = Depends(get_db)
):
    """Search job postings with filters"""
    filters = {
        "query": query, "job_type": job_type, "remote_ok": remote_ok,
        "location": location, "skills": skills.split(",") if skills else None,
        "salary_min": salary_min, "has_tryout": has_tryout,
        "sort_by": sort_by, "sort_order": sort_order
    }

    jobs, total = await job_service.search_jobs(db=db, filters=filters, page=page, page_size=page_size)

    def to_response(job):
        return JobResponse(
            id=str(job.id), employer_id=str(job.employer_id), title=job.title, company=job.company,
            description=job.description, requirements=job.requirements, job_type=job.job_type,
            location=job.location, remote_ok=job.remote_ok, salary_min=job.salary_min,
            salary_max=job.salary_max, salary_currency=job.salary_currency,
            skills_required=job.skills_required or [], experience_required=job.experience_required,
            has_tryout=job.has_tryout, tryout_config=job.tryout_config, outcome_terms=job.outcome_terms,
            custom_questions=job.custom_questions, status=job.status, views_count=job.views_count,
            applications_count=job.applications_count, created_at=job.created_at,
            updated_at=job.updated_at, published_at=job.published_at, expires_at=job.expires_at
        )

    return JobListResponse(jobs=[to_response(j) for j in jobs], total=total, page=page, page_size=page_size)


@router.get("/my-jobs", response_model=JobListResponse)
async def get_my_jobs(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    current_user: dict = Depends(require_role(UserRole.EMPLOYER)),
    db: AsyncSession = Depends(get_db)
):
    """Get all jobs posted by current employer"""
    jobs, total = await job_service.get_employer_jobs(
        db=db, employer_id=uuid.UUID(current_user["user_id"]), page=page, page_size=page_size
    )

    def to_response(job):
        return JobResponse(
            id=str(job.id), employer_id=str(job.employer_id), title=job.title, company=job.company,
            description=job.description, requirements=job.requirements, job_type=job.job_type,
            location=job.location, remote_ok=job.remote_ok, salary_min=job.salary_min,
            salary_max=job.salary_max, salary_currency=job.salary_currency,
            skills_required=job.skills_required or [], experience_required=job.experience_required,
            has_tryout=job.has_tryout, tryout_config=job.tryout_config, outcome_terms=job.outcome_terms,
            custom_questions=job.custom_questions, status=job.status, views_count=job.views_count,
            applications_count=job.applications_count, created_at=job.created_at,
            updated_at=job.updated_at, published_at=job.published_at, expires_at=job.expires_at
        )

    return JobListResponse(jobs=[to_response(j) for j in jobs], total=total, page=page, page_size=page_size)


# ========== Candidate Application Routes (must come before /{job_id} dynamic routes) ==========

@router.get("/applications/my-applications", response_model=ApplicationListResponse)
async def get_my_applications(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    current_user: dict = Depends(require_role(UserRole.CANDIDATE)),
    db: AsyncSession = Depends(get_db)
):
    """Get all applications for current candidate"""
    applications, total = await application_service.get_candidate_applications(
        db=db, candidate_id=uuid.UUID(current_user["user_id"]), page=page, page_size=page_size
    )

    def to_app_response(app):
        return ApplicationResponse(
            id=str(app.id), job_id=str(app.job_id), candidate_id=str(app.candidate_id),
            cover_letter=app.cover_letter, vault_share_token=app.vault_share_token,
            custom_answers=app.custom_answers, status=app.status, match_score=app.match_score,
            match_explanation=app.match_explanation, employer_notes=app.employer_notes,
            created_at=app.created_at, updated_at=app.updated_at
        )

    return ApplicationListResponse(applications=[to_app_response(a) for a in applications], total=total, page=page, page_size=page_size)


@router.put("/applications/{application_id}/status", response_model=ApplicationResponse)
async def update_application_status(
    application_id: str,
    status_data: ApplicationStatusUpdate,
    current_user: dict = Depends(require_role(UserRole.EMPLOYER)),
    db: AsyncSession = Depends(get_db)
):
    """Update application status (Employer only, must own the job)"""
    application = await application_service.update_application_status(
        db=db, application_id=uuid.UUID(application_id),
        employer_id=uuid.UUID(current_user["user_id"]),
        new_status=status_data.status, employer_notes=status_data.employer_notes
    )

    return ApplicationResponse(
        id=str(application.id), job_id=str(application.job_id), candidate_id=str(application.candidate_id),
        cover_letter=application.cover_letter, vault_share_token=application.vault_share_token,
        custom_answers=application.custom_answers, status=application.status,
        match_score=application.match_score, match_explanation=application.match_explanation,
        employer_notes=application.employer_notes, created_at=application.created_at,
        updated_at=application.updated_at
    )


@router.get("/{job_id}", response_model=JobResponse)
async def get_job(job_id: str, db: AsyncSession = Depends(get_db)):
    """Get job details by ID"""
    job = await job_service.get_job(db, uuid.UUID(job_id))

    if not job:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found")

    await job_service.increment_view_count(db, uuid.UUID(job_id))

    return JobResponse(
        id=str(job.id), employer_id=str(job.employer_id), title=job.title, company=job.company,
        description=job.description, requirements=job.requirements, job_type=job.job_type,
        location=job.location, remote_ok=job.remote_ok, salary_min=job.salary_min,
        salary_max=job.salary_max, salary_currency=job.salary_currency,
        skills_required=job.skills_required or [], experience_required=job.experience_required,
        has_tryout=job.has_tryout, tryout_config=job.tryout_config, outcome_terms=job.outcome_terms,
        custom_questions=job.custom_questions, status=job.status, views_count=job.views_count,
        applications_count=job.applications_count, created_at=job.created_at,
        updated_at=job.updated_at, published_at=job.published_at, expires_at=job.expires_at
    )


@router.put("/{job_id}", response_model=JobResponse)
async def update_job(
    job_id: str,
    job_data: JobUpdate,
    current_user: dict = Depends(require_role(UserRole.EMPLOYER)),
    db: AsyncSession = Depends(get_db)
):
    """Update job posting (Employer only, must own the job)"""
    job = await job_service.update_job(
        db=db, job_id=uuid.UUID(job_id),
        employer_id=uuid.UUID(current_user["user_id"]),
        update_data=job_data.model_dump(exclude_unset=True)
    )

    return JobResponse(
        id=str(job.id), employer_id=str(job.employer_id), title=job.title, company=job.company,
        description=job.description, requirements=job.requirements, job_type=job.job_type,
        location=job.location, remote_ok=job.remote_ok, salary_min=job.salary_min,
        salary_max=job.salary_max, salary_currency=job.salary_currency,
        skills_required=job.skills_required or [], experience_required=job.experience_required,
        has_tryout=job.has_tryout, tryout_config=job.tryout_config, outcome_terms=job.outcome_terms,
        custom_questions=job.custom_questions, status=job.status, views_count=job.views_count,
        applications_count=job.applications_count, created_at=job.created_at,
        updated_at=job.updated_at, published_at=job.published_at, expires_at=job.expires_at
    )


@router.post("/{job_id}/publish", response_model=JobResponse)
async def publish_job(
    job_id: str,
    current_user: dict = Depends(require_role(UserRole.EMPLOYER)),
    db: AsyncSession = Depends(get_db)
):
    """Publish a draft job (make it active and visible to candidates)"""
    job = await job_service.publish_job(
        db=db, job_id=uuid.UUID(job_id), employer_id=uuid.UUID(current_user["user_id"])
    )

    return JobResponse(
        id=str(job.id), employer_id=str(job.employer_id), title=job.title, company=job.company,
        description=job.description, requirements=job.requirements, job_type=job.job_type,
        location=job.location, remote_ok=job.remote_ok, salary_min=job.salary_min,
        salary_max=job.salary_max, salary_currency=job.salary_currency,
        skills_required=job.skills_required or [], experience_required=job.experience_required,
        has_tryout=job.has_tryout, tryout_config=job.tryout_config, outcome_terms=job.outcome_terms,
        custom_questions=job.custom_questions, status=job.status, views_count=job.views_count,
        applications_count=job.applications_count, created_at=job.created_at,
        updated_at=job.updated_at, published_at=job.published_at, expires_at=job.expires_at
    )


@router.delete("/{job_id}", response_model=dict)
async def delete_job(
    job_id: str,
    current_user: dict = Depends(require_role(UserRole.EMPLOYER)),
    db: AsyncSession = Depends(get_db)
):
    """Delete job posting (soft delete - marks as CLOSED)"""
    await job_service.delete_job(
        db=db, job_id=uuid.UUID(job_id), employer_id=uuid.UUID(current_user["user_id"])
    )

    return {"message": "Job closed successfully"}


# ========== Application Endpoints ==========

@router.post("/{job_id}/apply", response_model=ApplicationResponse, status_code=status.HTTP_201_CREATED)
async def apply_to_job(
    job_id: str,
    application_data: ApplicationCreate,
    current_user: dict = Depends(require_role(UserRole.CANDIDATE)),
    db: AsyncSession = Depends(get_db)
):
    """Apply to a job (Candidates only)"""
    app_dict = application_data.model_dump()
    app_dict["job_id"] = uuid.UUID(job_id)

    application = await application_service.create_application(
        db=db, candidate_id=uuid.UUID(current_user["user_id"]), application_data=app_dict
    )

    return ApplicationResponse(
        id=str(application.id), job_id=str(application.job_id), candidate_id=str(application.candidate_id),
        cover_letter=application.cover_letter, vault_share_token=application.vault_share_token,
        custom_answers=application.custom_answers, status=application.status,
        match_score=application.match_score, match_explanation=application.match_explanation,
        employer_notes=application.employer_notes, created_at=application.created_at,
        updated_at=application.updated_at
    )


@router.get("/{job_id}/applications", response_model=ApplicationListResponse)
async def get_job_applications(
    job_id: str,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    current_user: dict = Depends(require_role(UserRole.EMPLOYER)),
    db: AsyncSession = Depends(get_db)
):
    """Get all applications for a job (Employer only, must own the job)"""
    applications, total = await application_service.get_job_applications(
        db=db, job_id=uuid.UUID(job_id), employer_id=uuid.UUID(current_user["user_id"]),
        page=page, page_size=page_size
    )

    return ApplicationListResponse(
        applications=[
            ApplicationResponse(
                id=str(app.id), job_id=str(app.job_id), candidate_id=str(app.candidate_id),
                cover_letter=app.cover_letter, vault_share_token=app.vault_share_token,
                custom_answers=app.custom_answers, status=app.status,
                match_score=app.match_score, match_explanation=app.match_explanation,
                employer_notes=app.employer_notes, created_at=app.created_at, updated_at=app.updated_at
            )
            for app in applications
        ],
        total=total, page=page, page_size=page_size
    )
