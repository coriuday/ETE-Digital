import json
from pydantic import ValidationError
from app.schemas.jobs import JobCreate

payload = {
    "title": "Senior Frontend Developer",
    "company": "TechCorp Inc.",
    "description": "This is a detailed description of at least 10 chars.",
    "requirements": "These are the requirements of at least 10 chars.",
    "job_type": "full_time",
    "location": "",
    "remote_ok": False,
    "salary_min": None,
    "salary_max": None,
    "salary_currency": "INR",
    "skills_required": ["React", "TypeScript", "Node.js"],
    "experience_required": "",
    "has_tryout": False
}

try:
    job = JobCreate(**payload)
    print("SUCCESS")
except ValidationError as e:
    print("FAILED")
    print(e.json())
