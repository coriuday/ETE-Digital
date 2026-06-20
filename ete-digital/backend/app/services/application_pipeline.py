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
        ApplicationStatus.WITHDRAWN,
    }
)

STAGE_LABELS: dict[ApplicationStatus, str] = {
    ApplicationStatus.PENDING: "Applied",
    ApplicationStatus.SHORTLISTED: "Shortlisted",
    ApplicationStatus.REVIEWED: "Reviewed",
    ApplicationStatus.HIRED: "Hired",
    ApplicationStatus.REJECTED: "Rejected",
    ApplicationStatus.REOPENED: "Reopened",
    ApplicationStatus.WITHDRAWN: "Withdrawn",
}

# Positive pipeline stages in display order
PIPELINE_STAGES: list[ApplicationStatus] = [
    ApplicationStatus.PENDING,
    ApplicationStatus.SHORTLISTED,
    ApplicationStatus.REVIEWED,
    ApplicationStatus.HIRED,
]

REOPEN_NOTIFICATION = (
    "Application Reopened",
    "Your application has been reopened for consideration.",
)


def stage_label(s: ApplicationStatus) -> str:
    return STAGE_LABELS.get(s, s.value.replace("_", " ").title())


def is_locked(current: ApplicationStatus) -> bool:
    return current in TERMINAL_STATUSES


def validate_transition(
    old: ApplicationStatus,
    new: ApplicationStatus,
    *,
    special: str | None = None,
) -> None:
    """Raise HTTPException if transition is not allowed."""
    if special == "reopen":
        if old != ApplicationStatus.REJECTED or new != ApplicationStatus.REOPENED:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Only rejected applications can be reopened.",
            )
        return

    if special == "reopened_to_pending":
        if old != ApplicationStatus.REOPENED or new != ApplicationStatus.PENDING:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Reopened applications must return to Applied stage.",
            )
        return

    if special == "reapply":
        if old != ApplicationStatus.REJECTED or new != ApplicationStatus.PENDING:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Only rejected applications can be resubmitted.",
            )
        return

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

    if old == ApplicationStatus.REJECTED or old == ApplicationStatus.REOPENED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Use reopen or reapply workflow from {stage_label(old)}.",
        )

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
    """Return actions HR can take from the current stage."""
    if current in TERMINAL_STATUSES:
        return []

    if current == ApplicationStatus.REJECTED:
        return ["reopen"]

    if current == ApplicationStatus.REOPENED:
        return ["pending"]

    actions: list[str] = [ApplicationStatus.REJECTED.value]

    current_rank = PIPELINE_ORDER.get(current)
    if current_rank is None:
        return actions

    for stage, rank in PIPELINE_ORDER.items():
        if rank > current_rank:
            actions.insert(-1, stage.value)

    return actions


def build_pipeline_progress(current: ApplicationStatus) -> dict:
    """Lightweight progress object for candidate list views."""
    if current == ApplicationStatus.REJECTED:
        return {
            "current_stage": current.value,
            "current_label": stage_label(current),
            "is_terminal": False,
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

    if current == ApplicationStatus.REOPENED:
        return {
            "current_stage": current.value,
            "current_label": stage_label(current),
            "is_terminal": False,
            "is_rejected": False,
            "is_hired": False,
            "stages": [
                {
                    "key": ApplicationStatus.PENDING.value,
                    "label": stage_label(ApplicationStatus.PENDING),
                    "state": "completed",
                },
                *[
                    {
                        "key": s.value,
                        "label": stage_label(s),
                        "state": "pending",
                    }
                    for s in PIPELINE_STAGES
                    if s != ApplicationStatus.PENDING
                ],
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


@dataclass
class ReopenResult:
    application: Application
    job: Job
    old_status: ApplicationStatus
    history_entries: list[ApplicationStatusHistory]


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


def _apply_status_side_effects(application: Application, old: ApplicationStatus, new: ApplicationStatus) -> None:
    now = datetime.now(timezone.utc)
    if new == ApplicationStatus.REJECTED:
        application.rejected_at = now
    elif old in {ApplicationStatus.REJECTED, ApplicationStatus.REOPENED} and new == ApplicationStatus.PENDING:
        application.rejected_at = None


async def transition_application_status(
    db: AsyncSession,
    application: Application,
    job: Job,
    new_status: ApplicationStatus,
    changed_by: uuid.UUID,
    employer_notes: Optional[str] = None,
    *,
    special: str | None = None,
) -> TransitionResult:
    """Validate and apply a pipeline transition; does not commit."""
    old_status = application.status
    validate_transition(old_status, new_status, special=special)

    now = datetime.now(timezone.utc)
    application.status = new_status
    application.stage_entered_at = now
    if employer_notes is not None:
        application.employer_notes = employer_notes

    _apply_status_side_effects(application, old_status, new_status)

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


async def reopen_application_hr(
    db: AsyncSession,
    application: Application,
    job: Job,
    changed_by: uuid.UUID,
    reason: Optional[str] = None,
) -> ReopenResult:
    """HR reopen: rejected → reopened → pending in one transaction."""
    if application.status != ApplicationStatus.REJECTED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only rejected applications can be reopened.",
        )

    old_status = application.status
    history_entries: list[ApplicationStatusHistory] = []

    step1 = await transition_application_status(
        db=db,
        application=application,
        job=job,
        new_status=ApplicationStatus.REOPENED,
        changed_by=changed_by,
        employer_notes=reason,
        special="reopen",
    )
    history_entries.append(step1.history_entry)

    step2 = await transition_application_status(
        db=db,
        application=application,
        job=job,
        new_status=ApplicationStatus.PENDING,
        changed_by=changed_by,
        employer_notes=reason or "Reopened by HR",
        special="reopened_to_pending",
    )
    history_entries.append(step2.history_entry)

    return ReopenResult(
        application=application,
        job=job,
        old_status=old_status,
        history_entries=history_entries,
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


def notification_for_reopen() -> tuple[str, str]:
    return REOPEN_NOTIFICATION
