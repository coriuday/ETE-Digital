"""
Subscription Billing API
========================
Stripe-backed subscription management for organisation plans.

Plans:
  free       — ₹0/mo    1 seat,  3 jobs
  starter    — ₹1,999/mo 3 seats, 10 jobs
  pro        — ₹4,999/mo 10 seats, unlimited jobs
  enterprise — Custom

Endpoints:
  GET  /api/billing/plan         — current plan + usage
  POST /api/billing/subscribe    — create Stripe Checkout Session (upgrade)
  POST /api/billing/portal       — Stripe Customer Portal (manage/cancel)
  POST /api/billing/webhook      — Stripe webhook handler

When STRIPE_SECRET_KEY is not set, the billing endpoints return simulation
responses so the UI still works in development.
"""

import uuid
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, Header, HTTPException, Request, status
from pydantic import BaseModel
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.database import get_db
from app.core.security import require_role
from app.models.jobs import Job
from app.models.organization import Organization
from app.models.organization_member import OrganizationMember
from app.models.subscription import PLAN_LIMITS, PlanTier, Subscription
from app.models.users import UserRole

router = APIRouter()

# ── Stripe initialisation (optional) ─────────────────────────────────────────

try:
    import stripe  # type: ignore

    stripe.api_key = getattr(settings, "STRIPE_SECRET_KEY", None)
    STRIPE_AVAILABLE = bool(stripe.api_key)
except ImportError:
    STRIPE_AVAILABLE = False
    stripe = None  # type: ignore

STRIPE_WEBHOOK_SECRET = getattr(settings, "STRIPE_WEBHOOK_SECRET", None)

# Price IDs — set these in .env after creating prices in Stripe Dashboard
STRIPE_PRICE_IDS = {
    "starter": getattr(settings, "STRIPE_PRICE_STARTER", "price_starter_test"),
    "pro": getattr(settings, "STRIPE_PRICE_PRO", "price_pro_test"),
}


# ── Schemas ───────────────────────────────────────────────────────────────────


class PlanResponse(BaseModel):
    plan: str
    status: str
    seat_limit: int
    job_limit: int
    seats_used: int
    jobs_active: int
    current_period_end: Optional[datetime]
    cancel_at_period_end: bool
    stripe_customer_id: Optional[str]


class SubscribeRequest(BaseModel):
    plan: str  # starter | pro | enterprise


class PortalResponse(BaseModel):
    url: str


class CheckoutResponse(BaseModel):
    url: str
    simulation: bool = False


# ── Helpers ───────────────────────────────────────────────────────────────────


async def _get_or_create_subscription(db: AsyncSession, org_id: uuid.UUID) -> Subscription:
    """Fetch the org's subscription or auto-create a free plan record."""
    result = await db.execute(select(Subscription).where(Subscription.org_id == org_id))
    sub = result.scalar_one_or_none()
    if not sub:
        sub = Subscription(org_id=org_id, plan=PlanTier.FREE, status="active")
        db.add(sub)
        await db.commit()
        await db.refresh(sub)
    return sub


async def _get_caller_org(db: AsyncSession, user_id: uuid.UUID) -> Optional[Organization]:
    result = await db.execute(select(Organization).where(Organization.owner_id == user_id))
    return result.scalar_one_or_none()


async def _count_active_jobs(db: AsyncSession, org_id: uuid.UUID) -> int:
    """Count jobs posted by members of this org that are still active."""
    # Get all user IDs in this org (owner + members)
    owner_result = await db.execute(select(Organization.owner_id).where(Organization.id == org_id))
    owner_id = owner_result.scalar_one_or_none()

    member_result = await db.execute(select(OrganizationMember.user_id).where(OrganizationMember.organization_id == org_id))
    member_ids = [r[0] for r in member_result.all()]
    all_ids = list(set(member_ids + ([owner_id] if owner_id else [])))

    if not all_ids:
        return 0

    count_result = await db.execute(
        select(func.count(Job.id)).where(
            Job.created_by.in_(all_ids),
            Job.is_active == True,  # noqa: E712
        )
    )
    return count_result.scalar_one() or 0


async def _count_members(db: AsyncSession, org_id: uuid.UUID) -> int:
    """Count org members (owner counts as 1)."""
    mem_result = await db.execute(
        select(func.count(OrganizationMember.id)).where(OrganizationMember.organization_id == org_id)
    )
    member_count = mem_result.scalar_one() or 0
    return member_count + 1  # +1 for owner


# ── Endpoints ─────────────────────────────────────────────────────────────────


@router.get("/plan", response_model=PlanResponse)
async def get_plan(
    current_user: dict = Depends(require_role(UserRole.HR)),
    db: AsyncSession = Depends(get_db),
):
    """Return the caller's current plan, usage, and limits."""
    caller_id = uuid.UUID(current_user["user_id"])
    org = await _get_caller_org(db, caller_id)
    if not org:
        raise HTTPException(status_code=404, detail="No organisation found. Create one first.")

    sub = await _get_or_create_subscription(db, org.id)
    seats_used = await _count_members(db, org.id)
    jobs_active = await _count_active_jobs(db, org.id)

    return PlanResponse(
        plan=sub.plan.value,
        status=sub.status,
        seat_limit=sub.get_seat_limit(),
        job_limit=sub.get_job_limit(),
        seats_used=seats_used,
        jobs_active=jobs_active,
        current_period_end=sub.current_period_end,
        cancel_at_period_end=sub.cancel_at_period_end,
        stripe_customer_id=sub.stripe_customer_id,
    )


