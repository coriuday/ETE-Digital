-- ============================================================
-- JOBROWS — Comprehensive Row Level Security Policies
-- File: supabase/policies/rls_policies.sql
-- Date: 2026-04-20
--
-- SAFE TO RE-RUN: Uses DO $$ BEGIN ... END $$ guards.
-- Run AFTER migration 002 has been applied.
--
-- Architecture Note:
--   The backend (FastAPI on Render) connects via DATABASE_URL
--   with the service role / direct Postgres connection.
--   This BYPASSES RLS entirely — so these policies protect
--   against direct PostgREST (anon key) access only.
--
--   Policy naming convention:
--     "<Who> can <action> <scope>"
-- ============================================================

-- Helper: check if current JWT role is 'admin' via custom claim
-- The backend embeds role in the JWT. For Supabase auth, we use
-- the users table lookup pattern shown below.

-- ============================================================
-- TABLE: users
-- ============================================================

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename='users' AND policyname='Users view own record'
    ) THEN
        CREATE POLICY "Users view own record"
            ON users FOR SELECT
            USING (id = auth.uid());
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename='users' AND policyname='Users update own record'
    ) THEN
        CREATE POLICY "Users update own record"
            ON users FOR UPDATE
            USING (id = auth.uid())
            WITH CHECK (id = auth.uid());
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename='users' AND policyname='Admin full access to users'
    ) THEN
        CREATE POLICY "Admin full access to users"
            ON users FOR ALL
            USING (
                EXISTS (
                    SELECT 1 FROM users u
                    WHERE u.id = auth.uid() AND u.role = 'admin'
                )
            );
    END IF;
END $$;

-- ============================================================
-- TABLE: user_profiles
-- ============================================================

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename='user_profiles' AND policyname='Users view own profile'
    ) THEN
        CREATE POLICY "Users view own profile"
            ON user_profiles FOR SELECT
            USING (user_id = auth.uid());
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename='user_profiles' AND policyname='Users update own profile'
    ) THEN
        CREATE POLICY "Users update own profile"
            ON user_profiles FOR UPDATE
            USING (user_id = auth.uid())
            WITH CHECK (user_id = auth.uid());
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename='user_profiles' AND policyname='Users insert own profile'
    ) THEN
        CREATE POLICY "Users insert own profile"
            ON user_profiles FOR INSERT
            WITH CHECK (user_id = auth.uid());
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename='user_profiles' AND policyname='Admin full access to profiles'
    ) THEN
        CREATE POLICY "Admin full access to profiles"
            ON user_profiles FOR ALL
            USING (
                EXISTS (
                    SELECT 1 FROM users u
                    WHERE u.id = auth.uid() AND u.role = 'admin'
                )
            );
    END IF;
END $$;

-- ============================================================
-- TABLE: refresh_tokens
-- ============================================================

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename='refresh_tokens' AND policyname='Users manage own refresh tokens'
    ) THEN
        CREATE POLICY "Users manage own refresh tokens"
            ON refresh_tokens FOR ALL
            USING (user_id = auth.uid())
            WITH CHECK (user_id = auth.uid());
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename='refresh_tokens' AND policyname='Admin view all refresh tokens'
    ) THEN
        CREATE POLICY "Admin view all refresh tokens"
            ON refresh_tokens FOR SELECT
            USING (
                EXISTS (
                    SELECT 1 FROM users u
                    WHERE u.id = auth.uid() AND u.role = 'admin'
                )
            );
    END IF;
END $$;

-- ============================================================
-- TABLE: company_profiles
-- ============================================================

-- Public can view non-suspended companies
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename='company_profiles' AND policyname='Public view active companies'
    ) THEN
        CREATE POLICY "Public view active companies"
            ON company_profiles FOR SELECT
            USING (is_suspended = false OR is_suspended IS NULL);
    END IF;
END $$;

-- Employer manages their own company profile
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename='company_profiles' AND policyname='Employer manages own company'
    ) THEN
        CREATE POLICY "Employer manages own company"
            ON company_profiles FOR ALL
            USING (employer_id = auth.uid())
            WITH CHECK (employer_id = auth.uid());
    END IF;
END $$;

-- Admin full access (moderation)
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename='company_profiles' AND policyname='Admin full access to companies'
    ) THEN
        CREATE POLICY "Admin full access to companies"
            ON company_profiles FOR ALL
            USING (
                EXISTS (
                    SELECT 1 FROM users u
                    WHERE u.id = auth.uid() AND u.role = 'admin'
                )
            );
    END IF;
END $$;

-- ============================================================
-- TABLE: jobs
-- ============================================================

