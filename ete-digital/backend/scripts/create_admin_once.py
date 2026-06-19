#!/usr/bin/env python3
"""Create a single admin user non-interactively. Usage:
    cd backend
    ADMIN_EMAIL=admin@jobsrow.com ADMIN_PASSWORD='YourPass1!' python scripts/create_admin_once.py
"""
import asyncio
import os
import sys
import uuid

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker

from app.core.config import settings
from app.core.security import hash_password, validate_password_strength
from app.models.users import User, UserProfile, UserRole


async def main() -> None:
    email = os.environ.get("ADMIN_EMAIL", "admin@jobsrow.com")
    password = os.environ.get("ADMIN_PASSWORD", "")
    full_name = os.environ.get("ADMIN_NAME", "JobsRow Admin")

    if not password:
        print("Set ADMIN_PASSWORD env var.")
        sys.exit(1)
    if not validate_password_strength(password):
        print("Password too weak (8+ chars, upper, lower, digit, special).")
        sys.exit(1)

    db_url = settings.DATABASE_URL
    if db_url.startswith("postgresql://"):
        db_url = db_url.replace("postgresql://", "postgresql+asyncpg://", 1)
    elif db_url.startswith("postgres://"):
        db_url = db_url.replace("postgres://", "postgresql+asyncpg://", 1)

    engine = create_async_engine(db_url, echo=False)
    Session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with Session() as session:
        existing = await session.execute(select(User).where(User.email == email))
        if existing.scalar_one_or_none():
            print(f"EXISTS:{email}")
            return

        admin_id = uuid.uuid4()
        session.add(
            User(
                id=admin_id,
                email=email,
                password_hash=hash_password(password),
                role=UserRole.ADMIN,
                is_verified=True,
                is_active=True,
                onboarding_complete=True,
            )
        )
        session.add(UserProfile(user_id=admin_id, full_name=full_name))
        await session.commit()
        print(f"CREATED:{email}")

    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(main())
