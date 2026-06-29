# ETE Digital / Jobsrow — Test Report

**Date:** 2026-06-29 (updated after safe-fix pass)  
**Environments:** Local CI verification + production smoke  
**VPS deploy:** Not performed (local/CI only per plan)

---

## Executive summary

| Area | Result | Notes |
|------|--------|-------|
| Backend pytest (SQLite) | **PASS** | 90 passed, 1 skipped (FTS — Postgres only) |
| Backend pytest (Postgres) | **PASS** | **91/91** after migration `o0p1q2r3s4t5` |
| Frontend vitest | **PASS** | 22/22, 0 unhandled WebSocket errors |
| Frontend lint / tsc / build | **PASS** | Clean |
| flake8 E9/F63/F7/F82 | **PASS** | 0 errors |
| Production API smoke | **PASS** | 9/9 checks |
| Local Docker backend | **PARTIAL** | MinIO fixed; Postgres volume password mismatch may need one-time volume reset |

**Overall:** Safe fixes applied. All automated tests green. Production unchanged. Deploy migration `o0p1q2r3s4t5` to VPS when ready.

---

## Fixes applied (this pass)

| Change | File(s) | Risk |
|--------|---------|------|
| Seed script: `/api/jobs/feed`, skip publish when active, ASCII output | `scripts/e2e_seed.py` | None |
| Skip FTS test on SQLite | `tests/test_jobs.py` | Test-only |
| Mock WebSocket in vitest | `useNotifications.test.ts` | Test-only |
| TYPE_CHECKING import for AsyncSession | `app/core/security.py` | None |
| Idempotent migration: `submission_format`, vault enum lowercase, legacy tryout nullability | `o0p1q2r3s4t5_fix_tryout_vault_schema.py` | Additive; idempotent |
| pre_deploy_check HEAD → `o0p1q2r3s4t5` | `scripts/pre_deploy_check.py` | Ops |
| MinIO legacy image in local override | `docker-compose.override.yml` | Local only |
| Docker Postgres password docs | `backend/.env.example` | Docs |

### Previously fixed (prior test run)

- `fraud_score` / `fraud_flags` in application API schemas
- Postgres `conftest` TRUNCATE CASCADE (users ↔ organizations cycle)

---

## Verification results

```
# Backend SQLite
pytest tests/ -q                    → 90 passed, 1 skipped

# Backend Postgres (CI-style)
TEST_DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5433/test_db
alembic upgrade head && pytest tests/ -q  → 91 passed

# Frontend
npx vitest run                      → 22 passed, 0 errors
npm run lint && npx tsc --noEmit    → pass
flake8 app/ --select=E9,F63,F7,F82  → 0 errors

# Production API
python scripts/api_e2e_check.py --base https://jobsrow.com  → 9/9 pass
```

---

## Local Docker notes

- **MinIO:** `docker-compose.override.yml` pins `minio/minio:latest` to match existing volume format.
- **Postgres password:** Password is set at **first volume init** and does not change when `.env` changes. If backend cannot connect, either:
  - Keep `POSTGRES_PASSWORD` matching the volume's original value, or
  - Reset local data only: `docker compose down` then remove `ete-digital_postgres_data` volume and `up` again with desired password.
- **Do not** run migrations on VPS until CI/local verification is reviewed and you explicitly approve deploy.

---

## Open items (non-blocking)

| Item | Severity | Notes |
|------|----------|-------|
| Local Docker backend health | Low | Password/volume alignment; see above |
| Production has 0 active jobs | Info | Seed or HR post when ready |
| Playwright E2E | Info | Not in scope |
| HR audit requires org onboarding | Info | Expected behavior |

---

## Deploy checklist (when you approve VPS)

1. `git pull` on VPS
2. `alembic upgrade head` (applies `o0p1q2r3s4t5`)
3. `python scripts/pre_deploy_check.py` — expect HEAD `o0p1q2r3s4t5`
4. Restart backend service
5. `python scripts/api_e2e_check.py --base https://jobsrow.com`

---

## Commands reference

```bash
# Backend tests
cd ete-digital/backend
pytest tests/ -q

# Postgres CI parity
export TEST_DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5433/test_db
alembic upgrade head && pytest tests/ -q

# Frontend
cd ete-digital/frontend
npm run lint && npx tsc --noEmit && npx vitest run && npm run build

# API smoke
python scripts/api_e2e_check.py --base https://jobsrow.com
```
