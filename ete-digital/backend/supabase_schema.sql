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
    'PENDING',
    'REVIEWED',
    'SHORTLISTED',
    'REJECTED',
    'HIRED',
    'WITHDRAWN'
);
CREATE TYPE auditaction AS ENUM (
    'VAULT_ACCESS',
    'VAULT_SHARE',
    'DATA_EXPORT',
    'DATA_DELETION',
    'PROFILE_UPDATE',
    'PASSWORD_CHANGE',
    'ADMIN_ACTION'
);
CREATE TYPE jobtype AS ENUM (
    'FULL_TIME',
    'PART_TIME',
    'CONTRACT',
    'INTERNSHIP'
);
CREATE TYPE jobstatus AS ENUM ('DRAFT', 'ACTIVE', 'CLOSED', 'ARCHIVED');
CREATE TYPE notificationtype AS ENUM (
    'APPLICATION',
    'TRYOUT',
    'MESSAGE',
    'PAYMENT',
    'SYSTEM'
);
CREATE TYPE submissionstatus AS ENUM (
    'SUBMITTED',
    'GRADING',
    'GRADED',
    'VERIFIED',
    'FAILED'
);
CREATE TYPE paymentstatus AS ENUM (
    'PENDING',
    'ESCROWED',
    'RELEASED',
    'REFUNDED',
    'FAILED'
);
CREATE TYPE tryoutstatus AS ENUM ('ACTIVE', 'EXPIRED', 'CLOSED');
CREATE TYPE vaultitemtype AS ENUM (
    'PROJECT',
    'VERIFIED_SAMPLE',
    'BADGE',
    'CERTIFICATE',
    'OTHER'
);
CREATE TYPE companysize AS ENUM (
    'STARTUP',
    'SMALL',
    'MEDIUM',
    'LARGE',
    'ENTERPRISE'
);
CREATE TYPE interviewtype AS ENUM (
    'VIDEO',
    'PHONE',
    'IN_PERSON',
    'TECHNICAL',
    'HR',
    'FINAL'
);
CREATE TYPE interviewstatus AS ENUM ('SCHEDULED', 'COMPLETED', 'CANCELLED', 'NO_SHOW');
-- ============================================================
-- TABLE: users
-- ============================================================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role userrole NOT NULL,
    is_verified BOOLEAN NOT NULL DEFAULT false,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ,
    last_login_at TIMESTAMPTZ,
    verification_token VARCHAR(255),
    verification_token_expires TIMESTAMPTZ,
    reset_token VARCHAR(255),
    reset_token_expires TIMESTAMPTZ
);
CREATE INDEX ix_users_email ON users (email);
CREATE INDEX ix_users_role ON users (role);
-- ============================================================
-- TABLE: user_profiles
-- ============================================================
CREATE TABLE user_profiles (
    user_id UUID PRIMARY KEY,
    full_name VARCHAR(255),
    phone VARCHAR(20),
    location VARCHAR(255),
    bio VARCHAR(1000),
    avatar_url VARCHAR(500),
    resume_url VARCHAR(500),
    skills JSONB DEFAULT '[]',
    experience_years VARCHAR(20),
    phone_encrypted VARCHAR(500),
    ssn_encrypted VARCHAR(500),
    social_links JSONB DEFAULT '{}',
    preferences JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ
);
-- ============================================================
-- TABLE: refresh_tokens
-- ============================================================
CREATE TABLE refresh_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    token VARCHAR(500) NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    is_revoked BOOLEAN NOT NULL DEFAULT false,
    ip_address VARCHAR(45),
    user_agent VARCHAR(500),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ix_refresh_tokens_token ON refresh_tokens (token);
