"""
AI Matching Service — Bidirectional Job ↔ Candidate Matching
=============================================================
Architecture:
  Layer 1 (Rules Engine) — Fast, deterministic, pure Python (<5ms).
                           Scores candidates against jobs across 5 weighted factors.
                           Results cached in Redis for 6 hours.
  Layer 2 (Gemini LLM)  — Async, triggered only on application submit.
                           Writes a plain-English explanation to the
                           applications.match_explanation JSONB column.
                           Falls back to a template if Gemini is unavailable.

Free-tier strategy: Gemini free tier = 15 req/min, 1M tokens/day.
At ~100 applications/day, we consume ~100 calls and ~30K tokens — well within limits.
"""

from __future__ import annotations

import logging
import math
import re
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Any, Optional

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Data containers
# ---------------------------------------------------------------------------


@dataclass
class CandidateProfile:
    """Lightweight snapshot of a candidate's profile for scoring."""

    user_id: str
    skills: list[str] = field(default_factory=list)
    experience_years: Optional[str] = None  # e.g. "2-3", "5-7", "10+"
    location: Optional[str] = None
    remote_preferred: bool = False
    salary_expectation_min: Optional[int] = None
    salary_expectation_max: Optional[int] = None
    preferred_job_types: list[str] = field(default_factory=list)
    preferred_locations: list[str] = field(default_factory=list)


@dataclass
class JobSnapshot:
    """Lightweight snapshot of a job posting for scoring."""

    job_id: str
    title: str
    skills_required: list[str] = field(default_factory=list)
    experience_required: Optional[str] = None  # e.g. "3-5"
    location: Optional[str] = None
    remote_ok: bool = False
    salary_min: Optional[int] = None
    salary_max: Optional[int] = None
    job_type: Optional[str] = None
    created_at: Optional[datetime] = None
    description: str = ""
    requirements: str = ""


@dataclass
class ScoreBreakdown:
    """Detailed breakdown of a match score."""

    total: int  # 0–100
    skill_score: int  # max 40
    experience_score: int  # max 20
    location_score: int  # max 15
    salary_score: int  # max 15
    freshness_score: int  # max 10
    matched_skills: list[str] = field(default_factory=list)
    missing_skills: list[str] = field(default_factory=list)
    explanation_hint: str = ""  # Short human-readable summary


# ---------------------------------------------------------------------------
# Scoring helpers
# ---------------------------------------------------------------------------


def _parse_experience_years(exp_str: Optional[str]) -> tuple[int, int]:
    """Parse an experience range string into (min, max) years.

    Examples: "2-3" → (2, 3), "10+" → (10, 99), "5-7" → (5, 7)
    """
    if not exp_str:
        return (0, 99)
    exp_str = exp_str.strip()
    if "+" in exp_str:
        low = int(re.sub(r"\D", "", exp_str.split("+")[0]))
        return (low, 99)
    parts = re.findall(r"\d+", exp_str)
    if len(parts) >= 2:
        return (int(parts[0]), int(parts[1]))
    if len(parts) == 1:
        val = int(parts[0])
        return (val, val)
    return (0, 99)


def _skill_score(candidate: CandidateProfile, job: JobSnapshot) -> tuple[int, list, list]:
    """Score skill overlap. Max = 40 points."""
    c_skills = {s.lower().strip() for s in candidate.skills}
    j_skills = {s.lower().strip() for s in job.skills_required}

    if not j_skills:
        # Fall back to keyword overlap against description
        jd_words = set(re.findall(r"[a-zA-Z]{4,}", job.description.lower()))
        cv_words = {w for s in c_skills for w in re.findall(r"[a-zA-Z]{4,}", s)}
        if not jd_words:
            return 20, [], []  # Unknown requirements → neutral score
        overlap_ratio = len(cv_words & jd_words) / len(jd_words)
        return min(40, round(overlap_ratio * 40)), [], []

    matched = sorted(c_skills & j_skills)
    missing = sorted(j_skills - c_skills)
    ratio = len(matched) / len(j_skills)
    score = min(40, round(ratio * 40))
    return score, matched, missing


