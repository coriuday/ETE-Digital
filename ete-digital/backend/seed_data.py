"""
Seed Data Script — creates realistic mock data for development/testing
Run from backend/ directory:
  python seed_data.py
"""
import asyncio
import sys
import os

# Add backend to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from app.core.security import hash_password
import uuid
from datetime import datetime, timedelta

# Load env
from dotenv import load_dotenv
load_dotenv()

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://postgres@localhost:5432/postgres"
).replace("postgresql://", "postgresql+asyncpg://")

engine = create_async_engine(DATABASE_URL, echo=False)
AsyncSessionLocal = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


async def seed():
    from app.models.users import User, UserProfile, UserRole
    from app.models.jobs import Job, JobType, JobStatus, Application, ApplicationStatus

    async with AsyncSessionLocal() as db:
        print("🌱 Seeding database with mock data...")

        # ── 1. CREATE USERS ──────────────────────────────────────────────

        admin_id = uuid.uuid4()
        employer_id = uuid.uuid4()
        candidate_id = uuid.uuid4()
        candidate2_id = uuid.uuid4()

        # Admin
        admin = User(
            id=admin_id,
            email="admin@etedigital.com",
            password_hash=hash_password("Admin@1234"),
            role=UserRole.ADMIN,
            is_verified=True,
            is_active=True,
        )

        # Employer
        employer = User(
            id=employer_id,
            email="hr@novatech.io",
            password_hash=hash_password("Employer@1234"),
            role=UserRole.EMPLOYER,
            is_verified=True,
            is_active=True,
        )

        # Candidate 1
        candidate = User(
            id=candidate_id,
            email="arjun.sharma@gmail.com",
            password_hash=hash_password("Candidate@1234"),
            role=UserRole.CANDIDATE,
            is_verified=True,
            is_active=True,
        )

        # Candidate 2
        candidate2 = User(
            id=candidate2_id,
            email="priya.nair@gmail.com",
            password_hash=hash_password("Candidate@1234"),
            role=UserRole.CANDIDATE,
            is_verified=True,
            is_active=True,
        )

        db.add_all([admin, employer, candidate, candidate2])
        await db.flush()

        # ── 2. CREATE PROFILES ───────────────────────────────────────────

        admin_profile = UserProfile(
            user_id=admin_id,
            full_name="ETE Admin",
            location="Bangalore, India",
            bio="Platform administrator",
        )

        employer_profile = UserProfile(
            user_id=employer_id,
            full_name="NovaTech HR Team",
            location="Hyderabad, India",
            bio="We build the future of enterprise software at NovaTech Solutions.",
            skills=["Recruitment", "Tech Hiring", "Python", "React"],
            social_links={"linkedin": "https://linkedin.com/company/novatech"},
        )

        candidate_profile = UserProfile(
            user_id=candidate_id,
            full_name="Arjun Sharma",
            location="Pune, India",
            bio="Full-stack developer with 3+ years of experience in React and FastAPI.",
            skills=["React", "TypeScript", "Python", "FastAPI", "PostgreSQL", "Docker"],
            experience_years="3-5",
            social_links={
                "github": "https://github.com/arjunsharma",
                "linkedin": "https://linkedin.com/in/arjunsharma",
            },
        )

        candidate2_profile = UserProfile(
            user_id=candidate2_id,
            full_name="Priya Nair",
            location="Chennai, India",
            bio="Backend engineer specializing in Python microservices and cloud infrastructure.",
            skills=["Python", "FastAPI", "AWS", "Docker", "Kubernetes", "PostgreSQL"],
            experience_years="2-3",
            social_links={
                "github": "https://github.com/priyanair",
                "linkedin": "https://linkedin.com/in/priyanair",
            },
        )

        db.add_all([admin_profile, employer_profile, candidate_profile, candidate2_profile])
        await db.flush()

        # ── 3. CREATE JOB POSTINGS ───────────────────────────────────────

        job1_id = uuid.uuid4()
        job2_id = uuid.uuid4()
        job3_id = uuid.uuid4()

        job1 = Job(
            id=job1_id,
            employer_id=employer_id,
            title="Senior React Developer",
            company="NovaTech Solutions",
            description=(
                "We are looking for a Senior React Developer to join our product team at NovaTech Solutions. "
                "You will lead the frontend architecture of our enterprise SaaS platform, collaborate closely "
                "with designers and backend engineers, and mentor junior developers. This is a high-impact role "
                "where your work will directly affect 50,000+ users.\n\n"
                "You will work on building performant, accessible, and beautiful UIs using React 18, TypeScript, "
                "and our modern design system. Experience with state management (Zustand/Redux), REST APIs, and "
                "CI/CD pipelines is expected."
            ),
            requirements=(
                "- 4+ years of React.js experience\n"
                "- Strong TypeScript skills\n"
                "- Experience with REST APIs and state management\n"
                "- Familiarity with testing (Jest, React Testing Library)\n"
                "- Good understanding of web performance and accessibility\n"
                "- Experience with Git and CI/CD workflows"
            ),
            job_type=JobType.FULL_TIME,
            location="Hyderabad, India",
            remote_ok=True,
            salary_min=2500000,
            salary_max=3500000,
            salary_currency="INR",
            skills_required=["React", "TypeScript", "JavaScript", "REST APIs", "Git", "CSS"],
            experience_required="4-6",
            status=JobStatus.ACTIVE,
            has_tryout=True,
            tryout_config={
                "duration_days": 3,
                "payment_amount": 5000,
                "currency": "INR",
                "task": "Build a responsive job board UI component with search and filter functionality using React and TypeScript.",
                "rubric": {
                    "code_quality": 30,
                    "functionality": 40,
                    "ui_design": 20,
                    "documentation": 10
                }
            },
            views_count=142,
            applications_count=2,
            published_at=datetime.utcnow() - timedelta(days=5),
        )

        job2 = Job(
            id=job2_id,
            employer_id=employer_id,
            title="Python Backend Engineer",
            company="NovaTech Solutions",
            description=(
                "Join NovaTech's backend engineering team and help us scale our microservices architecture. "
                "You will design and build high-performance REST APIs using FastAPI and Python, work with "
                "PostgreSQL and Redis, and deploy on AWS using Docker and Kubernetes.\n\n"
                "We have a strong engineering culture with code reviews, technical RFCs, and knowledge-sharing "
                "sessions. Remote-friendly with flexible hours."
            ),
            requirements=(
                "- 3+ years of Python backend experience\n"
                "- Experience with FastAPI or Django REST Framework\n"
                "- Strong SQL and PostgreSQL skills\n"
                "- Experience with Docker and containerization\n"
                "- Familiarity with Redis and caching strategies\n"
                "- Understanding of async programming in Python"
            ),
            job_type=JobType.FULL_TIME,
            location="Hyderabad, India",
            remote_ok=True,
            salary_min=2000000,
            salary_max=3000000,
            salary_currency="INR",
            skills_required=["Python", "FastAPI", "PostgreSQL", "Redis", "Docker", "AWS"],
            experience_required="3-5",
            status=JobStatus.ACTIVE,
            has_tryout=True,
            tryout_config={
                "duration_days": 4,
                "payment_amount": 4000,
                "currency": "INR",
                "task": "Design and implement a REST API with authentication, rate limiting, and PostgreSQL persistence using FastAPI.",
                "rubric": {
                    "api_design": 30,
                    "code_quality": 30,
                    "performance": 25,
                    "documentation": 15
                }
            },
            views_count=98,
            applications_count=1,
            published_at=datetime.utcnow() - timedelta(days=3),
        )

        job3 = Job(
            id=job3_id,
            employer_id=employer_id,
            title="DevOps Engineer (Kubernetes)",
            company="NovaTech Solutions",
            description=(
                "NovaTech is expanding its infrastructure team. We need a DevOps Engineer who can help us "
                "scale our Kubernetes clusters, automate deployments, and improve observability across our "
                "microservices. This role is currently in draft — final job description coming soon."
            ),
            requirements=(
                "- 3+ years of DevOps/SRE experience\n"
                "- Strong Kubernetes and Helm expertise\n"
                "- Experience with Terraform and infrastructure as code\n"
                "- Proficiency in CI/CD tools (GitHub Actions, ArgoCD)\n"
                "- Monitoring stack experience (Prometheus, Grafana, Loki)"
            ),
            job_type=JobType.FULL_TIME,
            location="Hyderabad, India",
            remote_ok=False,
            salary_min=1800000,
            salary_max=2800000,
            salary_currency="INR",
            skills_required=["Kubernetes", "Docker", "Terraform", "AWS", "Helm", "CI/CD"],
            experience_required="3-6",
            status=JobStatus.DRAFT,
            has_tryout=False,
            views_count=0,
            applications_count=0,
        )

        db.add_all([job1, job2, job3])
        await db.flush()

        # ── 4. CREATE APPLICATIONS ───────────────────────────────────────

        app1 = Application(
            id=uuid.uuid4(),
            job_id=job1_id,
            candidate_id=candidate_id,
            cover_letter=(
                "I am excited to apply for the Senior React Developer role at NovaTech Solutions. "
                "Over the past 3 years, I have built production-grade React applications for startups "
                "and enterprise clients, with a strong focus on TypeScript, performance, and accessibility. "
                "I would love the opportunity to contribute to your product team."
            ),
            custom_answers={"why_novatech": "I love NovaTech's product vision and engineering culture."},
            status=ApplicationStatus.SHORTLISTED,
            match_score=87,
            match_explanation={"skills_match": 90, "experience_match": 85, "location_match": 85},
        )

        app2 = Application(
            id=uuid.uuid4(),
            job_id=job1_id,
            candidate_id=candidate2_id,
            cover_letter=(
                "I am a backend engineer with strong Python skills and some React experience. "
                "I am transitioning towards full-stack roles and believe this opportunity at NovaTech "
                "aligns perfectly with my growth trajectory."
            ),
            status=ApplicationStatus.PENDING,
            match_score=62,
            match_explanation={"skills_match": 65, "experience_match": 60, "location_match": 60},
        )

        app3 = Application(
            id=uuid.uuid4(),
            job_id=job2_id,
            candidate_id=candidate_id,
            cover_letter=(
                "Although my primary stack is React/TypeScript, I have 2 years of experience building "
                "FastAPI backends for my own projects and for freelance clients. I am highly motivated to "
                "transition into a full-stack backend engineer role and NovaTech is my top choice."
            ),
            status=ApplicationStatus.REVIEWED,
            match_score=74,
            match_explanation={"skills_match": 80, "experience_match": 70, "location_match": 75},
        )

        db.add_all([app1, app2, app3])
        await db.commit()

        print("\n✅ Seed data created successfully!\n")
        print("=" * 50)
        print("🔐 Login Credentials")
        print("=" * 50)
        print(f"  👤 Admin    → admin@etedigital.com    / Admin@1234")
        print(f"  🏢 Employer → hr@novatech.io           / Employer@1234")
        print(f"  👨 Candidate → arjun.sharma@gmail.com  / Candidate@1234")
        print(f"  👩 Candidate → priya.nair@gmail.com    / Candidate@1234")
        print("=" * 50)
        print(f"\n📋 Created:")
        print(f"  Jobs        → 2 active + 1 draft (all by NovaTech)")
        print(f"  Applications → 3 total (Arjun → Job1 shortlisted, Job2 reviewed; Priya → Job1 pending)")
        print("=" * 50)


if __name__ == "__main__":
    asyncio.run(seed())
