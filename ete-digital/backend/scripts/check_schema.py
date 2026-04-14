import asyncio
import asyncpg


async def schema():
    conn = await asyncpg.connect(
        "postgresql://postgres.khfqzjuxklfidoblnylz:oqD9XBhLaLqkvhZe@aws-1-ap-northeast-1.pooler.supabase.com:5432/postgres",
        ssl="require",
    )
    for table in ("users", "user_profiles"):
        cols = await conn.fetch(
            "SELECT column_name, data_type FROM information_schema.columns "
            "WHERE table_schema='public' AND table_name=$1 ORDER BY ordinal_position",
            table,
        )
        print(f"\n{table}:")
        for c in cols:
            print(f"  {c['column_name']} ({c['data_type']})")
    await conn.close()


asyncio.run(schema())
