"""Unit tests for ATS application pipeline transition rules."""

import pytest
from fastapi import HTTPException

from app.models.jobs import ApplicationStatus
from app.services.application_pipeline import (
    validate_transition,
    get_available_actions,
    is_locked,
    build_pipeline_progress,
    stage_label,
)


class TestValidateTransition:
    def test_same_status_raises(self):
        with pytest.raises(HTTPException) as exc:
            validate_transition(ApplicationStatus.SHORTLISTED, ApplicationStatus.SHORTLISTED)
        assert exc.value.status_code == 400
        assert "already in" in exc.value.detail

    def test_terminal_hired_locked(self):
        with pytest.raises(HTTPException) as exc:
            validate_transition(ApplicationStatus.HIRED, ApplicationStatus.REJECTED)
        assert exc.value.status_code == 400
        assert "locked" in exc.value.detail.lower()

    def test_terminal_rejected_locked(self):
        with pytest.raises(HTTPException) as exc:
            validate_transition(ApplicationStatus.REJECTED, ApplicationStatus.HIRED)
        assert exc.value.status_code == 400

    def test_backward_transition_blocked(self):
        with pytest.raises(HTTPException) as exc:
            validate_transition(ApplicationStatus.REVIEWED, ApplicationStatus.SHORTLISTED)
        assert exc.value.status_code == 400
        assert "backward" in exc.value.detail.lower()

    def test_forward_skip_allowed(self):
        validate_transition(ApplicationStatus.PENDING, ApplicationStatus.HIRED)

    def test_reject_from_any_non_terminal(self):
        validate_transition(ApplicationStatus.PENDING, ApplicationStatus.REJECTED)
        validate_transition(ApplicationStatus.SHORTLISTED, ApplicationStatus.REJECTED)
        validate_transition(ApplicationStatus.REVIEWED, ApplicationStatus.REJECTED)

    def test_withdraw_not_allowed_by_hr(self):
        with pytest.raises(HTTPException) as exc:
            validate_transition(ApplicationStatus.PENDING, ApplicationStatus.WITHDRAWN)
        assert exc.value.status_code == 400

    def test_sequential_forward(self):
        validate_transition(ApplicationStatus.PENDING, ApplicationStatus.SHORTLISTED)
        validate_transition(ApplicationStatus.SHORTLISTED, ApplicationStatus.REVIEWED)
        validate_transition(ApplicationStatus.REVIEWED, ApplicationStatus.HIRED)


class TestAvailableActions:
    def test_pending_includes_forward_and_reject(self):
        actions = get_available_actions(ApplicationStatus.PENDING)
        assert "shortlisted" in actions
        assert "reviewed" in actions
        assert "hired" in actions
        assert actions[-1] == "rejected"

    def test_hired_has_no_actions(self):
        assert get_available_actions(ApplicationStatus.HIRED) == []

    def test_reviewed_can_hire_or_reject(self):
        actions = get_available_actions(ApplicationStatus.REVIEWED)
        assert actions == ["hired", "rejected"]


class TestHelpers:
    def test_is_locked(self):
        assert is_locked(ApplicationStatus.HIRED) is True
        assert is_locked(ApplicationStatus.PENDING) is False

    def test_stage_label(self):
        assert stage_label(ApplicationStatus.PENDING) == "Applied"

    def test_build_pipeline_progress_hired(self):
        progress = build_pipeline_progress(ApplicationStatus.HIRED)
        assert progress["is_hired"] is True
        assert all(s["state"] == "completed" for s in progress["stages"])

    def test_build_pipeline_progress_rejected(self):
        progress = build_pipeline_progress(ApplicationStatus.REJECTED)
        assert progress["is_rejected"] is True
