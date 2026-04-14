"""
Direct seed script — inserts test users into Supabase without needing the API running.
Run: .venv\Scripts\python.exe scripts\seed_users_direct.py
"""

import asyncio
import sys
import os

# Make sure the app package is importable
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import engine, AsyncSessionLocal, Base
from app.core.security import hash_password
from app.models.users import User, UserProfile, UserRole
from sqlalchemy import select

USERS = [
    {
        "email": "admin@etedigital.com",
        "password": "Admin@1234",
        "role": UserRole.ADMIN,
        "full_name": "ETE Admin",
    },
    {
        "email": "employer@novatech.io",
        "password": "Employer@1234",
        "role": UserRole.EMPLOYER,
        "full_name": "NovaTech HR",
    },
    {
        "email": "candidate@gmail.com",
        "password": "Candidate@1234",
        "role": UserRole.CANDIDATE,
        "full_name": "Arjun Sharma",
    },
]


async def seed():
    print("[seed] Connecting to Supabase...")
    async with AsyncSessionLocal() as db:
        for u in USERS:
            # Check if already exists
            result = await db.execute(select(User).where(User.email == u["email"]))
            existing = result.scalar_one_or_none()
            if existing:
                print(f"  SKIP  {u['email']} (already exists)")
                continue

            user = User(
                email=u["email"],
                password_hash=hash_password(u["password"]),
                role=u["role"],
                is_verified=True,
                is_active=True,
            )
            db.add(user)
            await db.flush()

            profile = UserProfile(
                user_id=user.id,
                full_name=u["full_name"],
                skills=[],
                social_links={},
                preferences={},
            )
            db.add(profile)
            await db.commit()
            print(f"  OK    {u['email']} ({u['role'].value}) — password: {u['password']}")

    print("\n[seed] Done! You can now login at http://localhost:5173/login")
    print("       Credentials above.")


if __name__ == "__main__":
    asyncio.run(seed())
