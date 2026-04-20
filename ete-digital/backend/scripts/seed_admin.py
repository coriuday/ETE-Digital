#!/usr/bin/env python3
"""
Jobrows — Admin User Seeder
=========================================
Run this script to create the initial admin user.
It hashes the password with Argon2 before inserting,
so you never store plaintext passwords.

Usage:
    cd backend
    python scripts/seed_admin.py

You will be prompted for:
    - Admin email
    - Admin password (input is hidden)

The script will:
    1. Validate password strength
    2. Hash with Argon2id
    3. Insert into users + user_profiles tables
    4. Print the generated UUID

Requirements:
    - DATABASE_URL must be set in .env or environment
    - Run from the backend/ directory
"""

import sys
import os
import getpass
import asyncio
import uuid

# Add backend root to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.security import hash_password, validate_password_strength
from app.core.config import settings


async def seed_admin():
    """Interactive admin user creation."""
    print("\n" + "=" * 60)
    print("  JOBROWS — Admin User Setup")
    print("=" * 60)

    # Collect credentials
    email = input("\nAdmin email [admin@jobsrow.com]: ").strip()
    if not email:
        email = "admin@jobsrow.com"

    full_name = input("Admin full name [Jobrows Admin]: ").strip()
    if not full_name:
        full_name = "Jobrows Admin"

    while True:
        password = getpass.getpass("Admin password (hidden): ")
        if not password:
            print("❌ Password cannot be empty.")
            continue
        if not validate_password_strength(password):
            print(
                f"❌ Password too weak. Must be at least {settings.PASSWORD_MIN_LENGTH} chars "
                "with uppercase, lowercase, digit, and special character."
            )
            continue
        confirm = getpass.getpass("Confirm password: ")
        if password != confirm:
            print("❌ Passwords do not match. Try again.")
            continue
        break

    print("\n⏳ Hashing password with Argon2id...")
    password_hash = hash_password(password)

    print("⏳ Connecting to database...")

    try:
        from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
        from sqlalchemy.orm import sessionmaker
        from sqlalchemy import select, text
        from app.models.users import User, UserProfile, UserRole

        # Convert sync URL to async if needed
        db_url = settings.DATABASE_URL
        if db_url.startswith("postgresql://"):
            db_url = db_url.replace("postgresql://", "postgresql+asyncpg://", 1)
        elif db_url.startswith("postgres://"):
            db_url = db_url.replace("postgres://", "postgresql+asyncpg://", 1)

        engine = create_async_engine(db_url, echo=False)
        async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

        async with async_session() as session:
            # Check if admin already exists
            result = await session.execute(
                select(User).where(User.role == UserRole.ADMIN)
            )
            existing_admin = result.scalars().first()

            if existing_admin:
                print(f"\n⚠️  Admin already exists: {existing_admin.email}")
                print(f"   ID: {existing_admin.id}")
                choice = input("   Create another admin? [y/N]: ").strip().lower()
                if choice != "y":
                    print("Aborted.\n")
                    return

            # Create admin user
            admin_id = uuid.uuid4()
            admin_user = User(
                id=admin_id,
                email=email,
                password_hash=password_hash,
                role=UserRole.ADMIN,
                is_verified=True,
                is_active=True,
            )

            # Add email_verified if column exists (migration 002)
            try:
                admin_user.email_verified = True
            except AttributeError:
                pass  # Column not yet migrated — will be set after migration 002

            session.add(admin_user)

            # Create minimal profile
            admin_profile = UserProfile(
                user_id=admin_id,
                full_name=full_name,
            )
            session.add(admin_profile)

            await session.commit()

            print("\n" + "=" * 60)
            print("✅ Admin user created successfully!")
            print(f"   Email:    {email}")
            print(f"   Name:     {full_name}")
            print(f"   Role:     admin")
            print(f"   UUID:     {admin_id}")
            print("=" * 60)
            print("\n💡 You can now login at /login with these credentials.")
            print("   The admin panel is available at /admin\n")

        await engine.dispose()

    except Exception as e:
        print(f"\n❌ Error: {e}")
        print("\nMake sure:")
        print("  1. DATABASE_URL is set in .env")
        print("  2. You ran migration 002 first (supabase/migrations/002_addons_security.sql)")
        print("  3. You're running from the backend/ directory\n")
        raise


if __name__ == "__main__":
    asyncio.run(seed_admin())
