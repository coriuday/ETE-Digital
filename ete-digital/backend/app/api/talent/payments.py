"""
Payments API — Stripe Escrow Endpoints
========================================
Handles the full lifecycle of tryout payments:

  HR creates PaymentIntent → candidate pays (funds held in escrow)
  HR approves submission   → capture (candidate receives funds)
  HR rejects submission    → refund  (employer gets money back)
  Stripe events            → webhook (idempotent status sync)

Simulation mode:
  When STRIPE_SECRET_KEY is not set, all operations succeed silently
  and return simulated IDs. This lets the full UI/flow work in dev
  without real Stripe credentials.
"""

from fastapi import APIRouter, Depends, HTTPException, Request, Header, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime, timezone
from typing import Optional
import uuid
import logging

from app.core.database import get_db
from app.core.security import get_current_user, require_role
from app.models.users import UserRole
from app.models.tryouts import TryoutSubmission, Tryout, PaymentStatus, SubmissionStatus
from app.models.jobs import Job
from app.services.payment import payment_service
from app.services.notification_service import notification_service
from pydantic import BaseModel

logger = logging.getLogger(__name__)

router = APIRouter()


# ── Schemas ───────────────────────────────────────────────────────────────────


class EscrowRequest(BaseModel):
    """HR initiates escrow for a tryout submission."""

    currency: str = "inr"


class EscrowResponse(BaseModel):
    submission_id: str
    payment_intent_id: str
    client_secret: str
    amount: int
    currency: str
    payment_status: str
    checkout_url: Optional[str] = None


class PaymentActionResponse(BaseModel):
    submission_id: str
    payment_status: str
    message: str


# ── Helpers ───────────────────────────────────────────────────────────────────


async def _get_submission_with_auth(
    db: AsyncSession,
    submission_id: uuid.UUID,
    hr_id: uuid.UUID,
) -> tuple[TryoutSubmission, Tryout]:
    """Fetch submission + verify HR owns the parent job."""
    result = await db.execute(select(TryoutSubmission).where(TryoutSubmission.id == submission_id))
    submission = result.scalar_one_or_none()
    if not submission:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Submission not found")

    tryout_result = await db.execute(select(Tryout).where(Tryout.id == submission.tryout_id))
    tryout = tryout_result.scalar_one_or_none()
    if not tryout:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tryout not found")

    job_result = await db.execute(select(Job).where(Job.id == tryout.job_id))
    job = job_result.scalar_one_or_none()
    if not job or job.employer_id != hr_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to manage payments for this submission",
        )

    return submission, tryout


# ── Endpoints ─────────────────────────────────────────────────────────────────


@router.post(
    "/tryout/{submission_id}/escrow",
    response_model=EscrowResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Escrow payment for a tryout submission",
)
async def escrow_payment(
    submission_id: str,
    body: EscrowRequest,
    current_user: dict = Depends(require_role(UserRole.HR)),
    db: AsyncSession = Depends(get_db),
):
    """
    HR creates a PaymentIntent for a tryout submission.
    Funds are held in escrow (manual capture) until HR approves or rejects.
    Returns client_secret so the frontend can show Stripe's payment element.
    """
    sub_id = uuid.UUID(submission_id)
    hr_id = uuid.UUID(current_user["user_id"])

    submission, tryout = await _get_submission_with_auth(db, sub_id, hr_id)

    if tryout.payment_amount <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This tryout has no payment amount configured",
        )

    if submission.payment_status not in (PaymentStatus.PENDING, PaymentStatus.FAILED):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Payment already in state: {submission.payment_status.value}",
        )

    client_secret, intent_id = payment_service.create_payment_intent(
        amount_minor_units=tryout.payment_amount,
        currency=body.currency,
        capture_method="manual",
        metadata={
            "tryout_id": str(tryout.id),
            "submission_id": str(submission.id),
            "candidate_id": str(submission.candidate_id),
        },
    )

    if not intent_id:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Failed to create payment intent — please try again",
        )

    # Persist the intent ID and update status
    submission.payment_intent_id = intent_id
    submission.payment_status = PaymentStatus.ESCROWED
    submission.payment_escrowed_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(submission)

    # Notify candidate
    await notification_service.create_and_push(
        db=db,
        user_id=str(submission.candidate_id),
        notif_type="payment",
        title="Payment Escrowed 🔒",
        message=f"₹{tryout.payment_amount // 100:,} has been held in escrow for your tryout submission. Complete your work to get paid!",
        link=f"/tryouts/{tryout.id}/payment",
    )

    return EscrowResponse(
        submission_id=str(submission.id),
        payment_intent_id=intent_id,
        client_secret=client_secret or "",
        amount=tryout.payment_amount,
        currency=body.currency,
        payment_status=submission.payment_status.value,
    )


