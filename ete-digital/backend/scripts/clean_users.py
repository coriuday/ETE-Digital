import asyncio
import asyncpg
from app.core.config import settings

async def clean_users():
    database_url = str(settings.DATABASE_URL).replace('postgresql://', 'postgresql+asyncpg://')
    conn = await asyncpg.connect(str(settings.DATABASE_URL))
    
    # Delete the corrupted users so we can register them cleanly
    emails = ['sakshi.hr@technova.in', 'arjun.mehta.dev@gmail.com']
    
    for email in emails:
        print(f"Cleaning {email}...")
        await conn.execute("DELETE FROM user_profiles WHERE user_id IN (SELECT id FROM users WHERE email = $1)", email)
        await conn.execute("DELETE FROM users WHERE email = $1", email)
        
    print("Done cleaning.")
    await conn.close()

if __name__ == "__main__":
    asyncio.run(clean_users())
