"""
Domain Verification & Team Management API
==========================================
Endpoints for HR employers to:
  1. Verify their company domain via DNS TXT record.
  2. Invite recruiters to join their organisation.
  3. Manage team members (list / change role / remove).

Invite flow:
  1. Owner calls POST /invite → receives a signed invite token (JWT, 7 days)
  2. The token is emailed to the invitee (email service hook — stub for now)
  3. Invitee calls POST /accept-invite?token=... → joins org with recruiter role
"""

import secrets
import uuid
from datetime import datetime, timedelta, timezone
from typing import List, Optional

import jwt
from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, EmailStr
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.database import get_db
from app.core.security import require_role
from app.models.organization import Organization
from app.models.organization_member import OrganizationMember
from app.models.users import User, UserRole

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


class InviteRequest(BaseModel):
    email: str
    role: str = "recruiter"  # recruiter | admin | hiring_manager | viewer


class AcceptInviteRequest(BaseModel):
    token: str


class MemberRoleUpdate(BaseModel):
    role: str  # recruiter | admin | hiring_manager | viewer


class MemberResponse(BaseModel):
    user_id: str
    email: str
    full_name: Optional[str]
    role: str
    joined_at: datetime
    invited_by: Optional[str]

    class Config:
        from_attributes = True


class InviteResponse(BaseModel):
    message: str
    invite_token: str  # In production, this would only be emailed — shown here for testing
    invite_link: str


VALID_ROLES = {"owner", "admin", "recruiter", "hiring_manager", "viewer"}

# ── Helpers ───────────────────────────────────────────────────────────────────


def _make_txt_record(token: str) -> str:
    return f"jobsrow-verification={token}"


async def _get_owner_org(db: AsyncSession, owner_id: uuid.UUID) -> Organization | None:
    result = await db.execute(select(Organization).where(Organization.owner_id == owner_id))
    return result.scalar_one_or_none()


async def _get_member_org(db: AsyncSession, user_id: uuid.UUID) -> Organization | None:
    """Return org for any member (owner OR regular member)."""
    # First check if owner
    owner_result = await db.execute(select(Organization).where(Organization.owner_id == user_id))
    org = owner_result.scalar_one_or_none()
    if org:
        return org
    # Then check membership
    mem_result = await db.execute(select(OrganizationMember).where(OrganizationMember.user_id == user_id))
    mem = mem_result.scalar_one_or_none()
    if mem:
        org_result = await db.execute(select(Organization).where(Organization.id == mem.organization_id))
        return org_result.scalar_one_or_none()
    return None


def _create_invite_token(org_id: str, email: str, role: str) -> str:
    """Create a signed invite JWT valid for 7 days."""
    payload = {
        "type": "org_invite",
        "org_id": org_id,
        "email": email,
        "role": role,
        "exp": datetime.now(timezone.utc) + timedelta(days=7),
    }
    return jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


def _decode_invite_token(token: str) -> dict:
    """Decode invite JWT. Raises HTTPException on invalid/expired."""
    try:
        payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
        if payload.get("type") != "org_invite":
            raise ValueError("Not an invite token")
        return payload
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired invite link.",
        )


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


# ── Team Management Endpoints ─────────────────────────────────────────────────


@router.post("/invite", response_model=InviteResponse)
async def invite_member(
    body: InviteRequest,
    current_user: dict = Depends(require_role(UserRole.HR)),
    db: AsyncSession = Depends(get_db),
):
    """
    Send an invite to a recruiter to join the caller's organisation.
    Only org owners and admins can invite.
    Returns a signed invite token (in production this would be emailed).
    """
    caller_id = uuid.UUID(current_user["user_id"])
    org = await _get_owner_org(db, caller_id)
    if not org:
        raise HTTPException(status_code=404, detail="You don't have an organisation. Create one first.")

    if body.role not in VALID_ROLES or body.role == "owner":
        raise HTTPException(status_code=400, detail=f"Invalid role. Choose from: {VALID_ROLES - {'owner'}}")

    # Check invitee isn't already a member
    existing_user = await db.execute(select(User).where(User.email == body.email))
    user = existing_user.scalar_one_or_none()
    if user:
        existing_mem = await db.execute(
            select(OrganizationMember).where(
                OrganizationMember.organization_id == org.id,
                OrganizationMember.user_id == user.id,
            )
        )
        if existing_mem.scalar_one_or_none():
            raise HTTPException(status_code=409, detail="This user is already a member of your organisation.")

    invite_token = _create_invite_token(str(org.id), body.email, body.role)
    invite_link = f"{settings.FRONTEND_URL}/hr/accept-invite?token={invite_token}"

    # TODO: Send email via email service when configured
    # await email_service.send_invite(body.email, org.company_name, invite_link)

    return InviteResponse(
        message=f"Invite created for {body.email}. Share the link or email it to them.",
        invite_token=invite_token,
        invite_link=invite_link,
    )