CREATE INDEX ix_refresh_tokens_user_id ON refresh_tokens (user_id);
-- ============================================================
-- TABLE: jobs  (final state after all migrations)
-- ============================================================
CREATE TABLE jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employer_id UUID NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    requirements TEXT,
    company VARCHAR(255) NOT NULL DEFAULT '',
    location VARCHAR(255),
    remote_ok BOOLEAN DEFAULT false,
    job_type jobtype NOT NULL,
    salary_min INTEGER,
    salary_max INTEGER,
    salary_currency VARCHAR(3) DEFAULT 'INR',
    skills_required JSONB DEFAULT '[]',
    experience_required VARCHAR(50),
    status jobstatus NOT NULL DEFAULT 'DRAFT',
    has_tryout BOOLEAN NOT NULL DEFAULT false,
    tryout_config JSONB,
    outcome_terms JSONB,
    custom_questions JSONB,
    views_count INTEGER DEFAULT 0,
    applications_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ,
    published_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ
);
CREATE INDEX ix_jobs_employer_id ON jobs (employer_id);
CREATE INDEX ix_jobs_status ON jobs (status);
-- ============================================================
-- TABLE: applications  (final state after all migrations)
-- ============================================================
CREATE TABLE applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_id UUID NOT NULL,
    candidate_id UUID NOT NULL,
    cover_letter TEXT,
    custom_answers JSONB,
    vault_share_token VARCHAR(500),
    status applicationstatus NOT NULL DEFAULT 'PENDING',
    match_score INTEGER,
    match_explanation JSONB,
    employer_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ
);
CREATE INDEX ix_applications_job_id ON applications (job_id);
CREATE INDEX ix_applications_candidate_id ON applications (candidate_id);
-- ============================================================
-- TABLE: tryouts
-- ============================================================
CREATE TABLE tryouts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_id UUID NOT NULL,
    task_description TEXT NOT NULL,
    task_requirements JSONB,
    test_cases JSONB,
    duration_days INTEGER NOT NULL,
    payment_amount NUMERIC(10, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'INR',
    rubric JSONB NOT NULL,
    passing_score INTEGER,
    status tryoutstatus DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at TIMESTAMPTZ
);
CREATE INDEX ix_tryouts_job_id ON tryouts (job_id);
-- ============================================================
-- TABLE: tryout_submissions
-- ============================================================
CREATE TABLE tryout_submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tryout_id UUID NOT NULL,
    candidate_id UUID NOT NULL,
    submission_url VARCHAR(500),
    submission_data JSONB,
    submission_notes TEXT,
    auto_score INTEGER,
    manual_score INTEGER,
    final_score INTEGER,
    score_breakdown JSONB,
    feedback TEXT,
    status submissionstatus DEFAULT 'SUBMITTED',
    payment_status paymentstatus DEFAULT 'PENDING',
    payment_transaction_id VARCHAR(255),
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    graded_at TIMESTAMPTZ,
    payment_released_at TIMESTAMPTZ
);
CREATE INDEX ix_tryout_submissions_tryout_id ON tryout_submissions (tryout_id);
CREATE INDEX ix_tryout_submissions_candidate_id ON tryout_submissions (candidate_id);
-- ============================================================
-- TABLE: talent_vault_items
-- ============================================================
CREATE TABLE talent_vault_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    candidate_id UUID NOT NULL,
    type vaultitemtype NOT NULL,
    title VARCHAR(255) NOT NULL,
    description VARCHAR(1000),
    file_url VARCHAR(500),
    file_type VARCHAR(50),
    file_size_bytes INTEGER,
    item_metadata JSONB,
    is_verified BOOLEAN NOT NULL DEFAULT false,
    verified_by VARCHAR(50),
    tryout_submission_id UUID,
    share_count INTEGER DEFAULT 0,
    view_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ
);
CREATE INDEX ix_talent_vault_items_candidate_id ON talent_vault_items (candidate_id);
-- ============================================================
-- TABLE: vault_share_tokens
-- ============================================================
CREATE TABLE vault_share_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vault_item_id UUID NOT NULL,
    token UUID NOT NULL UNIQUE DEFAULT uuid_generate_v4(),
    expires_at TIMESTAMPTZ,
    max_views INTEGER,
    view_count INTEGER DEFAULT 0,
    is_revoked BOOLEAN DEFAULT false,
    shared_with_email VARCHAR(255),
    shared_with_company VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    last_accessed_at TIMESTAMPTZ
);
CREATE INDEX ix_vault_share_tokens_token ON vault_share_tokens (token);
CREATE INDEX ix_vault_share_tokens_vault_item_id ON vault_share_tokens (vault_item_id);
-- ============================================================
-- TABLE: notifications
-- ============================================================
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    type notificationtype NOT NULL,
    title VARCHAR(255) NOT NULL,
    message VARCHAR(500) NOT NULL,
    link VARCHAR(500),
    notification_metadata JSONB,
    is_read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    read_at TIMESTAMPTZ
);
CREATE INDEX ix_notifications_user_id ON notifications (user_id);
-- ============================================================
-- TABLE: audit_logs
-- ============================================================
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID,
    action auditaction NOT NULL,
    resource_type VARCHAR(50),
    resource_id UUID,
    ip_address VARCHAR(45),
    user_agent VARCHAR(500),
    request_path VARCHAR(500),
    details JSONB,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ix_audit_logs_user_id ON audit_logs (user_id);
