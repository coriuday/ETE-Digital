-- ============================================================
-- JOBROWS — Emergency Security Response Procedures
-- File: supabase/security/emergency_response.sql
-- Date: 2026-04-20
--
-- PURPOSE: One canonical file for security incident response.
-- Keep this file in the Supabase SQL Editor as "02_EMERGENCY_RESPONSE"
--
-- CONTENTS:
--   1. Lockdown Mode (disable all logins)
--   2. IP Blocking (manual + query)
--   3. Kill active connections from an IP
--   4. Purge failed login attempts
--   5. Audit log query shortcuts
--   6. SQL Injection detection query
--   7. Rate limit check query
-- ============================================================

-- ============================================================
-- 1. LOCKDOWN MODE
-- Use when: under active attack, detected breach, or emergency
-- Effect: Sets all non-admin users to inactive (cannot login)
-- Undo: Run the UNLOCK block below
-- ============================================================

-- LOCK (run this in emergency):
/*
UPDATE users
SET is_active = false
WHERE role != 'admin';
RAISE NOTICE 'LOCKDOWN ENGAGED: All non-admin users deactivated';
*/

-- UNLOCK (run after incident is resolved):
/*
UPDATE users
SET is_active = true
WHERE role != 'admin';
RAISE NOTICE 'LOCKDOWN LIFTED: Non-admin users reactivated';
*/

-- ============================================================
-- 2. MANUAL IP BLOCKING
-- Block a specific IP address permanently
-- ============================================================

-- Block an IP (replace with actual IP):
/*
INSERT INTO blocked_ips (ip_address, reason, auto_blocked)
VALUES ('1.2.3.4', 'Manual block: suspected DDoS', false)
ON CONFLICT (ip_address) DO UPDATE
    SET is_active = true,
        reason = EXCLUDED.reason,
        blocked_at = now(),
        expires_at = NULL;
*/

-- Unblock an IP:
/*
UPDATE blocked_ips
SET is_active = false
WHERE ip_address = '1.2.3.4';
*/

-- View all active blocks:
/*
SELECT ip_address, reason, auto_blocked, blocked_at, expires_at
FROM blocked_ips
WHERE is_active = true
ORDER BY blocked_at DESC;
*/

-- ============================================================
-- 3. VIEW RECENT FAILED LOGINS (Brute Force Detection)
-- ============================================================

/*
-- IPs with >10 failed attempts in last 1 hour:
SELECT
    ip_address,
    COUNT(*) AS attempts,
    MIN(attempted_at) AS first_attempt,
    MAX(attempted_at) AS last_attempt
FROM failed_login_attempts
WHERE attempted_at > now() - INTERVAL '1 hour'
GROUP BY ip_address
HAVING COUNT(*) > 10
ORDER BY attempts DESC;
*/

/*
-- Auto-block IPs with >20 failed attempts in last hour:
INSERT INTO blocked_ips (ip_address, reason, auto_blocked, expires_at)
SELECT
    ip_address,
    FORMAT('Auto-blocked: %s failed logins in 1 hour', COUNT(*)),
    true,
    now() + INTERVAL '24 hours'    -- Auto-unblock after 24h
FROM failed_login_attempts
WHERE attempted_at > now() - INTERVAL '1 hour'
GROUP BY ip_address
HAVING COUNT(*) > 20
ON CONFLICT (ip_address) DO UPDATE
    SET is_active = true,
        blocked_at = now(),
        expires_at = EXCLUDED.expires_at,
        auto_blocked = true;
*/

-- ============================================================
-- 4. PURGE OLD FAILED LOGIN DATA (run daily)
-- ============================================================

/*
DELETE FROM failed_login_attempts
WHERE attempted_at < now() - INTERVAL '24 hours';
*/

-- ============================================================
-- 5. AUDIT LOG SHORTCUTS
-- ============================================================

/*
-- Recent admin actions:
SELECT
    al.timestamp,
    u.email AS actor,
    al.action,
    al.resource_type,
    al.resource_id,
    al.ip_address,
    al.details
FROM audit_logs al
LEFT JOIN users u ON u.id = al.user_id
WHERE al.action = 'admin_action'
ORDER BY al.timestamp DESC
LIMIT 100;
*/

/*
-- Recent login failures:
SELECT
    al.timestamp,
    u.email AS target,
    al.ip_address,
    al.details
FROM audit_logs al
LEFT JOIN users u ON u.id = al.user_id
WHERE al.action = 'login_failure'
  AND al.timestamp > now() - INTERVAL '24 hours'
ORDER BY al.timestamp DESC;
*/

/*
-- GDPR: All data exports by a user:
SELECT timestamp, action, details
FROM audit_logs
WHERE user_id = '<user-uuid-here>'
  AND action = 'data_export'
ORDER BY timestamp DESC;
*/

-- ============================================================
-- 6. SQL INJECTION DETECTION
-- (Checks pg_stat_activity for suspicious queries — run as superuser)
-- ============================================================

/*
SELECT
    pid,
    usename,
    application_name,
    client_addr,
    state,
    LEFT(query, 200) AS query_preview,
    query_start
FROM pg_stat_activity
WHERE query ILIKE '%DROP%'
   OR query ILIKE '%DELETE FROM%'
   OR query ILIKE '%TRUNCATE%'
   OR query ILIKE '%; INSERT%'
   OR query ILIKE '%UNION SELECT%'
   OR query ILIKE '%OR 1=1%'
ORDER BY query_start DESC;
*/

-- ============================================================
-- 7. EXPIRE UNBLOCKED IPs (maintenance)
-- Auto-expire temporary blocks that have passed their expiry date
-- ============================================================

/*
UPDATE blocked_ips
SET is_active = false
WHERE expires_at IS NOT NULL
  AND expires_at < now()
  AND is_active = true;
*/

-- ============================================================
-- 8. SUSPICIOUS ACCOUNT ACTIVITY
-- Users with abnormally many applications in a short time (bots)
-- ============================================================

/*
SELECT
    u.email,
    u.id AS candidate_id,
    COUNT(a.id) AS apps_last_hour,
    u.created_at AS registered
FROM applications a
JOIN users u ON u.id = a.candidate_id
WHERE a.created_at > now() - INTERVAL '1 hour'
GROUP BY u.id, u.email, u.created_at
HAVING COUNT(a.id) > 30
ORDER BY apps_last_hour DESC;
*/

-- ============================================================
-- END OF EMERGENCY RESPONSE FILE
-- Keep this file as "02_EMERGENCY_RESPONSE" in the SQL Editor.
-- Never delete it — it's your incident response toolkit.
-- ============================================================
