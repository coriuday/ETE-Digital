"""
Pytest shared fixtures for ETE Digital backend tests.

Uses a real PostgreSQL test database (separate from dev DB).
Assumes the same PostgreSQL instance as dev is available.
Override DATABASE_URL via environment or .env if needed.

Quick start:
  docker run -d -p 5432:5432 -e POSTGRES_PASSWORD=ete_dev_password_change_in_prod \
             -e POSTGRES_USER=ete_user -e POSTGRES_DB=ete_test postgres:15-alpine
"""
import os
import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.pool import NullPool

from app.main import app
from app.core.database import Base, get_db
from app.core.security import create_access_token, hash_password
from app.models.users import User, UserRole

# ---- Test Database ----

TEST_DB_URL = os.environ.get(
    "TEST_DATABASE_URL",
    "postgresql+asyncpg://ete_user:ete_dev_password_change_in_prod@localhost:5432/ete_digital"
)


@pytest_asyncio.fixture(scope="session")
async def engine():
    """Session-scoped engine pointing at the test Postgres DB."""
    eng = create_async_engine(TEST_DB_URL, poolclass=NullPool)
    async with eng.begin() as conn:
        # Drop ALL tables first to clean up stale enum types and old columns
        await conn.run_sync(Base.metadata.drop_all)
        # Recreate fresh schema
        await conn.run_sync(Base.metadata.create_all)
    yield eng
    async with eng.begin() as conn:
        # Clean up data after all tests (keep tables for inspection if needed)
        for table in reversed(Base.metadata.sorted_tables):
            await conn.execute(table.delete())
    await eng.dispose()


@pytest_asyncio.fixture(scope="function")
async def db_session(engine):
    """New session per test, auto-rolled back after each test."""
    async_session = async_sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)
    async with async_session() as session:
        yield session
        await session.rollback()


@pytest_asyncio.fixture(scope="function")
async def client(db_session):
    """AsyncClient with DB dependency overridden to use test session."""
    async def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        yield ac
    app.dependency_overrides.clear()


# ---- User Fixtures ----

import uuid as _uuid

@pytest_asyncio.fixture
async def candidate_user(db_session):
    uid = _uuid.uuid4().hex[:8]
    user = User(
        email=f"candidate_{uid}@test.com",
        password_hash=hash_password("TestPass1!"),
        role=UserRole.CANDIDATE,
        is_active=True,
        is_verified=True,
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    return user


@pytest_asyncio.fixture
async def employer_user(db_session):
    uid = _uuid.uuid4().hex[:8]
    user = User(
        email=f"employer_{uid}@test.com",
        password_hash=hash_password("TestPass1!"),
        role=UserRole.EMPLOYER,
        is_active=True,
        is_verified=True,
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    return user


@pytest_asyncio.fixture
async def candidate_token(candidate_user):
    return create_access_token({"sub": str(candidate_user.id), "role": "candidate", "email": candidate_user.email})


@pytest_asyncio.fixture
async def employer_token(employer_user):
    return create_access_token({"sub": str(employer_user.id), "role": "employer", "email": employer_user.email})


@pytest_asyncio.fixture
async def admin_user(db_session):
    uid = _uuid.uuid4().hex[:8]
    user = User(
        email=f"admin_{uid}@test.com",
        password_hash=hash_password("TestPass1!"),
        role=UserRole.ADMIN,
        is_active=True,
        is_verified=True,
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    return user


@pytest_asyncio.fixture
async def admin_token(admin_user):
    return create_access_token({"sub": str(admin_user.id), "role": "admin", "email": admin_user.email})
