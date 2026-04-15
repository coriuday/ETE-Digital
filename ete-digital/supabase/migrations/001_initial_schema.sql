-- ============================================================
-- ETE Digital — CANONICAL Database Schema for Supabase
-- Version: 002 (Post-enum-fix rebuild)
-- Migration: 001_initial_schema
-- Applied: 2026-04-08
--
-- CRITICAL: All enum values match Python SQLAlchemy model .value
-- Apply via: supabase db push  (or Supabase Dashboard → SQL Editor)
-- ⚠️  Safe to re-run: drops existing tables/types first
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- CLEANUP — drop in dependency order (children before parents)
-- ============================================================

DROP TABLE IF EXISTS public.interviews             CASCADE;
DROP TABLE IF EXISTS public.vault_share_tokens     CASCADE;
DROP TABLE IF EXISTS public.talent_vault_items     CASCADE;
DROP TABLE IF EXISTS public.tryout_submissions     CASCADE;
DROP TABLE IF EXISTS public.tryouts               CASCADE;
DROP TABLE IF EXISTS public.applications          CASCADE;
DROP TABLE IF EXISTS public.notifications         CASCADE;
DROP TABLE IF EXISTS public.audit_logs            CASCADE;
DROP TABLE IF EXISTS public.refresh_tokens        CASCADE;
DROP TABLE IF EXISTS public.company_profiles      CASCADE;
DROP TABLE IF EXISTS public.user_profiles         CASCADE;
DROP TABLE IF EXISTS public.jobs                  CASCADE;
DROP TABLE IF EXISTS public.users                 CASCADE;
DROP TABLE IF EXISTS public.alembic_version       CASCADE;

DROP TYPE IF EXISTS public.interviewstatus   CASCADE;
DROP TYPE IF EXISTS public.interviewtype     CASCADE;
DROP TYPE IF EXISTS public.companysize       CASCADE;
DROP TYPE IF EXISTS public.vaultitemtype     CASCADE;
DROP TYPE IF EXISTS public.tryoutstatus      CASCADE;
DROP TYPE IF EXISTS public.paymentstatus     CASCADE;
DROP TYPE IF EXISTS public.submissionstatus  CASCADE;
DROP TYPE IF EXISTS public.notificationtype  CASCADE;
DROP TYPE IF EXISTS public.jobstatus         CASCADE;
DROP TYPE IF EXISTS public.jobtype           CASCADE;
DROP TYPE IF EXISTS public.auditaction       CASCADE;
DROP TYPE IF EXISTS public.applicationstatus CASCADE;
DROP TYPE IF EXISTS public.userrole          CASCADE;

-- ============================================================
-- ENUMS — Values EXACTLY match Python model .value strings
-- ============================================================

-- UserRole.CANDIDATE.value = 'candidate', etc.
CREATE TYPE userrole AS ENUM ('candidate', 'employer', 'admin');

-- ApplicationStatus.PENDING.value = 'pending', etc.
CREATE TYPE applicationstatus AS ENUM (
    'pending', 'reviewed', 'shortlisted', 'rejected', 'hired', 'withdrawn'
);

-- AuditAction values are lowercase with underscores
CREATE TYPE auditaction AS ENUM (
    'vault_access', 'vault_share', 'data_export', 'data_deletion',
    'profile_update', 'password_change', 'admin_action'
);

-- JobType.FULL_TIME.value = 'full_time', etc.
CREATE TYPE jobtype AS ENUM ('full_time', 'part_time', 'contract', 'internship');

-- JobStatus.DRAFT.value = 'draft', etc.
CREATE TYPE jobstatus AS ENUM ('draft', 'active', 'closed', 'archived');

-- NotificationType.APPLICATION.value = 'application', etc.
CREATE TYPE notificationtype AS ENUM (
    'application', 'tryout', 'message', 'payment', 'system'
);

