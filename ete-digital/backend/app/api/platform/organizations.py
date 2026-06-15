"""
Domain Verification API
========================
Endpoints for HR employers to verify their company domain via DNS TXT record.

Flow:
  1. POST /api/organizations/init
       → Creates or fetches the employer's Organization record
       → Returns verification_token for DNS TXT

  2. GET  /api/organizations/me
       → Returns the employer's org including verification status

  3. POST /api/organizations/verify-dns
       → Performs live DNS TXT lookup for the token
       → If found: sets is_verified=True, verified_at=now

Error handling:
  - 403 if caller is not employer role
  - 400 if organization already verified
  - 422 if DNS lookup fails
"""

import secrets
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import require_role
from app.models.organization import Organization
from app.models.users import UserRole

router = APIRouter()


# ── Schemas ───────────────────────────────────────────────────────────────────


class OrgInitRequest(BaseModel):
    company_name: str
    domain: str  # e.g. "acme.com" (no https://)
    website: str  # e.g. "https://acme.com"


class OrgResponse(BaseModel):
    id: str
    company_name: str
    domain: str
    website: str
    is_verified: bool
    verification_token: str | None
    verification_method: str | None
    verified_at: datetime | None
    dns_txt_record: str | None  # The exact TXT record to add

    class Config:
        from_attributes = True


class VerifyDNSRequest(BaseModel):
    pass  # domain inferred from the org record


# ── Helpers ───────────────────────────────────────────────────────────────────


def _make_txt_record(token: str) -> str:
    return f"jobsrow-verification={token}"


async def _get_owner_org(db: AsyncSession, owner_id: uuid.UUID) -> Organization | None:
    result = await db.execute(select(Organization).where(Organization.owner_id == owner_id))
    return result.scalar_one_or_none()


async def _check_dns(domain: str, expected_token: str) -> bool:
    """
    Perform a live DNS TXT lookup.
    Uses dnspython if available, falls back to a basic socket approach.
    Never raises — returns False on any error.
    """
    try:
        import dns.resolver  # type: ignore  # noqa: PLC0415

        answers = dns.resolver.resolve(domain, "TXT")
        for rdata in answers:
            for txt_string in rdata.strings:
                decoded = txt_string.decode("utf-8", errors="ignore")
                if decoded == _make_txt_record(expected_token):
                    return True
        return False
    except Exception:
        return False


# ── Endpoints ─────────────────────────────────────────────────────────────────


@router.post("/init", response_model=OrgResponse, status_code=status.HTTP_201_CREATED)
async def init_organization(
    body: OrgInitRequest,
    current_user: dict = Depends(require_role(UserRole.HR)),
    db: AsyncSession = Depends(get_db),
):
    """
    Create (or return existing) organization record for the authenticated employer.
    Returns the DNS TXT verification record the user must add.
    """
    owner_id = uuid.UUID(current_user["user_id"])

    # Idempotent: if already exists for this owner, return it
    existing = await _get_owner_org(db, owner_id)
    if existing:
        return _to_response(existing)

    # Check domain not already taken by another org
    domain_clash = await db.execute(select(Organization).where(Organization.domain == body.domain.lower().strip()))
    if domain_clash.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Domain '{body.domain}' is already registered by another organisation.",
        )

    token = secrets.token_urlsafe(32)
    org = Organization(
        company_name=body.company_name,
        domain=body.domain.lower().strip(),
        website=body.website,
        owner_id=owner_id,
        is_verified=False,
        verification_method="dns_txt",
        verification_token=token,
    )
    db.add(org)
    await db.commit()
    await db.refresh(org)
    return _to_response(org)


@router.get("/me", response_model=OrgResponse)
async def get_my_organization(
    current_user: dict = Depends(require_role(UserRole.HR)),
    db: AsyncSession = Depends(get_db),
):
    """Return the caller's organization, or 404 if none exists yet."""
    owner_id = uuid.UUID(current_user["user_id"])
    org = await _get_owner_org(db, owner_id)
    if not org:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No organization found. Call POST /init first.",
        )
    return _to_response(org)


@router.post("/verify-dns", response_model=OrgResponse)
async def verify_domain_dns(
    current_user: dict = Depends(require_role(UserRole.HR)),
    db: AsyncSession = Depends(get_db),
):
    """
    Check DNS for the expected TXT record and mark the domain as verified.

    The client should display the TXT record from /init or /me, then call this
    endpoint after adding it to their DNS provider.
    """
    owner_id = uuid.UUID(current_user["user_id"])
    org = await _get_owner_org(db, owner_id)
    if not org:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No organization found. Call POST /init first.",
        )

    if org.is_verified:
        return _to_response(org)  # Already verified — idempotent

    if not org.verification_token:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No verification token found. Re-init the organization.",
        )

    dns_ok = await _check_dns(org.domain, org.verification_token)
    if not dns_ok:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=(
                f"DNS TXT record not found for '{org.domain}'. "
                f"Add this record: {_make_txt_record(org.verification_token)} "
                f"and wait for DNS propagation (up to 48h), then try again."
            ),
        )

    org.is_verified = True
    org.verified_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(org)
    return _to_response(org)


# ── Serialiser ────────────────────────────────────────────────────────────────


def _to_response(org: Organization) -> OrgResponse:
    return OrgResponse(
        id=str(org.id),
        company_name=org.company_name,
        domain=org.domain,
        website=org.website,
        is_verified=org.is_verified,
        verification_token=org.verification_token,
        verification_method=org.verification_method,
        verified_at=org.verified_at,
        dns_txt_record=_make_txt_record(org.verification_token) if org.verification_token else None,
    )
