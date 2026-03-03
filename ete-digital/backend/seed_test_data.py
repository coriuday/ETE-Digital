"""
Seed script: Creates HR account, posts 8 jobs (4 fresher + 4 experienced),
creates two candidate profiles (fresher + experienced) with mock resumes.
Run from backend directory with: .venv\Scripts\python seed_test_data.py
"""
import asyncio
import httpx
import json

BASE = "http://localhost:8000"

HR = {
    "email": "sakshi.hr@technova.in",
    "password": "TechNova@2024",
    "role": "employer",
    "full_name": "Sakshi Agarwal"
}

FRESHER = {
    "email": "arjun.mehta.dev@gmail.com",
    "password": "Arjun@2024",
    "role": "candidate",
    "full_name": "Arjun Mehta"
}

EXPERIENCED = {
    "email": "priya.sharma.tech@gmail.com",
    "password": "Priya@2024",
    "role": "candidate",
    "full_name": "Priya Sharma"
}

JOBS = [
    # ---- FRESHER JOBS ----
    {
        "title": "Junior Frontend Developer",
        "company": "TechNova Solutions",
        "description": "Join our frontend team to build modern React applications. You will work on customer-facing products used by millions. Great opportunity for fresh graduates passionate about UI development.",
        "requirements": "B.Tech/BCA in CS or related field. Knowledge of HTML, CSS, JavaScript, React basics. Strong portfolio or personal projects preferred.",
        "job_type": "full_time",
        "location": "Bangalore, Karnataka",
        "remote_ok": False,
        "salary_min": 400000,
        "salary_max": 600000,
        "salary_currency": "INR",
        "experience_required": 0,
        "skills_required": ["HTML", "CSS", "JavaScript", "React", "Git"],
        "has_tryout": True,
    },
    {
        "title": "Data Analyst Trainee",
        "company": "TechNova Solutions",
        "description": "Kick-start your data career as a Data Analyst Trainee. You will learn to analyse business metrics, create dashboards, and provide actionable insights to product teams.",
        "requirements": "Freshers welcome. Knowledge of Excel, SQL basics, Python preferred. A statistics or analytics background is a plus.",
        "job_type": "full_time",
        "location": "Remote",
        "remote_ok": True,
        "salary_min": 300000,
        "salary_max": 500000,
        "salary_currency": "INR",
        "experience_required": 0,
        "skills_required": ["SQL", "Excel", "Python", "Tableau"],
        "has_tryout": False,
    },
    {
        "title": "QA / Test Engineer (Fresher)",
        "company": "TechNova Solutions",
        "description": "We are looking for detail-oriented freshers to join our QA team. You will write test cases, perform manual and automated testing on our web and mobile applications.",
        "requirements": "Any engineering graduate. Interest in software testing. Basic programming knowledge in Python or Java.",
        "job_type": "full_time",
        "location": "Hyderabad, Telangana",
        "remote_ok": False,
        "salary_min": 350000,
        "salary_max": 500000,
        "salary_currency": "INR",
        "experience_required": 0,
        "skills_required": ["Manual Testing", "Selenium", "JIRA", "Python"],
        "has_tryout": True,
    },
    {
        "title": "Business Analyst — Associate",
        "company": "TechNova Solutions",
        "description": "Exciting opportunity for freshers to work as a Business Analyst Associate. You will gather requirements, create process documentation, and work between tech and business teams.",
        "requirements": "MBA or B.Tech graduates. Good communication and analytical skills. MS Excel, PowerPoint proficiency.",
        "job_type": "full_time",
        "location": "Mumbai, Maharashtra",
        "remote_ok": False,
        "salary_min": 400000,
        "salary_max": 600000,
        "salary_currency": "INR",
        "experience_required": 0,
        "skills_required": ["Business Analysis", "Excel", "SQL", "Communication"],
        "has_tryout": False,
    },
    # ---- EXPERIENCED JOBS ----
    {
        "title": "Senior Backend Engineer (Python / FastAPI)",
        "company": "TechNova Solutions",
        "description": "We need a Senior Backend Engineer to own our core API platform. You will design distributed systems, mentor juniors, conduct code reviews, and drive architectural decisions for our high-traffic services.",
        "requirements": "5+ years backend experience. Expert in Python, FastAPI or Django. PostgreSQL, Redis, Docker required. Microservices architecture experience a must.",
        "job_type": "full_time",
        "location": "Bangalore, Karnataka",
        "remote_ok": True,
        "salary_min": 1800000,
        "salary_max": 2800000,
        "salary_currency": "INR",
        "experience_required": 5,
        "skills_required": ["Python", "FastAPI", "PostgreSQL", "Redis", "Docker", "Microservices"],
        "has_tryout": True,
    },
    {
        "title": "Product Manager — Platform",
        "company": "TechNova Solutions",
        "description": "Lead product strategy for our core hiring platform. You will own the product roadmap, work with design and engineering, and define the vision for ETE's matching and tryout features.",
        "requirements": "4+ years Product Management. Experience with B2B SaaS platforms. Background in HR-tech or marketplace products is ideal. MBA preferred.",
        "job_type": "full_time",
        "location": "Remote",
        "remote_ok": True,
        "salary_min": 2200000,
        "salary_max": 3500000,
        "salary_currency": "INR",
        "experience_required": 4,
        "skills_required": ["Product Management", "Roadmapping", "Data Analysis", "Agile", "Figma"],
        "has_tryout": False,
    },
    {
        "title": "DevOps / Platform Engineering Lead",
        "company": "TechNova Solutions",
        "description": "Own and evolve our infrastructure. You will manage CI/CD pipelines, Kubernetes clusters, observability stacks, and ensure 99.9% uptime for our production systems.",
        "requirements": "6+ years DevOps/SRE experience. Kubernetes, Terraform, GitHub Actions. AWS or GCP certified. On-call rotation involved.",
        "job_type": "full_time",
        "location": "Pune, Maharashtra",
        "remote_ok": False,
        "salary_min": 2000000,
        "salary_max": 3000000,
        "salary_currency": "INR",
        "experience_required": 6,
        "skills_required": ["Kubernetes", "Terraform", "AWS", "CI/CD", "Docker", "Prometheus"],
        "has_tryout": False,
    },
    {
        "title": "Data Science Manager",
        "company": "TechNova Solutions",
        "description": "Lead a team of 6 data scientists building our candidate-job matching models and recommendation engine. You will define the ML roadmap, drive model accuracy improvements, and present insights to leadership.",
        "requirements": "7+ years in Data Science. 2+ years managing teams. Deep expertise in ML, NLP. Python, MLFlow, AWS SageMaker experience.",
        "job_type": "full_time",
        "location": "Hyderabad, Telangana",
        "remote_ok": True,
        "salary_min": 2500000,
        "salary_max": 4000000,
        "salary_currency": "INR",
        "experience_required": 7,
        "skills_required": ["Machine Learning", "NLP", "Python", "MLFlow", "Leadership", "AWS SageMaker"],
        "has_tryout": True,
    },
]


