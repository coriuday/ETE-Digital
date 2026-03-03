import asyncio
import uuid
import sys
from pydantic import ValidationError

# Add backend to path
sys.path.append(".")

from app.core.database import AsyncSessionLocal
from app.services.jobs import job_service
from app.schemas.jobs import JobCreate

async def toggle_test():
    async with AsyncSessionLocal() as db:
        # Use a dummy employer UUID
        employer_id = uuid.uuid4()
        
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
            # First, check validation
            job_data = JobCreate(**payload)
            print("SCHEMA VALIDATION SUCCESS!")
            
            # Then check database insert
            job = await job_service.create_job(db, employer_id, job_data.model_dump())
            print(f"DB INSERT SUCCESS: Job ID {job.id}")
        except ValidationError as e:
            print("SCHEMA VALIDATION FAILED:")
            print(e.json())
        except Exception as e:
            print("GENERAL ERROR:", type(e))
            print(e)

if __name__ == "__main__":
    asyncio.run(toggle_test())
