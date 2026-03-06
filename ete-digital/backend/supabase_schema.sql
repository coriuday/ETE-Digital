-- ============================================================
-- ETE Digital — Full Database Schema for Supabase
-- Generated from all Alembic migrations (final state)
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- Enable UUID extension (already enabled in Supabase by default)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- ENUMS
-- ============================================================

CREATE TYPE userrole AS ENUM ('CANDIDATE', 'EMPLOYER', 'ADMIN');
CREATE TYPE applicationstatus AS ENUM (
    'PENDING', 'REVIEWED', 'SHORTLISTED', 'REJECTED', 'HIRED', 'WITHDRAWN'
);
CREATE TYPE auditaction AS ENUM (
    'VAULT_ACCESS', 'VAULT_SHARE', 'DATA_EXPORT', 'DATA_DELETION',
    'PROFILE_UPDATE', 'PASSWORD_CHANGE', 'ADMIN_ACTION'
);
CREATE TYPE jobtype AS ENUM ('FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERNSHIP');
CREATE TYPE jobstatus AS ENUM ('DRAFT', 'ACTIVE', 'CLOSED', 'ARCHIVED');
CREATE TYPE notificationtype AS ENUM ('APPLICATION', 'TRYOUT', 'MESSAGE', 'PAYMENT', 'SYSTEM');
CREATE TYPE submissionstatus AS ENUM ('SUBMITTED', 'GRADING', 'GRADED', 'VERIFIED', 'FAILED');
CREATE TYPE paymentstatus AS ENUM ('PENDING', 'ESCROWED', 'RELEASED', 'REFUNDED', 'FAILED');
CREATE TYPE tryoutstatus AS ENUM ('ACTIVE', 'EXPIRED', 'CLOSED');
CREATE TYPE vaultitemtype AS ENUM ('PROJECT', 'VERIFIED_SAMPLE', 'BADGE', 'CERTIFICATE', 'OTHER');
CREATE TYPE companysize AS ENUM ('STARTUP', 'SMALL', 'MEDIUM', 'LARGE', 'ENTERPRISE');
CREATE TYPE interviewtype AS ENUM ('VIDEO', 'PHONE', 'IN_PERSON', 'TECHNICAL', 'HR', 'FINAL');
CREATE TYPE interviewstatus AS ENUM ('SCHEDULED', 'COMPLETED', 'CANCELLED', 'NO_SHOW');

-- ============================================================
-- TABLE: users
-- ============================================================

CREATE TABLE users (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email           VARCHAR(255) NOT NULL UNIQUE,
    password_hash   VARCHAR(255) NOT NULL,
    role            userrole NOT NULL,
    is_verified     BOOLEAN NOT NULL DEFAULT false,
    is_active       BOOLEAN NOT NULL DEFAULT true,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ,
    last_login_at   TIMESTAMPTZ,
    verification_token          VARCHAR(255),
    verification_token_expires  TIMESTAMPTZ,
    reset_token                 VARCHAR(255),
    reset_token_expires         TIMESTAMPTZ
);

-- email already UNIQUE (implicit index); add role index for fast filtering
CREATE INDEX ix_users_role ON users (role);

-- ============================================================
-- TABLE: user_profiles
-- Fix: FK on user_id → users(id) ON DELETE CASCADE
-- Note: phone stores plain display value; phone_encrypted stores
--       AES-encrypted version for PII compliance — both intentional.
-- ============================================================

CREATE TABLE user_profiles (
    user_id          UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    full_name        VARCHAR(255),
    phone            VARCHAR(20),          -- plain display copy (optional)
    location         VARCHAR(255),
    bio              VARCHAR(1000),
    avatar_url       VARCHAR(500),
    resume_url       VARCHAR(500),
    skills           JSONB DEFAULT '[]',
    experience_years VARCHAR(20),
    phone_encrypted  VARCHAR(500),         -- AES-encrypted for PII storage
    ssn_encrypted    VARCHAR(500),
    social_links     JSONB DEFAULT '{}',
    preferences      JSONB DEFAULT '{}',
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at       TIMESTAMPTZ
);

