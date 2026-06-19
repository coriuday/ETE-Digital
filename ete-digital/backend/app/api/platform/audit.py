"""
Audit API
=========
Endpoints for HR users to view their organisation's audit logs.
"""

import uuid
from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy import select, desc
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import require_role
from app.models.notifications import AuditLog
from app.models.organization import Organization
from app.models.users import User, UserRole

router = APIRouter()


class AuditLogResponse(BaseModel):
    id: str
    action: str
    resource_type: Optional[str]
    resource_id: Optional[str]
    ip_address: Optional[str]
    user_email: Optional[str]
    details: dict
    timestamp: datetime

    class Config:
        from_attributes = True


async def _get_caller_org(db: AsyncSession, user_id: uuid.UUID) -> Optional[Organization]:
    result = await db.execute(select(Organization).where(Organization.owner_id == user_id))
    return result.scalar_one_or_none()


@router.get("/", response_model=List[AuditLogResponse])
async def get_audit_logs(
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    action: Optional[str] = Query(None, description="Filter by action type"),
    current_user: dict = Depends(require_role(UserRole.HR)),
    db: AsyncSession = Depends(get_db),
):
    """
    Get audit logs for the caller's organisation.
    Only the org owner can view audit logs.
    """
    caller_id = uuid.UUID(current_user["user_id"])
    org = await _get_caller_org(db, caller_id)
    if not org:
        raise HTTPException(status_code=404, detail="Organisation not found.")

    query = select(AuditLog, User.email).outerjoin(User, AuditLog.user_id == User.id).where(AuditLog.org_id == org.id)

    if action:
        query = query.where(AuditLog.action == action)

    query = query.order_by(desc(AuditLog.timestamp)).limit(limit).offset(offset)

    result = await db.execute(query)
    rows = result.all()

    response = []
    for log, email in rows:
        response.append(
            AuditLogResponse(
                id=str(log.id),
                action=log.action.value,
                resource_type=log.resource_type,
                resource_id=str(log.resource_id) if log.resource_id else None,
                ip_address=log.ip_address,
                user_email=email,
                details=log.details or {},
                timestamp=log.timestamp,
            )
        )

    return response