@router.post("/accept-invite")
async def accept_invite(
    token: str = Query(..., description="Invite token from the invite link"),
    current_user: dict = Depends(require_role(UserRole.HR)),
    db: AsyncSession = Depends(get_db),
):
    """
    Accept an organisation invite. The calling user joins the org with the invited role.
    The invite email must match the caller's email.
    """
    caller_id = uuid.UUID(current_user["user_id"])
    caller_email = current_user["email"]

    payload = _decode_invite_token(token)
    invited_email = payload["email"]
    org_id = uuid.UUID(payload["org_id"])
    role = payload["role"]

    if caller_email.lower() != invited_email.lower():
        raise HTTPException(
            status_code=403,
            detail=f"This invite was sent to {invited_email}. Log in with that email to accept.",
        )

    # Check org exists
    org_result = await db.execute(select(Organization).where(Organization.id == org_id))
    org = org_result.scalar_one_or_none()
    if not org:
        raise HTTPException(status_code=404, detail="Organisation not found.")

    # Idempotent — already a member?
    existing = await db.execute(
        select(OrganizationMember).where(
            OrganizationMember.organization_id == org_id,
            OrganizationMember.user_id == caller_id,
        )
    )
    if existing.scalar_one_or_none():
        return {"message": "You are already a member of this organisation.", "org_id": str(org_id)}

    member = OrganizationMember(
        organization_id=org_id,
        user_id=caller_id,
        role=role,
        invited_by=org.owner_id,
    )
    db.add(member)
    await db.commit()
    return {"message": f"Welcome to {org.company_name}! You joined as {role}.", "org_id": str(org_id)}


@router.get("/members", response_model=List[MemberResponse])
async def list_members(
    current_user: dict = Depends(require_role(UserRole.HR)),
    db: AsyncSession = Depends(get_db),
):
    """List all members of the caller's organisation (owner + all members)."""
    caller_id = uuid.UUID(current_user["user_id"])
    org = await _get_member_org(db, caller_id)
    if not org:
        raise HTTPException(status_code=404, detail="No organisation found.")

    # Owner entry
    owner_result = await db.execute(select(User).where(User.id == org.owner_id))
    owner = owner_result.scalar_one_or_none()

    members_result = await db.execute(select(OrganizationMember).where(OrganizationMember.organization_id == org.id))
    db_members = members_result.scalars().all()

    # Fetch user details for each member
    user_ids = [m.user_id for m in db_members]
    users_result = await db.execute(select(User).where(User.id.in_(user_ids)))
    users_map = {u.id: u for u in users_result.scalars().all()}

    result: List[MemberResponse] = []

    # Add owner
    if owner:
        result.append(
            MemberResponse(
                user_id=str(owner.id),
                email=owner.email,
                full_name=None,
                role="owner",
                joined_at=org.created_at,
                invited_by=None,
            )
        )

    for m in db_members:
        u = users_map.get(m.user_id)
        if u:
            result.append(
                MemberResponse(
                    user_id=str(u.id),
                    email=u.email,
                    full_name=None,
                    role=m.role,
                    joined_at=m.joined_at,
                    invited_by=str(m.invited_by) if m.invited_by else None,
                )
            )

    return result


@router.patch("/members/{user_id}/role")
async def update_member_role(
    user_id: str,
    body: MemberRoleUpdate,
    current_user: dict = Depends(require_role(UserRole.HR)),
    db: AsyncSession = Depends(get_db),
):
    """Change the role of a team member. Only org owner can do this."""
    caller_id = uuid.UUID(current_user["user_id"])
    org = await _get_owner_org(db, caller_id)
    if not org:
        raise HTTPException(status_code=403, detail="Only the organisation owner can change roles.")

    if body.role not in VALID_ROLES or body.role == "owner":
        raise HTTPException(status_code=400, detail=f"Invalid role. Choose from: {VALID_ROLES - {'owner'}}")

    target_id = uuid.UUID(user_id)
    mem_result = await db.execute(
        select(OrganizationMember).where(
            OrganizationMember.organization_id == org.id,
            OrganizationMember.user_id == target_id,
        )
    )
    member = mem_result.scalar_one_or_none()
    if not member:
        raise HTTPException(status_code=404, detail="Member not found in your organisation.")

    member.role = body.role
    await db.commit()
    return {"message": f"Role updated to '{body.role}'."}


@router.delete("/members/{user_id}")
async def remove_member(
    user_id: str,
    current_user: dict = Depends(require_role(UserRole.HR)),
    db: AsyncSession = Depends(get_db),
):
    """Remove a member from the organisation. Only org owner can do this."""
    caller_id = uuid.UUID(current_user["user_id"])
    org = await _get_owner_org(db, caller_id)
    if not org:
        raise HTTPException(status_code=403, detail="Only the organisation owner can remove members.")

    target_id = uuid.UUID(user_id)
    if target_id == caller_id:
        raise HTTPException(status_code=400, detail="You cannot remove yourself (org owner).")

    mem_result = await db.execute(
        select(OrganizationMember).where(
            OrganizationMember.organization_id == org.id,
            OrganizationMember.user_id == target_id,
        )
    )
    member = mem_result.scalar_one_or_none()
    if not member:
        raise HTTPException(status_code=404, detail="Member not found in your organisation.")

    await db.delete(member)
    await db.commit()
    return {"message": "Member removed from organisation."}
