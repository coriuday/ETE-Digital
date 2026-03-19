import asyncio
import asyncpg

REGIONS = [
    "us-east-1", "us-east-2", "us-west-1", "us-west-2",
    "eu-west-1", "eu-west-2", "eu-west-3", "eu-central-1", "eu-central-2",
    "ap-southeast-1", "ap-northeast-1", "ap-northeast-2",
    "ap-south-1", "ap-southeast-2", "sa-east-1", "ca-central-1"
]

PROJECT_REF = "khfqzjuxklfidoblnylz"
PASSWORD = "b66hl3W1xjRV3ack"

async def test_region(region):
    host = f"aws-0-{region}.pooler.supabase.com"
    url = f"postgresql://postgres.{PROJECT_REF}:{PASSWORD}@{host}:6543/postgres"
    try:
        conn = await asyncio.wait_for(asyncpg.connect(url), timeout=5.0)
        print(f"SUCCESS: {host}")
        await conn.close()
        return host
    except Exception as e:
        err = str(e)
        if "Tenant or user not found" not in err and "timeout" not in err.lower():
            print(f"Failed {region}: {type(e).__name__} -> {err}")
    return None

async def main():
    print("Testing all Supabase regions...")
    tasks = [test_region(r) for r in REGIONS]
    results = await asyncio.gather(*tasks)
    found = [r for r in results if r]
    if not found:
        print("COULD NOT FIND REGION")

if __name__ == "__main__":
    asyncio.run(main())
