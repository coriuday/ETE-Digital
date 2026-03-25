"""
E2E Seed Script — Registers users and seeds 8 jobs for full E2E platform test.
Run from backend/ directory:
  .venv\Scripts\python e2e_seed.py
"""
import asyncio
import httpx
import json

BASE = "http://localhost:8000"

USERS = [
    {
        "email": "admin@etedigital.com",
        "password": "Admin@1234",
        "role": "admin",
        "full_name": "ETE Admin",
    },
    {
        "email": "sakshi.hr@technova.in",
        "password": "TechNova@2024",
        "role": "employer",
        "full_name": "Sakshi Agarwal",
    },
    {
        "email": "arjun.mehta.dev@gmail.com",
        "password": "Arjun@2024",
        "role": "candidate",
        "full_name": "Arjun Mehta",
    },
    {
        "email": "priya.sharma.tech@gmail.com",
        "password": "Priya@2024",
        "role": "candidate",
        "full_name": "Priya Sharma",
    },
]

JOBS = [
    # ---- FRESHER JOBS ----
    {
        "title": "Junior Frontend Developer",
        "company": "TechNova Solutions",
        "description": "Join our frontend team building modern React applications used by millions. Great for fresh graduates passionate about UI development.",
        "requirements": "B.Tech/BCA in CS. Knowledge of HTML, CSS, JavaScript, React basics.",
        "job_type": "full_time",
        "location": "Bangalore, Karnataka",
        "remote_ok": False,
        "salary_min": 400000, "salary_max": 600000, "salary_currency": "INR",
        "experience_required": "Fresher",
        "skills_required": ["HTML", "CSS", "JavaScript", "React", "Git"],
        "has_tryout": True,
    },
    {
        "title": "Data Analyst Trainee",
        "company": "TechNova Solutions",
        "description": "Kick-start your data career. Analyse business metrics, create dashboards, provide insights to product teams.",
        "requirements": "Freshers welcome. Excel, SQL basics, Python preferred.",
        "job_type": "full_time",
        "location": "Remote",
        "remote_ok": True,
        "salary_min": 300000, "salary_max": 500000, "salary_currency": "INR",
        "experience_required": "Fresher",
        "skills_required": ["SQL", "Excel", "Python", "Tableau"],
        "has_tryout": False,
    },
    {
        "title": "QA / Test Engineer (Fresher)",
        "company": "TechNova Solutions",
        "description": "Write test cases, perform manual and automated testing on web and mobile applications.",
        "requirements": "Any engineering graduate. Interest in testing. Python or Java basics.",
        "job_type": "full_time",
        "location": "Hyderabad, Telangana",
        "remote_ok": False,
        "salary_min": 350000, "salary_max": 500000, "salary_currency": "INR",
        "experience_required": "Fresher",
        "skills_required": ["Manual Testing", "Selenium", "JIRA", "Python"],
        "has_tryout": True,
    },
    {
        "title": "Business Analyst — Associate",
        "company": "TechNova Solutions",
        "description": "Gather requirements, create process docs, work between tech and business teams.",
        "requirements": "MBA or B.Tech graduates. Good communication. MS Excel, PowerPoint.",
        "job_type": "full_time",
        "location": "Mumbai, Maharashtra",
        "remote_ok": False,
        "salary_min": 400000, "salary_max": 600000, "salary_currency": "INR",
        "experience_required": "Fresher",
        "skills_required": ["Business Analysis", "Excel", "SQL", "Communication"],
        "has_tryout": False,
    },
    # ---- EXPERIENCED JOBS ----
    {
        "title": "Senior Backend Engineer (Python / FastAPI)",
        "company": "TechNova Solutions",
        "description": "Own our core API platform. Design distributed systems, mentor juniors, drive architecture for high-traffic services.",
        "requirements": "5+ years backend. Expert in Python, FastAPI/Django. PostgreSQL, Redis, Docker. Microservices required.",
        "job_type": "full_time",
        "location": "Bangalore, Karnataka",
        "remote_ok": True,
        "salary_min": 1800000, "salary_max": 2800000, "salary_currency": "INR",
        "experience_required": "5+ years",
        "skills_required": ["Python", "FastAPI", "PostgreSQL", "Redis", "Docker", "Microservices"],
        "has_tryout": True,
    },
    {
        "title": "Product Manager — Platform",
        "company": "TechNova Solutions",
        "description": "Lead product strategy for our core hiring platform. Own roadmap, work with design and engineering.",
        "requirements": "4+ years PM. B2B SaaS background. HR-tech or marketplace ideal. MBA preferred.",
        "job_type": "full_time",
        "location": "Remote",
        "remote_ok": True,
        "salary_min": 2200000, "salary_max": 3500000, "salary_currency": "INR",
        "experience_required": "4+ years",
        "skills_required": ["Product Management", "Roadmapping", "Data Analysis", "Agile", "Figma"],
        "has_tryout": False,
    },
    {
        "title": "DevOps / Platform Engineering Lead",
        "company": "TechNova Solutions",
        "description": "Manage CI/CD pipelines, Kubernetes clusters, observability stacks. Ensure 99.9% uptime.",
        "requirements": "6+ years DevOps/SRE. Kubernetes, Terraform, GitHub Actions. AWS or GCP certified.",
        "job_type": "full_time",
        "location": "Pune, Maharashtra",
        "remote_ok": False,
        "salary_min": 2000000, "salary_max": 3000000, "salary_currency": "INR",
        "experience_required": "6+ years",
        "skills_required": ["Kubernetes", "Terraform", "AWS", "CI/CD", "Docker", "Prometheus"],
        "has_tryout": False,
    },
    {
        "title": "Data Science Manager",
        "company": "TechNova Solutions",
        "description": "Lead team of 6 data scientists building candidate-job matching models and recommendation engine.",
        "requirements": "7+ years Data Science. 2+ years managing. ML, NLP, Python, MLFlow, AWS SageMaker.",
        "job_type": "full_time",
        "location": "Hyderabad, Telangana",
        "remote_ok": True,
        "salary_min": 2500000, "salary_max": 4000000, "salary_currency": "INR",
        "experience_required": "7+ years",
        "skills_required": ["Machine Learning", "NLP", "Python", "MLFlow", "Leadership", "AWS SageMaker"],
        "has_tryout": True,
    },
]