async def register(client, user):
    r = await client.post(f"{BASE}/api/auth/register", json=user)
    if r.status_code in (200, 201):
        print(f"  ✅ Registered {user['email']}")
    elif r.status_code == 409:
        print(f"  ⚠️  Already exists: {user['email']}")
    else:
        print(f"  ❌ Register failed {user['email']}: {r.status_code} {r.text[:120]}")


async def login(client, email, password):
    r = await client.post(f"{BASE}/api/auth/login",
                          json={"email": email, "password": password})
    if r.status_code == 200:
        token = r.json()["access_token"]
        print(f"  ✅ Login OK: {email}")
        return token
    else:
        print(f"  ❌ Login failed {email}: {r.status_code} {r.text[:120]}")
        return None


async def post_job(client, token, job):
    r = await client.post(
        f"{BASE}/api/jobs/",
        json=job,
        headers={"Authorization": f"Bearer {token}"}
    )
    if r.status_code == 201:
        data = r.json()
        job_id = data["id"]
        # Publish it immediately
        pub = await client.post(
            f"{BASE}/api/jobs/{job_id}/publish",
            headers={"Authorization": f"Bearer {token}"}
        )
        status = pub.json().get("status", "unknown") if pub.status_code == 200 else "draft"
        print(f"  ✅ Job posted: {job['title']} [{status}]")
        return job_id
    else:
        print(f"  ❌ Job failed: {job['title']} → {r.status_code} {r.text[:120]}")
        return None


