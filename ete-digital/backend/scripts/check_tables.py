import asyncio
import asyncpg


async def check():
    conn = await asyncpg.connect(
        "postgresql://postgres.khfqzjuxklfidoblnylz:oqD9XBhLaLqkvhZe@aws-1-ap-northeast-1.pooler.supabase.com:5432/postgres",
        ssl="require",
    )
    tables = await conn.fetch(
        "SELECT tablename, schemaname FROM pg_tables "
        "WHERE schemaname NOT IN ('pg_catalog','information_schema') "
        "ORDER BY schemaname, tablename"
    )
    print("Tables found:")
    for t in tables:
        print(f"  {t['schemaname']}.{t['tablename']}")
    if not tables:
        print("  (none)")
    await conn.close()


asyncio.run(check())
