-- =========================================================================
-- Migration: 002_drop_otp_verifications.sql
-- Description: Drop legacy OTP tables & cleanup unverified rows.
-- Auth standard: Simple Name + Email + Password + Confirm Password.
-- =========================================================================

-- 1. Drop the otp_verifications table if it exists
DROP TABLE IF EXISTS otp_verifications CASCADE;

-- 2. Cleanup any incomplete or orphaned user rows from legacy OTP testing
DELETE FROM users 
WHERE email IS NULL 
   OR TRIM(email) = '' 
   OR password_hash IS NULL 
   OR TRIM(password_hash) = '';

-- 3. Ensure users table has a unique index on normalized (lowercase trimmed) email
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_normalized_email ON users (LOWER(TRIM(email)));

-- 4. Mark all existing users as active/verified
UPDATE users SET email_verified = true WHERE email_verified IS FALSE;
