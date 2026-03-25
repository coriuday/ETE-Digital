import asyncio
import asyncpg  # type: ignore
import os
from dotenv import load_dotenv  # type: ignore

load_dotenv()

async def test_db():
    db_url_native = os.getenv('DATABASE_URL') or ""
    print(f"Connecting to: {db_url_native}")
    try:
        conn = await asyncpg.connect(db_url_native)
        print("Successfully connected to Supabase!")
        await conn.close()
    except Exception as e:
        print(f"Database Error: {type(e).__name__}: {str(e)}")

if __name__ == "__main__":
    asyncio.run(test_db())
