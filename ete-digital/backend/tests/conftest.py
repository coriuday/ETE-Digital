"""
Pytest shared fixtures for ETE Digital backend tests.

Strategy:
  - If TEST_DATABASE_URL or DATABASE_URL is set in the environment AND
    points to a real PostgreSQL instance (CI provides one as a service),
    we use that directly — giving us full JSONB support.
  - If no env var is set (or they point nowhere reachable), we fall back
    to an in-memory SQLite database so that developers can run the test
    suite locally without any external services.

IMPORTANT: We do NOT call load_dotenv() here. In CI the env vars are
injected by GitHub Actions and must NOT be overridden by a local .env
file (which would point at the production Supabase instance).

Event-loop fix (pytest-asyncio ≥ 0.21):
  - Do NOT define a custom event_loop fixture — it is deprecated.
  - asyncio_mode = auto (in pytest.ini) makes every async test/fixture
    use the default loop managed by pytest-asyncio automatically.
  - Use NullPool so the engine never binds a connection to the loop at
    import time; each connection is opened fresh inside the running loop.

SAFETY: drop_all / create_all are NEVER called on a Supabase/production
  database. If SUPABASE_INTEGRATION_MODE=true (set by CI when running
  against SUPABASE_TEST_DATABASE_URL), the schema is assumed to already
  exist — only read/write DML tests run, never DDL.
"""

import os

# ---------------------------------------------------------------------------
# ⚠️  PRODUCTION SAFETY GUARD
# Refuse to wipe the schema if we appear to be connected to Supabase.
# Supabase URLs contain ".supabase.co" in the hostname.  We also check the
# explicit SUPABASE_INTEGRATION_MODE flag set by the CI workflow.
# ---------------------------------------------------------------------------
_SUPABASE_INTEGRATION_MODE = os.environ.get("SUPABASE_INTEGRATION_MODE", "false").lower() == "true"
_raw_url_check = os.environ.get("TEST_DATABASE_URL") or os.environ.get("DATABASE_URL", "")
_looks_like_supabase = "supabase.co" in _raw_url_check or "supabase.com" in _raw_url_check

if _looks_like_supabase and not _SUPABASE_INTEGRATION_MODE:
    raise RuntimeError(
        "\n\n"
        "🚨  SAFETY ABORT: DATABASE_URL / TEST_DATABASE_URL points to Supabase (production)!\n"
        "    Running the test suite against Supabase will call drop_all() and DESTROY user data.\n"
        "\n"
        "    If you intentionally want read-only integration tests against Supabase, set:\n"
        "        SUPABASE_INTEGRATION_MODE=true\n"
        "\n"
        "    Otherwise, unset DATABASE_URL / TEST_DATABASE_URL to use the local SQLite fallback,\n"
        "    or point them at your LOCAL postgres instance (localhost:5432).\n"
    )

import uuid as _uuid
import asyncio

# ---------------------------------------------------------------------------
# Provide safe fallback env vars so that Settings() doesn't raise when
# no .env is present (e.g. local runs without a Postgres instance).
# ---------------------------------------------------------------------------
if not os.getenv("DATABASE_URL") and not os.getenv("TEST_DATABASE_URL"):
    os.environ["DATABASE_URL"] = "sqlite+aiosqlite:///:memory:"
os.environ.setdefault("JWT_SECRET_KEY", "ci-test-secret-key-not-for-production")
os.environ.setdefault("ENCRYPTION_KEY", "ci-test-encryption-key-32-chars!!")

import pytest
import pytest_asyncio
import sqlalchemy as sa
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import (
    create_async_engine,
    AsyncSession,
    async_sessionmaker,
)
from sqlalchemy.pool import NullPool, StaticPool
from sqlalchemy.ext.compiler import compiles
from sqlalchemy.dialects.postgresql import JSONB


@compiles(JSONB, "sqlite")
def compile_jsonb_sqlite(type_, compiler, **kw):
    return "JSON"


# ---------------------------------------------------------------------------
# Decide which engine to use
# ---------------------------------------------------------------------------


def _make_asyncpg_url(url: str) -> str:
    return url.replace("postgresql+psycopg2://", "postgresql+asyncpg://", 1).replace(
        "postgresql://", "postgresql+asyncpg://", 1
    )


_raw = os.environ.get("TEST_DATABASE_URL") or os.environ.get("DATABASE_URL", "")
_use_sqlite = "sqlite" in _raw or not _raw

if _use_sqlite:
    _TEST_DB_URL = "sqlite+aiosqlite:///:memory:"
    _pool_class = StaticPool
    _connect_args: dict = {"check_same_thread": False}
else:
    _TEST_DB_URL = _make_asyncpg_url(_raw)
    # NullPool: connections are never held open between requests,
    # so they're always acquired inside the currently running event loop.
    # This is the canonical fix for "Future attached to a different loop".
    _pool_class = NullPool
    _connect_args = {"statement_cache_size": 0}

print(f"🧪 Pytest active execution DB URL: {'SQLite (In-Memory)' if _use_sqlite else _TEST_DB_URL}")

# ---------------------------------------------------------------------------
# Imports that trigger the app (after env vars are set)
# ---------------------------------------------------------------------------

from app.core.security import create_access_token, hash_password  # noqa: E402
from app.main import app  # noqa: E402
from app.models.users import User, UserRole  # noqa: E402
from app.core.database import Base, get_db  # noqa: E402