def _experience_score(candidate: CandidateProfile, job: JobSnapshot) -> int:
    """Score experience years overlap. Max = 20 points."""
    c_min, c_max = _parse_experience_years(candidate.experience_years)
    j_min, j_max = _parse_experience_years(job.experience_required)

    # Perfect overlap
    if c_min <= j_max and c_max >= j_min:
        overlap_start = max(c_min, j_min)
        overlap_end = min(c_max, j_max)
        range_span = j_max - j_min if j_max != j_min else 1
        ratio = (overlap_end - overlap_start + 1) / max(range_span, 1)
        return min(20, round(ratio * 20))
    # Overqualified (candidate has more experience)
    if c_min > j_max:
        return 10  # Partial credit — overqualified but potentially hireable
    # Underqualified
    return 0


def _location_score(candidate: CandidateProfile, job: JobSnapshot) -> int:
    """Score location/remote compatibility. Max = 15 points."""
    if job.remote_ok:
        return 15  # Full points — remote is universally accessible
    if candidate.remote_preferred and not job.remote_ok:
        return 5  # Some friction — they want remote, job is on-site

    c_loc = (candidate.location or "").lower().strip()
    j_loc = (job.location or "").lower().strip()
    pref_locs = [loc.lower().strip() for loc in candidate.preferred_locations]

    if not j_loc or not c_loc:
        return 8  # Unknown → neutral

    # City-level match
    if c_loc in j_loc or j_loc in c_loc:
        return 15
    # Preferred locations match
    if any(p in j_loc for p in pref_locs):
        return 15
    # Country-level (can detect if both mention same country keyword)
    country_pattern = r"\b(india|us|uk|us|australia|canada|germany|singapore)\b"
    j_country = re.findall(country_pattern, j_loc)
    c_country = re.findall(country_pattern, c_loc)
    if j_country and c_country and set(j_country) & set(c_country):
        return 8

    return 3  # No location overlap


def _salary_score(candidate: CandidateProfile, job: JobSnapshot) -> int:
    """Score salary expectation compatibility. Max = 15 points."""
    # If we don't have both sides, return neutral
    c_min = candidate.salary_expectation_min
    c_max = candidate.salary_expectation_max
    j_min = job.salary_min
    j_max = job.salary_max

    if not j_min or not j_max:
        return 8  # Employer hasn't disclosed salary → neutral
    if not c_min or not c_max:
        return 8  # Candidate hasn't set expectations → neutral

    # Check overlap
    if c_min <= j_max and c_max >= j_min:
        return 15  # Ranges overlap
    if c_max < j_min:
        return 12  # Candidate expects less than offered → slight boon for employer
    # Candidate expects more than the job offers
    gap_pct = (c_min - j_max) / j_max
    if gap_pct <= 0.2:
        return 6  # Within 20% → possible negotiation
    return 0  # Too far apart


def _freshness_score(job: JobSnapshot) -> int:
    """Score job post recency. Max = 10 points."""
    if job.created_at is None:
        return 5  # Default neutral
    now = datetime.now(timezone.utc)
    # Ensure job.created_at is tz-aware
    created = job.created_at
    if created.tzinfo is None:
        created = created.replace(tzinfo=timezone.utc)
    age_days = (now - created).days

    if age_days <= 3:
        return 10
    if age_days <= 7:
        return 7
    if age_days <= 14:
        return 5
    if age_days <= 30:
        return 2
    return 0


# ---------------------------------------------------------------------------
# Main scoring function
# ---------------------------------------------------------------------------


def compute_match_score(candidate: CandidateProfile, job: JobSnapshot) -> ScoreBreakdown:
    """
    Compute a 0-100 match score between a candidate and a job.

    Factor weights:
      Skills overlap  → 40 pts
      Experience match→ 20 pts
      Location/remote → 15 pts
      Salary compat   → 15 pts
      Job freshness   → 10 pts
    """
    skill_pts, matched, missing = _skill_score(candidate, job)
    exp_pts = _experience_score(candidate, job)
    loc_pts = _location_score(candidate, job)
    sal_pts = _salary_score(candidate, job)
    fresh_pts = _freshness_score(job)

    total = skill_pts + exp_pts + loc_pts + sal_pts + fresh_pts

    # Build a human-readable hint
    parts = []
    if matched:
        parts.append(f"{len(matched)}/{len(job.skills_required)} skills matched")
    if missing:
        parts.append(f"missing: {', '.join(missing[:3])}")
    if job.remote_ok:
        parts.append("remote ok")
    hint = " · ".join(parts) if parts else "General match based on profile"

    return ScoreBreakdown(
        total=total,
        skill_score=skill_pts,
        experience_score=exp_pts,
        location_score=loc_pts,
        salary_score=sal_pts,
        freshness_score=fresh_pts,
        matched_skills=matched,
        missing_skills=missing,
        explanation_hint=hint,
    )


