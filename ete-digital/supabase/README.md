# Supabase Database — Structure & Operations Guide

## Directory Structure

```
supabase/
├── migrations/
│   ├── 001_initial_schema.sql       ← Full schema (tables, enums, indexes, RLS)
│   └── 002_addons_security.sql      ← Additive: 2FA, OAuth, phone verify, blocked_ips
├── policies/
│   └── rls_policies.sql             ← Comprehensive RLS for all tables + roles
├── seeds/
│   └── seed_admin.sql               ← Admin user creation template
├── security/
│   └── emergency_response.sql       ← Incident response playbook
└── snapshots/
    └── schema_snapshot_20260420.sql ← Pre-migration rollback reference
```

## SQL Editor Files (Keep Only These 3)

| # | File Name in SQL Editor | Content |
|---|-------------------------|---------|
| 00 | `00_MASTER_SCHEMA` | Copy of `001_initial_schema.sql` + `002_addons_security.sql` combined |
| 01 | `01_RLS_POLICIES` | Copy of `policies/rls_policies.sql` |
| 02 | `02_EMERGENCY_RESPONSE` | Copy of `security/emergency_response.sql` |

**Delete all other files in the SQL Editor — they are duplicates.**

## Applying Migrations

### Step 1: Run Migration 002 (New Columns)
In Supabase Dashboard → SQL Editor → paste contents of:
```
supabase/migrations/002_addons_security.sql
```

### Step 2: Apply RLS Policies
In SQL Editor → paste contents of:
```
supabase/policies/rls_policies.sql
```

### Step 3: Create Admin User
Run from your terminal:
```bash
cd backend
python scripts/seed_admin.py
```

## Table Relationships (Data Flow)

```
users
  ├── user_profiles (1:1, CASCADE)
  ├── refresh_tokens (1:N, CASCADE)
  ├── company_profiles (employer only, 1:1, CASCADE)
  ├── jobs (employer only, 1:N, CASCADE)
  │     └── applications (N candidates per job, CASCADE)
  │           └── interviews (1:N per application, CASCADE)
  ├── tryouts (via jobs → 1:1, CASCADE)
  │     └── tryout_submissions (N per tryout, CASCADE)
  │           └── talent_vault_items (via tryout_submission_id, SET NULL)
  ├── talent_vault_items (candidate only, 1:N, CASCADE)
  │     └── vault_share_tokens (1:N, CASCADE)
  ├── notifications (1:N, CASCADE)
  └── audit_logs (1:N, nullable user_id)
```

## New Columns Added (Migration 002)

### `users` table
| Column | Type | Purpose |
|--------|------|---------|
| `totp_secret` | VARCHAR(255) | Encrypted TOTP secret for 2FA |
| `totp_enabled` | BOOLEAN | Whether 2FA is active |
| `totp_backup_codes` | JSONB | Hashed one-time recovery codes |
| `email_verified` | BOOLEAN | Email confirmed via link |
| `phone_verified` | BOOLEAN | Phone confirmed via SMS OTP |
| `oauth_provider` | VARCHAR(50) | 'google', null for password users |
| `oauth_provider_id` | VARCHAR(255) | Google's `sub` claim |
| `avatar_url` | VARCHAR(500) | Profile picture from OAuth/upload |

### `jobs` table
| Column | Type | Purpose |
|--------|------|---------|
| `external_apply_url` | VARCHAR(2048) | Redirect to company careers page |

### New Tables
- `blocked_ips` — IP-level DDoS/abuse protection
- `failed_login_attempts` — Brute force tracking

## Rollback If Something Goes Wrong

Run the rollback script in the snapshot file:
```
supabase/snapshots/schema_snapshot_20260420.sql
```
(The rollback block is between `/* ... */` comments at the bottom of the file.)

## Admin Access

After running `seed_admin.py`, log in at `/login` with the admin credentials.
The admin panel is at `/admin` — it requires `role = 'admin'` in the JWT.
