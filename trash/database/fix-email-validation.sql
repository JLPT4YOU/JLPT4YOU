-- Fix Email Validation Issues for JLPT4YOU
-- Run this in Supabase SQL Editor

-- 1. Check current email domain restrictions
SELECT * FROM auth.config WHERE key LIKE '%email%';

-- 2. Update auth configuration to allow test emails in development
-- Note: Only for development/testing, remove in production
UPDATE auth.config 
SET value = jsonb_set(
  COALESCE(value, '{}'::jsonb),
  '{email_domain_whitelist}',
  '[]'::jsonb
)
WHERE key = 'auth.settings';

-- 3. Ensure email confirmation is properly configured
UPDATE auth.config
SET value = jsonb_set(
  COALESCE(value, '{}'::jsonb),
  '{disable_signup}',
  'false'::jsonb
)
WHERE key = 'auth.settings';

-- 4. Check if there are any email validation triggers
SELECT 
  n.nspname as schema_name,
  c.relname as table_name,
  t.tgname as trigger_name,
  p.proname as function_name
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_namespace n ON c.relnamespace = n.oid
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE t.tgname LIKE '%email%' OR p.proname LIKE '%email%';

-- 5. Create a test user with proper email (if needed for testing)
-- Replace with actual test email
/*
INSERT INTO auth.users (
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_user_meta_data
) VALUES (
  gen_random_uuid(),
  'test.user@jlpt4you.com',
  crypt('TestPassword123!', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '{"name": "Test User"}'::jsonb
) ON CONFLICT (email) DO NOTHING;
*/

-- 6. Verify email settings
SELECT 
  key,
  value
FROM auth.config
WHERE key IN (
  'auth.settings',
  'external_email_enabled',
  'mailer_autoconfirm',
  'sms_autoconfirm'
);

-- Report
SELECT 'Email validation configuration checked and updated' as status;
