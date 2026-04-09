"""
Utility script to find the active Supabase region for the project.

Usage:
    SUPABASE_PROJECT_REF=<ref> SUPABASE_PASSWORD=<password> python tests/find_regions.py

Environment variables (required):
    SUPABASE_PROJECT_REF  - The Supabase project reference ID
    SUPABASE_PASSWORD     - The Supabase database password
"""

import asyncio
import os
import sys
import asyncpg

REGIONS = [
    "us-east-1", "us-east-2", "us-west-1", "us-west-2",
    "eu-west-1", "eu-west-2", "eu-west-3", "eu-central-1", "eu-central-2",
    "ap-southeast-1", "ap-northeast-1", "ap-northeast-2",
    "ap-south-1", "ap-southeast-2", "sa-east-1", "ca-central-1",
]


def _get_env(name: str) -> str:
    value = os.environ.get(name)
    if not value:
        print(f"ERROR: Required environment variable '{name}' is not set.", file=sys.stderr)
        sys.exit(1)
    return value


async def probe_region(region: str, project_ref: str, password: str) -> str | None:
    host = f"aws-0-{region}.pooler.supabase.com"
    url = f"postgresql://postgres.{project_ref}:{password}@{host}:6543/postgres"
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


async def main() -> None:
    project_ref = _get_env("SUPABASE_PROJECT_REF")
    password = _get_env("SUPABASE_PASSWORD")

    print("Testing all Supabase regions...")
    tasks = [probe_region(r, project_ref, password) for r in REGIONS]
    results = await asyncio.gather(*tasks)
    found = [r for r in results if r]
    if found:
        print(f"\nActive region(s): {found}")
    else:
        print("COULD NOT FIND REGION")


if __name__ == "__main__":
    asyncio.run(main())