# ---------------------------------------------------------------------------
# Engine + session factory
#
# NOTE: We intentionally do NOT create a module-level engine that opens
# connections at import time. Instead, we create a session-scoped fixture
# so the engine is built inside the running event loop managed by
# pytest-asyncio. NullPool ensures no connections linger across tests.
# ---------------------------------------------------------------------------


@pytest_asyncio.fixture(scope="session")
async def _engine():
    """Session-scoped async engine. Created inside the running loop.

    When SUPABASE_INTEGRATION_MODE is active we SKIP drop_all / create_all.
    The schema is assumed to already exist on Supabase (managed manually via
    supabase_schema.sql). Touching it from here would destroy production data.
    """
    retries = 10

    for i in range(retries):
        try:
            eng = create_async_engine(
                _TEST_DB_URL,
                poolclass=_pool_class,
                connect_args=_connect_args,
                echo=False,
            )

            if not _SUPABASE_INTEGRATION_MODE:
                # Local CI / SQLite: create a fresh schema for each test run
                async with eng.begin() as conn:
                    await conn.run_sync(Base.metadata.drop_all)
                    await conn.run_sync(Base.metadata.create_all)
            else:
                # Supabase integration mode: just verify connectivity
                async with eng.connect() as conn:
                    await conn.execute(sa.text("SELECT 1"))
                print("[conftest] Supabase integration mode — skipping drop_all/create_all")

            break

        except Exception as e:
            if i == retries - 1:
                raise e
            print(f"DB not ready, retrying... ({i+1}/{retries})")
            import asyncio

            await asyncio.sleep(2)

    yield eng

    if not _SUPABASE_INTEGRATION_MODE:
        # Only wipe the local test schema — NEVER wipe Supabase
        async with eng.begin() as conn:
            await conn.run_sync(Base.metadata.drop_all)

    await eng.dispose()


@pytest_asyncio.fixture(scope="session")
async def _session_factory(_engine):
    """Session-scoped factory, derived from the session-scoped engine."""
    return async_sessionmaker(
        _engine,
        class_=AsyncSession,
        expire_on_commit=False,
        autocommit=False,
        autoflush=False,
    )


# ---------------------------------------------------------------------------
# Override get_db so the app uses the same test engine
# ---------------------------------------------------------------------------


@pytest_asyncio.fixture(scope="session", autouse=True)
async def _override_get_db(_session_factory):
    """Install the test session factory as the app's get_db override."""

    async def _get_db_override():
        async with _session_factory() as session:
            try:
                yield session
                await session.commit()
            except Exception:
                await session.rollback()
                raise
            finally:
                await session.close()

    app.dependency_overrides[get_db] = _get_db_override
    yield
    app.dependency_overrides.pop(get_db, None)


# ---------------------------------------------------------------------------
# HTTP client (function-scoped — fresh client per test)
# ---------------------------------------------------------------------------


@pytest_asyncio.fixture(scope="function")
async def client():
    """ASGI test client wired to the test database."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        yield ac


# ---------------------------------------------------------------------------
# Internal DB session for fixture user creation (function-scoped)
# ---------------------------------------------------------------------------


@pytest_asyncio.fixture(scope="function")
async def _db(_session_factory):
    async with _session_factory() as session:
        yield session


# ---------------------------------------------------------------------------
# User fixtures
# ---------------------------------------------------------------------------


@pytest_asyncio.fixture
async def candidate_user(_db: AsyncSession):
    uid = _uuid.uuid4().hex[:8]
    user = User(
        email=f"candidate_{uid}@test.com",
        password_hash=hash_password("TestPass1!"),
        role=UserRole.CANDIDATE,
        is_active=True,
        is_verified=True,
    )
    _db.add(user)
    await _db.commit()
    await _db.refresh(user)
    return user


@pytest_asyncio.fixture
async def employer_user(_db: AsyncSession):
    uid = _uuid.uuid4().hex[:8]
    user = User(
        email=f"employer_{uid}@test.com",
        password_hash=hash_password("TestPass1!"),
        role=UserRole.EMPLOYER,
        is_active=True,
        is_verified=True,
    )
    _db.add(user)
    await _db.commit()
    await _db.refresh(user)
    return user


@pytest_asyncio.fixture
async def admin_user(_db: AsyncSession):
    uid = _uuid.uuid4().hex[:8]
    user = User(
        email=f"admin_{uid}@test.com",
        password_hash=hash_password("TestPass1!"),
        role=UserRole.ADMIN,
        is_active=True,
        is_verified=True,
    )
    _db.add(user)
    await _db.commit()
    await _db.refresh(user)
    return user


# ---------------------------------------------------------------------------
# Token fixtures
# ---------------------------------------------------------------------------


@pytest_asyncio.fixture
async def candidate_token(candidate_user: User) -> str:
    return create_access_token({"sub": str(candidate_user.id), "role": "candidate", "email": str(candidate_user.email)})


@pytest_asyncio.fixture
async def employer_token(employer_user: User) -> str:
    return create_access_token({"sub": str(employer_user.id), "role": "employer", "email": str(employer_user.email)})


@pytest_asyncio.fixture
async def admin_token(admin_user: User) -> str:
    return create_access_token({"sub": str(admin_user.id), "role": "admin", "email": str(admin_user.email)})
