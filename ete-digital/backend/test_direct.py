import asyncio, asyncpg

async def test():
    try:
        conn = await asyncpg.connect('postgresql://postgres:zefkpLJjsizfHgF3@db.khfqzjuxklfidoblnylz.supabase.co:5432/postgres')
        print('Direct OK')
        await conn.close()
    except Exception as e:
        print('Direct Error:', e)

asyncio.run(test())
