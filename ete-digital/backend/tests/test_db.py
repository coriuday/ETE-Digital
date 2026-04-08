import asyncio, os
from dotenv import load_dotenv
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text

load_dotenv()

async def test():
    engine = create_async_engine(os.getenv('DATABASE_URL'))
    try:
        async with engine.begin() as conn:
            await conn.execute(text('SELECT 1'))
        print('DB OK')
    except Exception as e:
        print('DB ERROR:', e)

if __name__ == "__main__":
    asyncio.run(test())