-- Note: "Public can view active jobs" already exists from migration 001.
-- We add additional policies below.

-- Employer manages their own jobs
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename='jobs' AND policyname='Employer manages own jobs'
    ) THEN
        CREATE POLICY "Employer manages own jobs"
            ON jobs FOR ALL
            USING (employer_id = auth.uid())
            WITH CHECK (employer_id = auth.uid());
    END IF;
END $$;

-- Admin full access
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename='jobs' AND policyname='Admin full access to jobs'
    ) THEN
        CREATE POLICY "Admin full access to jobs"
            ON jobs FOR ALL
            USING (
                EXISTS (
                    SELECT 1 FROM users u
                    WHERE u.id = auth.uid() AND u.role = 'admin'
                )
            );
    END IF;
END $$;

-- ============================================================
-- TABLE: applications
-- ============================================================

-- Candidate views/creates/withdraws own applications
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename='applications' AND policyname='Candidate manages own applications'
    ) THEN
        CREATE POLICY "Candidate manages own applications"
            ON applications FOR ALL
            USING (candidate_id = auth.uid())
            WITH CHECK (candidate_id = auth.uid());
    END IF;
END $$;

-- Employer views applications for their jobs + can update status/notes
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename='applications' AND policyname='Employer views applications for own jobs'
    ) THEN
        CREATE POLICY "Employer views applications for own jobs"
            ON applications FOR SELECT
            USING (
                EXISTS (
                    SELECT 1 FROM jobs j
                    WHERE j.id = applications.job_id
                      AND j.employer_id = auth.uid()
                )
            );
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename='applications' AND policyname='Employer updates application status'
    ) THEN
        CREATE POLICY "Employer updates application status"
            ON applications FOR UPDATE
            USING (
                EXISTS (
                    SELECT 1 FROM jobs j
                    WHERE j.id = applications.job_id
                      AND j.employer_id = auth.uid()
                )
            );
    END IF;
END $$;

-- Admin full access
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename='applications' AND policyname='Admin full access to applications'
    ) THEN
        CREATE POLICY "Admin full access to applications"
            ON applications FOR ALL
            USING (
                EXISTS (
                    SELECT 1 FROM users u
                    WHERE u.id = auth.uid() AND u.role = 'admin'
                )
            );
    END IF;
END $$;

-- ============================================================
-- TABLE: tryouts
-- ============================================================

-- Public view active tryouts (linked to active jobs)
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename='tryouts' AND policyname='Public view active tryouts'
    ) THEN
        CREATE POLICY "Public view active tryouts"
            ON tryouts FOR SELECT
            USING (status = 'active');
    END IF;
END $$;

-- Employer manages tryouts for own jobs
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename='tryouts' AND policyname='Employer manages own tryouts'
    ) THEN
        CREATE POLICY "Employer manages own tryouts"
            ON tryouts FOR ALL
            USING (
                EXISTS (
                    SELECT 1 FROM jobs j
                    WHERE j.id = tryouts.job_id
                      AND j.employer_id = auth.uid()
                )
            );
    END IF;
END $$;

-- Admin full access
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename='tryouts' AND policyname='Admin full access to tryouts'
    ) THEN
        CREATE POLICY "Admin full access to tryouts"
            ON tryouts FOR ALL
            USING (
                EXISTS (
                    SELECT 1 FROM users u
                    WHERE u.id = auth.uid() AND u.role = 'admin'
                )
            );
    END IF;
END $$;

-- ============================================================
-- TABLE: tryout_submissions
-- ============================================================

-- Candidate manages own submissions
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename='tryout_submissions' AND policyname='Candidate manages own submissions'
    ) THEN
        CREATE POLICY "Candidate manages own submissions"
            ON tryout_submissions FOR ALL
            USING (candidate_id = auth.uid())
            WITH CHECK (candidate_id = auth.uid());
    END IF;
END $$;

-- Employer views/grades submissions for own tryouts
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename='tryout_submissions' AND policyname='Employer grades submissions for own tryouts'
    ) THEN
        CREATE POLICY "Employer grades submissions for own tryouts"
            ON tryout_submissions FOR ALL
            USING (
                EXISTS (
                    SELECT 1 FROM tryouts t
                    JOIN jobs j ON j.id = t.job_id
                    WHERE t.id = tryout_submissions.tryout_id
                      AND j.employer_id = auth.uid()
                )
            );
    END IF;
END $$;

