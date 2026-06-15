"""
Organization Member Model
=========================
Join table between users and organizations.
Tracks role, who invited them, and when they joined.

Roles: owner | admin | recruiter | hiring_manager | viewer
"""

from __future__ import annotations

import uuid
from datetime import datetime
from typing import TYPE_CHECKING, Optional

if TYPE_CHECKING:
    from app.models.organization import Organization  # noqa: F401

from sqlalchemy import DateTime, ForeignKey, String, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from app.core.database import Base


class OrganizationMember(Base):
    """Membership record linking a user to an organization with a role."""

    __tablename__ = "organization_members"

    # Composite unique constraint: one user per org
    __table_args__ = (UniqueConstraint("organization_id", "user_id", name="uq_org_members_org_user"),)

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    organization_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("organizations.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    # Role within the organization
    # Allowed values: 'owner' | 'admin' | 'recruiter' | 'hiring_manager' | 'viewer'
    role: Mapped[str] = mapped_column(String(50), nullable=False, default="recruiter")

    # Who sent the invite (null for the owner who created the org)
    invited_by: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )

    joined_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # ORM relationships
    organization: Mapped["Organization"] = relationship("Organization", back_populates="members")

    def __repr__(self) -> str:
        return f"<OrganizationMember user={self.user_id} org={self.organization_id} role={self.role}>"
