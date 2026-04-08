"""
Unit tests for the AI matching engine (app/services/matching.py)
These tests are pure Python — no database, no network calls.
Run with: pytest tests/test_matching.py -v
"""

import pytest
from datetime import datetime, timezone, timedelta

from app.services.matching import (
    CandidateProfile,
    JobSnapshot,
    ScoreBreakdown,
    _parse_experience_years,
    _skill_score,
    _experience_score,
    _location_score,
    _salary_score,
    _freshness_score,
    compute_match_score,
    rank_jobs_for_candidate,
    _build_fallback_explanation,
)


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------


@pytest.fixture
def full_candidate():
    return CandidateProfile(
        user_id="test-user-1",
        skills=["Python", "FastAPI", "React", "PostgreSQL", "Docker"],
        experience_years="3-5",
        location="Bangalore",
        remote_preferred=False,
        salary_expectation_min=800_000,
        salary_expectation_max=1_200_000,
        preferred_job_types=["full_time"],
        preferred_locations=["Bangalore", "Mumbai"],
    )


@pytest.fixture
def perfect_match_job():
    return JobSnapshot(
        job_id="job-1",
        title="Senior Python Developer",
        skills_required=["Python", "FastAPI", "PostgreSQL"],
        experience_required="3-5",
        location="Bangalore",
        remote_ok=False,
        salary_min=900_000,
        salary_max=1_300_000,
        job_type="full_time",
        created_at=datetime.now(timezone.utc) - timedelta(days=1),  # fresh
    )


@pytest.fixture
def poor_match_job():
    return JobSnapshot(
        job_id="job-2",
        title="Java Enterprise Developer",
        skills_required=["Java", "Spring", "Hibernate", "Oracle", "Maven"],
        experience_required="10+",
        location="Chennai",
        remote_ok=False,
        salary_min=400_000,
        salary_max=600_000,
        job_type="contract",
        created_at=datetime.now(timezone.utc) - timedelta(days=45),  # old
    )


@pytest.fixture
def remote_job():
    return JobSnapshot(
        job_id="job-3",
        title="Frontend Engineer",
        skills_required=["React"],
        experience_required="1-3",
        location=None,
        remote_ok=True,
        salary_min=700_000,
        salary_max=1_100_000,
        job_type="full_time",
        created_at=datetime.now(timezone.utc) - timedelta(days=5),
    )


# ---------------------------------------------------------------------------
# _parse_experience_years tests
# ---------------------------------------------------------------------------


class TestParseExperienceYears:
    def test_range(self):
        assert _parse_experience_years("3-5") == (3, 5)

    def test_plus(self):
        assert _parse_experience_years("10+") == (10, 99)

    def test_single(self):
        assert _parse_experience_years("5") == (5, 5)

    def test_none(self):
        assert _parse_experience_years(None) == (0, 99)

    def test_empty(self):
        assert _parse_experience_years("") == (0, 99)


# ---------------------------------------------------------------------------
# Individual factor tests
# ---------------------------------------------------------------------------


class TestSkillScore:
    def test_perfect_match(self, full_candidate, perfect_match_job):
        score, matched, missing = _skill_score(full_candidate, perfect_match_job)
        assert score == 40  # 3/3 skills matched → 100% → 40 pts
        assert len(matched) == 3
        assert len(missing) == 0

    def test_partial_match(self, full_candidate, poor_match_job):
        score, matched, missing = _skill_score(full_candidate, poor_match_job)
        assert score == 0  # none of Java/Spring/etc in candidate's skills
        assert len(missing) == 5

    def test_no_job_skills(self, full_candidate):
        job = JobSnapshot(
            job_id="job-empty",
            title="Generic Role",
            skills_required=[],  # no skills listed
            description="We need someone great",
        )
        score, matched, missing = _skill_score(full_candidate, job)
        assert 0 <= score <= 40  # falls back to keyword overlap / default


class TestExperienceScore:
    def test_exact_overlap(self, full_candidate, perfect_match_job):
        # candidate: 3-5, job: 3-5 → full overlap
        score = _experience_score(full_candidate, perfect_match_job)
        assert score > 0

    def test_overqualified(self, full_candidate):
        job = JobSnapshot(
            job_id="j",
            title="Junior Dev",
            experience_required="0-1",
        )
        score = _experience_score(full_candidate, job)
        assert score == 10  # overqualified → partial credit

    def test_underqualified(self, full_candidate):
        job = JobSnapshot(
            job_id="j",
            title="Principal Architect",
            experience_required="15+",
        )
        score = _experience_score(full_candidate, job)
        assert score == 0  # underqualified → no credit

    def test_no_experience_requirement(self, full_candidate):
        job = JobSnapshot(
            job_id="j",
            title="Open Role",
            experience_required=None,
        )
        # No requirement → candidate auto-qualifies
        score = _experience_score(full_candidate, job)
        assert score >= 0


class TestLocationScore:
    def test_remote_job_full_score(self, full_candidate, remote_job):
        score = _location_score(full_candidate, remote_job)
        assert score == 15  # remote → any candidate gets full points

    def test_city_match(self, full_candidate, perfect_match_job):
        score = _location_score(full_candidate, perfect_match_job)
        assert score == 15  # Bangalore matches Bangalore

    def test_no_location(self, full_candidate):
        job = JobSnapshot(job_id="j", title="Role", location=None)
        score = _location_score(full_candidate, job)
        assert score == 8  # Unknown → neutral

    def test_remote_preferred_but_onsite_job(self):
        candidate = CandidateProfile(user_id="u", remote_preferred=True)
        job = JobSnapshot(job_id="j", title="Onsite Role", remote_ok=False, location="Delhi")
        score = _location_score(candidate, job)
        assert score == 5  # mismatch → low but not zero


