"""
Domain Verification & Team Management API
==========================================
Employer organisation flows:
  - Domain path: DNS TXT / HTML file / meta tag verification
  - Standard path: company profile + admin review (trust tiers)
  - Team invites and member management
"""

import secrets
import uuid
from datetime import datetime, timedelta, timezone
from typing import List, Optional

import jwt
from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.database import get_db
from app.core.security import get_current_user, require_role
from app.models.organization import Organization
from app.models.organization_member import OrganizationMember
from app.models.users import User, UserRole
from app.services.domain_auth import (
    check_html_file,
    check_meta_tag,
    domain_from_website,
    extract_email_domain,
    is_blocked_free_domain,
    is_corporate_email,
    make_html_filename,
    make_meta_content,
    make_txt_record,
    normalize_domain,
)
from app.services.email import email_service
from app.services.organization_service import sync_user_email_domain_fields

router = APIRouter()

VALID_ROLES = {"owner", "admin", "recruiter", "hiring_manager", "viewer"}
VALID_VERIFICATION_METHODS = {"dns_txt", "html_file", "meta_tag"}


# ── Schemas ───────────────────────────────────────────────────────────────────


class OrgInitRequest(BaseModel):
    company_name: str
    domain: str
    website: str
    verification_method: str = "dns_txt"


class OrgStandardInitRequest(BaseModel):
    company_name: str
    website: str
    linkedin_url: Optional[str] = None
    company_size: Optional[str] = None
    industry: Optional[str] = None
    gst_number: Optional[str] = None


class OrgUpdateRequest(BaseModel):
    company_name: Optional[str] = Field(None, min_length=1, max_length=255)
    website: Optional[str] = Field(None, min_length=1, max_length=255)
    linkedin_url: Optional[str] = None
    company_size: Optional[str] = None
    industry: Optional[str] = None
    reapply_cooldown_days: Optional[int] = Field(None, ge=-1, le=365)


class OrgResponse(BaseModel):
    id: str
    company_name: str
    domain: str
    website: str
    is_verified: bool
    trust_tier: str
    registration_path: str
    verification_token: str | None
    verification_method: str | None
    verified_at: datetime | None
    dns_txt_record: str | None
    html_file_name: str | None
    meta_tag_snippet: str | None
    linkedin_url: str | None = None
    company_size: str | None = None
    industry: str | None = None
    reapply_cooldown_days: int = 60

    class Config:
        from_attributes = True


class InviteRequest(BaseModel):
    email: EmailStr
    role: str = "recruiter"


class MemberRoleUpdate(BaseModel):
    role: str


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
    invite_link: str


# ── Helpers ───────────────────────────────────────────────────────────────────


async def _get_owner_org(db: AsyncSession, owner_id: uuid.UUID) -> Organization | None:
    result = await db.execute(select(Organization).where(Organization.owner_id == owner_id))
    return result.scalar_one_or_none()


async def _get_member_org(db: AsyncSession, user_id: uuid.UUID) -> Organization | None:
    owner_result = await db.execute(select(Organization).where(Organization.owner_id == user_id))
    org = owner_result.scalar_one_or_none()
    if org:
        return org
    mem_result = await db.execute(select(OrganizationMember).where(OrganizationMember.user_id == user_id))
    mem = mem_result.scalar_one_or_none()
    if mem:
        org_result = await db.execute(select(Organization).where(Organization.id == mem.organization_id))
        return org_result.scalar_one_or_none()
    return None


def _create_invite_token(org_id: str, email: str, role: str) -> str:
    payload = {
        "type": "org_invite",
        "org_id": org_id,
        "email": email,
        "role": role,
        "exp": datetime.now(timezone.utc) + timedelta(days=7),
    }
    return jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


def _decode_invite_token(token: str) -> dict:
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
    try:
        import dns.resolver  # type: ignore  # noqa: PLC0415

        answers = dns.resolver.resolve(domain, "TXT")
        for rdata in answers:
            for txt_string in rdata.strings:
                decoded = txt_string.decode("utf-8", errors="ignore")
                if decoded == make_txt_record(expected_token):
                    return True
        return False
    except Exception:
        return False


async def _run_verification(org: Organization) -> bool:
    if not org.verification_token:
        return False
    method = org.verification_method or "dns_txt"
    token = org.verification_token
    if method == "dns_txt":
        return await _check_dns(org.domain, token)
    if method == "html_file":
        return await check_html_file(org.website, token)
    if method == "meta_tag":
        return await check_meta_tag(org.website, token)
    return False


