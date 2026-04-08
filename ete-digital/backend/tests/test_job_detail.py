"""Debug job detail 500 - test with explicit DB query."""
import asyncio, httpx

async def test():
    async with httpx.AsyncClient(timeout=10) as c:
        # Get first job ID
        jobs = await c.get("http://localhost:8000/api/jobs/search?page_size=1")
        job_list = jobs.json().get("jobs", [])
        if not job_list:
            print("No jobs found in search")
            return
        jid = job_list[0]["id"]
        print("Testing job ID:", jid)
        
        # Test without auth
        r1 = await c.get(f"http://localhost:8000/api/jobs/{jid}")
        print("No auth:", r1.status_code, r1.text[:200] if r1.status_code != 200 else "OK")
        
        # test with auth
        login = await c.post("http://localhost:8000/api/auth/login",
                             json={"email": "arjun.mehta.dev@gmail.com", "password": "Arjun@2024"})
        token = login.json().get("access_token", "")
        r2 = await c.get(f"http://localhost:8000/api/jobs/{jid}",
                         headers={"Authorization": f"Bearer {token}"})
        print("With auth:", r2.status_code, r2.text[:200] if r2.status_code != 200 else "OK")

if __name__ == "__main__":
    asyncio.run(test())
