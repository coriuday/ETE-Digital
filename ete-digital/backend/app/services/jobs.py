"""
Job posting and application service
Business logic for job CRUD, search, and application management
"""
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_, and_
from datetime import datetime
from typing import Optional, List, Tuple
import uuid

from app.models.jobs import Job, Application, JobStatus, ApplicationStatus
from app.models.users import User, UserRole
from fastapi import HTTPException, status


class JobService:
    """Job posting service"""
    
    async def create_job(
        self,
        db: AsyncSession,
        employer_id: uuid.UUID,
        job_data: dict
    ) -> Job:
        """Create a new job posting"""
        job = Job(
            employer_id=employer_id,
            status=JobStatus.ACTIVE,
            published_at=datetime.utcnow(),
            **job_data
        )
        db.add(job)
        await db.commit()
        await db.refresh(job)
        return job
    
    async def get_job(
        self,
        db: AsyncSession,
        job_id: uuid.UUID
    ) -> Optional[Job]:
        """Get job by ID"""
        result = await db.execute(
            select(Job).where(Job.id == job_id)
        )
        return result.scalar_one_or_none()
    
    async def update_job(
        self,
        db: AsyncSession,
        job_id: uuid.UUID,
        employer_id: uuid.UUID,
        update_data: dict
    ) -> Job:
        """Update job posting"""
        job = await self.get_job(db, job_id)
        
        if not job:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Job not found"
            )
        
        if job.employer_id != employer_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to update this job"
            )
        
        for field, value in update_data.items():
            if value is not None:
                setattr(job, field, value)
        
        await db.commit()
        await db.refresh(job)
        return job
    
    async def delete_job(
        self,
        db: AsyncSession,
        job_id: uuid.UUID,
        employer_id: uuid.UUID
    ) -> bool:
        """Delete job posting (soft delete by marking as closed)"""
        job = await self.get_job(db, job_id)
        
        if not job:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Job not found"
            )
        
        if job.employer_id != employer_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to delete this job"
            )
        
        job.status = JobStatus.CLOSED
        await db.commit()
        return True
    
    async def publish_job(
        self,
        db: AsyncSession,
        job_id: uuid.UUID,
        employer_id: uuid.UUID
    ) -> Job:
        """Publish a draft job"""
        job = await self.get_job(db, job_id)
        
        if not job:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Job not found"
            )
        
        if job.employer_id != employer_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to publish this job"
            )
        
        if job.status != JobStatus.DRAFT:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Only draft jobs can be published"
            )
        
        job.status = JobStatus.ACTIVE
        job.published_at = datetime.utcnow()
        await db.commit()
        await db.refresh(job)
        return job
    
    async def search_jobs(
        self,
        db: AsyncSession,
        filters: dict,
        page: int = 1,
        page_size: int = 20
    ) -> Tuple[List[Job], int]:
        """Search jobs with filters"""
        query = select(Job).where(Job.status == JobStatus.ACTIVE)
        
        # Apply filters
        if filters.get("query"):
            search_term = f"%{filters['query']}%"
            query = query.where(
                or_(
                    Job.title.ilike(search_term),
                    Job.description.ilike(search_term),
                    Job.company.ilike(search_term)
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
        page_size: int = 20
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
    
    async def increment_view_count(
        self,
        db: AsyncSession,
        job_id: uuid.UUID
    ) -> None:
        """Increment job view count"""
        job = await self.get_job(db, job_id)
        if job:
            job.views_count += 1
            await db.commit()


class ApplicationService:
    """Job application service"""
    
    async def create_application(
        self,
        db: AsyncSession,
        candidate_id: uuid.UUID,
        application_data: dict
    ) -> Application:
        """Create a job application"""
        job_id = application_data.get("job_id")
        
        # Check if job exists and is active
        job_result = await db.execute(
            select(Job).where(Job.id == job_id)
        )
        job = job_result.scalar_one_or_none()
        
        if not job:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Job not found"
            )
        
        if job.status != JobStatus.ACTIVE:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Job is not accepting applications"
            )
        
        # Check if already applied
        existing_result = await db.execute(
            select(Application).where(
                and_(
                    Application.job_id == job_id,
                    Application.candidate_id == candidate_id
                )
            )
        )
        if existing_result.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="You have already applied to this job"
            )
        
        # Create application
        application = Application(
            candidate_id=candidate_id,
            **application_data,
            status=ApplicationStatus.PENDING
        )
        db.add(application)
        
        # Increment application count
        job.applications_count += 1
        
        await db.commit()
        await db.refresh(application)
        return application
    
    async def get_application(
        self,
        db: AsyncSession,
        application_id: uuid.UUID
    ) -> Optional[Application]:
        """Get application by ID"""
        result = await db.execute(
            select(Application).where(Application.id == application_id)
        )
        return result.scalar_one_or_none()
    
    async def update_application_status(
        self,
        db: AsyncSession,
        application_id: uuid.UUID,
        employer_id: uuid.UUID,
        new_status: ApplicationStatus,
        employer_notes: Optional[str] = None
    ) -> Application:
        """Update application status (employer action)"""
        application = await self.get_application(db, application_id)
        
        if not application:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Application not found"
            )
        
        # Verify employer owns the job
        job_result = await db.execute(
            select(Job).where(Job.id == application.job_id)
        )
        job = job_result.scalar_one_or_none()
        
        if not job or job.employer_id != employer_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to update this application"
            )
        
        application.status = new_status
        if employer_notes:
            application.employer_notes = employer_notes
        
        await db.commit()
        await db.refresh(application)
        return application
    
    async def get_candidate_applications(
        self,
        db: AsyncSession,
        candidate_id: uuid.UUID,
        page: int = 1,
        page_size: int = 20
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
        page_size: int = 20
    ) -> Tuple[List[Application], int]:
        """Get all applications for a job (employer view)"""
        # Verify employer owns the job
        job_result = await db.execute(
            select(Job).where(Job.id == job_id)
        )
        job = job_result.scalar_one_or_none()
        
        if not job or job.employer_id != employer_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to view these applications"
            )
        
        query = select(Application).where(Application.job_id == job_id)
        
        # Get total count
        count_query = select(func.count()).where(Application.job_id == job_id)
        total_result = await db.execute(count_query)
        total = total_result.scalar()
        
        # Apply pagination
        offset = (page - 1) * page_size
        query = query.order_by(Application.created_at.desc()).offset(offset).limit(page_size)
        
        # Execute query
        result = await db.execute(query)
        applications = result.scalars().all()
        
        return applications, total


# Singleton instances
job_service = JobService()
application_service = ApplicationService()
