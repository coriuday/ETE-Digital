-- ============================================================
-- JOBROWS — Migration 002: Security & Feature Addons
-- Version: 002
-- Date: 2026-04-20
-- Branch: feature/db-security-overhaul
--
-- SAFE TO RE-RUN: Uses ADD COLUMN IF NOT EXISTS everywhere.
-- Does NOT drop any existing columns, tables, or data.
--
-- What this adds:
--   1. jobs.external_apply_url         (Python model had it, DB didn't)
--   2. users: TOTP 2FA columns         (totp_secret, totp_enabled, totp_backup_codes)
--   3. users: Verification flags       (email_verified, phone_verified)
--   4. users: OAuth fields             (oauth_provider, oauth_provider_id, avatar_url)
--   5. user_profiles: phone_verified_at
--   6. blocked_ips table               (DDoS / abuse protection)
--   7. oauth unique index on users
--   8. admin_notes on company_profiles (for admin moderation)
--
-- Run in: Supabase Dashboard → SQL Editor → file 00_MASTER_SCHEMA.sql (addons section)
-- Or: supabase db push  (via CLI)
-- ============================================================

-- ============================================================
-- 1. JOBS TABLE — Add missing external_apply_url column
--    (Python model Job.external_apply_url exists since April 9,
--     but was never added to the DB schema — this is why job
--     posting with external URLs was silently failing)
-- ============================================================

ALTER TABLE jobs
    ADD COLUMN IF NOT EXISTS external_apply_url VARCHAR(2048);

COMMENT ON COLUMN jobs.external_apply_url IS
    'Optional: redirect candidates to company career page instead of in-app apply';

-- ============================================================
-- 2. USERS TABLE — Two-Factor Authentication (TOTP)
--    Using RFC 6238 Time-based OTP (Google Authenticator compatible)
-- ============================================================

ALTER TABLE users
    ADD COLUMN IF NOT EXISTS totp_secret      VARCHAR(255),
    ADD COLUMN IF NOT EXISTS totp_enabled     BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS totp_backup_codes JSONB DEFAULT '[]'::jsonb;

COMMENT ON COLUMN users.totp_secret       IS 'Base32-encoded TOTP secret (encrypted at rest)';
COMMENT ON COLUMN users.totp_enabled      IS 'Whether 2FA is active for this account';
COMMENT ON COLUMN users.totp_backup_codes IS 'One-time backup codes (hashed), used when TOTP device lost';

-- ============================================================
-- 3. USERS TABLE — Separate email and phone verification
--    (is_verified was overloaded; now we track both explicitly)
-- ============================================================

ALTER TABLE users
    ADD COLUMN IF NOT EXISTS email_verified BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN users.email_verified IS 'Set true after user clicks verification email link';
COMMENT ON COLUMN users.phone_verified IS 'Set true after user enters correct SMS OTP';

-- Backfill: treat existing is_verified=true as email_verified=true
-- (safe: is_verified was used only for email before)
UPDATE users
SET email_verified = true
WHERE is_verified = true
  AND email_verified = false;

-- ============================================================
-- 4. USERS TABLE — OAuth / Social Login columns
--    Supports Google Sign-In (and future providers)
-- ============================================================

ALTER TABLE users
    ADD COLUMN IF NOT EXISTS oauth_provider    VARCHAR(50),
    ADD COLUMN IF NOT EXISTS oauth_provider_id VARCHAR(255),
    ADD COLUMN IF NOT EXISTS avatar_url        VARCHAR(500);

COMMENT ON COLUMN users.oauth_provider    IS 'e.g. ''google'', ''github''. NULL for email/password users';
COMMENT ON COLUMN users.oauth_provider_id IS 'Provider''s unique user ID (sub claim from Google)';
COMMENT ON COLUMN users.avatar_url        IS 'Profile picture from OAuth provider or uploaded';

-- Unique index: one account per OAuth identity
-- Partial index so NULL oauth_provider rows are excluded
CREATE UNIQUE INDEX IF NOT EXISTS ix_users_oauth
    ON users (oauth_provider, oauth_provider_id)
    WHERE oauth_provider IS NOT NULL;

-- ============================================================
-- 5. USER_PROFILES TABLE — Phone verification timestamp
-- ============================================================

ALTER TABLE user_profiles
    ADD COLUMN IF NOT EXISTS phone_verified_at TIMESTAMPTZ;

COMMENT ON COLUMN user_profiles.phone_verified_at IS 'Timestamp when phone was last verified via OTP';

-- ============================================================
-- 6. BLOCKED_IPS TABLE — DDoS / Abuse Protection
--    Backend checks this table on every request.
--    Admin can add IPs manually or via automated triggers.
-- ============================================================

CREATE TABLE IF NOT EXISTS blocked_ips (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ip_address      VARCHAR(45) NOT NULL UNIQUE,
    reason          VARCHAR(500),
    blocked_by      UUID REFERENCES users(id) ON DELETE SET NULL,
    auto_blocked    BOOLEAN DEFAULT false,
    blocked_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at      TIMESTAMPTZ,          -- NULL = permanent
    is_active       BOOLEAN NOT NULL DEFAULT true
);

CREATE INDEX IF NOT EXISTS ix_blocked_ips_ip        ON blocked_ips (ip_address);
CREATE INDEX IF NOT EXISTS ix_blocked_ips_is_active ON blocked_ips (is_active);

COMMENT ON TABLE blocked_ips IS
    'IP addresses blocked from accessing the platform. Checked on login and sensitive endpoints.';

ALTER TABLE blocked_ips ENABLE ROW LEVEL SECURITY;

-- Only admins can manage blocked IPs
CREATE POLICY IF NOT EXISTS "Admin manages blocked IPs"
    ON blocked_ips FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
              AND users.role = 'admin'
        )
    );