class TestSalaryScore:
    def test_overlap_full(self, full_candidate, perfect_match_job):
        score = _salary_score(full_candidate, perfect_match_job)
        assert score == 15  # Ranges overlap

    def test_candidate_lower_than_offer(self, full_candidate):
        job = JobSnapshot(
            job_id="j",
            title="High Pay",
            salary_min=2_000_000,
            salary_max=3_000_000,
        )
        score = _salary_score(full_candidate, job)
        assert score == 12  # candidate expects less than offered

    def test_candidate_much_higher(self, full_candidate):
        job = JobSnapshot(
            job_id="j",
            title="Low Pay",
            salary_min=200_000,
            salary_max=300_000,
        )
        score = _salary_score(full_candidate, job)
        assert score == 0  # too far apart (>50% gap)

    def test_no_salary_info(self, full_candidate):
        job = JobSnapshot(job_id="j", title="Role")
        score = _salary_score(full_candidate, job)
        assert score == 8  # neutral


class TestFreshnessScore:
    def test_fresh(self, perfect_match_job):
        # Created 1 day ago
        assert _freshness_score(perfect_match_job) == 10

    def test_week_old(self):
        job = JobSnapshot(
            job_id="j",
            title="Role",
            created_at=datetime.now(timezone.utc) - timedelta(days=6),
        )
        assert _freshness_score(job) == 7

    def test_old(self, poor_match_job):
        # Created 45 days ago
        assert _freshness_score(poor_match_job) == 0

    def test_no_date(self):
        job = JobSnapshot(job_id="j", title="Role", created_at=None)
        assert _freshness_score(job) == 5  # default neutral


# ---------------------------------------------------------------------------
# Full compute_match_score tests
# ---------------------------------------------------------------------------


class TestComputeMatchScore:
    def test_perfect_match_high_score(self, full_candidate, perfect_match_job):
        result = compute_match_score(full_candidate, perfect_match_job)
        assert isinstance(result, ScoreBreakdown)
        assert result.total >= 80  # Should be a very high match
        assert result.total <= 100

    def test_poor_match_low_score(self, full_candidate, poor_match_job):
        result = compute_match_score(full_candidate, poor_match_job)
        assert result.total < 40  # Should be a very poor match

    def test_score_components_sum_correctly(self, full_candidate, perfect_match_job):
        result = compute_match_score(full_candidate, perfect_match_job)
        component_sum = (
            result.skill_score
            + result.experience_score
            + result.location_score
            + result.salary_score
            + result.freshness_score
        )
        assert result.total == component_sum

    def test_hint_populated(self, full_candidate, perfect_match_job):
        result = compute_match_score(full_candidate, perfect_match_job)
        assert isinstance(result.explanation_hint, str)
        assert len(result.explanation_hint) > 0

    def test_empty_candidate(self, perfect_match_job):
        """Candidate with no profile info should still return a valid score (no crash)."""
        empty = CandidateProfile(user_id="empty")
        result = compute_match_score(empty, perfect_match_job)
        assert 0 <= result.total <= 100


# ---------------------------------------------------------------------------
# rank_jobs_for_candidate tests
# ---------------------------------------------------------------------------


class TestRankJobsForCandidate:
    def test_ranking_order(self, full_candidate, perfect_match_job, poor_match_job, remote_job):
        jobs = [poor_match_job, perfect_match_job, remote_job]
        ranked = rank_jobs_for_candidate(full_candidate, jobs)

        # Perfect match should be first
        assert ranked[0][0].job_id == perfect_match_job.job_id

        # Poor match should be last
        assert ranked[-1][0].job_id == poor_match_job.job_id

    def test_empty_jobs(self, full_candidate):
        ranked = rank_jobs_for_candidate(full_candidate, [])
        assert ranked == []

    def test_returns_all_jobs(self, full_candidate, perfect_match_job, poor_match_job):
        ranked = rank_jobs_for_candidate(full_candidate, [perfect_match_job, poor_match_job])
        assert len(ranked) == 2


# ---------------------------------------------------------------------------
# Fallback explanation tests
# ---------------------------------------------------------------------------


class TestFallbackExplanation:
    def test_generates_text(self, full_candidate, perfect_match_job):
        from app.services.matching import compute_match_score, _build_fallback_explanation
        breakdown = compute_match_score(full_candidate, perfect_match_job)
        text = _build_fallback_explanation(full_candidate, perfect_match_job, breakdown)
        assert isinstance(text, str)
        assert len(text) > 10
        assert str(breakdown.total) in text  # score mentioned in text

    def test_missing_skills_mentioned(self, full_candidate, poor_match_job):
        from app.services.matching import compute_match_score, _build_fallback_explanation
        breakdown = compute_match_score(full_candidate, poor_match_job)
        text = _build_fallback_explanation(full_candidate, poor_match_job, breakdown)
        # Should mention skills to improve on
        assert "upskilling" in text.lower() or "missing" in text.lower() or len(breakdown.missing_skills) == 0
