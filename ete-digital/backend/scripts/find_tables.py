import asyncio
import asyncpg


async def check():
    conn = await asyncpg.connect(
        "postgresql://postgres.khfqzjuxklfidoblnylz:oqD9XBhLaLqkvhZe@aws-1-ap-northeast-1.pooler.supabase.com:5432/postgres?ssl=require"
    )
    tables = await conn.fetch(
        "SELECT table_schema, table_name FROM information_schema.tables WHERE table_name='users' or table_name='user_profiles'"
    )
    print("Found tables:")
    for t in tables:
        print(f"  {t['table_schema']}.{t['table_name']}")
    await conn.close()


asyncio.run(check())
