"""
Fraud Detection Service
=======================
Rules engine to evaluate job applications for potential fraud or spam.
"""

import uuid
from datetime import datetime, timedelta, timezone

from sqlalchemy import case as sa_case, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.jobs import Application
from app.models.users import UserProfile

# --- Simple Rules Engine Heuristics ---

SUSPICIOUS_KEYWORDS = [
    "crypto",
    "bitcoin",
    "investment",
    "guaranteed returns",
    "wire transfer",
    "gift card",
    "whatsapp me",
    "telegram me",
    "money laundering",
    "sugar daddy",
    "cash app",
    "venmo",
]

MAX_APPS_PER_DAY = 20  # If a user applies to >20 jobs a day, flag as spam
MAX_APPS_PER_HOUR = 10  # Rapid-fire applications


async def evaluate_application_fraud(db: AsyncSession, application_id: uuid.UUID) -> None:
    """
    Evaluates an application and updates its fraud_score and fraud_flags.
    This should be run as a background task after an application is submitted.
    """
    app_result = await db.execute(select(Application).where(Application.id == application_id))
    application = app_result.scalar_one_or_none()
    if not application:
        return

    candidate_id = application.candidate_id

    profile_result = await db.execute(select(UserProfile).where(UserProfile.user_id == candidate_id))
    profile = profile_result.scalar_one_or_none()

    score = 0
    flags = []

    # 1. Keyword analysis in Cover Letter
    if application.cover_letter:
        cl_lower = application.cover_letter.lower()
        found_keywords = [kw for kw in SUSPICIOUS_KEYWORDS if kw in cl_lower]
        if found_keywords:
            flags.append(f"Suspicious keywords in cover letter: {', '.join(found_keywords)}")
            score += len(found_keywords) * 20

    # 2. Keyword analysis in Bio
    if profile and profile.bio:
        bio_lower = profile.bio.lower()
        found_keywords = [kw for kw in SUSPICIOUS_KEYWORDS if kw in bio_lower]
        if found_keywords:
            flags.append(f"Suspicious keywords in profile bio: {', '.join(found_keywords)}")
            score += len(found_keywords) * 15

    # 3. Application Velocity (Spam detection)
    now = datetime.now(timezone.utc)
    one_day_ago = now - timedelta(days=1)
    one_hour_ago = now - timedelta(hours=1)

    velocity_result = await db.execute(
        select(
            func.count().label("day_count"),
            func.sum(
                sa_case(
                    (Application.created_at >= one_hour_ago, 1),
                    else_=0,
                )
            ).label("hour_count"),
        )
        .where(Application.candidate_id == candidate_id)
        .where(Application.created_at >= one_day_ago)
    )
    counts = velocity_result.first()

    if counts:
        day_count = counts.day_count or 0
        hour_count = counts.hour_count or 0

        if day_count > MAX_APPS_PER_DAY:
            flags.append(f"High daily application volume ({day_count}/day)")
            score += 30

        if hour_count > MAX_APPS_PER_HOUR:
            flags.append(f"Rapid application velocity ({hour_count}/hour)")
            score += 40

    # 4. Incomplete Profile penalty
    if not profile or (
        not profile.experience_years and not (profile.skills or []) and not profile.bio and not profile.headline
    ):
        flags.append("Sparse profile (no experience, skills, bio, or headline)")
        score += 10

    score = min(score, 100)

    application.fraud_score = score
    application.fraud_flags = flags

    db.add(application)
    await db.commit()
