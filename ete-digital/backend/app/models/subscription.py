"""
Subscription Model
==================
Tracks the billing plan for each organisation.

Plans:
  free       — 1 seat, 3 active jobs
  starter    — 3 seats, 10 active jobs  (₹1,999/mo)
  pro        — 10 seats, unlimited jobs (₹4,999/mo)
  enterprise — unlimited seats + jobs   (custom)
"""

from __future__ import annotations

import enum
import uuid
from datetime import datetime
from typing import Optional

from sqlalchemy import Boolean, DateTime, Enum as SQLEnum, ForeignKey, Integer, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from app.core.database import Base


class PlanTier(str, enum.Enum):
    FREE = "free"
    STARTER = "starter"
    PRO = "pro"
    ENTERPRISE = "enterprise"


# Plan limits — used for enforcement
PLAN_LIMITS: dict[str, dict] = {
    "free": {"seats": 1, "jobs": 3},
    "starter": {"seats": 3, "jobs": 10},
    "pro": {"seats": 10, "jobs": 9999},
    "enterprise": {"seats": 9999, "jobs": 9999},
}


class Subscription(Base):
    """One subscription record per organisation."""

    __tablename__ = "subscriptions"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # Organisation this sub belongs to (1:1 — one active sub per org)
    org_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("organizations.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
        index=True,
    )

    # Plan info
    plan: Mapped[PlanTier] = mapped_column(
        SQLEnum(PlanTier, values_callable=lambda x: [e.value for e in x]),
        nullable=False,
        default=PlanTier.FREE,
    )
    status: Mapped[str] = mapped_column(
        String(50), nullable=False, default="active"
    )  # active | past_due | canceled | trialing

    # Stripe identifiers (null for free plan)
    stripe_customer_id: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    stripe_subscription_id: Mapped[Optional[str]] = mapped_column(String(255), nullable=True, unique=True)

    # Billing period
    current_period_start: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    current_period_end: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    cancel_at_period_end: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    # Seat & job overrides (set to override plan defaults if negotiated)
    seat_limit_override: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    job_limit_override: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), onupdate=func.now())

    def get_seat_limit(self) -> int:
        if self.seat_limit_override is not None:
            return self.seat_limit_override
        return PLAN_LIMITS.get(self.plan.value, PLAN_LIMITS["free"])["seats"]

    def get_job_limit(self) -> int:
        if self.job_limit_override is not None:
            return self.job_limit_override
        return PLAN_LIMITS.get(self.plan.value, PLAN_LIMITS["free"])["jobs"]

    def __repr__(self) -> str:
        return f"<Subscription org={self.org_id} plan={self.plan} status={self.status}>"
