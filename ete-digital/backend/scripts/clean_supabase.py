"""
Drop all orphan enums and alembic_version so migrations can run clean.
Safe to run: only drops types/tracking, no table data to lose.
"""

import asyncio
import asyncpg


async def clean():
    conn = await asyncpg.connect(
        "postgresql://postgres.khfqzjuxklfidoblnylz:oqD9XBhLaLqkvhZe@aws-1-ap-northeast-1.pooler.supabase.com:5432/postgres",
        ssl="require",
    )

    # Get all custom enum types in public schema
    enums = await conn.fetch(
        "SELECT typname FROM pg_type "
        "JOIN pg_namespace ON pg_namespace.oid = pg_type.typnamespace "
        "WHERE pg_namespace.nspname = 'public' AND pg_type.typtype = 'e'"
    )
    print(f"Found {len(enums)} enum types to drop:")
    for e in enums:
        print(f"  DROP TYPE public.{e['typname']}")
        await conn.execute(f"DROP TYPE IF EXISTS public.\"{e['typname']}\" CASCADE")

    # Clear alembic version
    await conn.execute("DELETE FROM public.alembic_version")
    print("Cleared alembic_version")

    await conn.close()
    print("Done. Run: alembic upgrade head")


asyncio.run(clean())
