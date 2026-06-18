"""
Bulk Job Posting API
====================
Allows HR users to upload a CSV file with multiple job postings.

CSV format (headers required):
  title, description, location, job_type, salary_min, salary_max,
  skills_required, experience_required, expires_days, remote_ok

endpoint: POST /api/jobs/bulk
"""

import csv
import io
import json
import uuid
from datetime import datetime, timedelta, timezone
from typing import Any

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import require_role
from app.models.jobs import Job, JobStatus, JobType
from app.models.users import UserRole

router = APIRouter()

# ── CSV template columns ──────────────────────────────────────────────────────

REQUIRED_COLUMNS = {"title", "description", "job_type"}
OPTIONAL_COLUMNS = {
    "location",
    "salary_min",
    "salary_max",
    "skills_required",
    "experience_required",
    "expires_days",
    "remote_ok",
    "company",
    "requirements",
}
ALL_COLUMNS = REQUIRED_COLUMNS | OPTIONAL_COLUMNS

VALID_JOB_TYPES = {t.value for t in JobType}

# ── Template CSV content (for download) ───────────────────────────────────────

CSV_TEMPLATE = (
    "title,description,location,job_type,salary_min,salary_max,"
    "skills_required,experience_required,expires_days,remote_ok,company,requirements\n"
    "Senior React Engineer,"
    '"Build and maintain our front-end products.",'
    "Mumbai,full_time,80000,120000,"
    '"React,TypeScript,Node.js",'
    "3-5 years,30,false,Acme Corp,"
    '"Experience with REST APIs required."\n'
    "Data Analyst,"
    '"Analyse user data and build dashboards.",'
    "Remote,contract,50000,70000,"
    '"Python,SQL,Tableau",'
    "1-3 years,45,true,Acme Corp,\n"
)


# ── Schemas ───────────────────────────────────────────────────────────────────


class BulkRowError(BaseModel):
    row: int
    reason: str


class BulkUploadResponse(BaseModel):
    created: int
    failed: int
    errors: list[BulkRowError]


# ── Helpers ───────────────────────────────────────────────────────────────────


def _parse_bool(val: str) -> bool:
    return val.strip().lower() in ("true", "1", "yes")


def _parse_skills(val: str) -> list[str]:
    """Accept comma-separated string or JSON array."""
    val = val.strip()
    if not val:
        return []
    if val.startswith("["):
        try:
            return json.loads(val)
        except json.JSONDecodeError:
            pass
    return [s.strip() for s in val.split(",") if s.strip()]


def _validate_row(row: dict[str, str], row_num: int) -> tuple[dict[str, Any] | None, BulkRowError | None]:
    """Validate a CSV row dict. Returns (job_data, None) or (None, error)."""
    for col in REQUIRED_COLUMNS:
        if not row.get(col, "").strip():
            return None, BulkRowError(row=row_num, reason=f"Missing required column: '{col}'")

    job_type = row.get("job_type", "").strip().lower()
    if job_type not in VALID_JOB_TYPES:
        return None, BulkRowError(
            row=row_num,
            reason=f"Invalid job_type '{job_type}'. Choose from: {', '.join(VALID_JOB_TYPES)}",
        )

    salary_min = None
    salary_max = None
    try:
        if row.get("salary_min", "").strip():
            salary_min = int(row["salary_min"].strip())
        if row.get("salary_max", "").strip():
            salary_max = int(row["salary_max"].strip())
    except ValueError:
        return None, BulkRowError(row=row_num, reason="salary_min / salary_max must be integers.")

    expires_days = 30
    try:
        if row.get("expires_days", "").strip():
            expires_days = int(row["expires_days"].strip())
    except ValueError:
        return None, BulkRowError(row=row_num, reason="expires_days must be an integer.")

    return {
        "title": row["title"].strip(),
        "description": row["description"].strip(),
        "location": row.get("location", "").strip() or None,
        "job_type": job_type,
        "salary_min": salary_min,
        "salary_max": salary_max,
        "skills_required": _parse_skills(row.get("skills_required", "")),
        "experience_required": row.get("experience_required", "").strip() or None,
        "remote_ok": _parse_bool(row.get("remote_ok", "false")),
        "company": row.get("company", "").strip(),
        "requirements": row.get("requirements", "").strip() or None,
        "expires_at": datetime.now(timezone.utc) + timedelta(days=expires_days),
    }, None


# ── Endpoints ─────────────────────────────────────────────────────────────────


@router.get("/template")
async def download_template():
    """Return a sample CSV template for bulk posting."""
    from fastapi.responses import Response

    return Response(
        content=CSV_TEMPLATE,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=jobsrow_bulk_template.csv"},
    )


@router.post("/", response_model=BulkUploadResponse, status_code=status.HTTP_201_CREATED)
async def bulk_upload_jobs(
    file: UploadFile = File(...),
    current_user: dict = Depends(require_role(UserRole.HR)),
    db: AsyncSession = Depends(get_db),
):
    """
    Upload a CSV file to create multiple job postings at once.

    - Maximum 200 rows per upload.
    - Returns count of created jobs and per-row error details.
    - Jobs are created with status=ACTIVE and published_at=now.
    """
    if not file.filename or not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="File must be a .csv file.")

    employer_id = uuid.UUID(current_user["user_id"])

    content = await file.read()
    try:
        text = content.decode("utf-8-sig")  # handle BOM from Excel
    except UnicodeDecodeError:
        raise HTTPException(status_code=400, detail="File must be UTF-8 encoded.")

    reader = csv.DictReader(io.StringIO(text))
    if reader.fieldnames is None:
        raise HTTPException(status_code=400, detail="CSV file is empty or has no headers.")

    headers = {h.strip().lower() for h in reader.fieldnames if h}
    missing = REQUIRED_COLUMNS - headers
    if missing:
        raise HTTPException(
            status_code=400,
            detail=f"CSV is missing required column(s): {', '.join(missing)}. "
            f"Download the template from GET /api/jobs/bulk/template.",
        )

    created = 0
    errors: list[BulkRowError] = []
    jobs_to_add: list[Job] = []

    for row_num, raw_row in enumerate(reader, start=2):  # row 1 = header
        # Normalise keys to lowercase
        row = {k.strip().lower(): v for k, v in raw_row.items() if k}

        if row_num > 202:  # limit 200 data rows
            errors.append(BulkRowError(row=row_num, reason="Row limit of 200 exceeded. Truncated."))
            break

        job_data, error = _validate_row(row, row_num)
        if error:
            errors.append(error)
            continue

        job = Job(
            id=uuid.uuid4(),
            employer_id=employer_id,
            title=job_data["title"],
            company=job_data["company"] or "",
            description=job_data["description"],
            requirements=job_data["requirements"],
            location=job_data["location"],
            remote_ok=job_data["remote_ok"],
            job_type=JobType(job_data["job_type"]),
            salary_min=job_data["salary_min"],
            salary_max=job_data["salary_max"],
            salary_currency="INR",
            skills_required=job_data["skills_required"],
            experience_required=job_data["experience_required"],
            status=JobStatus.ACTIVE,
            published_at=datetime.now(timezone.utc),
            expires_at=job_data["expires_at"],
        )
        jobs_to_add.append(job)
        created += 1

    # Bulk-insert all valid jobs in one round-trip
    if jobs_to_add:
        db.add_all(jobs_to_add)
        await db.commit()

    return BulkUploadResponse(created=created, failed=len(errors), errors=errors)