-- ============================================================
-- TABLE: refresh_tokens
-- Fix: FK on user_id → users(id) ON DELETE CASCADE
-- Fix: removed redundant ix_refresh_tokens_token (UNIQUE already creates index)
-- ============================================================

CREATE TABLE refresh_tokens (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token       VARCHAR(500) NOT NULL UNIQUE,   -- UNIQUE creates the index
    expires_at  TIMESTAMPTZ NOT NULL,
    is_revoked  BOOLEAN NOT NULL DEFAULT false,
    ip_address  VARCHAR(45),
    user_agent  VARCHAR(500),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX ix_refresh_tokens_user_id ON refresh_tokens (user_id);

-- ============================================================
-- TABLE: jobs
-- Fix: FK on employer_id → users(id)
-- Fix: CHECK salary_min <= salary_max (nulls allowed)
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
    job_type            jobtype NOT NULL,
    salary_min          INTEGER,
    salary_max          INTEGER,
    salary_currency     VARCHAR(3) DEFAULT 'INR',
    skills_required     JSONB DEFAULT '[]',
    experience_required VARCHAR(50),
    status              jobstatus NOT NULL DEFAULT 'DRAFT',
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
-- Fix: FKs on job_id → jobs(id) and candidate_id → users(id)
-- Fix: UNIQUE (job_id, candidate_id) — one application per candidate per job
-- ============================================================

CREATE TABLE applications (
    id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_id            UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    candidate_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    cover_letter      TEXT,
    custom_answers    JSONB,
    vault_share_token VARCHAR(500),
    status            applicationstatus NOT NULL DEFAULT 'PENDING',
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
-- Fix: FK on job_id → jobs(id)
-- Fix: CHECK duration_days > 0, CHECK passing_score >= 0
-- ============================================================

CREATE TABLE tryouts (
    id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_id           UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    task_description TEXT NOT NULL,
    task_requirements JSONB,
    test_cases       JSONB,
    duration_days    INTEGER NOT NULL CHECK (duration_days > 0),
    payment_amount   NUMERIC(10, 2) NOT NULL,
    currency         VARCHAR(3) DEFAULT 'INR',
    rubric           JSONB NOT NULL,
    passing_score    INTEGER CHECK (passing_score >= 0),
    status           tryoutstatus DEFAULT 'ACTIVE',
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at       TIMESTAMPTZ
);

CREATE INDEX ix_tryouts_job_id ON tryouts (job_id);

-- ============================================================
-- TABLE: tryout_submissions
-- Fix: FKs on tryout_id → tryouts(id) and candidate_id → users(id)
-- Fix: UNIQUE (tryout_id, candidate_id) — one submission per candidate per tryout
-- ============================================================

CREATE TABLE tryout_submissions (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tryout_id               UUID NOT NULL REFERENCES tryouts(id) ON DELETE CASCADE,
    candidate_id            UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    submission_url          VARCHAR(500),
    submission_data         JSONB,
    submission_notes        TEXT,
    auto_score              INTEGER,
    manual_score            INTEGER,
    final_score             INTEGER,
    score_breakdown         JSONB,
    feedback                TEXT,
    status                  submissionstatus DEFAULT 'SUBMITTED',
    payment_status          paymentstatus DEFAULT 'PENDING',
    payment_transaction_id  VARCHAR(255),
    submitted_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
    graded_at               TIMESTAMPTZ,
    payment_released_at     TIMESTAMPTZ,

    CONSTRAINT uq_tryout_submissions_tryout_candidate UNIQUE (tryout_id, candidate_id)
);

CREATE INDEX ix_tryout_submissions_tryout_id    ON tryout_submissions (tryout_id);
CREATE INDEX ix_tryout_submissions_candidate_id ON tryout_submissions (candidate_id);

-- ============================================================
-- TABLE: talent_vault_items
-- Fix: FKs on candidate_id → users(id) and tryout_submission_id → tryout_submissions(id)
-- Fix: file_size_bytes changed from INTEGER to BIGINT (avoids 2 GB overflow)
-- ============================================================

CREATE TABLE talent_vault_items (
    id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    candidate_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type                 vaultitemtype NOT NULL,
    title                VARCHAR(255) NOT NULL,
    description          VARCHAR(1000),
    file_url             VARCHAR(500),
    file_type            VARCHAR(50),
    file_size_bytes      BIGINT,                -- BIGINT: supports files > 2 GB
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
-- Fix: FK on vault_item_id → talent_vault_items(id) ON DELETE CASCADE
-- Fix: removed redundant ix_vault_share_tokens_token (UNIQUE already creates index)
-- ============================================================

CREATE TABLE vault_share_tokens (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vault_item_id       UUID NOT NULL REFERENCES talent_vault_items(id) ON DELETE CASCADE,
    token               UUID NOT NULL UNIQUE DEFAULT uuid_generate_v4(),  -- UNIQUE creates index
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
-- Fix: FK on user_id → users(id) ON DELETE CASCADE
-- Fix: composite index (user_id, is_read) for unread-notification queries
-- ============================================================

CREATE TABLE notifications (
    id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id               UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type                  notificationtype NOT NULL,
    title                 VARCHAR(255) NOT NULL,
    message               VARCHAR(500) NOT NULL,
    link                  VARCHAR(500),
    notification_metadata JSONB,
    is_read               BOOLEAN NOT NULL DEFAULT false,
    created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
    read_at               TIMESTAMPTZ
);

-- Composite index covers "fetch unread for user" queries
CREATE INDEX ix_notifications_user_id_is_read ON notifications (user_id, is_read);

-- ============================================================
-- TABLE: audit_logs
-- (user_id nullable intentionally — system actions have no user)
-- ============================================================

CREATE TABLE audit_logs (
    id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id      UUID,                    -- nullable: system-level actions allowed
    action       auditaction NOT NULL,
    resource_type VARCHAR(50),
    resource_id  UUID,
    ip_address   VARCHAR(45),
    user_agent   VARCHAR(500),
    request_path VARCHAR(500),
    details      JSONB,
    timestamp    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX ix_audit_logs_user_id   ON audit_logs (user_id);
CREATE INDEX ix_audit_logs_action    ON audit_logs (action);
CREATE INDEX ix_audit_logs_timestamp ON audit_logs (timestamp);

-- ============================================================
-- TABLE: company_profiles
-- Fix: FK on employer_id → users(id)
-- Fix: removed redundant ix_company_profiles_employer_id (UNIQUE already creates index)
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
    social_links     JSONB DEFAULT '{}',
    benefits         JSONB DEFAULT '[]',
    tech_stack       JSONB DEFAULT '[]',
    culture_tags     JSONB DEFAULT '[]',
    is_verified      BOOLEAN DEFAULT false,
    verified_at      TIMESTAMPTZ,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at       TIMESTAMPTZ
    -- UNIQUE on employer_id already creates the index; no separate CREATE INDEX needed
);

-- ============================================================
-- TABLE: interviews
-- Fix: FKs on application_id → applications(id), employer_id → users(id),
--      candidate_id → users(id)
-- Fix: CHECK candidate_rating BETWEEN 1 AND 5
-- ============================================================

CREATE TABLE interviews (
    id                          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    application_id              UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    employer_id                 UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    candidate_id                UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    interview_type              interviewtype,
    title                       VARCHAR(255),
    scheduled_at                TIMESTAMPTZ NOT NULL,
    duration_minutes            INTEGER,
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
    status                      interviewstatus DEFAULT 'SCHEDULED',
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
-- Alembic version tracking (so Alembic knows migrations are done)
-- ============================================================

CREATE TABLE IF NOT EXISTS alembic_version (
    version_num VARCHAR(32) NOT NULL,
    CONSTRAINT alembic_version_pkc PRIMARY KEY (version_num)
);

-- Insert the latest migration version so Alembic won't re-run migrations
INSERT INTO alembic_version (version_num) VALUES ('71bc124d75eb');

-- ============================================================
-- DONE! All 13 tables created.
-- Tables: users, user_profiles, refresh_tokens, jobs,
--         applications, tryouts, tryout_submissions,
--         talent_vault_items, vault_share_tokens,
--         notifications, audit_logs, company_profiles, interviews
-- ============================================================