def _to_response(org: Organization) -> OrgResponse:
    token = org.verification_token
    return OrgResponse(
        id=str(org.id),
        company_name=org.company_name,
        domain=org.domain,
        website=org.website,
        is_verified=org.is_verified,
        trust_tier=org.trust_tier,
        registration_path=org.registration_path,
        verification_token=token,
        verification_method=org.verification_method,
        verified_at=org.verified_at,
        dns_txt_record=make_txt_record(token) if token else None,
        html_file_name=make_html_filename(token) if token else None,
        meta_tag_snippet=(f'<meta name="jobsrow-verify" content="{make_meta_content(token)}" />' if token else None),
        linkedin_url=org.linkedin_url,
        company_size=org.company_size,
        industry=org.industry,
        reapply_cooldown_days=org.reapply_cooldown_days,
    )


async def _link_owner_to_org(db: AsyncSession, user_id: uuid.UUID, org: Organization) -> None:
    user_result = await db.execute(select(User).where(User.id == user_id))
    user = user_result.scalar_one_or_none()
    if user:
        user.organization_id = org.id
        await sync_user_email_domain_fields(user)


# ── Endpoints ─────────────────────────────────────────────────────────────────


@router.post("/init", response_model=OrgResponse, status_code=status.HTTP_201_CREATED)
async def init_organization(
    body: OrgInitRequest,
    current_user: dict = Depends(require_role(UserRole.HR)),
    db: AsyncSession = Depends(get_db),
):
    """Domain path: register company and get verification instructions."""
    owner_id = uuid.UUID(current_user["user_id"])
    caller_email = current_user["email"]

    if body.verification_method not in VALID_VERIFICATION_METHODS:
        raise HTTPException(status_code=400, detail="Choose verification_method: dns_txt, html_file, or meta_tag")

    domain = normalize_domain(body.domain)
    if is_blocked_free_domain(domain):
        raise HTTPException(
            status_code=400,
            detail="Free email domains (Gmail, Yahoo, etc.) cannot be used for domain verification. Use the standard registration path.",
        )

    if is_corporate_email(caller_email) and extract_email_domain(caller_email) != domain:
        raise HTTPException(
            status_code=400,
            detail=f"Your email domain must match '{domain}' for domain verification.",
        )

    existing = await _get_owner_org(db, owner_id)
    if existing:
        return _to_response(existing)

    clash = await db.execute(select(Organization).where(Organization.domain == domain))
    if clash.scalar_one_or_none():
        raise HTTPException(status_code=409, detail=f"Domain '{domain}' is already registered.")

    token = secrets.token_urlsafe(32)
    org = Organization(
        company_name=body.company_name,
        domain=domain,
        website=body.website if body.website.startswith("http") else f"https://{body.website}",
        owner_id=owner_id,
        is_verified=False,
        trust_tier="unverified",
        registration_path="domain",
        verification_method=body.verification_method,
        verification_token=token,
    )
    db.add(org)
    await _link_owner_to_org(db, owner_id, org)
    await db.commit()
    await db.refresh(org)
    return _to_response(org)


@router.post("/init-standard", response_model=OrgResponse, status_code=status.HTTP_201_CREATED)
async def init_standard_organization(
    body: OrgStandardInitRequest,
    current_user: dict = Depends(require_role(UserRole.HR)),
    db: AsyncSession = Depends(get_db),
):
    """Standard path: personal/free email employers submit company info for admin review."""
    owner_id = uuid.UUID(current_user["user_id"])

    existing = await _get_owner_org(db, owner_id)
    if existing:
        return _to_response(existing)

    website = body.website if body.website.startswith("http") else f"https://{body.website}"
    domain = domain_from_website(website) or f"org-{secrets.token_hex(4)}.local"

    clash = await db.execute(select(Organization).where(Organization.domain == domain))
    if clash.scalar_one_or_none():
        domain = f"org-{secrets.token_hex(4)}.local"

    org = Organization(
        company_name=body.company_name,
        domain=domain,
        website=website,
        owner_id=owner_id,
        is_verified=False,
        trust_tier="pending",
        registration_path="standard",
        verification_method=None,
        verification_token=None,
        linkedin_url=body.linkedin_url,
        company_size=body.company_size,
        industry=body.industry,
        gst_number=body.gst_number,
    )
    db.add(org)
    await _link_owner_to_org(db, owner_id, org)
    await db.commit()
    await db.refresh(org)
    return _to_response(org)


@router.get("/me", response_model=OrgResponse)
async def get_my_organization(
    current_user: dict = Depends(require_role(UserRole.HR)),
    db: AsyncSession = Depends(get_db),
):
    user_id = uuid.UUID(current_user["user_id"])
    org = await _get_member_org(db, user_id)
    if not org:
        raise HTTPException(status_code=404, detail="No organization found.")
    return _to_response(org)


