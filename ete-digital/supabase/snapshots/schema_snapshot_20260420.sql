-- ============================================================
-- JOBROWS — Schema Snapshot (Pre-Security-Overhaul)
-- Captured: 2026-04-20
-- Branch: feature (before db-security-overhaul changes)
-- Purpose: ROLLBACK REFERENCE — if the migration causes issues,
--          restore from this snapshot.
--
-- To restore:
--   1. Open Supabase Dashboard → SQL Editor
--   2. Run the DROP + CREATE sections below in order
--   3. Reinsert any critical seed data manually
--
-- WARNING: Restoring this snapshot will OVERWRITE current schema.
--          Only do this in an emergency.
-- ============================================================

-- ============================================================
-- EXISTING ENUMS (as of 2026-04-20)
-- ============================================================
-- userrole:        'candidate', 'employer', 'admin'
-- applicationstatus: 'pending','reviewed','shortlisted','rejected','hired','withdrawn'
-- auditaction:     'vault_access','vault_share','data_export','data_deletion',
--                  'profile_update','password_change','admin_action'
-- jobtype:         'full_time','part_time','contract','internship'
-- jobstatus:       'draft','active','closed','archived'
-- notificationtype:'application','tryout','message','payment','system'
-- submissionstatus:'submitted','grading','auto_graded','graded','verified','passed','failed'
-- paymentstatus:   'pending','escrowed','released','refunded','failed'
-- tryoutstatus:    'draft','active','expired','closed'
-- vaultitemtype:   'project','verified_sample','badge','certificate','other'
-- companysize:     '1-10','11-50','51-200','201-1000','1000+'
-- interviewtype:   'video','phone','in_person','technical','hr','final'
-- interviewstatus: 'scheduled','completed','cancelled','no_show'

-- ============================================================
-- EXISTING TABLES (as of 2026-04-20)
-- ============================================================
-- users
--   id, email, password_hash, role, is_verified, is_active,
--   created_at, updated_at, last_login_at,
--   verification_token, verification_token_expires,
--   reset_token, reset_token_expires
--
-- user_profiles
--   user_id, full_name, phone, location, bio, avatar_url,
--   resume_url, skills, experience_years, phone_encrypted,
--   ssn_encrypted, social_links, preferences,
--   salary_expectation_min, salary_expectation_max,
--   preferred_job_types, preferred_locations,
--   created_at, updated_at
--
-- refresh_tokens
--   id, user_id, token, expires_at, is_revoked,
--   ip_address, user_agent, created_at
--
-- company_profiles
--   id, employer_id, name, tagline, description, industry,
--   company_size, founded_year, logo_url, cover_image_url,
--   brand_color, website, email, phone, address, city, country,
--   social_links, benefits, tech_stack, culture_tags,
--   is_verified, verified_at, created_at, updated_at
--
-- jobs
--   id, employer_id, title, description, requirements, company,
--   location, remote_ok, job_type, salary_min, salary_max,
--   salary_currency, skills_required, experience_required,
--   status, has_tryout, tryout_config, outcome_terms, custom_questions,
--   views_count, applications_count, created_at, updated_at,
--   published_at, expires_at
--   MISSING: external_apply_url (in Python model, NOT in DB)
--
-- applications
--   id, job_id, candidate_id, cover_letter, custom_answers,
--   vault_share_token, status, match_score, match_explanation,
--   employer_notes, created_at, updated_at
--
-- tryouts, tryout_submissions, talent_vault_items,
-- vault_share_tokens, notifications, audit_logs, interviews,
-- alembic_version
-- ============================================================

-- ============================================================
-- EXISTING RLS POLICIES (as of 2026-04-20) — ONLY 1 POLICY EXISTS
-- ============================================================
-- Table: jobs
--   Policy: "Public can view active jobs"
--     FOR SELECT USING (status = 'active')
--
-- ALL OTHER TABLES: RLS enabled but ZERO policies (blocked to anon)
-- Backend bypasses via service role key — works, but risky.
-- ============================================================

-- ============================================================
-- ROLLBACK SCRIPT (emergency use only)
-- Run this in Supabase SQL Editor to undo migration 002
-- ============================================================

-- Rollback migration 002 changes (run if 002 breaks things):
/*
ALTER TABLE jobs DROP COLUMN IF EXISTS external_apply_url;
ALTER TABLE users DROP COLUMN IF EXISTS totp_secret;
ALTER TABLE users DROP COLUMN IF EXISTS totp_enabled;
ALTER TABLE users DROP COLUMN IF EXISTS totp_backup_codes;
ALTER TABLE users DROP COLUMN IF EXISTS email_verified;
ALTER TABLE users DROP COLUMN IF EXISTS phone_verified;
ALTER TABLE users DROP COLUMN IF EXISTS oauth_provider;
ALTER TABLE users DROP COLUMN IF EXISTS oauth_provider_id;
ALTER TABLE users DROP COLUMN IF EXISTS avatar_url;
ALTER TABLE user_profiles DROP COLUMN IF EXISTS phone_verified_at;
DROP INDEX IF EXISTS ix_users_oauth;
*/

-- ============================================================
-- END OF SNAPSHOT
-- ============================================================