async def register_user(client: httpx.AsyncClient, user: dict) -> bool:
    """Register a user, skip if already exists."""
    payload = {
        "email": user["email"],
        "password": user["password"],
        "role": user["role"],
        "full_name": user["full_name"],
    }
    r = await client.post(f"{BASE}/api/auth/register", json=payload)
    if r.status_code == 201:
        print(f"  ✅ Registered: {user['email']} [{user['role']}]")
        return True
    elif r.status_code == 400 and "already registered" in r.text:
        print(f"  ⚠️  Already exists: {user['email']} (skipped)")
        return True
    else:
        print(f"  ❌ Register failed {user['email']}: {r.status_code} {r.text[:120]}")
        return False


async def login(client: httpx.AsyncClient, email: str, password: str) -> str | None:
    r = await client.post(f"{BASE}/api/auth/login", json={"email": email, "password": password})
    if r.status_code == 200:
        token = r.json()["access_token"]
        print(f"  ✅ Logged in: {email}")
        return token
    print(f"  ❌ Login failed {email}: {r.status_code} {r.text[:120]}")
    return None


async def post_and_publish_job(client: httpx.AsyncClient, token: str, job: dict) -> bool:
    headers = {"Authorization": f"Bearer {token}"}
    r = await client.post(f"{BASE}/api/jobs/", json=job, headers=headers)
    if r.status_code == 201:
        job_id = r.json()["id"]
        pub = await client.post(f"{BASE}/api/jobs/{job_id}/publish", headers=headers)
        status = pub.json().get("status", "unknown") if pub.status_code == 200 else f"err:{pub.status_code}"
        print(f"  ✅ [{status}] {job['title']}")
        return True
    print(f"  ❌ {job['title']}: {r.status_code} {r.text[:120]}")
    return False


async def main():
    print("\n" + "=" * 56)
    print("  ETE Digital — E2E Seed Script")
    print("=" * 56)

    async with httpx.AsyncClient(timeout=20) as client:
        # Step 1: Register all users
        print("\n👤 Registering users (non-admin only via API)...")
        for user in USERS:
            if user["role"] == "admin":
                print(f"  ⏭️  Skipping admin (must be created directly or already exists): {user['email']}")
                continue
            await register_user(client, user)

        # Step 2: Login as HR
        print("\n🔑 Logging in as HR...")
        hr_token = await login(client, "sakshi.hr@technova.in", "TechNova@2024")

        if hr_token:
            print(f"\n📋 Posting {len(JOBS)} jobs...")
            for job in JOBS:
                await post_and_publish_job(client, hr_token, job)

        # Step 3: Quick platform summary
        print("\n📊 Platform summary check...")
        r = await client.get(f"{BASE}/api/jobs/", params={"status": "active", "page_size": 1})
        if r.status_code == 200:
            total = r.json().get("total", "?")
            print(f"  📦 Active jobs visible: {total}")
        else:
            print(f"  ❌ Jobs list error: {r.status_code} {r.text[:80]}")

    print("\n" + "=" * 56)
    print("  ✅ Seed complete!")
    print("=" * 56)
    print("\n🔐 Login Credentials:")
    print(f"  HR        → sakshi.hr@technova.in         / TechNova@2024")
    print(f"  Fresher   → arjun.mehta.dev@gmail.com     / Arjun@2024")
    print(f"  Exp       → priya.sharma.tech@gmail.com   / Priya@2024")
    print(f"  Admin     → admin@etedigital.com           / Admin@1234 (if exists)")
    print()


if __name__ == "__main__":
    asyncio.run(main())
