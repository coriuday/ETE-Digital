from logging.config import fileConfig
from sqlalchemy import engine_from_config, pool, text
from alembic import context
import sys
import os
import time
import logging

logger = logging.getLogger("alembic.env")

# Add parent directory to path
sys.path.insert(0, os.path.realpath(os.path.join(os.path.dirname(__file__), "..")))

from app.core.config import settings
from app.core.database import Base

# Import all models so they are registered with Base.metadata
from app.models import (
    User,
    UserProfile,
    RefreshToken,
    Job,
    Application,
    Tryout,
    TryoutSubmission,
    TalentVaultItem,
    VaultShareToken,
    Notification,
    AuditLog,
    CompanyProfile,
    Interview,
)

# ── Alembic config ────────────────────────────────────────────────────────────
config = context.config

url = os.getenv("TEST_DATABASE_URL") or str(settings.DATABASE_URL)

logger.info("[alembic] Target DB: %s", url.split("@")[-1])  # hide credentials

# Force sync driver for Alembic (psycopg2, not asyncpg)
if "+asyncpg" in url:
    url = url.replace("+asyncpg", "")

# psycopg2 uses sslmode=require, NOT ssl=require
if "?ssl=require" in url:
    url = url.replace("?ssl=require", "?sslmode=require")
elif "&ssl=require" in url:
    url = url.replace("&ssl=require", "&sslmode=require")

config.set_main_option("sqlalchemy.url", url)

# Interpret the config file for Python logging
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# Target metadata for autogenerate
target_metadata = Base.metadata


# ── Helpers ───────────────────────────────────────────────────────────────────


def _wait_for_db(url: str, retries: int = 10, delay: float = 3.0) -> None:
    """Retry connecting to the DB before running migrations.

    Render cold-starts can make the DB briefly unreachable.  Retrying here
    prevents a crash-loop caused by a transient connection timeout.
    """
    from sqlalchemy import create_engine

    for attempt in range(1, retries + 1):
        try:
            engine = create_engine(url, poolclass=pool.NullPool, connect_args={"connect_timeout": 10})
            with engine.connect() as conn:
                conn.execute(text("SELECT 1"))
            logger.info("[alembic] DB connection established (attempt %d/%d)", attempt, retries)
            return
        except Exception as exc:
            logger.warning("[alembic] DB not ready (attempt %d/%d): %s", attempt, retries, exc)
            if attempt < retries:
                time.sleep(delay)

    raise RuntimeError(
        f"[alembic] Could not connect to the database after {retries} attempts. "
        "Check DATABASE_URL and ensure the DB service is running."
    )


# ── Offline mode ──────────────────────────────────────────────────────────────


def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode (generates SQL without a live connection)."""
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        compare_type=True,
        compare_server_default=True,
        include_schemas=True,
    )

    with context.begin_transaction():
        context.run_migrations()


# ── Online mode ───────────────────────────────────────────────────────────────


def run_migrations_online() -> None:
    """Run migrations against a live DB connection."""
    db_url = config.get_main_option("sqlalchemy.url")

    # Wait for DB to be reachable before attempting migrations
    _wait_for_db(db_url)

    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            compare_type=True,
            compare_server_default=True,
            include_schemas=True,
            # Prevent Alembic from generating DROP statements for unknown tables
            # (e.g. Supabase internal tables like auth.users)
            include_object=_include_object,
        )

        try:
            with context.begin_transaction():
                context.run_migrations()
        except Exception:
            logger.exception("[alembic] Migration failed — transaction rolled back")
            raise


def _include_object(obj, name, type_, reflected, compare_to):
    """Only autogenerate for objects in the 'public' schema."""
    if type_ == "table" and obj.schema not in (None, "public"):
        return False
    return True


# ── Entry point ───────────────────────────────────────────────────────────────

if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
