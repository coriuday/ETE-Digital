"""
Tryout & submission endpoint tests
"""
import pytest
from httpx import AsyncClient

pytestmark = pytest.mark.asyncio

TRYOUT_PAYLOAD = {
    "job_id": "",  # will be overridden in test
    "title": "Build a REST API Challenge",
    "description": (
        "Create a simple REST API with authentication and CRUD operations. "
        "Use FastAPI with SQLAlchemy ORM.  The API should include endpoint "
        "documentation and error handling with proper HTTP status codes."
    ),
    "requirements": "Python 3.10+, FastAPI, SQLAlchemy",
    "estimated_duration_hours": 8,
    "payment_amount": 5000,
    "payment_currency": "INR",
    "scoring_rubric": {
        "code_quality": 30,
        "functionality": 50,
        "documentation": 20,
    },
    "passing_score": 70,
    "auto_grade_enabled": False,
    "max_submissions": 1,
    "submission_format": "url",
}

JOB_PAYLOAD = {
    "title": "Backend Engineer — Tryout",
    "company": "TestCo",
    "description": "Build amazing APIs with Python and FastAPI on modern cloud infra",
    "requirements": "3+ years Python and FastAPI experience required",
    "job_type": "full_time",
    "remote_ok": True,
}


async def test_create_tryout_as_employer(client: AsyncClient, employer_token: str):
    """Employer can create a tryout for a job."""
    # First create a job
    job_resp = await client.post(
        "/api/jobs/",
        json=JOB_PAYLOAD,
        headers={"Authorization": f"Bearer {employer_token}"},
    )
    assert job_resp.status_code == 201, job_resp.json()
    job_id = job_resp.json()["id"]

    payload = {**TRYOUT_PAYLOAD, "job_id": job_id}
    response = await client.post(
        "/api/tryouts/",
        json=payload,
        headers={"Authorization": f"Bearer {employer_token}"},
    )
    assert response.status_code == 201, response.json()
    data = response.json()
    assert data["job_id"] == job_id
    assert data["passing_score"] == 70
    assert "id" in data


async def test_create_tryout_as_candidate_forbidden(client: AsyncClient, candidate_token: str, employer_token: str):
    """Candidate cannot create a tryout — 403."""
    job_resp = await client.post(
        "/api/jobs/",
        json=JOB_PAYLOAD,
        headers={"Authorization": f"Bearer {employer_token}"},
    )
    job_id = job_resp.json()["id"]
    payload = {**TRYOUT_PAYLOAD, "job_id": job_id}

    response = await client.post(
        "/api/tryouts/",
        json=payload,
        headers={"Authorization": f"Bearer {candidate_token}"},
    )
    assert response.status_code == 403


async def test_get_tryout_by_job(client: AsyncClient, employer_token: str):
    """Fetching tryout for a job returns TryoutResponse."""
    job_resp = await client.post(
        "/api/jobs/",
        json=JOB_PAYLOAD,
        headers={"Authorization": f"Bearer {employer_token}"},
    )
    job_id = job_resp.json()["id"]
    payload = {**TRYOUT_PAYLOAD, "job_id": job_id}
    create_resp = await client.post(
        "/api/tryouts/",
        json=payload,
        headers={"Authorization": f"Bearer {employer_token}"},
    )
    assert create_resp.status_code == 201, create_resp.json()

    # Correct endpoint: GET /api/tryouts/job/{job_id}
    response = await client.get(
        f"/api/tryouts/job/{job_id}",
        headers={"Authorization": f"Bearer {employer_token}"},
    )
    assert response.status_code == 200, response.json()
    data = response.json()
    assert "id" in data
    assert data["job_id"] == job_id


async def test_submit_tryout_as_candidate(client: AsyncClient, employer_token: str, candidate_token: str):
    """Candidate can submit a solution for a tryout."""
    job_resp = await client.post(
        "/api/jobs/",
        json=JOB_PAYLOAD,
        headers={"Authorization": f"Bearer {employer_token}"},
    )
    job_id = job_resp.json()["id"]
    tryout_payload = {**TRYOUT_PAYLOAD, "job_id": job_id}
    tryout_resp = await client.post(
        "/api/tryouts/",
        json=tryout_payload,
        headers={"Authorization": f"Bearer {employer_token}"},
    )
    assert tryout_resp.status_code == 201, tryout_resp.json()
    tryout_id = tryout_resp.json()["id"]

    submit_resp = await client.post(
        f"/api/tryouts/{tryout_id}/submit",
        json={
            "tryout_id": tryout_id,
            "submission_url": "https://github.com/candidate/solution",
            "notes": "Implemented all requirements with tests.",
        },
        headers={"Authorization": f"Bearer {candidate_token}"},
    )
    assert submit_resp.status_code == 201, submit_resp.json()
    data = submit_resp.json()
    assert data["tryout_id"] == tryout_id
    assert data["status"] == "submitted"
