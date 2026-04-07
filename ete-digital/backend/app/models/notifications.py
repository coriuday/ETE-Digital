"""
Notification and Audit Models
"""

from sqlalchemy import Column, String, Boolean, DateTime, Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.sql import func
import uuid
import enum

from app.core.database import Base


class NotificationType(str, enum.Enum):
    """Notification type enumeration"""

    APPLICATION = "application"
    TRYOUT = "tryout"
    MESSAGE = "message"
    PAYMENT = "payment"
    SYSTEM = "system"


class Notification(Base):
    """Notification model"""

    __tablename__ = "notifications"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), nullable=False, index=True)

    # Notification content
    type = Column(SQLEnum(NotificationType), nullable=False)
    title = Column(String(255), nullable=False)
    message = Column(String(500), nullable=False)
    link = Column(String(500))  # Link to related resource

    # Metadata
    notification_metadata = Column(JSONB)  # Additional context data

    # Status
    is_read = Column(Boolean, default=False, nullable=False)

    # Timestamps
    created_at = Column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    read_at = Column(DateTime(timezone=True))

    def __repr__(self):
        return f"<Notification {self.title}>"


class AuditAction(str, enum.Enum):
    """Audit action enumeration"""

    VAULT_ACCESS = "vault_access"
    VAULT_SHARE = "vault_share"
    DATA_EXPORT = "data_export"
    DATA_DELETION = "data_deletion"
    PROFILE_UPDATE = "profile_update"
    PASSWORD_CHANGE = "password_change"
    ADMIN_ACTION = "admin_action"


class AuditLog(Base):
    """Audit log for compliance and security"""

    __tablename__ = "audit_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), index=True)

    # Action details
    action = Column(SQLEnum(AuditAction), nullable=False, index=True)
    resource_type = Column(String(50))  # 'job', 'vault_item', 'user', etc.
    resource_id = Column(UUID(as_uuid=True))

    # Request metadata
    ip_address = Column(String(45))
    user_agent = Column(String(500))
    request_path = Column(String(500))

    # Additional context
    details = Column(JSONB)

    # Timestamp
    timestamp = Column(
        DateTime(timezone=True), server_default=func.now(), nullable=False, index=True
    )

    def __repr__(self):
        return f"<AuditLog {self.action} by {self.user_id}>"
