"""Publish all draft jobs via API."""
import asyncio, httpx

async def main():
    async with httpx.AsyncClient(timeout=15) as c:
        r = await c.post("http://localhost:8000/api/auth/login",
                         json={"email": "sakshi.hr@technova.in", "password": "TechNova@2024"})
        token = r.json()["access_token"]
        page = 1
        published = 0
        while True:
            jobs_r = await c.get(f"http://localhost:8000/api/jobs/my-jobs?page={page}&page_size=50",
                                 headers={"Authorization": f"Bearer {token}"})
            data = jobs_r.json()
            jobs = data.get("jobs", [])
            if not jobs:
                break
            for job in jobs:
                if job["status"] in ("draft", "DRAFT"):
                    pub = await c.post(f"http://localhost:8000/api/jobs/{job['id']}/publish",
                                       headers={"Authorization": f"Bearer {token}"})
                    if pub.status_code == 200:
                        print(f"  ✅ Published: {job['title']}")
                        published += 1
                    else:
                        print(f"  ❌ Failed ({pub.status_code}): {job['title']} — {pub.text[:80]}")
                else:
                    print(f"  ✓  Already {job['status']}: {job['title']}")
            if page * 50 >= data.get("total", 0):
                break
            page += 1
        print(f"\n✅ Published {published} jobs")

asyncio.run(main())
