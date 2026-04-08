"""
Tryout and Submission Models
Aligned with TryoutCreate/TryoutResponse schemas
"""

from sqlalchemy import (
    Column,
    String,
    DateTime,
    Integer,
    Boolean,
    Enum as SQLEnum,
    Text,
)
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.sql import func
import uuid
import enum

from app.core.database import Base


class TryoutStatus(str, enum.Enum):
    """Tryout status enumeration — matches DB tryoutstatus enum values"""

    DRAFT = "draft"
    ACTIVE = "active"
    EXPIRED = "expired"
    CLOSED = "closed"


class Tryout(Base):
    """Job tryout/trial task model"""

    __tablename__ = "tryouts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    job_id = Column(UUID(as_uuid=True), nullable=False, index=True)

    # Task details — aligned with TryoutCreate schema
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    requirements = Column(Text)
    task_requirements = Column(JSONB)  # Detailed requirements (legacy)
    test_cases = Column(JSONB)  # For code submissions
    expected_deliverables = Column(JSONB)  # List of deliverables

    # Duration and payment
    estimated_duration_hours = Column(
        Integer, nullable=False, default=4
    )  # Schema field
    duration_days = Column(Integer)  # Legacy field
    payment_amount = Column(Integer, default=0)  # In lowest currency unit
    payment_currency = Column(String(3), default="INR")  # Legacy field
    currency = Column(String(3), default="INR")  # Primary currency field

    # Scoring rubric — aligned with schema (scoring_rubric key)
    scoring_rubric = Column(JSONB, nullable=False)
    rubric = Column(JSONB)  # Legacy field
    passing_score = Column(Integer, default=70)
    auto_grade_enabled = Column(Boolean, default=False)

    # Submission rules
    max_submissions = Column(Integer, default=1)
    submission_format = Column(String(50), default="url")
    submissions_count = Column(Integer, default=0)

    # Status
    status = Column(
        SQLEnum(TryoutStatus, native_enum=False, values_callable=lambda x: [e.value for e in x]),
        default=TryoutStatus.ACTIVE,
    )

    # Timestamps
    created_at = Column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    expires_at = Column(DateTime(timezone=True))

    def __repr__(self):
        return f"<Tryout {self.id}>"


class SubmissionStatus(str, enum.Enum):
    """Submission status enumeration — matches DB submissionstatus enum values"""

    SUBMITTED = "submitted"
    GRADING = "grading"
    AUTO_GRADED = "auto_graded"
    GRADED = "graded"
    VERIFIED = "verified"
    PASSED = "passed"
    FAILED = "failed"


class PaymentStatus(str, enum.Enum):
    """Payment status enumeration"""

    PENDING = "pending"
    ESCROWED = "escrowed"
    RELEASED = "released"
    REFUNDED = "refunded"
    FAILED = "failed"


class TryoutSubmission(Base):
    """Tryout submission model"""

    __tablename__ = "tryout_submissions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tryout_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    candidate_id = Column(UUID(as_uuid=True), nullable=False, index=True)

    # Submission content
    submission_url = Column(String(500))
    submission_data = Column(JSONB)
    notes = Column(Text)          # Primary notes field
    submission_notes = Column(Text)   # Alias for API compatibility

    # Scoring
    auto_score = Column(Integer)
    manual_score = Column(Integer)
    final_score = Column(Integer)
    score_breakdown = Column(JSONB)

    # Feedback
    feedback = Column(Text)
    reviewed_by = Column(String(255))  # Reviewer email or name (String, not FK)
    reviewed_at = Column(DateTime(timezone=True))

    # Status
    status = Column(
        SQLEnum(SubmissionStatus, native_enum=False, values_callable=lambda x: [e.value for e in x]),
        default=SubmissionStatus.SUBMITTED,
    )

    # Payment
    payment_status = Column(
        SQLEnum(PaymentStatus, native_enum=False, values_callable=lambda x: [e.value for e in x]),
        default=PaymentStatus.PENDING,
    )
    payment_transaction_id = Column(String(255))

    # Timestamps
    created_at = Column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    submitted_at = Column(DateTime(timezone=True), server_default=func.now())
    graded_at = Column(DateTime(timezone=True))
    payment_escrowed_at = Column(DateTime(timezone=True))
    payment_released_at = Column(DateTime(timezone=True))

    def __repr__(self):
        return f"<TryoutSubmission {self.id}>"
