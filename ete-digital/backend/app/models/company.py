"""
Company Profile and Interview Models
"""
from sqlalchemy import Column, String, DateTime, Integer, Enum as SQLEnum, Text, Boolean
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.sql import func
import uuid
import enum

from app.core.database import Base


class CompanySize(str, enum.Enum):
    """Company size enumeration"""
    STARTUP = "1-10"
    SMALL = "11-50"
    MEDIUM = "51-200"
    LARGE = "201-1000"
    ENTERPRISE = "1000+"


class CompanyProfile(Base):
    """Employer's company profile"""
    __tablename__ = "company_profiles"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    employer_id = Column(UUID(as_uuid=True), nullable=False, unique=True, index=True)

    # Company details
    name = Column(String(255), nullable=False)
    tagline = Column(String(500))
    description = Column(Text)
    industry = Column(String(100))
    company_size = Column(SQLEnum(CompanySize))
    founded_year = Column(Integer)

    # Branding
    logo_url = Column(String(500))
    cover_image_url = Column(String(500))
    brand_color = Column(String(7))  # hex color

    # Contact & Location
    website = Column(String(500))
    email = Column(String(255))
    phone = Column(String(20))
    address = Column(String(500))
    city = Column(String(100))
    country = Column(String(100))

    # Social links (JSONB)
    social_links = Column(JSONB, default=dict)  # {'linkedin': 'url', 'twitter': 'url'}

    # Culture info
    benefits = Column(JSONB, default=list)  # ['Remote work', 'Health insurance', ...]
    tech_stack = Column(JSONB, default=list)  # ['React', 'Python', 'AWS']
    culture_tags = Column(JSONB, default=list)  # ['Fast-paced', 'Innovative', ...]

    # Verification
    is_verified = Column(Boolean, default=False)
    verified_at = Column(DateTime(timezone=True))

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    def __repr__(self):
        return f"<CompanyProfile {self.name}>"


class InterviewStatus(str, enum.Enum):
    """Interview status"""
    SCHEDULED = "scheduled"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
    NO_SHOW = "no_show"


class InterviewType(str, enum.Enum):
    """Interview type"""
    VIDEO = "video"
    PHONE = "phone"
    IN_PERSON = "in_person"
    TECHNICAL = "technical"
    HR = "hr"
    FINAL = "final"


class Interview(Base):
    """Scheduled interview model"""
    __tablename__ = "interviews"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    application_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    employer_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    candidate_id = Column(UUID(as_uuid=True), nullable=False, index=True)

    # Interview details
    interview_type = Column(SQLEnum(InterviewType), default=InterviewType.VIDEO)
    title = Column(String(255), default="Interview")
    scheduled_at = Column(DateTime(timezone=True), nullable=False)
    duration_minutes = Column(Integer, default=60)

    # Meeting info
    meeting_url = Column(String(500))  # Zoom/Meet link
    meeting_platform = Column(String(50))  # 'zoom', 'gmeet', 'teams'
    meeting_id = Column(String(100))
    meeting_password = Column(String(100))

    # Location (for in-person)
    location_address = Column(String(500))

    # Content
    agenda = Column(Text)
    instructions_for_candidate = Column(Text)
    internal_notes = Column(Text)  # Not shown to candidate

    # Feedback (post-interview)
    candidate_rating = Column(Integer)  # 1-5 stars
    interviewer_notes = Column(Text)

    # Status
    status = Column(SQLEnum(InterviewStatus), default=InterviewStatus.SCHEDULED)

    # Notifications
    reminder_sent = Column(Boolean, default=False)
    candidate_confirmed = Column(Boolean, default=False)

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    completed_at = Column(DateTime(timezone=True))

    def __repr__(self):
        return f"<Interview {self.id} at {self.scheduled_at}>"
