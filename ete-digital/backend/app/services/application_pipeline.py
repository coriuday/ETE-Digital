"""
ATS pipeline transition engine — validates stage changes and exposes UI helpers.
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timezone
from typing import List, Optional
import uuid

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.jobs import Application, ApplicationStatus, Job
from app.models.application_status_history import ApplicationStatusHistory

# Forward pipeline rank (flexible skips allowed to any higher rank)
PIPELINE_ORDER: dict[ApplicationStatus, int] = {
    ApplicationStatus.PENDING: 0,
    ApplicationStatus.SHORTLISTED: 1,
    ApplicationStatus.REVIEWED: 2,
    ApplicationStatus.HIRED: 3,
}

TERMINAL_STATUSES = frozenset(
    {
        ApplicationStatus.HIRED,
        ApplicationStatus.REJECTED,
        ApplicationStatus.WITHDRAWN,
    }
)

STAGE_LABELS: dict[ApplicationStatus, str] = {
    ApplicationStatus.PENDING: "Applied",
    ApplicationStatus.SHORTLISTED: "Shortlisted",
    ApplicationStatus.REVIEWED: "Reviewed",
    ApplicationStatus.HIRED: "Hired",
    ApplicationStatus.REJECTED: "Rejected",
    ApplicationStatus.WITHDRAWN: "Withdrawn",
}

# Positive pipeline stages in display order
PIPELINE_STAGES: list[ApplicationStatus] = [
    ApplicationStatus.PENDING,
    ApplicationStatus.SHORTLISTED,
    ApplicationStatus.REVIEWED,
    ApplicationStatus.HIRED,
]


def stage_label(s: ApplicationStatus) -> str:
    return STAGE_LABELS.get(s, s.value.replace("_", " ").title())


def is_locked(current: ApplicationStatus) -> bool:
    return current in TERMINAL_STATUSES


def validate_transition(old: ApplicationStatus, new: ApplicationStatus) -> None:
    """Raise HTTPException if transition is not allowed."""
    if old in TERMINAL_STATUSES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Application is locked — no further status changes allowed.",
        )

    if old == new:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Candidate already in {stage_label(new)} stage",
        )

    if new == ApplicationStatus.WITHDRAWN:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only candidates can withdraw an application.",
        )

    if new == ApplicationStatus.REJECTED:
        return

    old_rank = PIPELINE_ORDER.get(old)
    new_rank = PIPELINE_ORDER.get(new)

    if old_rank is None or new_rank is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid pipeline transition from {stage_label(old)} to {stage_label(new)}.",
        )

    if new_rank <= old_rank:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot move application backward from {stage_label(old)} to {stage_label(new)}.",
        )


def get_available_actions(current: ApplicationStatus) -> List[str]:
    """Return target status values HR can transition to from the current stage."""
    if current in TERMINAL_STATUSES:
        return []

    actions: list[str] = [ApplicationStatus.REJECTED.value]

    current_rank = PIPELINE_ORDER.get(current)
    if current_rank is None:
        return actions

    for stage, rank in PIPELINE_ORDER.items():
        if rank > current_rank:
            actions.insert(-1, stage.value)  # reject always last

    return actions


def build_pipeline_progress(current: ApplicationStatus) -> dict:
    """Lightweight progress object for candidate list views."""
    if current == ApplicationStatus.REJECTED:
        return {
            "current_stage": current.value,
            "current_label": stage_label(current),
            "is_terminal": True,
            "is_rejected": True,
            "is_hired": False,
            "stages": [
                {
                    "key": s.value,
                    "label": stage_label(s),
                    "state": "completed" if s == ApplicationStatus.PENDING else "skipped",
                }
                for s in PIPELINE_STAGES
            ],
        }

    if current == ApplicationStatus.WITHDRAWN:
        return {
            "current_stage": current.value,
            "current_label": stage_label(current),
            "is_terminal": True,
            "is_rejected": False,
            "is_hired": False,
            "stages": [],
        }

    current_rank = PIPELINE_ORDER.get(current, -1)
    stages = []
    for stage in PIPELINE_STAGES:
        rank = PIPELINE_ORDER[stage]
        if rank < current_rank:
            state = "completed"
        elif rank == current_rank:
            state = "completed" if current == ApplicationStatus.HIRED else "current"
        elif current == ApplicationStatus.HIRED:
            state = "completed"
        else:
            state = "pending"
        stages.append({"key": stage.value, "label": stage_label(stage), "state": state})

    return {
        "current_stage": current.value,
        "current_label": stage_label(current),
        "is_terminal": current in TERMINAL_STATUSES,
        "is_rejected": False,
        "is_hired": current == ApplicationStatus.HIRED,
        "stages": stages,
    }


@dataclass
class TransitionResult:
    application: Application
    old_status: ApplicationStatus
    new_status: ApplicationStatus
    job: Job
    history_entry: ApplicationStatusHistory


async def get_status_history(
    db: AsyncSession,
    application_id: uuid.UUID,
) -> list[ApplicationStatusHistory]:
    result = await db.execute(
        select(ApplicationStatusHistory)
        .where(ApplicationStatusHistory.application_id == application_id)
        .order_by(ApplicationStatusHistory.changed_at.asc())
    )
    return list(result.scalars().all())


async def record_initial_status(
    db: AsyncSession,
    application: Application,
    changed_by: uuid.UUID,
) -> None:
    """Record initial Applied stage when a candidate submits an application."""
    entry = ApplicationStatusHistory(
        application_id=application.id,
        old_status=None,
        new_status=ApplicationStatus.PENDING,
        changed_by=changed_by,
        changed_at=application.created_at or datetime.now(timezone.utc),
    )
    db.add(entry)


async def transition_application_status(
    db: AsyncSession,
    application: Application,
    job: Job,
    new_status: ApplicationStatus,
    changed_by: uuid.UUID,
    employer_notes: Optional[str] = None,
) -> TransitionResult:
    """Validate and apply a pipeline transition; does not commit."""
    old_status = application.status
    validate_transition(old_status, new_status)

    now = datetime.now(timezone.utc)
    application.status = new_status
    application.stage_entered_at = now
    if employer_notes is not None:
        application.employer_notes = employer_notes

    history_entry = ApplicationStatusHistory(
        application_id=application.id,
        old_status=old_status,
        new_status=new_status,
        changed_by=changed_by,
        changed_at=now,
        notes=employer_notes,
    )
    db.add(history_entry)

    return TransitionResult(
        application=application,
        old_status=old_status,
        new_status=new_status,
        job=job,
        history_entry=history_entry,
    )


NOTIFICATION_COPY: dict[ApplicationStatus, tuple[str, str]] = {
    ApplicationStatus.SHORTLISTED: (
        "Application Shortlisted",
        "Your application has been shortlisted.",
    ),
    ApplicationStatus.REVIEWED: (
        "Application Under Review",
        "Your application is under review.",
    ),
    ApplicationStatus.HIRED: (
        "Congratulations!",
        "Congratulations! You have been selected.",
    ),
    ApplicationStatus.REJECTED: (
        "Application Update",
        "Thank you for applying. We have decided to move forward with another candidate.",
    ),
}


def notification_for_status(new_status: ApplicationStatus) -> tuple[str, str] | None:
    return NOTIFICATION_COPY.get(new_status)