-- Admin full access
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename='tryout_submissions' AND policyname='Admin full access to submissions'
    ) THEN
        CREATE POLICY "Admin full access to submissions"
            ON tryout_submissions FOR ALL
            USING (
                EXISTS (
                    SELECT 1 FROM users u
                    WHERE u.id = auth.uid() AND u.role = 'admin'
                )
            );
    END IF;
END $$;

-- ============================================================
-- TABLE: talent_vault_items
-- ============================================================

-- Candidate manages own vault
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename='talent_vault_items' AND policyname='Candidate manages own vault'
    ) THEN
        CREATE POLICY "Candidate manages own vault"
            ON talent_vault_items FOR ALL
            USING (candidate_id = auth.uid())
            WITH CHECK (candidate_id = auth.uid());
    END IF;
END $$;

-- Admin full access
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename='talent_vault_items' AND policyname='Admin full access to vault'
    ) THEN
        CREATE POLICY "Admin full access to vault"
            ON talent_vault_items FOR ALL
            USING (
                EXISTS (
                    SELECT 1 FROM users u
                    WHERE u.id = auth.uid() AND u.role = 'admin'
                )
            );
    END IF;
END $$;

-- ============================================================
-- TABLE: vault_share_tokens
-- ============================================================

-- Public can read share tokens (for shared vault links)
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename='vault_share_tokens' AND policyname='Public view non-revoked share tokens'
    ) THEN
        CREATE POLICY "Public view non-revoked share tokens"
            ON vault_share_tokens FOR SELECT
            USING (is_revoked = false);
    END IF;
END $$;

-- Candidate manages their own share tokens (via vault item ownership)
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename='vault_share_tokens' AND policyname='Candidate manages own share tokens'
    ) THEN
        CREATE POLICY "Candidate manages own share tokens"
            ON vault_share_tokens FOR ALL
            USING (
                EXISTS (
                    SELECT 1 FROM talent_vault_items v
                    WHERE v.id = vault_share_tokens.vault_item_id
                      AND v.candidate_id = auth.uid()
                )
            );
    END IF;
END $$;

-- ============================================================
-- TABLE: notifications
-- ============================================================

-- Users manage their own notifications
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename='notifications' AND policyname='Users manage own notifications'
    ) THEN
        CREATE POLICY "Users manage own notifications"
            ON notifications FOR ALL
            USING (user_id = auth.uid())
            WITH CHECK (user_id = auth.uid());
    END IF;
END $$;

-- Admin view all notifications
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename='notifications' AND policyname='Admin view all notifications'
    ) THEN
        CREATE POLICY "Admin view all notifications"
            ON notifications FOR SELECT
            USING (
                EXISTS (
                    SELECT 1 FROM users u
                    WHERE u.id = auth.uid() AND u.role = 'admin'
                )
            );
    END IF;
END $$;

-- ============================================================
-- TABLE: audit_logs
-- ============================================================

-- Admin-only view of audit logs (security critical)
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename='audit_logs' AND policyname='Admin view audit logs'
    ) THEN
        CREATE POLICY "Admin view audit logs"
            ON audit_logs FOR SELECT
            USING (
                EXISTS (
                    SELECT 1 FROM users u
                    WHERE u.id = auth.uid() AND u.role = 'admin'
                )
            );
    END IF;
END $$;

-- System inserts (service role bypasses RLS — this is fine)
-- No INSERT policy needed here; backend uses service role for audit writes.

-- ============================================================
-- TABLE: interviews
-- ============================================================

-- Candidate views their own interviews
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename='interviews' AND policyname='Candidate views own interviews'
    ) THEN
        CREATE POLICY "Candidate views own interviews"
            ON interviews FOR SELECT
            USING (candidate_id = auth.uid());
    END IF;
END $$;

-- Employer manages interviews for their applications
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename='interviews' AND policyname='Employer manages own interviews'
    ) THEN
        CREATE POLICY "Employer manages own interviews"
            ON interviews FOR ALL
            USING (employer_id = auth.uid())
            WITH CHECK (employer_id = auth.uid());
    END IF;
END $$;

-- Admin full access
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename='interviews' AND policyname='Admin full access to interviews'
    ) THEN
        CREATE POLICY "Admin full access to interviews"
            ON interviews FOR ALL
            USING (
                EXISTS (
                    SELECT 1 FROM users u
                    WHERE u.id = auth.uid() AND u.role = 'admin'
                )
            );
    END IF;
END $$;

-- ============================================================
-- DONE — 30+ RLS policies created
-- Tables covered: users, user_profiles, refresh_tokens,
--   company_profiles, jobs, applications, tryouts,
--   tryout_submissions, talent_vault_items, vault_share_tokens,
--   notifications, audit_logs, interviews
-- ============================================================
