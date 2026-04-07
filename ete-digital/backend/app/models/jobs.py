"""
Job and Application Models — aligned with service/schema layer
"""

from sqlalchemy import (
    Column,
    String,
    Boolean,
    DateTime,
    Integer,
    Enum as SQLEnum,
    Text,
)
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.sql import func
import uuid
import enum

from app.core.database import Base


class JobType(str, enum.Enum):
    """Job type enumeration"""

    FULL_TIME = "full_time"
    PART_TIME = "part_time"
    CONTRACT = "contract"
    INTERNSHIP = "internship"


class JobStatus(str, enum.Enum):
    """Job status enumeration"""

    DRAFT = "draft"
    ACTIVE = "active"
    CLOSED = "closed"
    ARCHIVED = "archived"


class Job(Base):
    """Job posting model"""

    __tablename__ = "jobs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    employer_id = Column(UUID(as_uuid=True), nullable=False, index=True)

    # Job details
    title = Column(String(255), nullable=False)
    company = Column(String(255), nullable=False, default="")
    description = Column(Text, nullable=False)
    requirements = Column(Text, nullable=True)

    # Location and type
    location = Column(String(255))
    remote_ok = Column(Boolean, default=False)
    job_type = Column(SQLEnum(JobType), nullable=False)

    # Salary
    salary_min = Column(Integer, nullable=True)
    salary_max = Column(Integer, nullable=True)
    salary_currency = Column(String(3), default="INR")

    # Skills
    skills_required = Column(JSONB, default=list)  # ['Python', 'React']
    experience_required = Column(String(50), nullable=True)

    # Status
    status = Column(
        SQLEnum(JobStatus), default=JobStatus.DRAFT, nullable=False, index=True
    )

    # Tryout configuration
    has_tryout = Column(Boolean, default=False, nullable=False)
    tryout_config = Column(
        JSONB
    )  # {'duration_days': 3, 'payment': 5000, 'rubric': {...}}

    # Outcome-based pricing (optional)
    outcome_terms = Column(JSONB)
    custom_questions = Column(JSONB)

    # Statistics
    views_count = Column(Integer, default=0)
    applications_count = Column(Integer, default=0)

    # Timestamps
    created_at = Column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    published_at = Column(DateTime(timezone=True), nullable=True)
    expires_at = Column(DateTime(timezone=True))

    def __repr__(self):
        return f"<Job {self.title}>"


class ApplicationStatus(str, enum.Enum):
    """Application status enumeration"""

    PENDING = "pending"
    REVIEWED = "reviewed"
    SHORTLISTED = "shortlisted"
    REJECTED = "rejected"
    HIRED = "hired"
    WITHDRAWN = "withdrawn"


class Application(Base):
    """Job application model"""

    __tablename__ = "applications"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    job_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    candidate_id = Column(UUID(as_uuid=True), nullable=False, index=True)

    # Application content
    cover_letter = Column(Text)
    custom_answers = Column(JSONB)  # Answers to employer's custom questions

    # Talent vault access
    vault_share_token = Column(String(500))  # Expiring link to talent vault items

    # Status
    status = Column(
        SQLEnum(ApplicationStatus), default=ApplicationStatus.PENDING, nullable=False
    )

    # Matching score (if applicable)
    match_score = Column(Integer)  # 0-100
    match_explanation = Column(JSONB)  # Explainable matching details

    # Employer notes (internal)
    employer_notes = Column(Text)

    # Timestamps
    created_at = Column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    def __repr__(self):
        return f"<Application {self.id}>"
