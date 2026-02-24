"""
Tryout and submission API endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional
import uuid

from app.core.database import get_db
from app.core.security import get_current_user, require_role
from app.models.users import UserRole
from app.schemas.tryouts import (
    TryoutCreate,
    TryoutUpdate,
    TryoutResponse,
    TryoutListResponse,
    SubmissionCreate,
    SubmissionResponse,
    SubmissionListResponse,
    SubmissionReview,
    SubmissionGradeResponse
)
from app.services.tryouts import tryout_service, submission_service


router = APIRouter()


# ========== Tryout Endpoints ==========

@router.post("/", response_model=TryoutResponse, status_code=status.HTTP_201_CREATED)
async def create_tryout(
    tryout_data: TryoutCreate,
    current_user: dict = Depends(require_role(UserRole.EMPLOYER)),
    db: AsyncSession = Depends(get_db)
):
    """
    Create a new tryout for a job (Employers only)
    
    Tryout will be created in DRAFT status. Use /tryouts/{id}/activate to make it active.
    """
    tryout = await tryout_service.create_tryout(
        db=db,
        employer_id=uuid.UUID(current_user["user_id"]),
        tryout_data=tryout_data.model_dump()
    )
    
    return TryoutResponse(
        id=str(tryout.id),
        job_id=str(tryout.job_id),
        title=tryout.title,
        description=tryout.description,
        requirements=tryout.requirements,
        test_cases=tryout.test_cases,
        expected_deliverables=tryout.expected_deliverables or [],
        estimated_duration_hours=tryout.estimated_duration_hours,
        payment_amount=tryout.payment_amount,
        payment_currency=tryout.payment_currency,
        scoring_rubric=tryout.scoring_rubric,
        passing_score=tryout.passing_score,
        auto_grade_enabled=tryout.auto_grade_enabled,
        max_submissions=tryout.max_submissions,
        submission_format=tryout.submission_format,
        status=tryout.status,
        submissions_count=tryout.submissions_count,
        created_at=tryout.created_at,
        updated_at=tryout.updated_at
    )


@router.get("/job/{job_id}", response_model=TryoutResponse)
async def get_tryout_by_job(
    job_id: str,
    db: AsyncSession = Depends(get_db)
):
    """Get tryout for a specific job"""
    tryout = await tryout_service.get_tryout_by_job(db, uuid.UUID(job_id))
    
    if not tryout:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tryout not found for this job"
        )
    
    return TryoutResponse(
        id=str(tryout.id),
        job_id=str(tryout.job_id),
        title=tryout.title,
        description=tryout.description,
        requirements=tryout.requirements,
        test_cases=tryout.test_cases,
        expected_deliverables=tryout.expected_deliverables or [],
        estimated_duration_hours=tryout.estimated_duration_hours,
        payment_amount=tryout.payment_amount,
        payment_currency=tryout.payment_currency,
        scoring_rubric=tryout.scoring_rubric,
        passing_score=tryout.passing_score,
        auto_grade_enabled=tryout.auto_grade_enabled,
        max_submissions=tryout.max_submissions,
        submission_format=tryout.submission_format,
        status=tryout.status,
        submissions_count=tryout.submissions_count,
        created_at=tryout.created_at,
        updated_at=tryout.updated_at
    )


@router.get("/{tryout_id}", response_model=TryoutResponse)
async def get_tryout(
    tryout_id: str,
    db: AsyncSession = Depends(get_db)
):
    """Get tryout details by ID"""
    tryout = await tryout_service.get_tryout(db, uuid.UUID(tryout_id))
    
    if not tryout:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tryout not found"
        )
    
    return TryoutResponse(
        id=str(tryout.id),
        job_id=str(tryout.job_id),
        title=tryout.title,
        description=tryout.description,
        requirements=tryout.requirements,
        test_cases=tryout.test_cases,
        expected_deliverables=tryout.expected_deliverables or [],
        estimated_duration_hours=tryout.estimated_duration_hours,
        payment_amount=tryout.payment_amount,
        payment_currency=tryout.payment_currency,
        scoring_rubric=tryout.scoring_rubric,
        passing_score=tryout.passing_score,
        auto_grade_enabled=tryout.auto_grade_enabled,
        max_submissions=tryout.max_submissions,
        submission_format=tryout.submission_format,
        status=tryout.status,
        submissions_count=tryout.submissions_count,
        created_at=tryout.created_at,
        updated_at=tryout.updated_at
    )


@router.put("/{tryout_id}", response_model=TryoutResponse)
async def update_tryout(
    tryout_id: str,
    tryout_data: TryoutUpdate,
    current_user: dict = Depends(require_role(UserRole.EMPLOYER)),
    db: AsyncSession = Depends(get_db)
):
    """Update tryout (Employer only, must own the job)"""
    tryout = await tryout_service.update_tryout(
        db=db,
        tryout_id=uuid.UUID(tryout_id),
        employer_id=uuid.UUID(current_user["user_id"]),
        update_data=tryout_data.model_dump(exclude_unset=True)
    )
    
    return TryoutResponse(
        id=str(tryout.id),
        job_id=str(tryout.job_id),
        title=tryout.title,
        description=tryout.description,
        requirements=tryout.requirements,
        test_cases=tryout.test_cases,
        expected_deliverables=tryout.expected_deliverables or [],
        estimated_duration_hours=tryout.estimated_duration_hours,
        payment_amount=tryout.payment_amount,
        payment_currency=tryout.payment_currency,
        scoring_rubric=tryout.scoring_rubric,
        passing_score=tryout.passing_score,
        auto_grade_enabled=tryout.auto_grade_enabled,
        max_submissions=tryout.max_submissions,
        submission_format=tryout.submission_format,
        status=tryout.status,
        submissions_count=tryout.submissions_count,
        created_at=tryout.created_at,
        updated_at=tryout.updated_at
    )


@router.post("/{tryout_id}/activate", response_model=TryoutResponse)
async def activate_tryout(
    tryout_id: str,
    current_user: dict = Depends(require_role(UserRole.EMPLOYER)),
    db: AsyncSession = Depends(get_db)
):
    """Activate a draft tryout (make it available for submissions)"""
    tryout = await tryout_service.activate_tryout(
        db=db,
        tryout_id=uuid.UUID(tryout_id),
        employer_id=uuid.UUID(current_user["user_id"])
    )
    
    return TryoutResponse(
        id=str(tryout.id),
        job_id=str(tryout.job_id),
        title=tryout.title,
        description=tryout.description,
        requirements=tryout.requirements,
        test_cases=tryout.test_cases,
        expected_deliverables=tryout.expected_deliverables or [],
        estimated_duration_hours=tryout.estimated_duration_hours,
        payment_amount=tryout.payment_amount,
        payment_currency=tryout.payment_currency,
        scoring_rubric=tryout.scoring_rubric,
        passing_score=tryout.passing_score,
        auto_grade_enabled=tryout.auto_grade_enabled,
        max_submissions=tryout.max_submissions,
        submission_format=tryout.submission_format,
        status=tryout.status,
        submissions_count=tryout.submissions_count,
        created_at=tryout.created_at,
        updated_at=tryout.updated_at
    )


# ========== Submission Endpoints ==========

@router.post("/{tryout_id}/submit", response_model=SubmissionResponse, status_code=status.HTTP_201_CREATED)
async def submit_tryout(
    tryout_id: str,
    submission_data: SubmissionCreate,
    current_user: dict = Depends(require_role(UserRole.CANDIDATE)),
    db: AsyncSession = Depends(get_db)
):
    """Submit a tryout solution (Candidates only)"""
    # Override tryout_id from path
    sub_dict = submission_data.model_dump()
    sub_dict["tryout_id"] = uuid.UUID(tryout_id)
    
    submission = await submission_service.create_submission(
        db=db,
        candidate_id=uuid.UUID(current_user["user_id"]),
        submission_data=sub_dict
    )
    
    return SubmissionResponse(
        id=str(submission.id),
        tryout_id=str(submission.tryout_id),
        candidate_id=str(submission.candidate_id),
        submission_url=submission.submission_url,
        submission_data=submission.submission_data,
        notes=submission.notes,
        status=submission.status,
        auto_score=submission.auto_score,
        manual_score=submission.manual_score,
        final_score=submission.final_score,
        score_breakdown=submission.score_breakdown,
        feedback=submission.feedback,
        reviewed_by=submission.reviewed_by,
        reviewed_at=submission.reviewed_at,
        payment_status=submission.payment_status,
        payment_escrowed_at=submission.payment_escrowed_at,
        payment_released_at=submission.payment_released_at,
        created_at=submission.created_at,
        updated_at=submission.updated_at
    )


@router.get("/{tryout_id}/submissions", response_model=SubmissionListResponse)
async def get_tryout_submissions(
    tryout_id: str,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    current_user: dict = Depends(require_role(UserRole.EMPLOYER)),
    db: AsyncSession = Depends(get_db)
):
    """Get all submissions for a tryout (Employer only, must own the job)"""
    submissions, total = await submission_service.get_tryout_submissions(
        db=db,
        tryout_id=uuid.UUID(tryout_id),
        employer_id=uuid.UUID(current_user["user_id"]),
        page=page,
        page_size=page_size
    )
    
    return SubmissionListResponse(
        submissions=[
            SubmissionResponse(
                id=str(sub.id),
                tryout_id=str(sub.tryout_id),
                candidate_id=str(sub.candidate_id),
                submission_url=sub.submission_url,
                submission_data=sub.submission_data,
                notes=sub.notes,
                status=sub.status,
                auto_score=sub.auto_score,
                manual_score=sub.manual_score,
                final_score=sub.final_score,
                score_breakdown=sub.score_breakdown,
                feedback=sub.feedback,
                reviewed_by=sub.reviewed_by,
                reviewed_at=sub.reviewed_at,
                payment_status=sub.payment_status,
                payment_escrowed_at=sub.payment_escrowed_at,
                payment_released_at=sub.payment_released_at,
                created_at=sub.created_at,
                updated_at=sub.updated_at
            )
            for sub in submissions
        ],
        total=total,
        page=page,
        page_size=page_size
    )


@router.get("/submissions/my-submissions", response_model=SubmissionListResponse)
async def get_my_submissions(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    current_user: dict = Depends(require_role(UserRole.CANDIDATE)),
    db: AsyncSession = Depends(get_db)
):
    """Get all submissions for current candidate"""
    submissions, total = await submission_service.get_candidate_submissions(
        db=db,
        candidate_id=uuid.UUID(current_user["user_id"]),
        page=page,
        page_size=page_size
    )
    
    return SubmissionListResponse(
        submissions=[
            SubmissionResponse(
                id=str(sub.id),
                tryout_id=str(sub.tryout_id),
                candidate_id=str(sub.candidate_id),
                submission_url=sub.submission_url,
                submission_data=sub.submission_data,
                notes=sub.notes,
                status=sub.status,
                auto_score=sub.auto_score,
                manual_score=sub.manual_score,
                final_score=sub.final_score,
                score_breakdown=sub.score_breakdown,
                feedback=sub.feedback,
                reviewed_by=sub.reviewed_by,
                reviewed_at=sub.reviewed_at,
                payment_status=sub.payment_status,
                payment_escrowed_at=sub.payment_escrowed_at,
                payment_released_at=sub.payment_released_at,
                created_at=sub.created_at,
                updated_at=sub.updated_at
            )
            for sub in submissions
        ],
        total=total,
        page=page,
        page_size=page_size
    )


@router.post("/submissions/{submission_id}/review", response_model=SubmissionResponse)
async def review_submission(
    submission_id: str,
    review_data: SubmissionReview,
    current_user: dict = Depends(require_role(UserRole.EMPLOYER)),
    db: AsyncSession = Depends(get_db)
):
    """Review and grade submission (Employer only, must own the job)"""
    submission = await submission_service.review_submission(
        db=db,
        submission_id=uuid.UUID(submission_id),
        employer_id=uuid.UUID(current_user["user_id"]),
        manual_score=review_data.manual_score,
        feedback=review_data.feedback,
        approved=review_data.approved
    )
    
    return SubmissionResponse(
        id=str(submission.id),
        tryout_id=str(submission.tryout_id),
        candidate_id=str(submission.candidate_id),
        submission_url=submission.submission_url,
        submission_data=submission.submission_data,
        notes=submission.notes,
        status=submission.status,
        auto_score=submission.auto_score,
        manual_score=submission.manual_score,
        final_score=submission.final_score,
        score_breakdown=submission.score_breakdown,
        feedback=submission.feedback,
        reviewed_by=submission.reviewed_by,
        reviewed_at=submission.reviewed_at,
        payment_status=submission.payment_status,
        payment_escrowed_at=submission.payment_escrowed_at,
        payment_released_at=submission.payment_released_at,
        created_at=submission.created_at,
        updated_at=submission.updated_at
    )


@router.post("/submissions/{submission_id}/auto-grade", response_model=SubmissionGradeResponse)
async def auto_grade_submission(
    submission_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Trigger auto-grading for a submission"""
    result = await submission_service.auto_grade_submission(
        db=db,
        submission_id=uuid.UUID(submission_id)
    )
    
    return SubmissionGradeResponse(
        auto_score=result["auto_score"],
        score_breakdown=result["score_breakdown"],
        passed=result["passed"]
    )
