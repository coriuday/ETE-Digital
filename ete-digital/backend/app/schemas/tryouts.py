"""
Tryout-related Pydantic schemas
"""

from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List, Dict
from datetime import datetime
from app.models.tryouts import TryoutStatus, SubmissionStatus, PaymentStatus


# ========== Tryout Creation ==========


class TryoutCreate(BaseModel):
    """Create tryout for a job"""

    job_id: str
    title: str = Field(..., min_length=3, max_length=255)
    description: str = Field(..., min_length=50)
    requirements: str

    # Test specifications
    test_cases: Optional[Dict] = None  # For code challenges
    expected_deliverables: List[str] = Field(default_factory=list)

    # Time and compensation
    estimated_duration_hours: int = Field(..., ge=1, le=168)  # Max 1 week
    payment_amount: int = Field(default=0, ge=0)  # In cents
    payment_currency: str = Field(default="USD", max_length=3)

    # Scoring
    scoring_rubric: Dict  # {criterion: weight}
    passing_score: int = Field(..., ge=0, le=100)
    auto_grade_enabled: bool = False

    # Submission
    max_submissions: int = Field(default=1, ge=1, le=5)
    submission_format: str = Field(default="url")  # url, file, text, code


class TryoutUpdate(BaseModel):
    """Update tryout"""

    title: Optional[str] = Field(None, min_length=3, max_length=255)
    description: Optional[str] = Field(None, min_length=50)
    requirements: Optional[str] = None

    test_cases: Optional[Dict] = None
    expected_deliverables: Optional[List[str]] = None

    estimated_duration_hours: Optional[int] = Field(None, ge=1, le=168)
    payment_amount: Optional[int] = Field(None, ge=0)

    scoring_rubric: Optional[Dict] = None
    passing_score: Optional[int] = Field(None, ge=0, le=100)
    auto_grade_enabled: Optional[bool] = None

    max_submissions: Optional[int] = Field(None, ge=1, le=5)
    submission_format: Optional[str] = None

    status: Optional[TryoutStatus] = None


class TryoutResponse(BaseModel):
    """Tryout response"""

    id: str
    job_id: str

    title: str
    description: str
    requirements: str

    test_cases: Optional[Dict]
    expected_deliverables: List[str]

    estimated_duration_hours: int
    payment_amount: int
    payment_currency: str

    scoring_rubric: Dict
    passing_score: int
    auto_grade_enabled: bool

    max_submissions: int
    submission_format: str

    status: TryoutStatus
    submissions_count: int

    created_at: datetime
    updated_at: Optional[datetime]

    model_config = ConfigDict(from_attributes=True)


class TryoutListResponse(BaseModel):
    """Paginated tryout list"""

    tryouts: List[TryoutResponse]
    total: int
    page: int
    page_size: int


# ========== Tryout Submission ==========


class SubmissionCreate(BaseModel):
    """Create tryout submission"""

    tryout_id: str

    submission_url: Optional[str] = Field(None, max_length=500)
    submission_data: Optional[Dict] = None  # For code submissions, JSON data
    notes: Optional[str] = Field(None, max_length=2000)


class SubmissionResponse(BaseModel):
    """Submission response"""

    id: str
    tryout_id: str
    candidate_id: str

    submission_url: Optional[str]
    submission_data: Optional[Dict]
    notes: Optional[str]

    status: SubmissionStatus

    # Scoring
    auto_score: Optional[int]
    manual_score: Optional[int]
    final_score: Optional[int]
    score_breakdown: Optional[Dict]

    # Feedback
    feedback: Optional[str]
    reviewed_by: Optional[str]
    reviewed_at: Optional[datetime]

    # Payment
    payment_status: PaymentStatus
    payment_escrowed_at: Optional[datetime]
    payment_released_at: Optional[datetime]

    created_at: datetime
    updated_at: Optional[datetime]

    model_config = ConfigDict(from_attributes=True)


class SubmissionListResponse(BaseModel):
    """Paginated submission list"""

    submissions: List[SubmissionResponse]
    total: int
    page: int
    page_size: int


class SubmissionReview(BaseModel):
    """Review submission (employer)"""

    manual_score: int = Field(..., ge=0, le=100)
    feedback: Optional[str] = Field(None, max_length=2000)
    approved: bool  # Whether to approve and release payment


class SubmissionGradeResponse(BaseModel):
    """Auto-grading response"""

    auto_score: int
    score_breakdown: Dict
    passed: bool
