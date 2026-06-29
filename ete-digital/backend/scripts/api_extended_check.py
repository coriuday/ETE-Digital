"""Extended local API role flows for audit/GDPR/fraud/jobs."""

import asyncio
import json
import uuid

import httpx

BASE = "http://127.0.0.1:8001"
HR_EMAIL = "sakshi.hr@technova.in"
HR_PASS = "TechNova@2024"
CAND_EMAIL = "arjun.mehta.dev@gmail.com"
CAND_PASS = "Arjun@2024"

results = []


def record(name: str, ok: bool, detail: str = ""):
    results.append((name, ok, detail))
    mark = "PASS" if ok else "FAIL"
    print(f"  {mark}  {name}" + (f" — {detail}" if detail else ""))


async def login(client, email, password):
    r = await client.post(f"{BASE}/api/auth/login", json={"email": email, "password": password})
    if r.status_code != 200:
        return None
    return r.json()["access_token"]


async def main():
    print(f"\nExtended API flows @ {BASE}\n")
    async with httpx.AsyncClient(timeout=30) as c:
        hr = await login(c, HR_EMAIL, HR_PASS)
        cand = await login(c, CAND_EMAIL, CAND_PASS)
        record("HR login", hr is not None)
        record("Candidate login", cand is not None)
        if not hr or not cand:
            return

        hr_h = {"Authorization": f"Bearer {hr}"}
        cand_h = {"Authorization": f"Bearer {cand}"}

        # HR create job with INR salary
        job_payload = {
            "title": f"QA Test Role {uuid.uuid4().hex[:6]}",
            "company": "TechNova Solutions",
            "description": "Automated test job description with enough chars.",
            "requirements": "Test requirements field with enough characters.",
            "job_type": "full_time",
            "location": "Bangalore",
            "remote_ok": False,
            "salary_min": 500000,
            "salary_max": 800000,
            "salary_currency": "INR",
            "skills_required": ["Python"],
            "experience_required": "2 years",
            "has_tryout": False,
        }
        r = await c.post(f"{BASE}/api/jobs/", json=job_payload, headers=hr_h)
        record("HR create job", r.status_code == 201, f"{r.status_code} {r.text[:80]}")
        job_id = r.json().get("id") if r.status_code == 201 else None

        if job_id:
            pub = await c.post(f"{BASE}/api/jobs/{job_id}/publish", headers=hr_h)
            record("HR publish job", pub.status_code == 200, f"{pub.status_code} {pub.text[:80]}")

            # Clear salary on update
            upd = await c.put(
                f"{BASE}/api/jobs/{job_id}",
                json={"salary_min": None, "salary_max": None},
                headers=hr_h,
            )
            record("HR clear salary on edit", upd.status_code == 200, f"min={upd.json().get('salary_min')}")

            detail = await c.get(f"{BASE}/api/jobs/{job_id}")
            record("Public job detail", detail.status_code == 200)

            # Candidate apply
            app_r = await c.post(
                f"{BASE}/api/jobs/{job_id}/apply",
                json={"cover_letter": "Test application"},
                headers=cand_h,
            )
            record("Candidate apply", app_r.status_code in (200, 201), f"{app_r.status_code} {app_r.text[:80]}")
            app_id = app_r.json().get("id") if app_r.status_code in (200, 201) else None

            if app_id:
                app_detail = await c.get(f"{BASE}/api/jobs/applications/{app_id}", headers=hr_h)
                body = app_detail.json() if app_detail.status_code == 200 else {}
                fraud = body.get("fraud_score") or body.get("fraud_risk")
                record("Fraud fields on application", app_detail.status_code == 200, f"fraud={fraud}")

        # Audit logs
        audit = await c.get(f"{BASE}/api/audit/", headers=hr_h)
        record(
            "HR audit logs",
            audit.status_code == 200,
            f"count={len(audit.json()) if audit.status_code==200 else audit.text[:60]}",
        )

        # GDPR export (candidate)
        gdpr = await c.get(f"{BASE}/api/users/gdpr/export", headers=cand_h)
        record("Candidate GDPR export", gdpr.status_code == 200, f"{gdpr.status_code}")

        # Search
        search = await c.get(f"{BASE}/api/jobs/search", params={"query": "QA Test"})
        record("Job search with query", search.status_code == 200, f"total={search.json().get('total',0)}")

    fails = sum(1 for _, ok, _ in results if not ok)
    print(f"\n{len(results)-fails}/{len(results)} passed\n")


if __name__ == "__main__":
    asyncio.run(main())
