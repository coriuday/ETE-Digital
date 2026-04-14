"""
Creates test users by calling the live backend API.
No extra dependencies — uses stdlib urllib only.
Run: python create_users.py
"""

import urllib.request
import urllib.error
import json

BASE = "http://localhost:8000"

USERS = [
    {"email": "admin@etedigital.com", "password": "Admin@1234", "role": "admin", "full_name": "ETE Admin"},
    {"email": "hr@novatech.io", "password": "Employer@1234", "role": "employer", "full_name": "NovaTech HR"},
    {"email": "arjun.sharma@gmail.com", "password": "Candidate@1234", "role": "candidate", "full_name": "Arjun Sharma"},
    {"email": "priya.nair@gmail.com", "password": "Candidate@1234", "role": "candidate", "full_name": "Priya Nair"},
]


def post(url, body):
    data = json.dumps(body).encode()
    req = urllib.request.Request(url, data=data, headers={"Content-Type": "application/json"}, method="POST")
    try:
        with urllib.request.urlopen(req, timeout=10) as res:
            return res.status, json.loads(res.read())
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read())


print("Creating users via API...\n")
for u in USERS:
    status, resp = post(f"{BASE}/api/auth/register", u)
    if status in (200, 201):
        print(f"  ✅ Created  {u['email']}")
    elif status == 400 and "already registered" in str(resp):
        print(f"  ⚠️  Exists   {u['email']}")
    else:
        print(f"  ❌ Failed   {u['email']}  [{status}] {resp}")

print("\nDone! Now try logging in at http://localhost:5173/login")
