"""
Jobs and Applications endpoint tests
"""

import pytest
from httpx import AsyncClient

pytestmark = pytest.mark.asyncio

JOB_PAYLOAD = {
    "title": "Senior Developer",
    "company": "TechCorp",
    "description": "Build amazing things with Python and FastAPI on a modern stack",
    "requirements": "3+ years Python experience with async frameworks",
    "job_type": "full_time",  # enum value, NOT "FULL_TIME"
    "location": "Remote",
    "remote_ok": True,
    "salary_min": 80000,
    "salary_max": 120000,
    "skills_required": ["Python", "FastAPI"],
}


async def test_create_job_as_employer(client: AsyncClient, employer_token: str):
    """Employer can create a job and get 201."""
    response = await client.post(
        "/api/jobs/",
        json=JOB_PAYLOAD,
        headers={"Authorization": f"Bearer {employer_token}"},
    )
    assert response.status_code == 201, response.json()
    data = response.json()
    assert data["title"] == "Senior Developer"
    assert data["status"] is not None


async def test_create_job_as_candidate_forbidden(
    client: AsyncClient, candidate_token: str
):
    """Candidate cannot create a job — returns 403."""
    response = await client.post(
        "/api/jobs/",
        json=JOB_PAYLOAD,
        headers={"Authorization": f"Bearer {candidate_token}"},
    )
    assert response.status_code == 403


async def test_create_job_unauthenticated(client: AsyncClient):
    """Unauthenticated request to create job returns 403 or 401."""
    response = await client.post("/api/jobs/", json=JOB_PAYLOAD)
    assert response.status_code in (401, 403)


async def test_search_jobs_no_auth(client: AsyncClient, employer_token: str):
    """Job search is public — no auth required."""
    await client.post(
        "/api/jobs/",
        json=JOB_PAYLOAD,
        headers={"Authorization": f"Bearer {employer_token}"},
    )
    response = await client.get("/api/jobs/search")
    assert response.status_code == 200
    data = response.json()
    assert "jobs" in data
    assert isinstance(data["jobs"], list)


async def test_search_jobs_with_query(client: AsyncClient, employer_token: str):
    """Search with a keyword returns matching jobs."""
    await client.post(
        "/api/jobs/",
        json=JOB_PAYLOAD,
        headers={"Authorization": f"Bearer {employer_token}"},
    )
    response = await client.get("/api/jobs/search?query=Developer")
    assert response.status_code == 200


async def test_get_job_not_found(client: AsyncClient):
    """Getting a non-existent job returns 404."""
    import uuid

    response = await client.get(f"/api/jobs/{uuid.uuid4()}")
    assert response.status_code == 404