CREATE INDEX ix_audit_logs_action ON audit_logs (action);
CREATE INDEX ix_audit_logs_timestamp ON audit_logs (timestamp);
-- ============================================================
-- TABLE: company_profiles
-- ============================================================
CREATE TABLE company_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employer_id UUID NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    tagline VARCHAR(500),
    description TEXT,
    industry VARCHAR(100),
    company_size companysize,
    founded_year INTEGER,
    logo_url VARCHAR(500),
    cover_image_url VARCHAR(500),
    brand_color VARCHAR(7),
    website VARCHAR(500),
    email VARCHAR(255),
    phone VARCHAR(20),
    address VARCHAR(500),
    city VARCHAR(100),
    country VARCHAR(100),
    social_links JSONB DEFAULT '{}',
    benefits JSONB DEFAULT '[]',
    tech_stack JSONB DEFAULT '[]',
    culture_tags JSONB DEFAULT '[]',
    is_verified BOOLEAN DEFAULT false,
    verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ
);
CREATE UNIQUE INDEX ix_company_profiles_employer_id ON company_profiles (employer_id);
-- ============================================================
-- TABLE: interviews
-- ============================================================
CREATE TABLE interviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    application_id UUID NOT NULL,
    employer_id UUID NOT NULL,
    candidate_id UUID NOT NULL,
    interview_type interviewtype,
    title VARCHAR(255),
    scheduled_at TIMESTAMPTZ NOT NULL,
    duration_minutes INTEGER,
    meeting_url VARCHAR(500),
    meeting_platform VARCHAR(50),
    meeting_id VARCHAR(100),
    meeting_password VARCHAR(100),
    location_address VARCHAR(500),
    agenda TEXT,
    instructions_for_candidate TEXT,
    internal_notes TEXT,
    candidate_rating INTEGER,
    interviewer_notes TEXT,
    status interviewstatus DEFAULT 'SCHEDULED',
    reminder_sent BOOLEAN DEFAULT false,
    candidate_confirmed BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ
);
CREATE INDEX ix_interviews_application_id ON interviews (application_id);
CREATE INDEX ix_interviews_employer_id ON interviews (employer_id);
CREATE INDEX ix_interviews_candidate_id ON interviews (candidate_id);
-- ============================================================
-- Alembic version tracking (so Alembic knows migrations are done)
-- ============================================================
CREATE TABLE IF NOT EXISTS alembic_version (
    version_num VARCHAR(32) NOT NULL,
    CONSTRAINT alembic_version_pkc PRIMARY KEY (version_num)
);
-- Insert the latest migration version so Alembic won't re-run migrations
INSERT INTO alembic_version (version_num)
VALUES ('71bc124d75eb');
-- ============================================================
-- DONE! All 12 tables created.
-- Tables: users, user_profiles, refresh_tokens, jobs,
--         applications, tryouts, tryout_submissions,
--         talent_vault_items, vault_share_tokens,
--         notifications, audit_logs, company_profiles, interviews
-- ============================================================