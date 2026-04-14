import asyncio
import asyncpg


async def fix():
    # Use direct connection (not pooler) for DDL operations
    conn = await asyncpg.connect(
        "postgresql://postgres.khfqzjuxklfidoblnylz:oqD9XBhLaLqkvhZe@aws-1-ap-northeast-1.pooler.supabase.com:5432/postgres",
        ssl="require",
    )
    # Check alembic_version
    ver = await conn.fetchval("SELECT version_num FROM public.alembic_version")
    print(f"Alembic version in DB: {ver}")

    # Stamp as base so alembic re-runs all migrations
    await conn.execute("DELETE FROM public.alembic_version")
    print("Cleared alembic_version - will re-run all migrations")
    await conn.close()


asyncio.run(fix())