-- ============================================================
-- 7. FAILED_LOGIN_ATTEMPTS TABLE — Rate Limiting Tracker
--    Tracks failed logins per email/IP for auto-lockout
-- ============================================================

CREATE TABLE IF NOT EXISTS failed_login_attempts (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email       VARCHAR(255),
    ip_address  VARCHAR(45),
    attempted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    user_agent  VARCHAR(500)
);

CREATE INDEX IF NOT EXISTS ix_failed_logins_email ON failed_login_attempts (email, attempted_at);
CREATE INDEX IF NOT EXISTS ix_failed_logins_ip    ON failed_login_attempts (ip_address, attempted_at);

-- Auto-purge old entries (>24h) to keep table small
-- (Run this periodically or via pg_cron if available)
COMMENT ON TABLE failed_login_attempts IS
    'Tracks failed login attempts for rate limiting. Purge rows older than 24h periodically.';

ALTER TABLE failed_login_attempts ENABLE ROW LEVEL SECURITY;

-- No direct access — backend service role only
-- (RLS blocks all anon/authed PostgREST access)

-- ============================================================
-- 8. COMPANY_PROFILES TABLE — Admin moderation support
-- ============================================================

ALTER TABLE company_profiles
    ADD COLUMN IF NOT EXISTS admin_notes    TEXT,
    ADD COLUMN IF NOT EXISTS is_suspended   BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS suspended_at   TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS suspended_reason VARCHAR(500);

COMMENT ON COLUMN company_profiles.admin_notes      IS 'Internal admin notes about this company';
COMMENT ON COLUMN company_profiles.is_suspended     IS 'If true, employer cannot post jobs';
COMMENT ON COLUMN company_profiles.suspended_at     IS 'When the account was suspended';
COMMENT ON COLUMN company_profiles.suspended_reason IS 'Reason for suspension (shown to employer)';

-- ============================================================
-- 9. AUDIT_LOGS — Extend action enum for new events
-- ============================================================

DO $$ BEGIN
    ALTER TYPE auditaction ADD VALUE IF NOT EXISTS 'login_success';
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    ALTER TYPE auditaction ADD VALUE IF NOT EXISTS 'login_failure';
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    ALTER TYPE auditaction ADD VALUE IF NOT EXISTS 'totp_enabled';
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    ALTER TYPE auditaction ADD VALUE IF NOT EXISTS 'totp_disabled';
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    ALTER TYPE auditaction ADD VALUE IF NOT EXISTS 'oauth_login';
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    ALTER TYPE auditaction ADD VALUE IF NOT EXISTS 'account_suspended';
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    ALTER TYPE auditaction ADD VALUE IF NOT EXISTS 'ip_blocked';
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============================================================
-- 10. Update alembic_version to track this migration
-- ============================================================

INSERT INTO alembic_version (version_num)
SELECT 'd3e4f5a6b7c8'
WHERE NOT EXISTS (
    SELECT 1 FROM alembic_version WHERE version_num = 'd3e4f5a6b7c8'
);

-- ============================================================
-- DONE. Migration 002 complete.
-- New columns added: 10
-- New tables added:  2 (blocked_ips, failed_login_attempts)
-- New enum values:   7
-- Data loss:         ZERO
-- ============================================================
