-- 🔧 FIX AUTHENTICATION ISSUES - JLPT4YOU
-- Run this script in Supabase SQL Editor to fix authentication problems
-- Date: 2025-08-06

-- =============================================
-- STEP 1: FIX RLS POLICIES FOR USER REGISTRATION
-- =============================================

-- Drop duplicate/conflicting policies
DROP POLICY IF EXISTS "users_select_policy" ON public.users;
DROP POLICY IF EXISTS "users_insert_policy" ON public.users;
DROP POLICY IF EXISTS "users_update_policy" ON public.users;
DROP POLICY IF EXISTS "users_select_own" ON public.users;
DROP POLICY IF EXISTS "users_update_own" ON public.users;
DROP POLICY IF EXISTS "users_insert_own" ON public.users;

-- Ensure RLS is enabled
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Create clean, non-duplicate policies
-- Users can view their own profile
CREATE POLICY "Users can view own profile" ON public.users
    FOR SELECT
    USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- 🔑 THE KEY FIX: Allow users to insert their own record
CREATE POLICY "Users can insert own profile" ON public.users
    FOR INSERT
    WITH CHECK (auth.uid() = id);

-- Service role bypass for admin operations
CREATE POLICY "Service role can manage all users" ON public.users
    FOR ALL
    USING ((auth.jwt() ->> 'role'::text) = 'service_role'::text);

-- Grant necessary permissions
GRANT SELECT, UPDATE, INSERT ON public.users TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- =============================================
-- STEP 2: CREATE TRIGGER FOR AUTO USER CREATION
-- =============================================

-- Create trigger on auth.users to auto-create public.users record
CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- =============================================
-- STEP 3: VERIFY SETUP
-- =============================================

-- Check policies are in place
DO $$
DECLARE
    policy_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies 
    WHERE tablename = 'users' AND schemaname = 'public';
    
    RAISE NOTICE '✅ Found % RLS policies on users table', policy_count;
    
    -- List all policies
    FOR policy_count IN 
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'users' AND schemaname = 'public'
    LOOP
        RAISE NOTICE '  - Policy exists';
    END LOOP;
END $$;

-- Check trigger exists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.triggers 
        WHERE trigger_name = 'on_auth_user_created'
    ) THEN
        RAISE NOTICE '✅ Trigger on_auth_user_created exists';
    ELSE
        RAISE NOTICE '❌ Trigger on_auth_user_created NOT found';
    END IF;
END $$;

-- Check function exists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_proc 
        WHERE proname = 'handle_new_user'
    ) THEN
        RAISE NOTICE '✅ Function handle_new_user exists';
    ELSE
        RAISE NOTICE '❌ Function handle_new_user NOT found';
    END IF;
END $$;

-- =============================================
-- STEP 4: TEST USER CREATION (OPTIONAL)
-- =============================================

-- Test query to verify RLS works
-- This should return empty result if no authenticated user
-- SELECT * FROM public.users WHERE id = auth.uid();

-- =============================================
-- SUCCESS MESSAGE
-- =============================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🎉 AUTHENTICATION FIXES APPLIED!';
    RAISE NOTICE '';
    RAISE NOTICE '✅ Fixed Issues:';
    RAISE NOTICE '   1. Cleaned up duplicate RLS policies';
    RAISE NOTICE '   2. Added INSERT policy for user registration';
    RAISE NOTICE '   3. Created trigger for auto user creation';
    RAISE NOTICE '   4. Granted proper permissions';
    RAISE NOTICE '';
    RAISE NOTICE '🧪 Next Steps:';
    RAISE NOTICE '   1. Test user registration from frontend';
    RAISE NOTICE '   2. Verify login flow works correctly';
    RAISE NOTICE '   3. Check user records are created automatically';
    RAISE NOTICE '';
END $$;
