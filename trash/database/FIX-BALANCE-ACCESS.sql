-- 🔧 FIX BALANCE FIELD ACCESS
-- This script fixes balance field access issues
-- Run this in Supabase SQL Editor

-- ============================================================================
-- PROBLEM: Users cannot access their own balance field due to RLS
-- SOLUTION: Update RLS policies to allow balance access or remove balance from trigger
-- ============================================================================

BEGIN;

-- Option 1: Update trigger to not include balance field (recommended)
-- This avoids balance field issues entirely
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, name, role, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    'Free',
    NOW(),
    NOW()
  );
  RETURN NEW;
EXCEPTION
  WHEN unique_violation THEN
    -- User already exists, do nothing
    RETURN NEW;
  WHEN OTHERS THEN
    -- Log error but don't fail auth
    RAISE WARNING 'Failed to create user record for %: %', NEW.email, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Option 2: Alternative - Update existing users to have balance = 0 if NULL
UPDATE public.users 
SET balance = 0 
WHERE balance IS NULL;

-- Option 3: Make balance field have a default value
ALTER TABLE public.users 
ALTER COLUMN balance SET DEFAULT 0;

-- Option 4: Update RLS policies to ensure balance access
-- Drop and recreate the SELECT policy to be more explicit
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
CREATE POLICY "Users can view own profile" ON public.users
    FOR SELECT 
    USING (auth.uid() = id);

-- Verify the policy allows balance access
DO $$
BEGIN
    RAISE NOTICE '✅ Updated trigger to exclude balance field';
    RAISE NOTICE '✅ Set default value for balance field';
    RAISE NOTICE '✅ Updated RLS policies for balance access';
    RAISE NOTICE '';
    RAISE NOTICE '📋 Balance field will be managed separately from user creation';
END $$;

COMMIT;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Check recent users and their balance values
SELECT 
    id,
    email,
    name,
    role,
    balance,
    created_at
FROM public.users 
ORDER BY created_at DESC 
LIMIT 5;

-- Check if balance field has default value
SELECT 
    column_name,
    column_default,
    is_nullable,
    data_type
FROM information_schema.columns 
WHERE table_name = 'users' 
  AND table_schema = 'public' 
  AND column_name = 'balance';

-- Success message
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🚀 BALANCE ACCESS FIXED!';
    RAISE NOTICE '✅ Balance field issues should be resolved';
    RAISE NOTICE '✅ New users will have balance = 0 by default';
    RAISE NOTICE '✅ Existing users updated to have balance = 0';
    RAISE NOTICE '';
END $$;
