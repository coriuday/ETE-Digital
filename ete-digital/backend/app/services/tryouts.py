"""
Tryout and submission service
Business logic for trial tasks and candidate submissions
"""

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_
from datetime import datetime, timezone
from typing import Optional, List, Tuple, Dict
import uuid

from app.models.tryouts import (
    Tryout,
    TryoutSubmission,
    TryoutStatus,
    SubmissionStatus,
    PaymentStatus,
)
from app.models.jobs import Job
from fastapi import HTTPException, status


class TryoutService:
    """Tryout service"""

    async def create_tryout(self, db: AsyncSession, employer_id: uuid.UUID, tryout_data: dict) -> Tryout:
        """Create a new tryout for a job"""
        job_id = tryout_data.get("job_id")
        if isinstance(job_id, str):
            try:
                job_id = uuid.UUID(job_id)
            except ValueError:
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                    detail=f"Invalid job_id: '{job_id}' is not a valid UUID",
                )
            tryout_data["job_id"] = job_id

        # Verify job exists and employer owns it
        job_result = await db.execute(select(Job).where(Job.id == job_id))
        job = job_result.scalar_one_or_none()

        if not job:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found")

        if job.employer_id != employer_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to create tryout for this job",
            )

        # Create tryout
        tryout = Tryout(**tryout_data)
        db.add(tryout)

        # Update job to mark it has tryout
        job.has_tryout = True

        await db.commit()
        await db.refresh(tryout)
        return tryout

    async def get_tryout(self, db: AsyncSession, tryout_id: uuid.UUID) -> Optional[Tryout]:
        """Get tryout by ID"""
        result = await db.execute(select(Tryout).where(Tryout.id == tryout_id))
        return result.scalar_one_or_none()

    async def get_tryout_by_job(self, db: AsyncSession, job_id: uuid.UUID) -> Optional[Tryout]:
        """Get tryout for a job"""
        result = await db.execute(select(Tryout).where(Tryout.job_id == job_id))
        return result.scalar_one_or_none()

    async def update_tryout(
        self,
        db: AsyncSession,
        tryout_id: uuid.UUID,
        employer_id: uuid.UUID,
        update_data: dict,
    ) -> Tryout:
        """Update tryout"""
        tryout = await self.get_tryout(db, tryout_id)

        if not tryout:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tryout not found")

        # Verify employer owns the job
        job_result = await db.execute(select(Job).where(Job.id == tryout.job_id))
        job = job_result.scalar_one_or_none()

        if not job or job.employer_id != employer_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to update this tryout",
            )

        for field, value in update_data.items():
            if value is not None:
                setattr(tryout, field, value)

        await db.commit()
        await db.refresh(tryout)
        return tryout

    async def activate_tryout(self, db: AsyncSession, tryout_id: uuid.UUID, employer_id: uuid.UUID) -> Tryout:
        """Activate a draft tryout"""
        tryout = await self.get_tryout(db, tryout_id)

        if not tryout:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tryout not found")

        # Verify employer owns the job
        job_result = await db.execute(select(Job).where(Job.id == tryout.job_id))
        job = job_result.scalar_one_or_none()

        if not job or job.employer_id != employer_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to activate this tryout",
            )

        if tryout.status != TryoutStatus.DRAFT:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Only draft tryouts can be activated",
            )

        tryout.status = TryoutStatus.ACTIVE
        await db.commit()
        await db.refresh(tryout)
        return tryout


