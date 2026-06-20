"""
Job posting and application service
Business logic for job CRUD, search, and application management
"""

import logging

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_, and_, text
from datetime import datetime, timezone, timedelta
from typing import Optional, List, Tuple
import uuid

logger = logging.getLogger(__name__)

from app.models.jobs import Job, Application, JobStatus, ApplicationStatus
from app.models.users import UserProfile
from app.models.organization import Organization
from fastapi import HTTPException, status


class JobService:
    """Job posting service"""

    async def create_job(self, db: AsyncSession, employer_id: uuid.UUID, job_data: dict) -> Job:
        """Create a new job posting"""
        from app.models.organization import Organization  # noqa: PLC0415
        from app.services.organization_service import max_active_jobs_for_tier  # noqa: PLC0415

        org_result = await db.execute(select(Organization).where(Organization.owner_id == employer_id))
        org = org_result.scalar_one_or_none()
        if org:
            limit = max_active_jobs_for_tier(org.trust_tier, org.is_verified)
            if limit is not None:
                count_result = await db.execute(
                    select(func.count()).select_from(Job).where(Job.employer_id == employer_id, Job.status == JobStatus.ACTIVE)
                )
                active_count = count_result.scalar_one()
                if active_count >= limit:
                    raise HTTPException(
                        status_code=status.HTTP_403_FORBIDDEN,
                        detail=(
                            f"Your organisation tier allows up to {limit} active job(s). "
                            "Complete verification or upgrade to post more."
                        ),
                    )

        job = Job(
            employer_id=employer_id,
            status=JobStatus.ACTIVE,
            published_at=datetime.now(timezone.utc),
            **job_data,
        )
        db.add(job)
        await db.commit()
        await db.refresh(job)
        return job

    async def get_job(self, db: AsyncSession, job_id: uuid.UUID) -> Optional[Job]:
        """Get job by ID"""
        result = await db.execute(select(Job).where(Job.id == job_id))
        return result.scalar_one_or_none()

    async def update_job(
        self,
        db: AsyncSession,
        job_id: uuid.UUID,
        employer_id: uuid.UUID,
        update_data: dict,
    ) -> Job:
        """Update job posting"""
        job = await self.get_job(db, job_id)

        if not job:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found")

        if job.employer_id != employer_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to update this job",
            )

        for field, value in update_data.items():
            if value is not None:
                setattr(job, field, value)

        await db.commit()
        await db.refresh(job)
        return job

    async def delete_job(self, db: AsyncSession, job_id: uuid.UUID, employer_id: uuid.UUID) -> bool:
        """Delete job posting (soft delete by marking as closed)"""
        job = await self.get_job(db, job_id)

        if not job:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found")

        if job.employer_id != employer_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to delete this job",
            )

        job.status = JobStatus.CLOSED
        await db.commit()
        return True

    async def publish_job(self, db: AsyncSession, job_id: uuid.UUID, employer_id: uuid.UUID) -> Job:
        """Publish a draft job"""
        job = await self.get_job(db, job_id)

        if not job:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found")

        if job.employer_id != employer_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to publish this job",
            )

        if job.status != JobStatus.DRAFT:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Only draft jobs can be published",
            )

        job.status = JobStatus.ACTIVE
        job.published_at = datetime.now(timezone.utc)
        await db.commit()
        await db.refresh(job)
        return job

    async def search_jobs(self, db: AsyncSession, filters: dict, page: int = 1, page_size: int = 20) -> Tuple[List[Job], int]:
        """Search jobs with filters"""
        query = select(Job).where(Job.status == JobStatus.ACTIVE)

        # Full-text search (uses GIN index on fts_vector; falls back to ilike if column missing)
        if filters.get("query"):
            q = filters["query"].strip()
            try:
                # plainto_tsquery handles multi-word phrases and ignores stop-words
                query = query.where(Job.fts_vector.op("@@")(func.plainto_tsquery("english", q)))
            except Exception:
                # Fallback: plain ilike (e.g. during the migration transition window)
                search_term = f"%{q}%"
                query = query.where(
                    or_(
                        Job.title.ilike(search_term),
                        Job.description.ilike(search_term),
                        Job.company.ilike(search_term),
                    )
                )

        if filters.get("job_type"):
            query = query.where(Job.job_type == filters["job_type"])

        if filters.get("remote_ok") is not None:
            query = query.where(Job.remote_ok == filters["remote_ok"])

        if filters.get("location"):
            query = query.where(Job.location.ilike(f"%{filters['location']}%"))

        if filters.get("skills"):
            # Search in skills_required array
            for skill in filters["skills"]:
                query = query.where(Job.skills_required.contains([skill]))

        if filters.get("salary_min"):
            query = query.where(Job.salary_min >= filters["salary_min"])

        if filters.get("has_tryout") is not None:
            query = query.where(Job.has_tryout == filters["has_tryout"])

        # Get total count
        count_query = select(func.count()).select_from(query.subquery())
        total_result = await db.execute(count_query)
        total = total_result.scalar()

        # Apply sorting
        sort_by = filters.get("sort_by", "created_at")
        sort_order = filters.get("sort_order", "desc")

        if sort_order == "desc":
            query = query.order_by(getattr(Job, sort_by).desc())
        else:
            query = query.order_by(getattr(Job, sort_by).asc())

        # Apply pagination
        offset = (page - 1) * page_size
        query = query.offset(offset).limit(page_size)

        # Execute query
        result = await db.execute(query)
        jobs = result.scalars().all()

        return jobs, total

    async def get_employer_jobs(
        self,
        db: AsyncSession,
        employer_id: uuid.UUID,
        page: int = 1,
        page_size: int = 20,
    ) -> Tuple[List[Job], int]:
        """Get all jobs posted by an employer"""
        query = select(Job).where(Job.employer_id == employer_id)

        # Get total count
        count_query = select(func.count()).where(Job.employer_id == employer_id)
        total_result = await db.execute(count_query)
        total = total_result.scalar()

        # Apply pagination
        offset = (page - 1) * page_size
        query = query.order_by(Job.created_at.desc()).offset(offset).limit(page_size)

        # Execute query
        result = await db.execute(query)
        jobs = result.scalars().all()

        return jobs, total

    async def increment_view_count(self, db: AsyncSession, job_id: uuid.UUID) -> None:
        """Increment job view count using a direct SQL UPDATE to avoid session expunge issues."""
        from sqlalchemy import update as sql_update

        await db.execute(sql_update(Job).where(Job.id == job_id).values(views_count=Job.views_count + 1))
        await db.commit()