# ---------------------------------------------------------------------------
# Redis cache helpers
# ---------------------------------------------------------------------------


def _cache_key(user_id: str, job_id: str) -> str:
    return f"match:{user_id}:{job_id}"


async def _get_cached(redis_client: Any, user_id: str, job_id: str) -> Optional[int]:
    """Return cached score or None if not cached."""
    try:
        val = await redis_client.get(_cache_key(user_id, job_id))
        return int(val) if val is not None else None
    except Exception as e:
        logger.warning("Redis get failed (matching cache): %s", e)
        return None


async def _set_cached(redis_client: Any, user_id: str, job_id: str, score: int, ttl: int = 21600) -> None:
    """Store score in Redis with a 6-hour TTL."""
    try:
        await redis_client.setex(_cache_key(user_id, job_id), ttl, score)
    except Exception as e:
        logger.warning("Redis set failed (matching cache): %s", e)


async def invalidate_candidate_cache(redis_client: Any, user_id: str) -> None:
    """Invalidate all cached scores for a candidate (call on profile update)."""
    try:
        pattern = f"match:{user_id}:*"
        cursor = 0
        while True:
            cursor, keys = await redis_client.scan(cursor, match=pattern, count=100)
            if keys:
                await redis_client.delete(*keys)
            if cursor == 0:
                break
    except Exception as e:
        logger.warning("Redis cache invalidation failed for candidate %s: %s", user_id, e)


async def invalidate_job_cache(redis_client: Any, job_id: str) -> None:
    """Invalidate all cached scores for a job (call on job update)."""
    try:
        pattern = f"match:*:{job_id}"
        cursor = 0
        while True:
            cursor, keys = await redis_client.scan(cursor, match=pattern, count=100)
            if keys:
                await redis_client.delete(*keys)
            if cursor == 0:
                break
    except Exception as e:
        logger.warning("Redis cache invalidation failed for job %s: %s", job_id, e)


# ---------------------------------------------------------------------------
# Ranked feed helper
# ---------------------------------------------------------------------------


def rank_jobs_for_candidate(
    candidate: CandidateProfile,
    jobs: list[JobSnapshot],
) -> list[tuple[JobSnapshot, ScoreBreakdown]]:
    """
    Score and sort a list of jobs for a candidate.
    Returns list of (job, breakdown) sorted by total score descending.
    Fast enough to run synchronously on the API thread (<5ms for 200 jobs).
    """
    scored = [(job, compute_match_score(candidate, job)) for job in jobs]
    return sorted(scored, key=lambda x: x[1].total, reverse=True)


def rank_candidates_for_job(
    job: JobSnapshot,
    candidates: list[CandidateProfile],
) -> list[tuple[CandidateProfile, ScoreBreakdown]]:
    """
    Score and sort a list of candidates for a job.
    Useful for employer dashboard candidate ranking.
    """
    scored = [(c, compute_match_score(c, job)) for c in candidates]
    return sorted(scored, key=lambda x: x[1].total, reverse=True)


# ---------------------------------------------------------------------------
# Gemini LLM explanation layer
# ---------------------------------------------------------------------------


_FALLBACK_TEMPLATE = (
    "You match {score}% for this role. " "You have {matched_count} of {required_count} required skills. " "{missing_note}"
)


