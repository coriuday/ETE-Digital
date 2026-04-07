"""
Notification Service — create DB records + push via WebSocket in one call.

Usage:
    from app.services.notification_service import notification_service
    await notification_service.create_and_push(db, user_id, "tryout", "Title", "Body", "/link")
"""

from datetime import datetime, timezone
from typing import Optional
import logging
import uuid

from sqlalchemy.ext.asyncio import AsyncSession
from app.models.notifications import Notification, NotificationType

logger = logging.getLogger(__name__)


class NotificationService:
    """Unified service: persist notification + push to WS if user is online."""

    async def create_and_push(
        self,
        db: AsyncSession,
        user_id: str | uuid.UUID,
        notif_type: str,
        title: str,
        message: str,
        link: Optional[str] = None,
    ) -> Notification:
        """
        Create a notification in the DB and push it via WebSocket if the user
        has an active connection. Safe to call even when no WS connection exists.
        """
        uid = uuid.UUID(str(user_id))
        type_enum = self._resolve_type(notif_type)

        notification = Notification(
            user_id=uid,
            type=type_enum,
            title=title,
            message=message,
            link=link,
            is_read=False,
            created_at=datetime.now(timezone.utc),
        )
        db.add(notification)
        await db.commit()
        await db.refresh(notification)

        # Push to WebSocket (fire-and-forget, don't block on failure)
        await self._push(str(user_id), notification)
        return notification

    async def _push(self, user_id: str, notification: Notification):
        """Push a notification payload to WebSocket if user is online."""
        try:
            from app.api.platform.websocket import ws_manager

            payload = {
                "type": "notification",
                "data": {
                    "id": str(notification.id),
                    "notif_type": notification.type.value,
                    "title": notification.title,
                    "message": notification.message,
                    "link": notification.link,
                    "is_read": notification.is_read,
                    "created_at": notification.created_at.isoformat(),
                },
            }
            sent = await ws_manager.send_to_user(user_id, payload)
            if sent:
                logger.debug(f"[Notif] Pushed to {user_id}: {notification.title}")
        except Exception as e:
            logger.warning(f"[Notif] WebSocket push failed for {user_id}: {e}")

    def _resolve_type(self, notif_type: str) -> NotificationType:
        """Map string to NotificationType enum safely."""
        mapping = {
            "application": NotificationType.APPLICATION,
            "tryout": NotificationType.TRYOUT,
            "message": NotificationType.MESSAGE,
            "payment": NotificationType.PAYMENT,
            "system": NotificationType.SYSTEM,
        }
        return mapping.get(notif_type, NotificationType.SYSTEM)


notification_service = NotificationService()
