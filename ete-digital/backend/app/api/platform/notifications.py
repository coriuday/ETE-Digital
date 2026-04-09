"""
Notifications API endpoints
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from sqlalchemy.sql import func
from typing import List
import uuid
from datetime import datetime, timezone

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.notifications import Notification
from pydantic import BaseModel, ConfigDict
from datetime import datetime as dt
from typing import Optional


router = APIRouter()


# ---- Schemas ----


class NotificationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    type: str
    title: str
    message: str
    link: Optional[str] = None
    is_read: bool
    created_at: dt
    read_at: Optional[dt] = None


class NotificationListResponse(BaseModel):
    notifications: List[NotificationResponse]
    total: int
    unread_count: int


# ---- Endpoints ----


@router.get("/", response_model=NotificationListResponse)
async def get_notifications(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    unread_only: bool = Query(default=False),
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Get current user's notifications (paginated, newest first)
    """
    user_id = uuid.UUID(current_user["user_id"])

    query = select(Notification).where(Notification.user_id == user_id)
    if unread_only:
        query = query.where(Notification.is_read == False)  # noqa: E712
    query = query.order_by(Notification.created_at.desc())

    count_query = select(func.count()).select_from(select(Notification).where(Notification.user_id == user_id).subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0

    unread_query = select(func.count()).select_from(
        select(Notification).where(Notification.user_id == user_id, Notification.is_read == False).subquery()  # noqa: E712
    )
    unread_result = await db.execute(unread_query)
    unread_count = unread_result.scalar() or 0

    paginated = query.offset((page - 1) * page_size).limit(page_size)
    result = await db.execute(paginated)
    notifications = result.scalars().all()

    return NotificationListResponse(
        notifications=[
            NotificationResponse(
                id=str(n.id),
                type=n.type.value,
                title=n.title,
                message=n.message,
                link=n.link,
                is_read=n.is_read,
                created_at=n.created_at,
                read_at=n.read_at,
            )
            for n in notifications
        ],
        total=total,
        unread_count=unread_count,
    )


@router.patch("/{notification_id}/read", response_model=dict)
async def mark_notification_read(
    notification_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Mark a single notification as read"""
    user_id = uuid.UUID(current_user["user_id"])
    notif_id = uuid.UUID(notification_id)

    result = await db.execute(select(Notification).where(Notification.id == notif_id, Notification.user_id == user_id))
    notification = result.scalar_one_or_none()

    if not notification:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Notification not found")

    notification.is_read = True
    notification.read_at = datetime.now(timezone.utc)
    await db.commit()

    return {"message": "Notification marked as read"}


@router.patch("/read-all", response_model=dict)
async def mark_all_notifications_read(current_user: dict = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    """Mark all notifications as read for current user"""
    user_id = uuid.UUID(current_user["user_id"])

    await db.execute(
        update(Notification)
        .where(Notification.user_id == user_id, Notification.is_read == False)  # noqa: E712
        .values(is_read=True, read_at=datetime.now(timezone.utc))
    )
    await db.commit()

    return {"message": "All notifications marked as read"}


@router.delete("/{notification_id}", response_model=dict)
async def delete_notification(
    notification_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete a notification"""
    user_id = uuid.UUID(current_user["user_id"])
    notif_id = uuid.UUID(notification_id)

    result = await db.execute(select(Notification).where(Notification.id == notif_id, Notification.user_id == user_id))
    notification = result.scalar_one_or_none()

    if not notification:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Notification not found")

    await db.delete(notification)
    await db.commit()

    return {"message": "Notification deleted"}