-- SubmissionStatus has auto_graded and passed values
CREATE TYPE submissionstatus AS ENUM (
    'submitted', 'grading', 'auto_graded', 'graded', 'verified', 'passed', 'failed'
);

-- PaymentStatus.PENDING.value = 'pending', etc.
CREATE TYPE paymentstatus AS ENUM ('pending', 'escrowed', 'released', 'refunded', 'failed');

-- TryoutStatus has DRAFT value
CREATE TYPE tryoutstatus AS ENUM ('draft', 'active', 'expired', 'closed');

-- VaultItemType.PROJECT.value = 'project', etc.
CREATE TYPE vaultitemtype AS ENUM (
    'project', 'verified_sample', 'badge', 'certificate', 'other'
);

-- CompanySize uses size range strings (Python: STARTUP = "1-10")
CREATE TYPE companysize AS ENUM ('1-10', '11-50', '51-200', '201-1000', '1000+');

-- InterviewType.VIDEO.value = 'video', etc.
CREATE TYPE interviewtype AS ENUM ('video', 'phone', 'in_person', 'technical', 'hr', 'final');

-- InterviewStatus.SCHEDULED.value = 'scheduled', etc.
CREATE TYPE interviewstatus AS ENUM ('scheduled', 'completed', 'cancelled', 'no_show');

-- ============================================================
-- TABLE: users
-- ============================================================

CREATE TABLE users (
    id                          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email                       VARCHAR(255) NOT NULL UNIQUE,
    password_hash               VARCHAR(255) NOT NULL,
    role                        userrole NOT NULL,
    is_verified                 BOOLEAN NOT NULL DEFAULT false,
    is_active                   BOOLEAN NOT NULL DEFAULT true,
    created_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at                  TIMESTAMPTZ,
    last_login_at               TIMESTAMPTZ,
    verification_token          VARCHAR(255),
    verification_token_expires  TIMESTAMPTZ,
    reset_token                 VARCHAR(255),
    reset_token_expires         TIMESTAMPTZ
);

CREATE INDEX ix_users_role  ON users (role);
CREATE INDEX ix_users_email ON users (email);

-- ============================================================
-- TABLE: user_profiles
-- ============================================================

CREATE TABLE user_profiles (
    user_id          UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    full_name        VARCHAR(255),
    phone            VARCHAR(20),
    location         VARCHAR(255),
    bio              VARCHAR(1000),
    avatar_url       VARCHAR(500),
    resume_url       VARCHAR(500),
    skills           JSONB DEFAULT '[]'::jsonb,
    experience_years VARCHAR(20),
    phone_encrypted  VARCHAR(500),
    ssn_encrypted    VARCHAR(500),
    social_links     JSONB DEFAULT '{}'::jsonb,
    preferences      JSONB DEFAULT '{}'::jsonb,
    -- AI matching columns (added in migration b2c3d4e5f6a7)
    salary_expectation_min INTEGER,
    salary_expectation_max INTEGER,
    preferred_job_types    JSONB DEFAULT '[]'::jsonb,
    preferred_locations    JSONB DEFAULT '[]'::jsonb,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at       TIMESTAMPTZ
);

-- ============================================================
-- TABLE: refresh_tokens
-- ============================================================

