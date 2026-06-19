"""
Application status history — audit trail for ATS pipeline transitions.
"""

import uuid

from sqlalchemy import Column, DateTime, Enum as SQLEnum, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func

from app.core.database import Base
from app.models.jobs import ApplicationStatus


class ApplicationStatusHistory(Base):
    """Records every application pipeline stage change."""

    __tablename__ = "application_status_history"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    application_id = Column(
        UUID(as_uuid=True),
        ForeignKey("applications.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    old_status = Column(
        SQLEnum(ApplicationStatus, values_callable=lambda x: [e.value for e in x]),
        nullable=True,
    )
    new_status = Column(
        SQLEnum(ApplicationStatus, values_callable=lambda x: [e.value for e in x]),
        nullable=False,
    )
    changed_by = Column(UUID(as_uuid=True), nullable=False, index=True)
    changed_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False, index=True)
    notes = Column(Text, nullable=True)

    def __repr__(self):
        return f"<ApplicationStatusHistory {self.application_id} {self.old_status} -> {self.new_status}>"