@router.post(
    "/tryout/{submission_id}/release",
    response_model=PaymentActionResponse,
    summary="Release escrowed payment to candidate",
)
async def release_payment(
    submission_id: str,
    current_user: dict = Depends(require_role(UserRole.HR)),
    db: AsyncSession = Depends(get_db),
):
    """
    HR approves the submission and releases the escrowed payment to the candidate.
    Calls Stripe capture on the existing PaymentIntent.
    """
    sub_id = uuid.UUID(submission_id)
    hr_id = uuid.UUID(current_user["user_id"])

    submission, tryout = await _get_submission_with_auth(db, sub_id, hr_id)

    if submission.payment_status != PaymentStatus.ESCROWED:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Cannot release — current payment status: {submission.payment_status.value}",
        )

    if not submission.payment_intent_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No PaymentIntent on record — run escrow first",
        )

    success = payment_service.capture_payment(submission.payment_intent_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Stripe capture failed — please try again",
        )

    submission.payment_status = PaymentStatus.RELEASED
    submission.payment_released_at = datetime.now(timezone.utc)
    if submission.status not in (SubmissionStatus.PASSED,):
        submission.status = SubmissionStatus.PASSED
    await db.commit()

    await notification_service.create_and_push(
        db=db,
        user_id=str(submission.candidate_id),
        notif_type="payment",
        title="Payment Released 🎉",
        message=f"₹{tryout.payment_amount // 100:,} has been released to you for your tryout submission!",
        link=f"/tryouts/{tryout.id}/payment",
    )

    logger.info(f"[Payment] Released {submission.payment_intent_id} for submission {sub_id}")
    return PaymentActionResponse(
        submission_id=str(submission.id),
        payment_status=PaymentStatus.RELEASED.value,
        message="Payment successfully released to candidate",
    )


@router.post(
    "/tryout/{submission_id}/refund",
    response_model=PaymentActionResponse,
    summary="Refund escrowed payment to HR/employer",
)
async def refund_payment(
    submission_id: str,
    current_user: dict = Depends(require_role(UserRole.HR)),
    db: AsyncSession = Depends(get_db),
):
    """
    HR rejects the submission and returns the escrowed funds to the employer.
    Calls Stripe refund on the existing PaymentIntent.
    """
    sub_id = uuid.UUID(submission_id)
    hr_id = uuid.UUID(current_user["user_id"])

    submission, tryout = await _get_submission_with_auth(db, sub_id, hr_id)

    if submission.payment_status != PaymentStatus.ESCROWED:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Cannot refund — current payment status: {submission.payment_status.value}",
        )

    if not submission.payment_intent_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No PaymentIntent on record — nothing to refund",
        )

    success = payment_service.refund_payment(
        submission.payment_intent_id,
        reason="requested_by_customer",
    )
    if not success:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Stripe refund failed — please try again",
        )

    submission.payment_status = PaymentStatus.REFUNDED
    if submission.status not in (SubmissionStatus.FAILED,):
        submission.status = SubmissionStatus.FAILED
    await db.commit()

    await notification_service.create_and_push(
        db=db,
        user_id=str(submission.candidate_id),
        notif_type="payment",
        title="Tryout Not Approved",
        message="Your tryout submission was not approved. The escrowed payment has been returned to the employer.",
        link=f"/tryouts/{tryout.id}",
    )

    logger.info(f"[Payment] Refunded {submission.payment_intent_id} for submission {sub_id}")
    return PaymentActionResponse(
        submission_id=str(submission.id),
        payment_status=PaymentStatus.REFUNDED.value,
        message="Payment refunded to employer",
    )


