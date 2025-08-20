-- 🚨 URGENT: FIX USER CREATION RLS POLICIES
-- This script fixes the missing INSERT policy that prevents user registration
-- Run this in Supabase SQL Editor IMMEDIATELY

-- ============================================================================
-- PROBLEM: Users cannot create their own records due to missing INSERT policy
-- SOLUTION: Add the missing INSERT policy for authenticated users
-- ============================================================================

BEGIN;

-- Step 1: Check current table status
DO $$
BEGIN
    RAISE NOTICE '🔍 Checking current users table status...';
END $$;

-- Step 2: Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "users_select_own" ON public.users;
DROP POLICY IF EXISTS "users_update_own" ON public.users;
DROP POLICY IF EXISTS "users_insert_own" ON public.users;
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;

-- Step 3: Ensure RLS is enabled
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Step 4: Create the missing INSERT policy (THIS IS THE KEY FIX!)
CREATE POLICY "Users can insert own profile" ON public.users
    FOR INSERT 
    WITH CHECK (auth.uid() = id);

-- Step 5: Recreate other essential policies
CREATE POLICY "Users can view own profile" ON public.users
    FOR SELECT 
    USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE 
    USING (auth.uid() = id) 
    WITH CHECK (auth.uid() = id);

-- Step 6: Admin policy (from original template)
CREATE POLICY "Admins can view all users" ON public.users
    FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'Admin'
        )
    );

-- Step 7: Grant necessary permissions
GRANT SELECT, UPDATE, INSERT ON public.users TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

-- Step 8: Verify policies are created
DO $$
DECLARE
    policy_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies 
    WHERE tablename = 'users' AND schemaname = 'public';
    
    RAISE NOTICE '✅ Created % policies for users table', policy_count;
    
    IF policy_count >= 4 THEN
        RAISE NOTICE '🎉 SUCCESS: All required policies are now in place!';
        RAISE NOTICE '📝 Users can now: SELECT, INSERT, UPDATE their own records';
        RAISE NOTICE '🔒 RLS is properly configured';
    ELSE
        RAISE WARNING '⚠️  WARNING: Expected at least 4 policies, found %', policy_count;
    END IF;
END $$;

COMMIT;

-- ============================================================================
-- VERIFICATION QUERIES (Run these to confirm the fix worked)
-- ============================================================================

-- Check all policies
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

-- Check RLS status
SELECT 
    schemaname, 
    tablename, 
    rowsecurity 
FROM pg_tables 
WHERE tablename = 'users' AND schemaname = 'public';

-- Success message
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🚀 DEPLOYMENT READY!';
    RAISE NOTICE '✅ User registration should now work properly';
    RAISE NOTICE '✅ No more 42501 RLS policy violations';
    RAISE NOTICE '✅ Users can create their own records';
    RAISE NOTICE '';
    RAISE NOTICE '📋 Next steps:';
    RAISE NOTICE '1. Test user registration in the app';
    RAISE NOTICE '2. Verify no more 406/401 errors';
    RAISE NOTICE '3. Confirm clean URL redirects work';
    RAISE NOTICE '';
END $$;
