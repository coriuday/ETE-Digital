"""
Talent Vault Models
"""

from sqlalchemy import Column, String, Boolean, DateTime, Integer, Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.sql import func
import uuid
import enum

from app.core.database import Base


class VaultItemType(str, enum.Enum):
    """Talent vault item type enumeration"""

    PROJECT = "project"
    VERIFIED_SAMPLE = "verified_sample"  # From tryout
    BADGE = "badge"
    CERTIFICATE = "certificate"
    OTHER = "other"


class TalentVaultItem(Base):
    """Talent vault item model"""

    __tablename__ = "talent_vault_items"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    candidate_id = Column(UUID(as_uuid=True), nullable=False, index=True)

    # Item details
    type = Column(
        SQLEnum(VaultItemType, values_callable=lambda x: [e.value for e in x]),
        nullable=False,
    )
    title = Column(String(255), nullable=False)
    description = Column(String(1000))

    # File storage (encrypted)
    file_url = Column(String(500))  # Encrypted S3 URL
    file_type = Column(String(50))  # 'pdf', 'zip', 'github_link', etc.
    file_size_bytes = Column(Integer)

    # Metadata
    item_metadata = Column(JSONB, default=dict)
    # Example: {'tech_stack': ['React', 'Node'], 'score': 85, 'completion_date': '2026-01-15'}

    # Verification
    is_verified = Column(Boolean, default=False, nullable=False)
    verified_by = Column(String(50))  # 'tryout', 'manual', 'external'
    tryout_submission_id = Column(UUID(as_uuid=True))  # If from tryout

    # Sharing statistics
    share_count = Column(Integer, default=0)
    view_count = Column(Integer, default=0)

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    def __repr__(self):
        return f"<TalentVaultItem {self.title}>"


class VaultShareToken(Base):
    """Share tokens for talent vault items"""

    __tablename__ = "vault_share_tokens"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    vault_item_id = Column(UUID(as_uuid=True), nullable=False, index=True)

    # Token
    token = Column(UUID(as_uuid=True), unique=True, nullable=False, index=True, default=uuid.uuid4)

    # Access control
    expires_at = Column(DateTime(timezone=True))
    max_views = Column(Integer)  # Null = unlimited
    view_count = Column(Integer, default=0)
    is_revoked = Column(Boolean, default=False)

    # Shared with (optional tracking)
    shared_with_email = Column(String(255))
    shared_with_company = Column(String(255))

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    last_accessed_at = Column(DateTime(timezone=True))

    def __repr__(self):
        return f"<VaultShareToken {self.token}>"