class SubmissionService:
    """Tryout submission service"""

    async def create_submission(self, db: AsyncSession, candidate_id: uuid.UUID, submission_data: dict) -> TryoutSubmission:
        """Create a tryout submission"""
        tryout_id = submission_data.get("tryout_id")
        if isinstance(tryout_id, str):
            try:
                tryout_id = uuid.UUID(tryout_id)
            except ValueError:
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                    detail=f"Invalid tryout_id: '{tryout_id}' is not a valid UUID",
                )
            submission_data["tryout_id"] = tryout_id

        # Get tryout
        tryout_result = await db.execute(select(Tryout).where(Tryout.id == tryout_id))
        tryout = tryout_result.scalar_one_or_none()

        if not tryout:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tryout not found")

        if tryout.status != TryoutStatus.ACTIVE:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Tryout is not accepting submissions",
            )

        # Check submission count
        count_result = await db.execute(
            select(func.count()).where(
                and_(
                    TryoutSubmission.tryout_id == tryout_id,
                    TryoutSubmission.candidate_id == candidate_id,
                )
            )
        )
        submission_count = count_result.scalar()

        if submission_count >= tryout.max_submissions:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Maximum {tryout.max_submissions} submissions allowed",
            )

        # Create submission
        submission = TryoutSubmission(
            candidate_id=candidate_id,
            **submission_data,
            status=SubmissionStatus.SUBMITTED,
            payment_status=PaymentStatus.PENDING,
        )
        db.add(submission)

        # Increment submission count
        tryout.submissions_count += 1

        # Escrow payment if applicable
        if tryout.payment_amount > 0:
            submission.payment_status = PaymentStatus.ESCROWED
            submission.payment_escrowed_at = datetime.now(timezone.utc)

        await db.commit()
        await db.refresh(submission)

        # Auto-grade if enabled
        if tryout.auto_grade_enabled:
            await self.auto_grade_submission(db, submission.id)

        return submission

    async def get_submission(self, db: AsyncSession, submission_id: uuid.UUID) -> Optional[TryoutSubmission]:
        """Get submission by ID"""
        result = await db.execute(select(TryoutSubmission).where(TryoutSubmission.id == submission_id))
        return result.scalar_one_or_none()

    async def auto_grade_submission(self, db: AsyncSession, submission_id: uuid.UUID) -> Dict:
        """
        Auto-grade submission based on test cases

        This is a placeholder for the actual auto-grading logic.
        In production, this would:
        1. Run test cases against submitted code
        2. Check deliverables against requirements
        3. Calculate score based on rubric
        """
        submission = await self.get_submission(db, submission_id)

        if not submission:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Submission not found")

        # Get tryout
        tryout_result = await db.execute(select(Tryout).where(Tryout.id == submission.tryout_id))
        tryout = tryout_result.scalar_one_or_none()

        # Rubric-based scoring: each key in scoring_rubric is a criterion with max points.
        # We estimate a score per criterion by checking keyword overlap between
        # the submission text and the tryout requirements/description.
        rubric: dict = tryout.scoring_rubric or {}
        total_rubric_points = sum(rubric.values()) if rubric else 0

        # Build a vocabulary of keywords from tryout requirements and description
        import re

        def _tokenise(text: str) -> set:
            """Lower-case word tokens from text, 3+ chars only."""
            return {w for w in re.findall(r"[a-zA-Z]{3,}", (text or "").lower())}

        requirement_tokens = _tokenise((tryout.requirements or "") + " " + (tryout.description or ""))

        # Submission evidence: notes + submission_url text
        submission_text = (
            (submission.notes or "")
            + " "
            + (
                getattr(submission, "submission_url", None) or ""
                if hasattr(submission, "submission_url")
                else getattr(submission, "github_url", None) or ""
            )
        )
        submission_tokens = _tokenise(submission_text)

        # If no rubric defined, fall back to keyword-hit ratio × 100
        if not rubric or total_rubric_points == 0:
            if requirement_tokens:
                hit_ratio = len(submission_tokens & requirement_tokens) / max(len(requirement_tokens), 1)
                auto_score = min(100, int(50 + hit_ratio * 50))  # baseline 50, up to 100
            else:
                auto_score = 70  # neutral default when tryout has no requirements text
            score_breakdown = {"overall": auto_score}
        else:
            score_breakdown = {}
            weighted_sum = 0.0
            for criterion, max_pts in rubric.items():
                # Criterion-specific keyword: use the criterion name itself as keyword
                crit_tokens = _tokenise(criterion)
                crit_hit = bool(crit_tokens & submission_tokens)
                # Base per-criterion estimate from overall keyword overlap
                hit_ratio = len(submission_tokens & requirement_tokens) / max(len(requirement_tokens), 1)
                # Boost slightly if criterion keyword appears in submission
                criterion_ratio = min(1.0, hit_ratio + (0.15 if crit_hit else 0.0))
                earned = round(max_pts * criterion_ratio)
                score_breakdown[criterion] = {"max": max_pts, "earned": earned}
                weighted_sum += (earned / max_pts) * max_pts

            auto_score = min(100, int(weighted_sum / total_rubric_points * 100))

        submission.auto_score = auto_score
        submission.score_breakdown = score_breakdown
        submission.status = SubmissionStatus.AUTO_GRADED

        # Set final score if no manual review needed
        if auto_score >= tryout.passing_score:
            submission.final_score = auto_score
            submission.status = SubmissionStatus.PASSED

        await db.commit()
        await db.refresh(submission)

        return {
            "auto_score": auto_score,
            "score_breakdown": score_breakdown,
            "passed": auto_score >= tryout.passing_score,
        }

    async def review_submission(
        self,
        db: AsyncSession,
        submission_id: uuid.UUID,
        employer_id: uuid.UUID,
        manual_score: int,
        feedback: Optional[str],
        approved: bool,
    ) -> TryoutSubmission:
        """Review and grade submission (employer)"""
        submission = await self.get_submission(db, submission_id)

        if not submission:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Submission not found")

        # Verify employer owns the tryout
        tryout_result = await db.execute(select(Tryout).where(Tryout.id == submission.tryout_id))
        tryout = tryout_result.scalar_one_or_none()

        job_result = await db.execute(select(Job).where(Job.id == tryout.job_id))
        job = job_result.scalar_one_or_none()

        if not job or job.employer_id != employer_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to review this submission",
            )

        # Update submission
        submission.manual_score = manual_score
        submission.feedback = feedback
        submission.reviewed_by = str(employer_id)
        submission.reviewed_at = datetime.now(timezone.utc)

        # Calculate final score (weighted average if auto-score exists)
        if submission.auto_score:
            submission.final_score = int((submission.auto_score + manual_score) / 2)
        else:
            submission.final_score = manual_score

        # Update status
        if approved and submission.final_score >= tryout.passing_score:
            submission.status = SubmissionStatus.PASSED

            # Release payment if applicable
            if tryout.payment_amount > 0 and submission.payment_status == PaymentStatus.ESCROWED:
                submission.payment_status = PaymentStatus.RELEASED
                submission.payment_released_at = datetime.now(timezone.utc)
        else:
            submission.status = SubmissionStatus.FAILED

            # Refund payment if applicable
            if tryout.payment_amount > 0 and submission.payment_status == PaymentStatus.ESCROWED:
                submission.payment_status = PaymentStatus.REFUNDED

        await db.commit()
        await db.refresh(submission)
        return submission

    async def get_candidate_submissions(
        self,
        db: AsyncSession,
        candidate_id: uuid.UUID,
        page: int = 1,
        page_size: int = 20,
    ) -> Tuple[List[TryoutSubmission], int]:
        """Get all submissions for a candidate"""
        query = select(TryoutSubmission).where(TryoutSubmission.candidate_id == candidate_id)

        # Get total count
        count_query = select(func.count()).where(TryoutSubmission.candidate_id == candidate_id)
        total_result = await db.execute(count_query)
        total = total_result.scalar()

        # Apply pagination
        offset = (page - 1) * page_size
        query = query.order_by(TryoutSubmission.created_at.desc()).offset(offset).limit(page_size)

        # Execute query
        result = await db.execute(query)
        submissions = result.scalars().all()

        return submissions, total

    async def get_tryout_submissions(
        self,
        db: AsyncSession,
        tryout_id: uuid.UUID,
        employer_id: uuid.UUID,
        page: int = 1,
        page_size: int = 20,
    ) -> Tuple[List[TryoutSubmission], int]:
        """Get all submissions for a tryout (employer view)"""
        # Verify employer owns the tryout
        tryout_result = await db.execute(select(Tryout).where(Tryout.id == tryout_id))
        tryout = tryout_result.scalar_one_or_none()

        job_result = await db.execute(select(Job).where(Job.id == tryout.job_id))
        job = job_result.scalar_one_or_none()

        if not job or job.employer_id != employer_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to view these submissions",
            )

        query = select(TryoutSubmission).where(TryoutSubmission.tryout_id == tryout_id)

        # Get total count
        count_query = select(func.count()).where(TryoutSubmission.tryout_id == tryout_id)
        total_result = await db.execute(count_query)
        total = total_result.scalar()

        # Apply pagination
        offset = (page - 1) * page_size
        query = query.order_by(TryoutSubmission.created_at.desc()).offset(offset).limit(page_size)

        # Execute query
        result = await db.execute(query)
        submissions = result.scalars().all()

        return submissions, total


# Singleton instances
tryout_service = TryoutService()
submission_service = SubmissionService()