async def update_profile(client, token, profile_data):
    r = await client.put(
        f"{BASE}/api/users/profile",
        json=profile_data,
        headers={"Authorization": f"Bearer {token}"}
    )
    if r.status_code in (200, 201):
        print(f"  ✅ Profile updated")
    else:
        print(f"  ⚠️  Profile update: {r.status_code} {r.text[:120]}")


async def main():
    async with httpx.AsyncClient(timeout=15) as client:
        print("\n🏢 Phase 1: Creating HR account (TechNova Solutions)")
        await register(client, HR)
        hr_token = await login(client, HR["email"], HR["password"])

        if hr_token:
            await update_profile(client, hr_token, {
                "full_name": "Sakshi Agarwal",
                "bio": "Senior HR Manager at TechNova Solutions. Passionate about finding top talent through outcome-driven hiring.",
                "company_name": "TechNova Solutions",
                "company_website": "https://technova.in",
            })

            print(f"\n📋 Phase 2: Posting {len(JOBS)} jobs")
            for job in JOBS:
                await post_job(client, hr_token, job)

        print("\n👤 Phase 3: Creating candidate — Arjun Mehta (Fresher)")
        await register(client, FRESHER)
        fresher_token = await login(client, FRESHER["email"], FRESHER["password"])
        if fresher_token:
            await update_profile(client, fresher_token, {
                "full_name": "Arjun Mehta",
                "headline": "Fresh B.Tech Graduate | React Developer | Open to opportunities",
                "bio": "B.Tech CSE 2024 graduate from VIT Pune. Built 3 personal projects with React and FastAPI. Passionate about clean UI and performance.",
                "location": "Bangalore, Karnataka",
                "experience_years": 0,
                "education": [{"degree": "B.Tech CSE", "institution": "VIT Pune", "year": 2024}],
                "skills": ["React", "JavaScript", "Python", "FastAPI", "PostgreSQL", "Git", "Tailwind CSS"],
            })

        print("\n👤 Phase 4: Creating candidate — Priya Sharma (Experienced)")
        await register(client, EXPERIENCED)
        exp_token = await login(client, EXPERIENCED["email"], EXPERIENCED["password"])
        if exp_token:
            await update_profile(client, exp_token, {
                "full_name": "Priya Sharma",
                "headline": "Senior Full-Stack Engineer | 7 Years | Python + React | Hiring for Dream Role",
                "bio": "7 years of experience building scalable products at Flipkart, Razorpay, and startups. Expert in Python backend and React frontend. Leading teams of 4-6 engineers.",
                "location": "Hyderabad, Telangana",
                "experience_years": 7,
                "education": [{"degree": "B.Tech CSE", "institution": "IIT Kharagpur", "year": 2017}],
                "skills": ["Python", "FastAPI", "React", "TypeScript", "PostgreSQL", "Redis", "Docker", "Kubernetes", "AWS"],
            })

        print("\n✅ Seed complete! Credentials:")
        print(f"   HR:         {HR['email']} / {HR['password']}")
        print(f"   Fresher:    {FRESHER['email']} / {FRESHER['password']}")
        print(f"   Experienced:{EXPERIENCED['email']} / {EXPERIENCED['password']}")
        print(f"   Admin:      admin@etedigital.com / AdminPass123!")


if __name__ == "__main__":
    asyncio.run(main())
