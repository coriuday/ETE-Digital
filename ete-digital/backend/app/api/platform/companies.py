"""
Public Company Profile API — Task 1.5
GET /api/companies/{slug}  → company info + paginated active jobs
GET /api/companies/        → search/list companies (for directory)
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional
import math

from app.core.database import get_db
from app.models.company import CompanyProfile
from app.models.jobs import Job, JobStatus

router = APIRouter()


# ── Helpers ────────────────────────────────────────────────────────────────────


def _company_dict(c: CompanyProfile) -> dict:
    return {
        "id": str(c.id),
        "slug": c.slug,
        "name": c.name,
        "tagline": c.tagline,
        "description": c.description,
        "industry": c.industry,
        "company_size": c.company_size,
        "founded_year": c.founded_year,
        "logo_url": c.logo_url,
        "cover_image_url": c.cover_image_url,
        "brand_color": c.brand_color,
        "website": c.website,
        "city": c.city,
        "country": c.country,
        "social_links": c.social_links or {},
        "benefits": c.benefits or [],
        "tech_stack": c.tech_stack or [],
        "culture_tags": c.culture_tags or [],
        "is_verified": c.is_verified,
    }


def _job_dict(j: Job) -> dict:
    return {
        "id": str(j.id),
        "title": j.title,
        "location": j.location,
        "remote_ok": j.remote_ok,
        "job_type": j.job_type,
        "salary_min": j.salary_min,
        "salary_max": j.salary_max,
        "salary_currency": j.salary_currency,
        "skills_required": j.skills_required or [],
        "has_tryout": j.has_tryout,
        "created_at": j.created_at.isoformat() if j.created_at else None,
    }


# ── Endpoints ──────────────────────────────────────────────────────────────────


@router.get("/{slug}")
async def get_company_page(
    slug: str,
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=50),
    db: AsyncSession = Depends(get_db),
):
    """
    Public company page — returns company profile + paginated active job listings.
    Used by /companies/:slug on the frontend.
    """
    # Fetch company profile by slug
    result = await db.execute(select(CompanyProfile).where(CompanyProfile.slug == slug))
    company = result.scalar_one_or_none()

    if not company:
        raise HTTPException(status_code=404, detail="Company not found")

    # Fetch active jobs posted by this company (employer_id = company.employer_id)
    jobs_q = (
        select(Job)
        .where(
            Job.employer_id == company.employer_id,
            Job.status == JobStatus.ACTIVE,
        )
        .order_by(Job.created_at.desc())
    )

    # Count total
    count_result = await db.execute(jobs_q)
    all_jobs = count_result.scalars().all()
    total = len(all_jobs)

    # Paginate
    offset = (page - 1) * page_size
    paginated = all_jobs[offset : offset + page_size]

    return {
        "company": _company_dict(company),
        "jobs": [_job_dict(j) for j in paginated],
        "total_jobs": total,
        "page": page,
        "page_size": page_size,
        "total_pages": max(1, math.ceil(total / page_size)),
    }


@router.get("/")
async def list_companies(
    query: Optional[str] = Query(None, description="Search by company name"),
    industry: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(12, ge=1, le=48),
    db: AsyncSession = Depends(get_db),
):
    """List/search public company profiles (directory page)."""
    stmt = select(CompanyProfile).where(CompanyProfile.slug.isnot(None))

    if query:
        stmt = stmt.where(CompanyProfile.name.ilike(f"%{query}%"))
    if industry:
        stmt = stmt.where(CompanyProfile.industry.ilike(f"%{industry}%"))

    stmt = stmt.order_by(CompanyProfile.name)

    result = await db.execute(stmt)
    all_companies = result.scalars().all()
    total = len(all_companies)
    offset = (page - 1) * page_size

    return {
        "companies": [_company_dict(c) for c in all_companies[offset : offset + page_size]],
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": max(1, math.ceil(total / page_size)),
    }