@router.post("/subscribe", response_model=CheckoutResponse)
async def subscribe(
    body: SubscribeRequest,
    current_user: dict = Depends(require_role(UserRole.HR)),
    db: AsyncSession = Depends(get_db),
):
    """
    Create a Stripe Checkout Session for upgrading to starter or pro.
    If Stripe keys are not configured, returns a simulation response.
    """
    if body.plan not in ("starter", "pro"):
        raise HTTPException(status_code=400, detail="Choose plan: starter or pro. For enterprise, contact us.")

    caller_id = uuid.UUID(current_user["user_id"])
    org = await _get_caller_org(db, caller_id)
    if not org:
        raise HTTPException(status_code=404, detail="No organisation found.")

    sub = await _get_or_create_subscription(db, org.id)

    if not STRIPE_AVAILABLE:
        # Simulation mode — pretend the upgrade happened
        sub.plan = PlanTier(body.plan)
        sub.status = "active"
        sub.current_period_end = None
        await db.commit()
        return CheckoutResponse(
            url=f"{settings.FRONTEND_URL}/hr/billing?upgraded={body.plan}",
            simulation=True,
        )

    # Ensure Stripe customer exists
    if not sub.stripe_customer_id:
        customer = stripe.Customer.create(email=current_user["email"], name=org.company_name)
        sub.stripe_customer_id = customer.id
        await db.commit()

    price_id = STRIPE_PRICE_IDS.get(body.plan)
    session = stripe.checkout.Session.create(
        customer=sub.stripe_customer_id,
        payment_method_types=["card"],
        mode="subscription",
        line_items=[{"price": price_id, "quantity": 1}],
        success_url=f"{settings.FRONTEND_URL}/hr/billing?success=1",
        cancel_url=f"{settings.FRONTEND_URL}/hr/billing?canceled=1",
        metadata={"org_id": str(org.id), "plan": body.plan},
    )
    return CheckoutResponse(url=session.url, simulation=False)


@router.post("/portal", response_model=PortalResponse)
async def billing_portal(
    current_user: dict = Depends(require_role(UserRole.HR)),
    db: AsyncSession = Depends(get_db),
):
    """
    Return a Stripe Customer Portal URL so the user can manage/cancel their subscription.
    """
    caller_id = uuid.UUID(current_user["user_id"])
    org = await _get_caller_org(db, caller_id)
    if not org:
        raise HTTPException(status_code=404, detail="No organisation found.")

    sub = await _get_or_create_subscription(db, org.id)

    if not STRIPE_AVAILABLE or not sub.stripe_customer_id:
        return PortalResponse(url=f"{settings.FRONTEND_URL}/hr/billing")

    session = stripe.billing_portal.Session.create(
        customer=sub.stripe_customer_id,
        return_url=f"{settings.FRONTEND_URL}/hr/billing",
    )
    return PortalResponse(url=session.url)


@router.post("/webhook", status_code=status.HTTP_200_OK)
async def stripe_webhook(
    request: Request,
    stripe_signature: str = Header(None, alias="stripe-signature"),
    db: AsyncSession = Depends(get_db),
):
    """
    Handle Stripe webhook events:
      customer.subscription.updated → update plan/status/period
      customer.subscription.deleted → downgrade to free
    """
    if not STRIPE_AVAILABLE or not STRIPE_WEBHOOK_SECRET:
        return {"received": True, "simulation": True}

    payload = await request.body()
    try:
        event = stripe.Webhook.construct_event(payload, stripe_signature, STRIPE_WEBHOOK_SECRET)
    except stripe.error.SignatureVerificationError:
        raise HTTPException(status_code=400, detail="Invalid Stripe signature.")

    obj = event["data"]["object"]

    if event["type"] in ("customer.subscription.updated", "customer.subscription.created"):
        result = await db.execute(select(Subscription).where(Subscription.stripe_subscription_id == obj["id"]))
        sub = result.scalar_one_or_none()

        # Try to find by customer if no match by sub ID
        if not sub:
            result = await db.execute(select(Subscription).where(Subscription.stripe_customer_id == obj["customer"]))
            sub = result.scalar_one_or_none()

        if sub:
            # Map Stripe price to our plan
            price_id = obj["items"]["data"][0]["price"]["id"] if obj.get("items") else None
            reverse_map = {v: k for k, v in STRIPE_PRICE_IDS.items()}
            plan_name = reverse_map.get(price_id, sub.plan.value)

            sub.stripe_subscription_id = obj["id"]
            sub.plan = PlanTier(plan_name)
            sub.status = obj["status"]
            sub.current_period_start = (
                datetime.fromtimestamp(obj["current_period_start"], tz=timezone.utc)
                if obj.get("current_period_start")
                else None
            )
            sub.current_period_end = (
                datetime.fromtimestamp(obj["current_period_end"], tz=timezone.utc) if obj.get("current_period_end") else None
            )
            sub.cancel_at_period_end = obj.get("cancel_at_period_end", False)
            await db.commit()

    elif event["type"] == "customer.subscription.deleted":
        result = await db.execute(select(Subscription).where(Subscription.stripe_customer_id == obj["customer"]))
        sub = result.scalar_one_or_none()
        if sub:
            sub.plan = PlanTier.FREE
            sub.status = "canceled"
            sub.stripe_subscription_id = None
            await db.commit()

    return {"received": True}
