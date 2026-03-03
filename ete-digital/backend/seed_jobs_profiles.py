"""
Seed script v2 — corrected experience_required (string), profile upsert via SQL,
job posting with all fields matching the API schema.
Run: .venv\Scripts\python seed_jobs_profiles.py
"""
import asyncio
import httpx
import json
import asyncpg

DB_URL = "postgresql://ete_user:ete_dev_password_change_in_prod@localhost:5432/ete_digital"
BASE   = "http://localhost:8000"

CREDENTIALS = {
    "hr":         ("sakshi.hr@technova.in",        "TechNova@2024"),
    "fresher":    ("arjun.mehta.dev@gmail.com",    "Arjun@2024"),
    "experienced":("priya.sharma.tech@gmail.com",  "Priya@2024"),
}

JOBS = [
    # ---- FRESHER JOBS (experience_required = "Fresher / 0 years") ----
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

PROFILES = {
    "hr": {
        "full_name": "Sakshi Agarwal",
        "bio": "Senior HR Manager at TechNova Solutions. Passionate about outcome-driven hiring.",
        "location": "Bangalore, Karnataka",
        "experience_years": 8,
        "skills": ["Talent Acquisition", "HR Strategy", "Hiring", "ATS"],
    },
    "fresher": {
        "full_name": "Arjun Mehta",
        "bio": "B.Tech CSE 2024 graduate from VIT Pune. Built React+FastAPI projects. Passionate about clean UI.",
        "location": "Bangalore, Karnataka",
        "experience_years": 0,
        "skills": ["React", "JavaScript", "Python", "FastAPI", "PostgreSQL", "Git"],
    },
    "experienced": {
        "full_name": "Priya Sharma",
        "bio": "7 years of experience at Flipkart, Razorpay. Expert in Python backend and React. Leading teams of 4-6 engineers.",
        "location": "Hyderabad, Telangana",
        "experience_years": 7,
        "skills": ["Python", "FastAPI", "React", "TypeScript", "PostgreSQL", "Redis", "Docker", "AWS"],
    },
}


async def login(client, email, password):
    r = await client.post(f"{BASE}/api/auth/login", json={"email": email, "password": password})
    if r.status_code == 200:
        print(f"  ✅ Login: {email}")
        return r.json()["access_token"]
    print(f"  ❌ Login failed {email}: {r.status_code} {r.text[:80]}")
    return None


async def seed_profiles(conn):
    """Upsert profiles directly via SQL for all users."""
    exp_map = {"hr": "8 years", "fresher": "0 years", "experienced": "7 years"}
    for role, profile in PROFILES.items():
        email, _ = CREDENTIALS[role]
        user = await conn.fetchrow("SELECT id FROM users WHERE email = $1", email)
        if not user:
            print(f"  ⚠️  User not found: {email}")
            continue
        uid = user["id"]
        existing = await conn.fetchrow("SELECT user_id FROM user_profiles WHERE user_id = $1", uid)
        if existing:
            await conn.execute("""
                UPDATE user_profiles SET full_name=$2, bio=$3, location=$4,
                experience_years=$5, skills=$6 WHERE user_id=$1
            """, uid, profile["full_name"], profile["bio"], profile["location"],
                exp_map[role], json.dumps(profile["skills"]))
            print(f"  ✅ Profile updated: {email}")
        else:
            await conn.execute("""
                INSERT INTO user_profiles (user_id, full_name, bio, location, experience_years, skills)
                VALUES ($1, $2, $3, $4, $5, $6)
            """, uid, profile["full_name"], profile["bio"], profile["location"],
                exp_map[role], json.dumps(profile["skills"]))
            print(f"  ✅ Profile created: {email}")


async def main():
    async with httpx.AsyncClient(timeout=15) as client:
        # Login as HR
        hr_email, hr_pass = CREDENTIALS["hr"]
        hr_token = await login(client, hr_email, hr_pass)

        if hr_token:
            print(f"\n📋 Posting {len(JOBS)} jobs...")
            for job in JOBS:
                r = await client.post(
                    f"{BASE}/api/jobs/",
                    json=job,
                    headers={"Authorization": f"Bearer {hr_token}"}
                )
                if r.status_code == 201:
                    job_id = r.json()["id"]
                    pub = await client.post(
                        f"{BASE}/api/jobs/{job_id}/publish",
                        headers={"Authorization": f"Bearer {hr_token}"}
                    )
                    st = pub.json().get("status", "?") if pub.status_code == 200 else "draft"
                    print(f"  ✅ [{st}] {job['title']}")
                else:
                    print(f"  ❌ {job['title']}: {r.status_code} {r.text[:120]}")

    # Seed profiles via direct DB
    print("\n👤 Seeding user profiles via SQL...")
    conn = await asyncpg.connect(DB_URL)
    try:
        await seed_profiles(conn)
    finally:
        await conn.close()

    print("\n✅ Done! Credentials:")
    for role, (email, pwd) in CREDENTIALS.items():
        print(f"  {role:<12}: {email} / {pwd}")
    print(f"  {'admin':<12}: admin@etedigital.com / AdminPass123!")


if __name__ == "__main__":
    asyncio.run(main())