class ApplicationService:
    """Job application service"""

    async def _get_org_reapply_cooldown(self, db: AsyncSession, employer_id: uuid.UUID) -> int:
        org_result = await db.execute(select(Organization).where(Organization.owner_id == employer_id))
        org = org_result.scalar_one_or_none()
        if org:
            return org.reapply_cooldown_days
        return 60

    def _check_reapply_eligibility(
        self,
        application: Application,
        cooldown_days: int,
    ) -> None:
        if cooldown_days == -1:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You were previously rejected for this role. Reapplication is not allowed.",
            )
        if application.rejected_at is None:
            return
        eligible_at = application.rejected_at + timedelta(days=cooldown_days)
        now = datetime.now(timezone.utc)
        if now < eligible_at:
            days_left = max(1, (eligible_at.date() - now.date()).days)
            if days_left == 0:
                days_left = 1
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"You were previously rejected for this role. You may reapply after {days_left} days.",
            )

    async def create_application(self, db: AsyncSession, candidate_id: uuid.UUID, application_data: dict) -> Application:
        """Create a job application"""
        job_id = application_data.get("job_id")

        # Check if job exists and is active
        job_result = await db.execute(select(Job).where(Job.id == job_id))
        job = job_result.scalar_one_or_none()

        if not job:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found")

        if job.status != JobStatus.ACTIVE:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Job is not accepting applications",
            )

        # Check if already applied
        existing_result = await db.execute(
            select(Application).where(
                and_(
                    Application.job_id == job_id,
                    Application.candidate_id == candidate_id,
                )
            )
        )
        existing = existing_result.scalar_one_or_none()
        if existing:
            if existing.status == ApplicationStatus.HIRED:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="This application is closed — a hire has been recorded.",
                )
            if existing.status == ApplicationStatus.WITHDRAWN:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="This application was withdrawn and cannot be resubmitted.",
                )
            if existing.status == ApplicationStatus.REJECTED:
                cooldown = await self._get_org_reapply_cooldown(db, job.employer_id)
                self._check_reapply_eligibility(existing, cooldown)
                return await self._reapply_after_rejection(
                    db=db,
                    application=existing,
                    job=job,
                    candidate_id=candidate_id,
                    application_data=application_data,
                )
            if existing.status == ApplicationStatus.REOPENED:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Your application is being reviewed by the hiring team.",
                )
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="You have already applied to this job",
            )

        # Compute full match score via the AI matching engine (5-factor rules engine)
        match_score = None
        breakdown_dict = None
        try:
            from app.services.matching import (  # noqa: PLC0415
                compute_match_score,
                job_snapshot_from_orm,
                profile_from_orm,
            )

            profile_result = await db.execute(select(UserProfile).where(UserProfile.user_id == candidate_id))
            profile_orm = profile_result.scalar_one_or_none()
            candidate_profile = profile_from_orm(profile_orm, str(candidate_id))
            job_snap = job_snapshot_from_orm(job)
            breakdown = compute_match_score(candidate_profile, job_snap)
            match_score = breakdown.total
            breakdown_dict = {
                "total": breakdown.total,
                "skill_score": breakdown.skill_score,
                "experience_score": breakdown.experience_score,
                "location_score": breakdown.location_score,
                "salary_score": breakdown.salary_score,
                "freshness_score": breakdown.freshness_score,
                "matched_skills": breakdown.matched_skills,
                "missing_skills": breakdown.missing_skills,
                "hint": breakdown.explanation_hint,
            }
        except Exception as exc:
            logger.warning("Match scoring failed (non-blocking): %s", exc)

        # Create application
        application = Application(
            candidate_id=candidate_id,
            **application_data,
            status=ApplicationStatus.PENDING,
            match_score=match_score,
            match_explanation=breakdown_dict,
        )
        db.add(application)
        await db.flush()

        from app.services.application_pipeline import record_initial_status  # noqa: PLC0415

        await record_initial_status(db, application, candidate_id)

        # Increment application count
        job.applications_count += 1

        await db.commit()
        await db.refresh(application)

        # ── Background: generate Gemini LLM explanation ───────────────────────
        # Non-blocking — fires after the response is already sent to the candidate.
        # Uses the rules-engine breakdown (already computed above) to build the prompt.
        if match_score is not None and breakdown_dict is not None:
            import asyncio  # noqa: PLC0415

            app_id_str = str(application.id)

            async def _run_llm_explanation():
                """Background task: call Gemini, write explanation to DB."""
                try:
                    from app.core.database import AsyncSessionLocal  # noqa: PLC0415
                    from app.services.matching import (  # noqa: PLC0415
                        generate_llm_explanation,
                        CandidateProfile,
                        JobSnapshot,
                        ScoreBreakdown,
                    )
                    from app.models.jobs import Application as AppModel  # noqa: PLC0415

                    # Rebuild lightweight objects from already-computed data
                    cand = CandidateProfile(
                        user_id=str(candidate_id),
                        skills=breakdown_dict.get("matched_skills", []) + breakdown_dict.get("missing_skills", []),
                        experience_years=None,
                    )
                    job_snap = JobSnapshot(
                        job_id=str(job.id),
                        title=job.title,
                        skills_required=job.skills_required or [],
                        experience_required=job.experience_required,
                        location=job.location,
                        remote_ok=job.remote_ok or False,
                    )
                    bd = ScoreBreakdown(
                        total=breakdown_dict.get("total", match_score),
                        skill_score=breakdown_dict.get("skill_score", 0),
                        experience_score=breakdown_dict.get("experience_score", 0),
                        location_score=breakdown_dict.get("location_score", 0),
                        salary_score=breakdown_dict.get("salary_score", 0),
                        freshness_score=breakdown_dict.get("freshness_score", 0),
                        matched_skills=breakdown_dict.get("matched_skills", []),
                        missing_skills=breakdown_dict.get("missing_skills", []),
                        explanation_hint=breakdown_dict.get("hint", ""),
                    )
                    explanation_text = await generate_llm_explanation(cand, job_snap, bd)

                    async with AsyncSessionLocal() as bg_db:
                        result = await bg_db.execute(select(AppModel).where(AppModel.id == uuid.UUID(app_id_str)))
                        app_row = result.scalar_one_or_none()
                        if app_row:
                            existing = app_row.match_explanation or {}
                            existing["llm_explanation"] = explanation_text
                            app_row.match_explanation = existing
                            await bg_db.commit()
                            logger.info("[AI Screening] Explanation written for application %s", app_id_str)
                except Exception as exc:
                    logger.warning("[AI Screening] Background LLM task failed: %s", exc)

            asyncio.create_task(_run_llm_explanation())

        return application

    async def _reapply_after_rejection(
        self,
        db: AsyncSession,
        application: Application,
        job: Job,
        candidate_id: uuid.UUID,
        application_data: dict,
    ) -> Application:
        from app.services.application_pipeline import transition_application_status  # noqa: PLC0415
        from app.services.audit import get_org_id_for_user, log_audit_event  # noqa: PLC0415
        from app.models.notifications import AuditAction  # noqa: PLC0415

        cover_letter = application_data.get("cover_letter")
        if cover_letter is not None:
            application.cover_letter = cover_letter

        await transition_application_status(
            db=db,
            application=application,
            job=job,
            new_status=ApplicationStatus.PENDING,
            changed_by=candidate_id,
            employer_notes="Candidate reapplied",
            special="reapply",
        )

        org_id = await get_org_id_for_user(db, job.employer_id)
        await log_audit_event(
            db=db,
            action=AuditAction.APPLICATION_REAPPLIED,
            user_id=candidate_id,
            org_id=org_id,
            resource_type="application",
            resource_id=application.id,
            details={
                "old_status": ApplicationStatus.REJECTED.value,
                "new_status": ApplicationStatus.PENDING.value,
                "application_id": str(application.id),
                "job_id": str(job.id),
                "reason": "Candidate reapplied",
            },
        )

        await db.commit()
        await db.refresh(application)
        return application

    async def reopen_application(
        self,
        db: AsyncSession,
        application_id: uuid.UUID,
        employer_id: uuid.UUID,
        reason: Optional[str] = None,
    ):
        from app.services.application_pipeline import reopen_application_hr  # noqa: PLC0415

        application = await self.get_application(db, application_id)
        if not application:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Application not found")

        job_result = await db.execute(select(Job).where(Job.id == application.job_id))
        job = job_result.scalar_one_or_none()
        if not job or job.employer_id != employer_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to update this application",
            )

        result = await reopen_application_hr(
            db=db,
            application=application,
            job=job,
            changed_by=employer_id,
            reason=reason,
        )
        await db.flush()
        await db.refresh(application)
        return result

    async def get_application(self, db: AsyncSession, application_id: uuid.UUID) -> Optional[Application]:
        """Get application by ID"""
        result = await db.execute(select(Application).where(Application.id == application_id))
        return result.scalar_one_or_none()

    async def update_application_status(
        self,
        db: AsyncSession,
        application_id: uuid.UUID,
        employer_id: uuid.UUID,
        new_status: ApplicationStatus,
        employer_notes: Optional[str] = None,
    ):
        """Update application status via ATS pipeline (employer action)."""
        from app.services.application_pipeline import transition_application_status  # noqa: PLC0415

        application = await self.get_application(db, application_id)

        if not application:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Application not found")

        job_result = await db.execute(select(Job).where(Job.id == application.job_id))
        job = job_result.scalar_one_or_none()

        if not job or job.employer_id != employer_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to update this application",
            )

        result = await transition_application_status(
            db=db,
            application=application,
            job=job,
            new_status=new_status,
            changed_by=employer_id,
            employer_notes=employer_notes,
        )

        await db.flush()
        await db.refresh(application)
        return result

    async def get_candidate_applications(
        self,
        db: AsyncSession,
        candidate_id: uuid.UUID,
        page: int = 1,
        page_size: int = 20,
    ) -> Tuple[List[Application], int]:
        """Get all applications for a candidate"""
        query = select(Application).where(Application.candidate_id == candidate_id)

        # Get total count
        count_query = select(func.count()).where(Application.candidate_id == candidate_id)
        total_result = await db.execute(count_query)
        total = total_result.scalar()

        # Apply pagination
        offset = (page - 1) * page_size
        query = query.order_by(Application.created_at.desc()).offset(offset).limit(page_size)

        # Execute query
        result = await db.execute(query)
        applications = result.scalars().all()

        return applications, total

    async def get_job_applications(
        self,
        db: AsyncSession,
        job_id: uuid.UUID,
        employer_id: uuid.UUID,
        page: int = 1,
        page_size: int = 20,
    ) -> Tuple[List[Application], int]:
        """Get all applications for a job (employer view)"""
        # Verify employer owns the job
        job_result = await db.execute(select(Job).where(Job.id == job_id))
        job = job_result.scalar_one_or_none()

        if not job or job.employer_id != employer_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to view these applications",
            )

        query = select(Application).where(Application.job_id == job_id)

        # Get total count
        count_query = select(func.count()).where(Application.job_id == job_id)
        total_result = await db.execute(count_query)
        total = total_result.scalar()

        # Apply pagination — sort by match_score DESC by default (AI ranking).
        # Applications without a score fall to the bottom (NULLS LAST).
        # Secondary sort on created_at ensures stable ordering across pages
        # (PostgreSQL gives non-deterministic results for ties/NULLs without it).
        offset = (page - 1) * page_size
        query = (
            query.order_by(
                Application.match_score.desc().nullslast(),
                Application.created_at.desc(),
            )
            .offset(offset)
            .limit(page_size)
        )

        # Execute query
        result = await db.execute(query)
        applications = result.scalars().all()

        return applications, total


# Singleton instances
job_service = JobService()
application_service = ApplicationService()
