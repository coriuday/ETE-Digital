"""
Audit Logging Service
=====================
Helper functions to record audit logs.
"""

import uuid
from typing import Optional, Any
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import Request
from app.models.notifications import AuditLog, AuditAction


async def log_audit_event(
    db: AsyncSession,
    action: AuditAction | str,
    user_id: uuid.UUID | str,
    org_id: Optional[uuid.UUID | str] = None,
    resource_type: Optional[str] = None,
    resource_id: Optional[uuid.UUID | str] = None,
    request: Optional[Request] = None,
    details: Optional[dict[str, Any]] = None,
) -> None:
    """
    Log an audit event to the database.
    Does not commit the transaction automatically — the caller must `await db.commit()`.
    """
    if isinstance(action, str):
        action = AuditAction(action)
    if isinstance(user_id, str):
        user_id = uuid.UUID(user_id)
    if org_id and isinstance(org_id, str):
        org_id = uuid.UUID(org_id)
    if resource_id and isinstance(resource_id, str):
        resource_id = uuid.UUID(resource_id)

    ip_address = None
    user_agent = None
    request_path = None

    if request:
        ip_address = request.client.host if request.client else None
        user_agent = request.headers.get("user-agent")
        request_path = request.url.path

    audit_entry = AuditLog(
        user_id=user_id,
        org_id=org_id,
        action=action,
        resource_type=resource_type,
        resource_id=resource_id,
        ip_address=ip_address,
        user_agent=user_agent,
        request_path=request_path,
        details=details or {},
    )

    db.add(audit_entry)
    # Intentionally not awaiting db.commit() here so it can be batched with the caller's transaction
