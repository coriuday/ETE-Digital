"""Check if seeded users exist in Supabase."""

import asyncio
import asyncpg


async def check():
    conn = await asyncpg.connect(
        "postgresql://postgres.khfqzjuxklfidoblnylz:oqD9XBhLaLqkvhZe@aws-1-ap-northeast-1.pooler.supabase.com:5432/postgres",
        ssl="require",
    )
    users = await conn.fetch("SELECT email, role, is_active FROM public.users ORDER BY role")
    print(f"Users in DB ({len(users)}):")
    for u in users:
        print(f"  {u['email']} | {u['role']} | active={u['is_active']}")
    if not users:
        print("  (none - DB is empty!)")

    # Also check password hash for candidate
    row = await conn.fetchrow("SELECT email, password_hash FROM public.users WHERE email='candidate@gmail.com'")
    if row:
        print(f"\nHash exists: {bool(row['password_hash'])} | starts with: {row['password_hash'][:10]}...")
    await conn.close()


asyncio.run(check())