CREATE TABLE refresh_tokens (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token       VARCHAR(500) NOT NULL UNIQUE,
    expires_at  TIMESTAMPTZ NOT NULL,
    is_revoked  BOOLEAN NOT NULL DEFAULT false,
    ip_address  VARCHAR(45),
    user_agent  VARCHAR(500),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX ix_refresh_tokens_user_id ON refresh_tokens (user_id);

-- ============================================================
-- TABLE: company_profiles
-- ============================================================

CREATE TABLE company_profiles (
    id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employer_id      UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    name             VARCHAR(255) NOT NULL,
    tagline          VARCHAR(500),
    description      TEXT,
    industry         VARCHAR(100),
    company_size     companysize,
    founded_year     INTEGER,
    logo_url         VARCHAR(500),
    cover_image_url  VARCHAR(500),
    brand_color      VARCHAR(7),
    website          VARCHAR(500),
    email            VARCHAR(255),
    phone            VARCHAR(20),
    address          VARCHAR(500),
    city             VARCHAR(100),
    country          VARCHAR(100),
    social_links     JSONB DEFAULT '{}'::jsonb,
    benefits         JSONB DEFAULT '[]'::jsonb,
    tech_stack       JSONB DEFAULT '[]'::jsonb,
    culture_tags     JSONB DEFAULT '[]'::jsonb,
    is_verified      BOOLEAN DEFAULT false,
    verified_at      TIMESTAMPTZ,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at       TIMESTAMPTZ
);

-- ============================================================
-- TABLE: jobs
-- ============================================================

CREATE TABLE jobs (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employer_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title               VARCHAR(255) NOT NULL,
    description         TEXT NOT NULL,
    requirements        TEXT,
    company             VARCHAR(255) NOT NULL DEFAULT '',
    location            VARCHAR(255),
    remote_ok           BOOLEAN DEFAULT false,
    job_type            jobtype NOT NULL DEFAULT 'full_time',
    salary_min          INTEGER,
    salary_max          INTEGER,
    salary_currency     VARCHAR(3) DEFAULT 'INR',
    skills_required     JSONB DEFAULT '[]'::jsonb,
    experience_required VARCHAR(50),
    status              jobstatus NOT NULL DEFAULT 'draft',
    has_tryout          BOOLEAN NOT NULL DEFAULT false,
    tryout_config       JSONB,
    outcome_terms       JSONB,
    custom_questions    JSONB,
    views_count         INTEGER DEFAULT 0,
    applications_count  INTEGER DEFAULT 0,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ,
    published_at        TIMESTAMPTZ,
    expires_at          TIMESTAMPTZ,

    CONSTRAINT chk_jobs_salary_range
        CHECK (salary_min IS NULL OR salary_max IS NULL OR salary_min <= salary_max)
);

CREATE INDEX ix_jobs_employer_id ON jobs (employer_id);
CREATE INDEX ix_jobs_status ON jobs (status);

-- ============================================================
-- TABLE: applications
-- ============================================================

CREATE TABLE applications (
    id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_id            UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    candidate_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    cover_letter      TEXT,
    custom_answers    JSONB,
    vault_share_token VARCHAR(500),
    status            applicationstatus NOT NULL DEFAULT 'pending',
    match_score       INTEGER,
    match_explanation JSONB,
    employer_notes    TEXT,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at        TIMESTAMPTZ,

    CONSTRAINT uq_applications_job_candidate UNIQUE (job_id, candidate_id)
);

CREATE INDEX ix_applications_job_id       ON applications (job_id);
CREATE INDEX ix_applications_candidate_id ON applications (candidate_id);

-- ============================================================
-- TABLE: tryouts
-- Columns match SQLAlchemy model exactly:
--   title, description, requirements (NOT task_description)
--   payment_amount as INTEGER, both payment_currency AND currency
--   both scoring_rubric AND rubric fields
-- ============================================================

CREATE TABLE tryouts (
    id                        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_id                    UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    title                     VARCHAR(255) NOT NULL,
    description               TEXT NOT NULL,
    requirements              TEXT,
    task_requirements         JSONB,
    test_cases                JSONB,
    expected_deliverables     JSONB,
    estimated_duration_hours  INTEGER NOT NULL DEFAULT 8,
    duration_days             INTEGER NOT NULL DEFAULT 7 CHECK (duration_days > 0),
    payment_amount            INTEGER DEFAULT 0,
    payment_currency          VARCHAR(3) DEFAULT 'INR',
    currency                  VARCHAR(3) DEFAULT 'INR',
    scoring_rubric            JSONB NOT NULL DEFAULT '{}'::jsonb,
    rubric                    JSONB,
    passing_score             INTEGER CHECK (passing_score >= 0),
    auto_grade_enabled        BOOLEAN DEFAULT false,
    max_submissions           INTEGER DEFAULT 1,
    submission_format         VARCHAR(100),
    submissions_count         INTEGER DEFAULT 0,
    status                    tryoutstatus DEFAULT 'active',
    created_at                TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at                TIMESTAMPTZ,
    expires_at                TIMESTAMPTZ
);

CREATE INDEX ix_tryouts_job_id ON tryouts (job_id);

-- ============================================================
-- TABLE: tryout_submissions
-- Columns match SQLAlchemy model exactly:
--   both notes AND submission_notes
--   reviewed_by as VARCHAR(255) (not UUID FK)
-- ============================================================

CREATE TABLE tryout_submissions (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tryout_id               UUID NOT NULL REFERENCES tryouts(id) ON DELETE CASCADE,
    candidate_id            UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    submission_url          VARCHAR(500),
    submission_data         JSONB,
    notes                   TEXT,
    submission_notes        TEXT,
    auto_score              INTEGER,
    manual_score            INTEGER,
    final_score             INTEGER,
    score_breakdown         JSONB,
    feedback                TEXT,
    reviewed_by             VARCHAR(255),
    reviewed_at             TIMESTAMPTZ,
    status                  submissionstatus DEFAULT 'submitted',
    payment_status          paymentstatus DEFAULT 'pending',
    payment_transaction_id  VARCHAR(255),
    submitted_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
    graded_at               TIMESTAMPTZ,
    payment_escrowed_at     TIMESTAMPTZ,
    payment_released_at     TIMESTAMPTZ,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at              TIMESTAMPTZ,

    CONSTRAINT uq_tryout_submissions_tryout_candidate UNIQUE (tryout_id, candidate_id)
);

CREATE INDEX ix_tryout_submissions_tryout_id    ON tryout_submissions (tryout_id);
CREATE INDEX ix_tryout_submissions_candidate_id ON tryout_submissions (candidate_id);

-- ============================================================
-- TABLE: talent_vault_items
-- ============================================================

CREATE TABLE talent_vault_items (
    id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    candidate_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type                 vaultitemtype NOT NULL DEFAULT 'project',
    title                VARCHAR(255) NOT NULL,
    description          VARCHAR(1000),
    file_url             VARCHAR(500),
    file_type            VARCHAR(50),
    file_size_bytes      BIGINT,
    item_metadata        JSONB,
    is_verified          BOOLEAN NOT NULL DEFAULT false,
    verified_by          VARCHAR(50),
    tryout_submission_id UUID REFERENCES tryout_submissions(id) ON DELETE SET NULL,
    share_count          INTEGER DEFAULT 0,
    view_count           INTEGER DEFAULT 0,
    created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at           TIMESTAMPTZ
);

CREATE INDEX ix_talent_vault_items_candidate_id ON talent_vault_items (candidate_id);

-- ============================================================
-- TABLE: vault_share_tokens
-- ============================================================

CREATE TABLE vault_share_tokens (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vault_item_id       UUID NOT NULL REFERENCES talent_vault_items(id) ON DELETE CASCADE,
    token               UUID NOT NULL UNIQUE DEFAULT uuid_generate_v4(),
    expires_at          TIMESTAMPTZ,
    max_views           INTEGER,
    view_count          INTEGER DEFAULT 0,
    is_revoked          BOOLEAN DEFAULT false,
    shared_with_email   VARCHAR(255),
    shared_with_company VARCHAR(255),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    last_accessed_at    TIMESTAMPTZ
);

CREATE INDEX ix_vault_share_tokens_vault_item_id ON vault_share_tokens (vault_item_id);

-- ============================================================
-- TABLE: notifications
-- ============================================================

CREATE TABLE notifications (
    id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id               UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type                  notificationtype NOT NULL DEFAULT 'system',
    title                 VARCHAR(255) NOT NULL,
    message               VARCHAR(500) NOT NULL,
    link                  VARCHAR(500),
    notification_metadata JSONB,
    is_read               BOOLEAN NOT NULL DEFAULT false,
    created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
    read_at               TIMESTAMPTZ
);

CREATE INDEX ix_notifications_user_id_is_read ON notifications (user_id, is_read);

-- ============================================================
-- TABLE: audit_logs
-- ============================================================

CREATE TABLE audit_logs (
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id       UUID,
    action        auditaction NOT NULL DEFAULT 'admin_action',
    resource_type VARCHAR(50),
    resource_id   UUID,
    ip_address    VARCHAR(45),
    user_agent    VARCHAR(500),
    request_path  VARCHAR(500),
    details       JSONB,
    timestamp     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX ix_audit_logs_user_id   ON audit_logs (user_id);
CREATE INDEX ix_audit_logs_action    ON audit_logs (action);
CREATE INDEX ix_audit_logs_timestamp ON audit_logs (timestamp);

-- ============================================================
-- TABLE: interviews
-- ============================================================

CREATE TABLE interviews (
    id                          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    application_id              UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    employer_id                 UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    candidate_id                UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    interview_type              interviewtype DEFAULT 'video',
    title                       VARCHAR(255) DEFAULT 'Interview',
    scheduled_at                TIMESTAMPTZ NOT NULL,
    duration_minutes            INTEGER DEFAULT 60,
    meeting_url                 VARCHAR(500),
    meeting_platform            VARCHAR(50),
    meeting_id                  VARCHAR(100),
    meeting_password            VARCHAR(100),
    location_address            VARCHAR(500),
    agenda                      TEXT,
    instructions_for_candidate  TEXT,
    internal_notes              TEXT,
    candidate_rating            INTEGER CHECK (candidate_rating BETWEEN 1 AND 5),
    interviewer_notes           TEXT,
    status                      interviewstatus DEFAULT 'scheduled',
    reminder_sent               BOOLEAN DEFAULT false,
    candidate_confirmed         BOOLEAN DEFAULT false,
    created_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at                  TIMESTAMPTZ,
    completed_at                TIMESTAMPTZ
);

CREATE INDEX ix_interviews_application_id ON interviews (application_id);
CREATE INDEX ix_interviews_employer_id    ON interviews (employer_id);
CREATE INDEX ix_interviews_candidate_id   ON interviews (candidate_id);

-- ============================================================
-- TABLE: alembic_version
-- ============================================================

CREATE TABLE IF NOT EXISTS alembic_version (
    version_num VARCHAR(32) NOT NULL,
    CONSTRAINT alembic_version_pkc PRIMARY KEY (version_num)
);

INSERT INTO alembic_version (version_num) VALUES ('c1d2e3f4a5b6');

-- ============================================================
-- RLS: Enable Row Level Security
-- Backend uses PostgreSQL direct connection (bypasses RLS).
-- This blocks unauthenticated PostgREST/anon key access.
-- ============================================================

ALTER TABLE users              ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles      ENABLE ROW LEVEL SECURITY;
ALTER TABLE refresh_tokens     ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_profiles   ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs               ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications       ENABLE ROW LEVEL SECURITY;
ALTER TABLE tryouts            ENABLE ROW LEVEL SECURITY;
ALTER TABLE tryout_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE talent_vault_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE vault_share_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications      ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs         ENABLE ROW LEVEL SECURITY;
ALTER TABLE interviews         ENABLE ROW LEVEL SECURITY;
ALTER TABLE alembic_version    ENABLE ROW LEVEL SECURITY;

-- Allow public read of active jobs (for /jobs search page)
CREATE POLICY "Public can view active jobs"
    ON jobs FOR SELECT
    USING (status = 'active');

-- ============================================================
-- DONE: 13 tables + alembic_version created.
-- ============================================================
