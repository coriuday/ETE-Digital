-- ============================================================
-- Create the first Admin user for ETE Digital
--
-- INSTRUCTIONS:
-- 1. Replace the values below with your real admin details
-- 2. Run this in: Supabase Dashboard → SQL Editor → New Query
-- 3. The admin can then log in at https://ete-digital.vercel.app/login
--
-- Password requirements: uppercase + lowercase + digit + special char
-- Example strong password: Admin@1234
-- ============================================================

-- Step 1: Insert the password hash
-- We use bcrypt. Generate the hash using Python:
--   python -c "from passlib.context import CryptContext; print(CryptContext(['bcrypt']).hash('YOUR_PASSWORD_HERE'))"
-- Or use an online bcrypt generator: https://bcrypt-generator.com (cost factor 12)

DO $$
DECLARE
    admin_id UUID;
    -- ⚠️ CHANGE THESE VALUES:
    admin_email     TEXT := 'admin@etedigital.com';
    admin_password_hash TEXT := '$2b$12$REPLACE_THIS_WITH_YOUR_BCRYPT_HASH';
    admin_full_name TEXT := 'ETE Admin';
BEGIN
    -- Insert admin user (pre-verified, active)
    INSERT INTO users (
        id,
        email,
        password_hash,
        role,
        is_verified,
        is_active,
        created_at
    ) VALUES (
        uuid_generate_v4(),
        admin_email,
        admin_password_hash,
        'ADMIN',
        true,   -- pre-verified, no email confirmation needed
        true,
        now()
    )
    RETURNING id INTO admin_id;

    -- Insert user profile
    INSERT INTO user_profiles (
        user_id,
        full_name,
        skills,
        social_links,
        preferences,
        created_at
    ) VALUES (
        admin_id,
        admin_full_name,
        '[]',
        '{}',
        '{}',
        now()
    );

    RAISE NOTICE 'Admin user created with ID: %', admin_id;
END $$;
