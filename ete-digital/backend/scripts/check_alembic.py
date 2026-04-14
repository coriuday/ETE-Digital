import asyncio
import asyncpg


async def check():
    conn = await asyncpg.connect(
        "postgresql://postgres.khfqzjuxklfidoblnylz:oqD9XBhLaLqkvhZe@aws-1-ap-northeast-1.pooler.supabase.com:5432/postgres?ssl=require"
    )
    ver = await conn.fetchval("SELECT version_num FROM public.alembic_version")
    print(f"Alembic version: {ver}")
    await conn.close()


asyncio.run(check())
