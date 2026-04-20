"""
Job-related Pydantic schemas
"""

from pydantic import BaseModel, Field, ConfigDict, model_validator
from typing import Optional, List, Dict
from datetime import datetime
from app.models.jobs import JobType, JobStatus, ApplicationStatus

# ========== Job Posting ==========


class JobCreate(BaseModel):
    """Create job posting"""

    title: str = Field(..., min_length=3, max_length=255)
    company: str = Field(..., min_length=2, max_length=255)
    description: str = Field(..., min_length=10)
    requirements: str = Field(..., min_length=10)

    job_type: JobType
    location: Optional[str] = Field(None, max_length=255)
    remote_ok: bool = False

    salary_min: Optional[int] = None
    salary_max: Optional[int] = None
    salary_currency: str = Field(default="INR", max_length=3)

    skills_required: List[str] = Field(default_factory=list)
    experience_required: Optional[str] = None

    # Tryout configuration
    has_tryout: bool = False
    tryout_config: Optional[Dict] = None

    # External application redirect (optional)
    external_apply_url: Optional[str] = Field(None, max_length=2048)

    # Outcome-based terms (optional)
    outcome_terms: Optional[Dict] = None

    # Custom questions for application
    custom_questions: Optional[Dict] = None

    @model_validator(mode="after")
    def _validate_salary_range(self) -> "JobCreate":
        """Ensure salary_min <= salary_max when both are provided."""
        if self.salary_min is not None and self.salary_max is not None:
            if self.salary_min > self.salary_max:
                raise ValueError(
                    f"Minimum salary ({self.salary_min}) cannot be greater than "
                    f"maximum salary ({self.salary_max}). Please check your salary range."
                )
        return self


class JobUpdate(BaseModel):
    """Update job posting"""

    title: Optional[str] = Field(None, min_length=3, max_length=255)
    description: Optional[str] = Field(None, min_length=10)
    requirements: Optional[str] = Field(None, min_length=10)

    job_type: Optional[JobType] = None
    location: Optional[str] = Field(None, max_length=255)
    remote_ok: Optional[bool] = None

    salary_min: Optional[int] = None
    salary_max: Optional[int] = None

    skills_required: Optional[List[str]] = None
    experience_required: Optional[str] = None

    has_tryout: Optional[bool] = None
    tryout_config: Optional[Dict] = None
    outcome_terms: Optional[Dict] = None
    custom_questions: Optional[Dict] = None
    external_apply_url: Optional[str] = Field(None, max_length=2048)

    @model_validator(mode="after")
    def _validate_salary_range(self) -> "JobUpdate":
        """Ensure salary_min <= salary_max when both are provided."""
        if self.salary_min is not None and self.salary_max is not None:
            if self.salary_min > self.salary_max:
                raise ValueError(
                    f"Minimum salary ({self.salary_min}) cannot be greater than "
                    f"maximum salary ({self.salary_max}). Please check your salary range."
                )
        return self

    status: Optional[JobStatus] = None


class JobResponse(BaseModel):
    """Job response"""

    id: str
    employer_id: str

    title: str
    company: str
    description: str
    requirements: str

    job_type: JobType
    location: Optional[str]
    remote_ok: bool

    salary_min: Optional[int]
    salary_max: Optional[int]
    salary_currency: str

    skills_required: List[str]
    experience_required: Optional[str]

    has_tryout: bool
    tryout_config: Optional[Dict]
    outcome_terms: Optional[Dict]
    custom_questions: Optional[Dict]
    external_apply_url: Optional[str] = None

    status: JobStatus
    views_count: int
    applications_count: int

    created_at: datetime
    updated_at: Optional[datetime]
    published_at: Optional[datetime]
    expires_at: Optional[datetime]

    # AI Matching fields — only present in personalized /feed responses
    match_score: Optional[int] = None  # 0-100 score for this candidate ↔ job pair
    match_hint: Optional[str] = None  # e.g. "8/10 skills matched · Remote OK"

    model_config = ConfigDict(from_attributes=True)


class JobListResponse(BaseModel):
    """Paginated job list"""

    jobs: List[JobResponse]
    total: int
    page: int
    page_size: int


# ========== Job Application ==========


class ApplicationCreate(BaseModel):
    """Create job application"""

    job_id: Optional[str] = None  # overridden from path parameter
    cover_letter: Optional[str] = Field(None, max_length=2000)
    vault_share_token: Optional[str] = None  # Share talent vault items
    custom_answers: Optional[Dict] = None  # Answers to custom questions


class ApplicationUpdate(BaseModel):
    """Update application (candidate side)"""

    cover_letter: Optional[str] = Field(None, max_length=2000)
    custom_answers: Optional[Dict] = None


class ApplicationResponse(BaseModel):
    """Application response"""

    id: str
    job_id: str
    candidate_id: str

    cover_letter: Optional[str]
    vault_share_token: Optional[str]
    custom_answers: Optional[Dict]

    status: ApplicationStatus
    match_score: Optional[int]
    match_explanation: Optional[Dict]

    employer_notes: Optional[str]

    # Enriched fields (joined from Job table for candidate dashboard)
    job_title: Optional[str] = None
    company_name: Optional[str] = None

    created_at: datetime
    updated_at: Optional[datetime]

    model_config = ConfigDict(from_attributes=True)


class ApplicationDetailResponse(BaseModel):
    """Full application detail for employer view (includes candidate info)"""

    id: str
    job_id: str
    candidate_id: str

    cover_letter: Optional[str]
    vault_share_token: Optional[str]
    custom_answers: Optional[Dict]

    status: ApplicationStatus
    match_score: Optional[int]
    match_explanation: Optional[Dict]
    employer_notes: Optional[str]

    # Enriched fields
    candidate_name: Optional[str] = None
    candidate_email: Optional[str] = None
    job_title: Optional[str] = None

    created_at: datetime
    updated_at: Optional[datetime]

    model_config = ConfigDict(from_attributes=True)


class ApplicationListResponse(BaseModel):
    """Paginated application list"""

    applications: List[ApplicationResponse]
    total: int
    page: int
    page_size: int


class ApplicationStatusUpdate(BaseModel):
    """Update application status (employer side)"""

    status: ApplicationStatus
    employer_notes: Optional[str] = None


# ========== Job Search ==========


class JobSearchFilters(BaseModel):
    """Job search filters"""

    query: Optional[str] = None  # Full-text search
    job_type: Optional[JobType] = None
    remote_ok: Optional[bool] = None
    location: Optional[str] = None
    skills: Optional[List[str]] = None
    salary_min: Optional[int] = None
    has_tryout: Optional[bool] = None

    page: int = Field(default=1, ge=1)
    page_size: int = Field(default=20, ge=1, le=100)

    sort_by: str = Field(default="created_at", pattern="^(created_at|salary|title)$")
    sort_order: str = Field(default="desc", pattern="^(asc|desc)$")