@router.patch("/me", response_model=OrgResponse)
async def update_my_organization(
    payload: OrgUpdateRequest,
    current_user: dict = Depends(require_role(UserRole.HR)),
    db: AsyncSession = Depends(get_db),
):
    """Update company profile fields (name, website, LinkedIn, size, industry)."""
    user_id = uuid.UUID(current_user["user_id"])
    org = await _get_owner_org(db, user_id)
    if not org:
        raise HTTPException(status_code=404, detail="No organization found.")

    updates = payload.model_dump(exclude_unset=True)
    if not updates:
        raise HTTPException(status_code=400, detail="No fields to update.")

    if "company_name" in updates:
        org.company_name = updates["company_name"]
    if "website" in updates:
        org.website = updates["website"]
    if "linkedin_url" in updates:
        org.linkedin_url = updates["linkedin_url"]
    if "company_size" in updates:
        org.company_size = updates["company_size"]
    if "industry" in updates:
        org.industry = updates["industry"]
    if "reapply_cooldown_days" in updates:
        days = updates["reapply_cooldown_days"]
        if days not in (-1, 30, 60, 90):
            raise HTTPException(status_code=400, detail="reapply_cooldown_days must be 30, 60, 90, or -1 (never).")
        org.reapply_cooldown_days = days

    await db.commit()
    await db.refresh(org)
    return _to_response(org)


@router.post("/verify", response_model=OrgResponse)
async def verify_organization(
    current_user: dict = Depends(require_role(UserRole.HR)),
    db: AsyncSession = Depends(get_db),
):
    """Run verification check for the org's chosen method (DNS / HTML / meta)."""
    owner_id = uuid.UUID(current_user["user_id"])
    org = await _get_owner_org(db, owner_id)
    if not org:
        raise HTTPException(status_code=404, detail="No organization found.")
    if org.registration_path != "domain":
        raise HTTPException(status_code=400, detail="Standard-path orgs are verified via admin review.")
    if org.is_verified:
        return _to_response(org)

    ok = await _run_verification(org)
    if not ok:
        method = org.verification_method or "dns_txt"
        raise HTTPException(
            status_code=422,
            detail=f"Verification failed for method '{method}'. Check your setup and try again.",
        )

    org.is_verified = True
    org.trust_tier = "verified"
    org.verified_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(org)
    return _to_response(org)


@router.post("/verify-dns", response_model=OrgResponse)
async def verify_domain_dns(
    current_user: dict = Depends(require_role(UserRole.HR)),
    db: AsyncSession = Depends(get_db),
):
    """Backward-compatible DNS-only verify endpoint."""
    return await verify_organization(current_user=current_user, db=db)


@router.post("/invite", response_model=InviteResponse)
async def invite_member(
    body: InviteRequest,
    current_user: dict = Depends(require_role(UserRole.HR)),
    db: AsyncSession = Depends(get_db),
):
    caller_id = uuid.UUID(current_user["user_id"])
    org = await _get_owner_org(db, caller_id)
    if not org:
        raise HTTPException(status_code=404, detail="Create an organisation first.")

    if body.role not in VALID_ROLES or body.role == "owner":
        raise HTTPException(status_code=400, detail=f"Invalid role. Choose from: {VALID_ROLES - {'owner'}}")

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
            raise HTTPException(status_code=409, detail="User is already a member.")

    invite_token = _create_invite_token(str(org.id), body.email, body.role)
    invite_link = f"{settings.FRONTEND_URL}/accept-invite?token={invite_token}"

    email_service.send_org_invite(body.email, org.company_name, invite_link)

    return InviteResponse(
        message=f"Invite sent to {body.email}.",
        invite_link=invite_link,
    )