@router.get(
    "/tryout/{submission_id}/status",
    summary="Get payment status for a submission",
)
async def get_payment_status(
    submission_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get current payment status for a submission (visible to HR and the candidate who submitted)."""
    sub_id = uuid.UUID(submission_id)
    user_id = uuid.UUID(current_user["user_id"])
    user_role = current_user.get("role")

    result = await db.execute(select(TryoutSubmission).where(TryoutSubmission.id == sub_id))
    submission = result.scalar_one_or_none()
    if not submission:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Submission not found")

    # Candidates can only see their own
    if user_role == "candidate" and submission.candidate_id != user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    tryout_result = await db.execute(select(Tryout).where(Tryout.id == submission.tryout_id))
    tryout = tryout_result.scalar_one_or_none()

    return {
        "submission_id": str(submission.id),
        "payment_status": submission.payment_status.value,
        "payment_amount": tryout.payment_amount if tryout else 0,
        "payment_currency": tryout.payment_currency if tryout else "INR",
        "payment_escrowed_at": submission.payment_escrowed_at.isoformat() if submission.payment_escrowed_at else None,
        "payment_released_at": submission.payment_released_at.isoformat() if submission.payment_released_at else None,
        "submission_status": submission.status.value,
    }


@router.post(
    "/webhook",
    status_code=status.HTTP_200_OK,
    summary="Stripe webhook receiver",
    include_in_schema=False,  # Hidden from docs for security
)
async def stripe_webhook(
    request: Request,
    stripe_signature: Optional[str] = Header(None, alias="stripe-signature"),
    db: AsyncSession = Depends(get_db),
):
    """
    Receives and verifies Stripe webhook events.
    Handles: payment_intent.succeeded, payment_intent.payment_failed,
             charge.refunded for idempotent status sync.

    The endpoint is intentionally excluded from API docs.
    """
    payload = await request.body()

    if stripe_signature:
        event = payment_service.verify_webhook(payload, stripe_signature)
        if not event:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid webhook signature",
            )
    else:
        # Dev/simulation: parse raw JSON without signature check
        import json

        try:
            event = json.loads(payload)
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid payload")

    event_type = event.get("type", "")
    intent_data = event.get("data", {}).get("object", {})
    intent_id = intent_data.get("id", "")

    if not intent_id or not event_type:
        return {"received": True}

    # Find the submission with this PaymentIntent
    result = await db.execute(select(TryoutSubmission).where(TryoutSubmission.payment_intent_id == intent_id))
    submission = result.scalar_one_or_none()

    if not submission:
        logger.warning(f"[Webhook] No submission found for intent {intent_id}")
        return {"received": True}

    now = datetime.now(timezone.utc)

    if event_type == "payment_intent.succeeded":
        if submission.payment_status != PaymentStatus.RELEASED:
            submission.payment_status = PaymentStatus.RELEASED
            submission.payment_released_at = now
            await db.commit()
            logger.info(f"[Webhook] Released payment for submission {submission.id}")

    elif event_type == "payment_intent.payment_failed":
        if submission.payment_status not in (PaymentStatus.RELEASED, PaymentStatus.REFUNDED):
            submission.payment_status = PaymentStatus.FAILED
            await db.commit()
            logger.warning(f"[Webhook] Payment failed for submission {submission.id}")

    elif event_type in ("charge.refunded", "payment_intent.canceled"):
        if submission.payment_status not in (PaymentStatus.RELEASED, PaymentStatus.REFUNDED):
            submission.payment_status = PaymentStatus.REFUNDED
            await db.commit()
            logger.info(f"[Webhook] Refunded for submission {submission.id}")

    return {"received": True}
