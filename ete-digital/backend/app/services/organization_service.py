"""
Organization service — auto-join, user linking, trust tier helpers.
"""

from __future__ import annotations

import uuid
from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.organization import Organization
from app.models.organization_member import OrganizationMember
from app.models.users import User, UserRole
from app.services.domain_auth import extract_email_domain, is_blocked_free_domain, is_corporate_email


async def sync_user_email_domain_fields(user: User) -> None:
    """Populate work_email and email_domain from the user's login email."""
    user.work_email = user.email
    user.email_domain = extract_email_domain(user.email)


async def try_auto_join_verified_org(db: AsyncSession, user: User) -> Optional[Organization]:
    """
    If an HR user registers/logs in with a corporate email matching a verified org,
    automatically add them as a recruiter member.
    """
    if user.role != UserRole.HR or not is_corporate_email(user.email):
        return None

    domain = extract_email_domain(user.email)
    result = await db.execute(
        select(Organization).where(
            Organization.domain == domain,
            Organization.is_verified == True,  # noqa: E712
        )
    )
    org = result.scalar_one_or_none()
    if not org or org.owner_id == user.id:
        return None

    existing = await db.execute(
        select(OrganizationMember).where(
            OrganizationMember.organization_id == org.id,
            OrganizationMember.user_id == user.id,
        )
    )
    if existing.scalar_one_or_none():
        user.organization_id = org.id
        return org

    member = OrganizationMember(
        organization_id=org.id,
        user_id=user.id,
        role="recruiter",
        invited_by=org.owner_id,
    )
    db.add(member)
    user.organization_id = org.id
    return org


def max_active_jobs_for_tier(trust_tier: str, is_verified: bool) -> Optional[int]:
    """Return max active jobs allowed, or None for unlimited."""
    if is_verified or trust_tier == "verified":
        return None
    if trust_tier == "pending":
        return 3
    return 1


async def get_employer_verified_map(
    db: AsyncSession,
    employer_ids: list[uuid.UUID],
) -> dict[uuid.UUID, bool]:
    """Return whether each employer belongs to a verified organisation."""
    if not employer_ids:
        return {}

    verified: dict[uuid.UUID, bool] = {eid: False for eid in employer_ids}

    owned = await db.execute(
        select(Organization.owner_id).where(
            Organization.owner_id.in_(employer_ids),
            Organization.is_verified == True,  # noqa: E712
        )
    )
    for (owner_id,) in owned:
        verified[owner_id] = True

    member_rows = await db.execute(
        select(OrganizationMember.user_id)
        .join(Organization, OrganizationMember.organization_id == Organization.id)
        .where(
            OrganizationMember.user_id.in_(employer_ids),
            Organization.is_verified == True,  # noqa: E712
        )
    )
    for (user_id,) in member_rows:
        verified[user_id] = True

    linked = await db.execute(
        select(User.id)
        .join(Organization, User.organization_id == Organization.id)
        .where(
            User.id.in_(employer_ids),
            Organization.is_verified == True,  # noqa: E712
        )
    )
    for (user_id,) in linked:
        verified[user_id] = True

    return verified
