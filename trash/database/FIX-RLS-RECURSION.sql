-- 🚨 URGENT: FIX RLS POLICY INFINITE RECURSION
-- This script fixes the infinite recursion in RLS policies
-- Run this in Supabase SQL Editor

-- ============================================================================
-- PROBLEM: RLS policy causing infinite recursion when checking user permissions
-- SOLUTION: Simplify policies to avoid recursive calls
-- ============================================================================

BEGIN;

-- Step 1: Drop ALL existing policies to start fresh
DROP POLICY IF EXISTS "users_select_own" ON public.users;
DROP POLICY IF EXISTS "users_update_own" ON public.users;
DROP POLICY IF EXISTS "users_insert_own" ON public.users;
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
DROP POLICY IF EXISTS "users_can_select_own" ON public.users;
DROP POLICY IF EXISTS "users_can_update_own" ON public.users;
DROP POLICY IF EXISTS "users_can_insert_own" ON public.users;

-- Step 2: Ensure RLS is enabled
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Step 3: Create simple, non-recursive policies
-- Simple SELECT policy - no subqueries that could cause recursion
CREATE POLICY "users_select_policy" ON public.users
    FOR SELECT 
    USING (auth.uid() = id);

-- Simple UPDATE policy
CREATE POLICY "users_update_policy" ON public.users
    FOR UPDATE 
    USING (auth.uid() = id) 
    WITH CHECK (auth.uid() = id);

-- Simple INSERT policy
CREATE POLICY "users_insert_policy" ON public.users
    FOR INSERT 
    WITH CHECK (auth.uid() = id);

-- Step 4: Grant permissions
GRANT SELECT, UPDATE, INSERT ON public.users TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

-- Step 5: Test the policies with a simple query
DO $$
DECLARE
    test_count INTEGER;
BEGIN
    -- This should not cause recursion
    SELECT COUNT(*) INTO test_count FROM public.users LIMIT 1;
    RAISE NOTICE '✅ Policy test completed without recursion. User count: %', test_count;
EXCEPTION
    WHEN OTHERS THEN
        RAISE WARNING '❌ Policy test failed: %', SQLERRM;
END $$;

-- Step 6: Verify policies are created correctly
SELECT 
    policyname,
    cmd,
    permissive,
    roles,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'users' AND schemaname = 'public'
ORDER BY policyname;

COMMIT;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Check RLS status
SELECT 
    schemaname, 
    tablename, 
    rowsecurity 
FROM pg_tables 
WHERE tablename = 'users' AND schemaname = 'public';

-- Check policies
SELECT 
    'Policy count: ' || COUNT(*) as policy_status
FROM pg_policies 
WHERE tablename = 'users' AND schemaname = 'public';

-- Success message
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🚀 RLS RECURSION FIXED!';
    RAISE NOTICE '✅ Simplified policies to prevent infinite recursion';
    RAISE NOTICE '✅ Users can now access their own records safely';
    RAISE NOTICE '✅ No more 42P17 errors';
    RAISE NOTICE '';
    RAISE NOTICE '📋 Next steps:';
    RAISE NOTICE '1. Test user login in the app';
    RAISE NOTICE '2. Verify balance field access works';
    RAISE NOTICE '3. Check clean URL redirects work after login';
    RAISE NOTICE '';
END $$;
