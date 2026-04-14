"""
Seed users directly via asyncpg (bypasses SQLAlchemy pooling issues).
Uses Argon2 via passlib — same as the app's hash_password().
"""

import asyncio
import asyncpg
import uuid
from datetime import datetime, timezone
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")

USERS = [
    {"email": "admin@etedigital.com", "password": "Admin@1234", "role": "admin", "full_name": "ETE Admin"},
    {"email": "employer@novatech.io", "password": "Employer@1234", "role": "employer", "full_name": "NovaTech HR"},
    {"email": "candidate@gmail.com", "password": "Candidate@1234", "role": "candidate", "full_name": "Arjun Sharma"},
]

DB_URL = "postgresql://postgres.khfqzjuxklfidoblnylz:oqD9XBhLaLqkvhZe@aws-1-ap-northeast-1.pooler.supabase.com:5432/postgres"


def hash_pw(plain: str) -> str:
    return pwd_context.hash(plain)


async def seed():
    conn = await asyncpg.connect(DB_URL, ssl="require")
    print(f"Connected to Supabase.")

    for u in USERS:
        # Check existing
        existing = await conn.fetchval("SELECT id FROM public.users WHERE email = $1", u["email"])
        if existing:
            print(f"  SKIP  {u['email']} (exists, id={existing})")
            continue

        uid = str(uuid.uuid4())
        pw_hash = hash_pw(u["password"])
        now = datetime.now(timezone.utc)

        await conn.execute(
            """
            INSERT INTO public.users
              (id, email, password_hash, role, is_verified, is_active, created_at, updated_at)
            VALUES ($1, $2, $3, $4, true, true, $5, $5)
            """,
            uid,
            u["email"],
            pw_hash,
            u["role"],
            now,
        )

        # Insert profile (PK is user_id, no separate id column)
        await conn.execute(
            """
            INSERT INTO public.user_profiles
              (user_id, full_name, skills, social_links, preferences, created_at, updated_at)
            VALUES ($1, $2, $3::jsonb, $4::jsonb, $5::jsonb, $6, $6)
            """,
            uid,
            u["full_name"],
            "[]",
            "{}",
            "{}",
            now,
        )
        print(f"  OK    {u['email']} ({u['role']}) | password: {u['password']}")

    await conn.close()
    print("\nDone!")


asyncio.run(seed())
