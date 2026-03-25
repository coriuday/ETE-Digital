# Backend Scripts

Utility and seed scripts for development and data management.

> These scripts are **not part of the application** and should only run in development environments.

## Seed Scripts

| Script | Purpose |
|--------|---------|
| `seed_data.py` | Seed core reference data (roles, categories, etc.) |
| `seed_jobs_profiles.py` | Seed realistic job postings and candidate profiles |
| `seed_test_data.py` | Seed a minimal dataset for automated testing |
| `e2e_seed.py` | Full end-to-end seed for manual QA runs |
| `create_users.py` | Create specific test users with known credentials |
| `clean_users.py` | Remove all non-admin users (dev reset utility) |
| `publish_jobs.py` | Bulk-publish draft job listings |

## Usage

```bash
# From /backend directory, with the venv active:
python scripts/seed_data.py
python scripts/seed_jobs_profiles.py
```

> **Never run seed scripts against production databases.**
