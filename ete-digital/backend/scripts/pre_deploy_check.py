#!/usr/bin/env python3
"""
pre_deploy_check.py — Pre-deployment database validation

Run this before every production deploy to catch schema mismatches early.

Usage:
    python scripts/pre_deploy_check.py

Exit codes:
    0 — all checks passed
    1 — one or more checks failed (deploy blocked)
"""
import os
import sys

# Resolve project root (backend/)
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, ROOT)

import psycopg2
from app.core.config import settings

# ── Connection ────────────────────────────────────────────────────────────────
url = os.getenv("DATABASE_URL") or str(settings.DATABASE_URL)
url = url.replace("+asyncpg", "").replace("?ssl=require", "?sslmode=require")

try:
    conn = psycopg2.connect(url, connect_timeout=10)
    cur = conn.cursor()
except Exception as e:
    print(f"❌ FATAL: Cannot connect to database: {e}")
    sys.exit(1)

failures = []
passes = []


def check(name: str, passed: bool, detail: str = ""):
    if passed:
        passes.append(name)
        print(f"  ✅ {name}")
    else:
        failures.append(name)
        print(f"  ❌ {name}{': ' + detail if detail else ''}")


print("\n══════════════════════════════════════════")
print("  ETE-Digital Pre-Deploy Schema Check")
print("══════════════════════════════════════════\n")

# ── 1. Alembic version ────────────────────────────────────────────────────────
print("【1】Alembic migration state")
cur.execute("SELECT version_num FROM alembic_version LIMIT 1")
row = cur.fetchone()
if row:
    current_rev = row[0]
    check("alembic_version table exists", True)
    print(f"     Current revision: {current_rev}")
    # Expected head
    expected_head = "e5f6a7b8c9d0"
    check(
        f"Revision is HEAD ({expected_head})",
        current_rev == expected_head,
        f"got {current_rev!r}",
    )
else:
    check("alembic_version table has a row", False, "table empty — run alembic upgrade head")

# ── 2. Required tables ────────────────────────────────────────────────────────
print("\n【2】Required tables")
REQUIRED_TABLES = [
    "users",
    "user_profiles",
    "refresh_tokens",
    "jobs",
    "applications",
    "tryouts",
    "tryout_submissions",
    "talent_vault_items",
    "vault_share_tokens",
    "notifications",
    "audit_logs",
    "company_profiles",
    "interviews",
]
cur.execute("SELECT table_name FROM information_schema.tables " "WHERE table_schema = 'public'")
existing_tables = {r[0] for r in cur.fetchall()}
for t in REQUIRED_TABLES:
    check(f"table '{t}' exists", t in existing_tables)

# ── 3. ENUM type values ───────────────────────────────────────────────────────
print("\n【3】ENUM type values (must all be lowercase)")

EXPECTED_ENUMS = {
    "userrole": {"candidate", "employer", "admin"},
    "applicationstatus": {"pending", "reviewed", "shortlisted", "rejected", "hired", "withdrawn"},
    "jobtype": {"full_time", "part_time", "contract", "internship"},
    "jobstatus": {"draft", "active", "closed", "archived"},
    "notificationtype": {"application", "tryout", "message", "payment", "system"},
    "auditaction": {
        "vault_access",
        "vault_share",
        "data_export",
        "data_deletion",
        "profile_update",
        "password_change",
        "admin_action",
    },
    "companysize": {"1-10", "11-50", "51-200", "201-1000", "1000+"},
    "interviewtype": {"video", "phone", "in_person", "technical", "hr", "final"},
    "interviewstatus": {"scheduled", "completed", "cancelled", "no_show"},
    "tryoutstatus": {"draft", "active", "expired", "closed"},
    "submissionstatus": {"submitted", "grading", "auto_graded", "graded", "verified", "passed", "failed"},
    "paymentstatus": {"pending", "escrowed", "released", "refunded", "failed"},
}

cur.execute(
    "SELECT t.typname, e.enumlabel "
    "FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid "
    "ORDER BY t.typname, e.enumsortorder"
)
db_enums: dict[str, set] = {}
for type_name, label in cur.fetchall():
    db_enums.setdefault(type_name, set()).add(label)

for enum_name, expected_values in EXPECTED_ENUMS.items():
    if enum_name not in db_enums:
        check(f"enum '{enum_name}' exists", False, "not found in pg_type")
    else:
        actual = db_enums[enum_name]
        missing = expected_values - actual
        extra = actual - expected_values
        problems = []
        if missing:
            problems.append(f"missing: {missing}")
        if extra:
            problems.append(f"unexpected: {extra}")
        check(f"enum '{enum_name}' values correct", not problems, "; ".join(problems))

# ── 4. Key columns exist ──────────────────────────────────────────────────────
print("\n【4】Critical model columns")

CRITICAL_COLUMNS = [
    # (table, column)
    ("users", "email_verified"),
    ("users", "phone_verified"),
    ("users", "totp_secret"),
    ("users", "totp_enabled"),
    ("users", "totp_backup_codes"),
    ("users", "oauth_provider"),
    ("users", "avatar_url"),
    ("user_profiles", "salary_expectation_min"),
    ("user_profiles", "phone_verified_at"),
    ("tryouts", "title"),
    ("tryouts", "scoring_rubric"),
    ("tryout_submissions", "notes"),
    ("tryout_submissions", "created_at"),
    ("jobs", "external_apply_url"),
    ("jobs", "has_tryout"),
    ("jobs", "skills_required"),
]

cur.execute("SELECT table_name, column_name " "FROM information_schema.columns " "WHERE table_schema = 'public'")
existing_cols = {(r[0], r[1]) for r in cur.fetchall()}
for table, col in CRITICAL_COLUMNS:
    check(f"column '{table}.{col}' exists", (table, col) in existing_cols)

# ── 5. FK constraints ─────────────────────────────────────────────────────────
print("\n【5】Foreign key constraints")
REQUIRED_FKS = [
    "applications_candidate_id_fkey",
    "applications_job_id_fkey",
    "jobs_employer_id_fkey",
    "notifications_user_id_fkey",
    "tryouts_job_id_fkey",
    "tryout_submissions_tryout_id_fkey",
    "tryout_submissions_candidate_id_fkey",
    "talent_vault_items_candidate_id_fkey",
    "vault_share_tokens_vault_item_id_fkey",
    "company_profiles_employer_id_fkey",
    "interviews_application_id_fkey",
]

cur.execute("SELECT constraint_name FROM information_schema.table_constraints " "WHERE constraint_type = 'FOREIGN KEY'")
existing_fks = {r[0] for r in cur.fetchall()}
for fk in REQUIRED_FKS:
    check(f"FK '{fk}' exists", fk in existing_fks)

# ── Summary ───────────────────────────────────────────────────────────────────
conn.close()

print("\n══════════════════════════════════════════")
print(f"  Results: {len(passes)} passed, {len(failures)} failed")
print("══════════════════════════════════════════")

if failures:
    print("\n🚫 DEPLOY BLOCKED — fix the failures above before pushing.\n")
    sys.exit(1)
else:
    print("\n🚀 All checks passed — safe to deploy.\n")
    sys.exit(0)