@router.post("/accept-invite")
async def accept_invite(
    token: str = Query(..., description="Invite token from the invite link"),
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Accept an organisation invite. Requires login; invite email must match account email."""
    if current_user.get("role") not in ("employer", "admin"):
        raise HTTPException(status_code=403, detail="Only employer accounts can accept team invites.")

    caller_id = uuid.UUID(current_user["user_id"])
    caller_email = current_user["email"]
    payload = _decode_invite_token(token)
    org_id = uuid.UUID(payload["org_id"])
    role = payload["role"]

    if caller_email.lower() != payload["email"].lower():
        raise HTTPException(
            status_code=403,
            detail=f"This invite was sent to {payload['email']}. Log in with that email.",
        )

    org_result = await db.execute(select(Organization).where(Organization.id == org_id))
    org = org_result.scalar_one_or_none()
    if not org:
        raise HTTPException(status_code=404, detail="Organisation not found.")

    existing = await db.execute(
        select(OrganizationMember).where(
            OrganizationMember.organization_id == org_id,
            OrganizationMember.user_id == caller_id,
        )
    )
    if existing.scalar_one_or_none():
        return {"message": "Already a member.", "org_id": str(org_id)}

    db.add(
        OrganizationMember(
            organization_id=org_id,
            user_id=caller_id,
            role=role,
            invited_by=org.owner_id,
        )
    )
    user_result = await db.execute(select(User).where(User.id == caller_id))
    user = user_result.scalar_one_or_none()
    if user:
        user.organization_id = org_id
    await db.commit()
    return {"message": f"Welcome to {org.company_name}! You joined as {role}.", "org_id": str(org_id)}


@router.get("/members", response_model=List[MemberResponse])
async def list_members(
    current_user: dict = Depends(require_role(UserRole.HR)),
    db: AsyncSession = Depends(get_db),
):
    caller_id = uuid.UUID(current_user["user_id"])
    org = await _get_member_org(db, caller_id)
    if not org:
        raise HTTPException(status_code=404, detail="No organisation found.")

    owner_result = await db.execute(select(User).where(User.id == org.owner_id))
    owner = owner_result.scalar_one_or_none()
    members_result = await db.execute(select(OrganizationMember).where(OrganizationMember.organization_id == org.id))
    db_members = members_result.scalars().all()
    user_ids = [m.user_id for m in db_members]
    users_result = await db.execute(select(User).where(User.id.in_(user_ids))) if user_ids else None
    users_map = {u.id: u for u in users_result.scalars().all()} if users_result else {}

    profiles_result = await db.execute(select(User).where(User.id.in_([org.owner_id] + user_ids)))
    # fetch profiles separately
    from app.models.users import UserProfile  # noqa: PLC0415

    profile_ids = [org.owner_id] + user_ids
    prof_result = await db.execute(select(UserProfile).where(UserProfile.user_id.in_(profile_ids)))
    profiles_map = {p.user_id: p for p in prof_result.scalars().all()}

    result: List[MemberResponse] = []
    if owner:
        prof = profiles_map.get(owner.id)
        result.append(
            MemberResponse(
                user_id=str(owner.id),
                email=owner.email,
                full_name=prof.full_name if prof else None,
                role="owner",
                joined_at=org.created_at,
                invited_by=None,
            )
        )
    for m in db_members:
        u = users_map.get(m.user_id)
        if u:
            prof = profiles_map.get(u.id)
            result.append(
                MemberResponse(
                    user_id=str(u.id),
                    email=u.email,
                    full_name=prof.full_name if prof else None,
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
    caller_id = uuid.UUID(current_user["user_id"])
    org = await _get_owner_org(db, caller_id)
    if not org:
        raise HTTPException(status_code=403, detail="Only the organisation owner can change roles.")
    if body.role not in VALID_ROLES or body.role == "owner":
        raise HTTPException(status_code=400, detail=f"Invalid role. Choose from: {VALID_ROLES - {'owner'}}")

    mem_result = await db.execute(
        select(OrganizationMember).where(
            OrganizationMember.organization_id == org.id,
            OrganizationMember.user_id == uuid.UUID(user_id),
        )
    )
    member = mem_result.scalar_one_or_none()
    if not member:
        raise HTTPException(status_code=404, detail="Member not found.")
    member.role = body.role
    await db.commit()
    return {"message": f"Role updated to '{body.role}'."}


@router.delete("/members/{user_id}")
async def remove_member(
    user_id: str,
    current_user: dict = Depends(require_role(UserRole.HR)),
    db: AsyncSession = Depends(get_db),
):
    caller_id = uuid.UUID(current_user["user_id"])
    org = await _get_owner_org(db, caller_id)
    if not org:
        raise HTTPException(status_code=403, detail="Only the organisation owner can remove members.")
    target_id = uuid.UUID(user_id)
    if target_id == caller_id:
        raise HTTPException(status_code=400, detail="Cannot remove yourself as owner.")

    mem_result = await db.execute(
        select(OrganizationMember).where(
            OrganizationMember.organization_id == org.id,
            OrganizationMember.user_id == target_id,
        )
    )
    member = mem_result.scalar_one_or_none()
    if not member:
        raise HTTPException(status_code=404, detail="Member not found.")
    await db.delete(member)
    await db.commit()
    return {"message": "Member removed."}
