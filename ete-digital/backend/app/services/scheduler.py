"""
Background scheduler for periodic tasks.
Uses APScheduler AsyncIOScheduler so it runs inside the FastAPI event loop.

Tasks:
  - expire_jobs: Close jobs whose expires_at < now (runs every 30 min)
"""

import logging
from datetime import datetime, timezone

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.interval import IntervalTrigger
from sqlalchemy import update

logger = logging.getLogger(__name__)

# Module-level scheduler instance (started/stopped by FastAPI lifespan)
scheduler = AsyncIOScheduler()


async def expire_jobs() -> None:
    """Close any active jobs whose expires_at has passed."""
    from app.core.database import AsyncSessionLocal  # lazy import to avoid circular
    from app.models.jobs import Job, JobStatus

    now = datetime.now(timezone.utc)
    async with AsyncSessionLocal() as session:
        result = await session.execute(
            update(Job)
            .where(
                Job.status == JobStatus.ACTIVE,
                Job.expires_at.isnot(None),
                Job.expires_at < now,
            )
            .values(status=JobStatus.CLOSED)
            .returning(Job.id)
        )
        closed_ids = result.fetchall()
        await session.commit()

    if closed_ids:
        logger.info("Job expiry: closed %d job(s): %s", len(closed_ids), closed_ids)
    else:
        logger.debug("Job expiry: no jobs to close at %s", now.isoformat())


def start_scheduler() -> None:
    """Register all periodic tasks and start the scheduler."""
    scheduler.add_job(
        expire_jobs,
        trigger=IntervalTrigger(minutes=30),
        id="expire_jobs",
        replace_existing=True,
        max_instances=1,
    )
    scheduler.start()
    logger.info("Background scheduler started (job expiry every 30 min)")


def stop_scheduler() -> None:
    """Gracefully shut down the scheduler."""
    if scheduler.running:
        scheduler.shutdown(wait=False)
        logger.info("Background scheduler stopped")
