"""
Analytics API endpoints for employer dashboard data
"""
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_
from typing import List, Optional
import uuid
from datetime import datetime, timedelta, timezone

from app.core.database import get_db
from app.core.security import require_role
from app.models.users import UserRole
from app.models.jobs import Job, Application, ApplicationStatus
from app.models.tryouts import TryoutSubmission, SubmissionStatus
from pydantic import BaseModel


router = APIRouter()


# ---- Schemas ----

class KPICard(BaseModel):
    label: str
    value: int
    change_pct: float  # percentage change from previous period
    is_positive: bool


class TimeSeriesPoint(BaseModel):
    date: str
    value: int


class TopJobEntry(BaseModel):
    job_id: str
    title: str
    applications: int
    views: int


class FunnelStage(BaseModel):
    stage: str
    count: int
    pct: float


class AnalyticsSummary(BaseModel):
    kpis: List[KPICard]
    applications_over_time: List[TimeSeriesPoint]
    top_jobs: List[TopJobEntry]
    application_funnel: List[FunnelStage]
    period_days: int


# ---- Endpoints ----

@router.get("/summary", response_model=AnalyticsSummary)
async def get_analytics_summary(
    days: int = Query(default=30, ge=7, le=365, description="Analytics period in days"),
    current_user: dict = Depends(require_role(UserRole.EMPLOYER)),
    db: AsyncSession = Depends(get_db)
):
    """
    Get employer analytics summary.
    
    Returns KPIs, application trends, top performing jobs, and conversion funnel.
    """
    employer_id = uuid.UUID(current_user["user_id"])
    now = datetime.now(timezone.utc)
    period_start = now - timedelta(days=days)
    prev_period_start = period_start - timedelta(days=days)

    # Get employer's job IDs
    jobs_result = await db.execute(
        select(Job.id, Job.title, Job.views_count, Job.applications_count)
        .where(Job.employer_id == employer_id)
    )
    employer_jobs = jobs_result.all()
    job_ids = [row.id for row in employer_jobs]

    if not job_ids:
        return AnalyticsSummary(
            kpis=[
                KPICard(label="Total Jobs", value=0, change_pct=0.0, is_positive=True),
                KPICard(label="Applications", value=0, change_pct=0.0, is_positive=True),
                KPICard(label="Shortlisted", value=0, change_pct=0.0, is_positive=True),
                KPICard(label="Hired", value=0, change_pct=0.0, is_positive=True),
            ],
            applications_over_time=[],
            top_jobs=[],
            application_funnel=[],
            period_days=days
        )

    # ---- KPIs ----
    # Current period applications
    curr_apps_result = await db.execute(
        select(func.count(Application.id))
        .where(
            and_(
                Application.job_id.in_(job_ids),
                Application.created_at >= period_start
            )
        )
    )
    curr_apps = curr_apps_result.scalar() or 0

    # Previous period applications
    prev_apps_result = await db.execute(
        select(func.count(Application.id))
        .where(
            and_(
                Application.job_id.in_(job_ids),
                Application.created_at >= prev_period_start,
                Application.created_at < period_start
            )
        )
    )
    prev_apps = prev_apps_result.scalar() or 0

    def calc_change(current: int, previous: int) -> float:
        if previous == 0:
            return 100.0 if current > 0 else 0.0
        return round((current - previous) / previous * 100, 1)

    # Shortlisted count
    shortlisted_result = await db.execute(
        select(func.count(Application.id))
        .where(
            and_(
                Application.job_id.in_(job_ids),
                Application.status == ApplicationStatus.SHORTLISTED
            )
        )
    )
    shortlisted = shortlisted_result.scalar() or 0

    # Hired count
    hired_result = await db.execute(
        select(func.count(Application.id))
        .where(
            and_(
                Application.job_id.in_(job_ids),
                Application.status == ApplicationStatus.HIRED
            )
        )
    )
    hired = hired_result.scalar() or 0

    kpis = [
        KPICard(
            label="Total Jobs",
            value=len(job_ids),
            change_pct=0.0,
            is_positive=True
        ),
        KPICard(
            label="Applications",
            value=curr_apps,
            change_pct=calc_change(curr_apps, prev_apps),
            is_positive=curr_apps >= prev_apps
        ),
        KPICard(
            label="Shortlisted",
            value=shortlisted,
            change_pct=0.0,
            is_positive=True
        ),
        KPICard(
            label="Hired",
            value=hired,
            change_pct=0.0,
            is_positive=True
        ),
    ]

    # ---- Applications over time (daily) ----
    apps_over_time = []
    for i in range(min(days, 30)):  # max 30 data points
        day_start = period_start + timedelta(days=i * days // 30)
        day_end = period_start + timedelta(days=(i + 1) * days // 30)
        day_result = await db.execute(
            select(func.count(Application.id))
            .where(
                and_(
                    Application.job_id.in_(job_ids),
                    Application.created_at >= day_start,
                    Application.created_at < day_end
                )
            )
        )
        count = day_result.scalar() or 0
        apps_over_time.append(TimeSeriesPoint(
            date=day_start.strftime("%Y-%m-%d"),
            value=count
        ))

    # ---- Top jobs ----
    top_jobs = [
        TopJobEntry(
            job_id=str(row.id),
            title=row.title,
            applications=row.applications_count or 0,
            views=row.views_count or 0
        )
        for row in sorted(employer_jobs, key=lambda r: r.applications_count or 0, reverse=True)[:5]
    ]

    # ---- Application funnel ----
    total_apps_result = await db.execute(
        select(func.count(Application.id))
        .where(Application.job_id.in_(job_ids))
    )
    total_apps = total_apps_result.scalar() or 1  # avoid division by zero

    funnel_stages = [
        ("Applied", ApplicationStatus.PENDING),
        ("Reviewed", ApplicationStatus.REVIEWED),
        ("Shortlisted", ApplicationStatus.SHORTLISTED),
        ("Hired", ApplicationStatus.HIRED),
    ]

    funnel = []
    for stage_name, stage_status in funnel_stages:
        stage_result = await db.execute(
            select(func.count(Application.id))
            .where(
                and_(
                    Application.job_id.in_(job_ids),
                    Application.status == stage_status
                )
            )
        )
        stage_count = stage_result.scalar() or 0
        funnel.append(FunnelStage(
            stage=stage_name,
            count=stage_count,
            pct=round(stage_count / total_apps * 100, 1)
        ))

    return AnalyticsSummary(
        kpis=kpis,
        applications_over_time=apps_over_time,
        top_jobs=top_jobs,
        application_funnel=funnel,
        period_days=days
    )
