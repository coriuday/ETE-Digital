"""
Tryout and Submission Models
"""
from sqlalchemy import Column, String, DateTime, Integer, Enum as SQLEnum, Numeric, Text
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.sql import func
import uuid
import enum

from app.core.database import Base


class TryoutStatus(str, enum.Enum):
    """Tryout status enumeration"""
    ACTIVE = "active"
    EXPIRED = "expired"
    CLOSED = "closed"


class Tryout(Base):
    """Job tryout/trial task model"""
    __tablename__ = "tryouts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    job_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    
    # Task details
    task_description = Column(Text, nullable=False)
    task_requirements = Column(JSONB)  # Detailed requirements
    test_cases = Column(JSONB)  # For code submissions: input/output test cases
    
    # Duration and payment
    duration_days = Column(Integer, nullable=False)  # 1-7 days
    payment_amount = Column(Numeric(10, 2), nullable=False)
    currency = Column(String(3), default='INR')
    
    # Scoring rubric
    rubric = Column(JSONB, nullable=False)  
    # Example: {'code_quality': 30, 'functionality': 40, 'documentation': 20, 'creativity': 10}
    passing_score = Column(Integer, default=70)  # Minimum score to pass
    
    # Status
    status = Column(SQLEnum(TryoutStatus), default=TryoutStatus.ACTIVE)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    expires_at = Column(DateTime(timezone=True))

    def __repr__(self):
        return f"<Tryout {self.id}>"


class SubmissionStatus(str, enum.Enum):
    """Submission status enumeration"""
    SUBMITTED = "submitted"
    GRADING = "grading"
    GRADED = "graded"
    VERIFIED = "verified"
    FAILED = "failed"


class PaymentStatus(str, enum.Enum):
    """Payment status enumeration"""
    PENDING = "pending"
    ESCROWED = "escrowed"  # Held in escrow
    RELEASED = "released"  # Paid to candidate
    REFUNDED = "refunded"  # Returned to employer
    FAILED = "failed"


class TryoutSubmission(Base):
    """Tryout submission model"""
    __tablename__ = "tryout_submissions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tryout_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    candidate_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    
    # Submission content
    submission_url = Column(String(500))  # S3 link to code/files
    submission_data = Column(JSONB)  # Code snippets, outputs, metadata
    submission_notes = Column(Text)  # Candidate's explanation
    
    # Scoring
    auto_score = Column(Integer)  # 0-100, from automated tests
    manual_score = Column(Integer)  # 0-100, from human review
    final_score = Column(Integer)  # Combined score
    score_breakdown = Column(JSONB)  # Detailed rubric scores
    
    # Feedback
    feedback = Column(Text)  # Employer feedback
    
    # Status
    status = Column(SQLEnum(SubmissionStatus), default=SubmissionStatus.SUBMITTED)
    
    # Payment
    payment_status = Column(SQLEnum(PaymentStatus), default=PaymentStatus.PENDING)
    payment_transaction_id = Column(String(255))  # Stripe transaction ID
    
    # Timestamps
    submitted_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    graded_at = Column(DateTime(timezone=True))
    payment_released_at = Column(DateTime(timezone=True))

    def __repr__(self):
        return f"<TryoutSubmission {self.id}>"
