"""
Pipeline analytics helpers — funnel, conversion, time-in-stage from status history.
"""

from __future__ import annotations

import uuid
from datetime import datetime, timedelta, timezone
from typing import List, Tuple

from sqlalchemy import select, func, and_, distinct
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.jobs import Application, ApplicationStatus, Job
from app.models.application_status_history import ApplicationStatusHistory

FUNNEL_STAGES: List[Tuple[str, ApplicationStatus]] = [
    ("Applied", ApplicationStatus.PENDING),
    ("Shortlisted", ApplicationStatus.SHORTLISTED),
    ("Reviewed", ApplicationStatus.REVIEWED),
    ("Hired", ApplicationStatus.HIRED),
]


async def count_reached_stage(
    db: AsyncSession,
    job_ids: list[uuid.UUID],
    stage: ApplicationStatus,
) -> int:
    """Count applications that ever reached a given stage (from history)."""
    if not job_ids:
        return 0

    if stage == ApplicationStatus.PENDING:
        result = await db.execute(select(func.count(Application.id)).where(Application.job_id.in_(job_ids)))
        return result.scalar() or 0

    hist_apps = (
        select(distinct(ApplicationStatusHistory.application_id))
        .join(Application, Application.id == ApplicationStatusHistory.application_id)
        .where(
            and_(
                Application.job_id.in_(job_ids),
                ApplicationStatusHistory.new_status == stage,
            )
        )
    )

    result = await db.execute(select(func.count()).select_from(hist_apps.subquery()))
    return result.scalar() or 0


async def get_funnel_counts(
    db: AsyncSession,
    job_ids: list[uuid.UUID],
) -> list[tuple[str, int]]:
    counts = []
    for name, stage in FUNNEL_STAGES:
        counts.append((name, await count_reached_stage(db, job_ids, stage)))
    return counts


async def get_rejection_count(db: AsyncSession, job_ids: list[uuid.UUID]) -> int:
    if not job_ids:
        return 0
    result = await db.execute(
        select(func.count(Application.id)).where(
            and_(Application.job_id.in_(job_ids), Application.status == ApplicationStatus.REJECTED)
        )
    )
    return result.scalar() or 0


async def get_avg_hiring_days(db: AsyncSession, job_ids: list[uuid.UUID]) -> float | None:
    """Average days from application created_at to first hired history entry."""
    if not job_ids:
        return None

    hired_hist = (
        select(
            ApplicationStatusHistory.application_id,
            func.min(ApplicationStatusHistory.changed_at).label("hired_at"),
        )
        .where(ApplicationStatusHistory.new_status == ApplicationStatus.HIRED)
        .group_by(ApplicationStatusHistory.application_id)
        .subquery()
    )

    result = await db.execute(
        select(func.avg(func.extract("epoch", hired_hist.c.hired_at - Application.created_at) / 86400.0))
        .select_from(Application)
        .join(hired_hist, hired_hist.c.application_id == Application.id)
        .where(Application.job_id.in_(job_ids))
    )
    avg = result.scalar()
    return round(float(avg), 1) if avg is not None else None


async def get_avg_time_in_stage_hours(
    db: AsyncSession,
    job_ids: list[uuid.UUID],
    stage: ApplicationStatus,
) -> float | None:
    """Average hours spent in a stage before transitioning out."""
    if not job_ids:
        return None

    app_ids_subq = select(Application.id).where(Application.job_id.in_(job_ids))

    entries_result = await db.execute(
        select(ApplicationStatusHistory)
        .where(ApplicationStatusHistory.application_id.in_(app_ids_subq))
        .order_by(ApplicationStatusHistory.application_id, ApplicationStatusHistory.changed_at)
    )
    entries = list(entries_result.scalars().all())
    if not entries:
        return None

    by_app: dict[uuid.UUID, list] = {}
    for e in entries:
        by_app.setdefault(e.application_id, []).append(e)

    durations: list[float] = []
    for app_entries in by_app.values():
        for i, entry in enumerate(app_entries):
            if entry.new_status != stage:
                continue
            start = entry.changed_at
            end = app_entries[i + 1].changed_at if i + 1 < len(app_entries) else datetime.now(timezone.utc)
            durations.append((end - start).total_seconds() / 3600.0)

    if not durations:
        return None
    return round(sum(durations) / len(durations), 1)
