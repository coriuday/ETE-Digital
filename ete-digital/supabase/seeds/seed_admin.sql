-- ============================================================
-- JOBROWS — Admin User Seed
-- File: supabase/seeds/seed_admin.sql
-- Date: 2026-04-20
--
-- PURPOSE: Create the platform admin account.
--
-- ⚠️  DO NOT run this directly in the SQL Editor with a real password.
--     Use the companion Python script instead:
--       python backend/scripts/seed_admin.py
--     That script hashes the password with Argon2 before inserting.
--
-- This file shows the STRUCTURE of the insert.
-- Replace <ARGON2_HASH_HERE> with the output of seed_admin.py.
-- ============================================================

DO $$
DECLARE
    v_admin_id UUID;
BEGIN
    -- Only create admin if none exists
    IF NOT EXISTS (SELECT 1 FROM users WHERE role = 'admin') THEN

        v_admin_id := uuid_generate_v4();

        INSERT INTO users (
            id,
            email,
            password_hash,
            role,
            is_verified,
            email_verified,
            is_active,
            created_at
        ) VALUES (
            v_admin_id,
            'admin@jobsrow.com',        -- ← Change before running
            '<ARGON2_HASH_HERE>',        -- ← Run seed_admin.py to generate
            'admin',
            true,
            true,
            true,
            now()
        );

        -- Create a minimal profile so admin panel doesn't break
        INSERT INTO user_profiles (
            user_id,
            full_name,
            created_at
        ) VALUES (
            v_admin_id,
            'Jobrows Admin',
            now()
        );

        RAISE NOTICE 'Admin user created: admin@jobsrow.com (id: %)', v_admin_id;
    ELSE
        RAISE NOTICE 'Admin user already exists — skipping.';
    END IF;
END $$;