async def generate_llm_explanation(
    candidate: CandidateProfile,
    job: JobSnapshot,
    breakdown: ScoreBreakdown,
) -> str:
    """
    Generate a 2-3 sentence plain-English explanation of the match.

    Uses Google Gemini Flash (free tier, lightweight).
    Falls back gracefully to a template string on any error.

    This should be called from a FastAPI BackgroundTask — never on the hot request path.
    """
    try:
        from app.core.config import settings  # noqa: PLC0415

        api_key = getattr(settings, "GEMINI_API_KEY", None)
        if not api_key:
            raise ValueError("GEMINI_API_KEY not configured — using template fallback")

        import google.generativeai as genai  # noqa: PLC0415

        genai.configure(api_key=api_key)
        model = genai.GenerativeModel("gemini-1.5-flash")

        prompt = _build_explanation_prompt(candidate, job, breakdown)
        response = model.generate_content(prompt)
        text = response.text.strip()
        # Safety: keep it to 3 sentences max
        sentences = re.split(r"(?<=[.!?])\s+", text)
        return " ".join(sentences[:3])

    except Exception as e:
        logger.info("Gemini explanation unavailable (%s) — using template.", e)
        return _build_fallback_explanation(candidate, job, breakdown)


def _build_explanation_prompt(
    candidate: CandidateProfile,
    job: JobSnapshot,
    breakdown: ScoreBreakdown,
) -> str:
    """Build a tight, token-efficient Gemini prompt."""
    matched = ", ".join(breakdown.matched_skills[:5]) or "none specified"
    missing = ", ".join(breakdown.missing_skills[:3]) or "none"
    exp_label = candidate.experience_years or "not specified"
    remote_note = "Role is remote-friendly." if job.remote_ok else "Role is on-site."

    return (
        f"Write a 2-3 sentence recruiter-quality match summary for a job application. "
        f"Be specific, honest, and professional. Do NOT use bullet points.\n\n"
        f"Job Title: {job.title}\n"
        f"Match Score: {breakdown.total}/100\n"
        f"Skills matched: {matched}\n"
        f"Skills missing: {missing}\n"
        f"Candidate experience: {exp_label} years\n"
        f"Job experience required: {job.experience_required or 'not specified'}\n"
        f"{remote_note}\n\n"
        f"Write the summary now:"
    )


def _build_fallback_explanation(
    candidate: CandidateProfile,
    job: JobSnapshot,
    breakdown: ScoreBreakdown,
) -> str:
    """Template-based fallback used when Gemini is unavailable."""
    matched_count = len(breakdown.matched_skills)
    required_count = len(job.skills_required)

    missing_note = ""
    if breakdown.missing_skills:
        top_missing = ", ".join(breakdown.missing_skills[:3])
        missing_note = f"Consider upskilling in: {top_missing}."

    return _FALLBACK_TEMPLATE.format(
        score=breakdown.total,
        matched_count=matched_count,
        required_count=required_count if required_count else "the",
        missing_note=missing_note,
    )


# ---------------------------------------------------------------------------
# DB ↔ dataclass converters (used by API layer)
# ---------------------------------------------------------------------------


def profile_from_orm(profile_orm: Any, user_id: str) -> CandidateProfile:
    """Convert a SQLAlchemy UserProfile ORM object to a CandidateProfile dataclass."""
    prefs = profile_orm.preferences or {} if profile_orm else {}
    return CandidateProfile(
        user_id=str(user_id),
        skills=profile_orm.skills or [] if profile_orm else [],
        experience_years=profile_orm.experience_years if profile_orm else None,
        location=profile_orm.location if profile_orm else None,
        remote_preferred=prefs.get("remote_preferred", False),
        salary_expectation_min=getattr(profile_orm, "salary_expectation_min", None) if profile_orm else None,
        salary_expectation_max=getattr(profile_orm, "salary_expectation_max", None) if profile_orm else None,
        preferred_job_types=prefs.get("preferred_job_types", []),
        preferred_locations=prefs.get("preferred_locations", []),
    )


def job_snapshot_from_orm(job_orm: Any) -> JobSnapshot:
    """Convert a SQLAlchemy Job ORM object to a JobSnapshot dataclass."""
    return JobSnapshot(
        job_id=str(job_orm.id),
        title=job_orm.title or "",
        skills_required=job_orm.skills_required or [],
        experience_required=job_orm.experience_required,
        location=job_orm.location,
        remote_ok=job_orm.remote_ok or False,
        salary_min=job_orm.salary_min,
        salary_max=job_orm.salary_max,
        job_type=job_orm.job_type.value if job_orm.job_type else None,
        created_at=job_orm.created_at,
        description=job_orm.description or "",
        requirements=job_orm.requirements or "",
    )
