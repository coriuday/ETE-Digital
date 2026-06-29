"""
API E2E smoke script — tests public and auth-validation endpoints.
Usage:
  python scripts/api_e2e_check.py [--base URL]
Default base: https://jobsrow.com
"""

import argparse
import asyncio
import sys
import uuid

import httpx

PASS = 0
FAIL = 0
WARN = 0


def ok(name: str, detail: str = ""):
    global PASS
    PASS += 1
    print(f"  PASS  {name}" + (f" — {detail}" if detail else ""))


def fail(name: str, detail: str = ""):
    global FAIL
    FAIL += 1
    print(f"  FAIL  {name}" + (f" — {detail}" if detail else ""))


def warn(name: str, detail: str = ""):
    global WARN
    WARN += 1
    print(f"  WARN  {name}" + (f" — {detail}" if detail else ""))


async def run(base: str):
    print(f"\nAPI E2E checks @ {base}\n")
    async with httpx.AsyncClient(base_url=base, timeout=20, follow_redirects=True) as c:
        # --- Public ---
        r = await c.get("/health")
        if r.status_code == 200 and r.json().get("status") == "healthy":
            ok("GET /health", r.json().get("environment", ""))
        else:
            fail("GET /health", f"{r.status_code} {r.text[:80]}")

        r = await c.get("/api/jobs/search", params={"page": 1, "page_size": 5})
        if r.status_code == 200 and "jobs" in r.json():
            ok("GET /api/jobs/search", f"total={r.json().get('total', 0)}")
        else:
            fail("GET /api/jobs/search", f"{r.status_code}")

        r = await c.get("/api/jobs/feed", params={"page_size": 1})
        if r.status_code == 200 and "jobs" in r.json():
            ok("GET /api/jobs/feed")
        else:
            fail("GET /api/jobs/feed", f"{r.status_code}")

        # Protected without auth
        r = await c.get("/api/audit/")
        if r.status_code in (401, 403):
            ok("GET /api/audit/ unauthenticated blocked", str(r.status_code))
        else:
            fail("GET /api/audit/ unauthenticated", f"expected 401/403 got {r.status_code}")

        r = await c.get("/api/users/gdpr/export")
        if r.status_code in (401, 403, 404, 405):
            ok("GDPR export unauthenticated blocked", str(r.status_code))
        else:
            warn("GDPR export unauthenticated", f"got {r.status_code}")

        # Employer free-email block on register
        junk = f"test.hr.{uuid.uuid4().hex[:8]}@gmail.com"
        r = await c.post(
            "/api/auth/register",
            json={
                "email": junk,
                "password": "TestPass@1234",
                "role": "employer",
                "full_name": "Test HR",
            },
        )
        if r.status_code in (400, 403, 422):
            ok("Employer gmail register blocked", str(r.status_code))
        else:
            fail("Employer gmail register blocked", f"got {r.status_code} {r.text[:100]}")

        # Candidate gmail should be allowed (may need email verify)
        cand = f"test.cand.{uuid.uuid4().hex[:8]}@gmail.com"
        r = await c.post(
            "/api/auth/register",
            json={
                "email": cand,
                "password": "TestPass@1234",
                "role": "candidate",
                "full_name": "Test Candidate",
            },
        )
        if r.status_code == 201:
            ok("Candidate gmail register allowed", cand)
        elif r.status_code == 400 and "already" in r.text.lower():
            ok("Candidate register duplicate handling")
        else:
            warn("Candidate gmail register", f"{r.status_code} {r.text[:80]}")

        # Invalid login
        r = await c.post("/api/auth/login", json={"email": "nobody@example.com", "password": "wrong"})
        if r.status_code in (401, 400):
            ok("Invalid login rejected", str(r.status_code))
        else:
            fail("Invalid login rejected", f"{r.status_code}")

        # Forgot password always succeeds (no enumeration)
        r = await c.post("/api/auth/forgot-password", json={"email": "nobody@example.com"})
        if r.status_code == 200:
            ok("Forgot password generic success")
        else:
            warn("Forgot password", f"{r.status_code}")

    print(f"\nResults: {PASS} passed, {FAIL} failed, {WARN} warnings\n")
    return FAIL == 0


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--base", default="https://jobsrow.com")
    args = parser.parse_args()
    success = asyncio.run(run(args.base.rstrip("/")))
    sys.exit(0 if success else 1)
