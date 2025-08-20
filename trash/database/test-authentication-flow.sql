-- 🧪 TEST AUTHENTICATION FLOW - JLPT4YOU
-- Run this script to test authentication setup and RLS policies
-- Date: 2025-08-06

-- =============================================
-- TEST 1: CHECK RLS POLICIES
-- =============================================

DO $$
DECLARE
    policy_record RECORD;
    policy_count INTEGER := 0;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🧪 TEST 1: CHECKING RLS POLICIES';
    RAISE NOTICE '=====================================';
    
    -- Check if RLS is enabled
    IF EXISTS (
        SELECT 1 FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename = 'users'
        AND rowsecurity = true
    ) THEN
        RAISE NOTICE '✅ RLS is enabled on users table';
    ELSE
        RAISE NOTICE '❌ RLS is NOT enabled on users table';
    END IF;
    
    -- List all policies
    FOR policy_record IN 
        SELECT policyname, cmd, permissive, roles
        FROM pg_policies 
        WHERE tablename = 'users' AND schemaname = 'public'
        ORDER BY policyname
    LOOP
        policy_count := policy_count + 1;
        RAISE NOTICE '  📋 Policy: % (% for %)', 
            policy_record.policyname, 
            policy_record.cmd, 
            policy_record.roles;
    END LOOP;
    
    RAISE NOTICE '📊 Total policies found: %', policy_count;
    
    -- Check for required policies
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'users' AND policyname = 'Users can insert own profile') THEN
        RAISE NOTICE '✅ INSERT policy exists';
    ELSE
        RAISE NOTICE '❌ INSERT policy missing - users cannot register!';
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'users' AND policyname = 'Users can view own profile') THEN
        RAISE NOTICE '✅ SELECT policy exists';
    ELSE
        RAISE NOTICE '❌ SELECT policy missing';
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'users' AND policyname = 'Users can update own profile') THEN
        RAISE NOTICE '✅ UPDATE policy exists';
    ELSE
        RAISE NOTICE '❌ UPDATE policy missing';
    END IF;
END $$;

-- =============================================
-- TEST 2: CHECK FUNCTIONS AND TRIGGERS
-- =============================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🧪 TEST 2: CHECKING FUNCTIONS AND TRIGGERS';
    RAISE NOTICE '==========================================';
    
    -- Check handle_new_user function
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'handle_new_user') THEN
        RAISE NOTICE '✅ Function handle_new_user exists';
    ELSE
        RAISE NOTICE '❌ Function handle_new_user missing';
    END IF;
    
    -- Check encrypt/decrypt functions
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'encrypt_api_key') THEN
        RAISE NOTICE '✅ Function encrypt_api_key exists';
    ELSE
        RAISE NOTICE '❌ Function encrypt_api_key missing';
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'decrypt_api_key') THEN
        RAISE NOTICE '✅ Function decrypt_api_key exists';
    ELSE
        RAISE NOTICE '❌ Function decrypt_api_key missing';
    END IF;
    
    -- Check trigger on auth.users (may not exist due to permissions)
    IF EXISTS (
        SELECT 1 FROM information_schema.triggers 
        WHERE trigger_name = 'on_auth_user_created'
    ) THEN
        RAISE NOTICE '✅ Trigger on_auth_user_created exists';
    ELSE
        RAISE NOTICE '⚠️  Trigger on_auth_user_created missing (expected - using API fallback)';
    END IF;
END $$;

-- =============================================
-- TEST 3: CHECK PERMISSIONS
-- =============================================

DO $$
DECLARE
    has_select BOOLEAN := FALSE;
    has_insert BOOLEAN := FALSE;
    has_update BOOLEAN := FALSE;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🧪 TEST 3: CHECKING PERMISSIONS';
    RAISE NOTICE '===============================';
    
    -- Check table permissions for authenticated role
    SELECT 
        CASE WHEN privilege_type = 'SELECT' THEN TRUE ELSE FALSE END,
        CASE WHEN privilege_type = 'INSERT' THEN TRUE ELSE FALSE END,
        CASE WHEN privilege_type = 'UPDATE' THEN TRUE ELSE FALSE END
    INTO has_select, has_insert, has_update
    FROM information_schema.role_table_grants 
    WHERE table_schema = 'public' 
    AND table_name = 'users' 
    AND grantee = 'authenticated'
    AND privilege_type IN ('SELECT', 'INSERT', 'UPDATE');
    
    IF has_select THEN
        RAISE NOTICE '✅ authenticated role has SELECT permission';
    ELSE
        RAISE NOTICE '❌ authenticated role missing SELECT permission';
    END IF;
    
    IF has_insert THEN
        RAISE NOTICE '✅ authenticated role has INSERT permission';
    ELSE
        RAISE NOTICE '❌ authenticated role missing INSERT permission';
    END IF;
    
    IF has_update THEN
        RAISE NOTICE '✅ authenticated role has UPDATE permission';
    ELSE
        RAISE NOTICE '❌ authenticated role missing UPDATE permission';
    END IF;
END $$;

-- =============================================
-- TEST 4: CHECK TABLE STRUCTURE
-- =============================================

DO $$
DECLARE
    column_record RECORD;
    column_count INTEGER := 0;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🧪 TEST 4: CHECKING TABLE STRUCTURE';
    RAISE NOTICE '===================================';
    
    -- Check users table structure
    FOR column_record IN 
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'users'
        ORDER BY ordinal_position
    LOOP
        column_count := column_count + 1;
        RAISE NOTICE '  📋 Column: % (% - %)', 
            column_record.column_name, 
            column_record.data_type,
            CASE WHEN column_record.is_nullable = 'YES' THEN 'nullable' ELSE 'not null' END;
    END LOOP;
    
    RAISE NOTICE '📊 Total columns: %', column_count;
    
    -- Check for required columns
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'balance') THEN
        RAISE NOTICE '✅ balance column exists';
    ELSE
        RAISE NOTICE '❌ balance column missing';
    END IF;
END $$;

-- =============================================
-- TEST 5: SIMULATE USER OPERATIONS
-- =============================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🧪 TEST 5: SIMULATING USER OPERATIONS';
    RAISE NOTICE '=====================================';
    
    -- Test if we can query users table (should return empty for anonymous)
    BEGIN
        PERFORM COUNT(*) FROM public.users;
        RAISE NOTICE '✅ Can query users table';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '❌ Cannot query users table: %', SQLERRM;
    END;
    
    -- Test if we can query with auth.uid() (should work but return null)
    BEGIN
        PERFORM COUNT(*) FROM public.users WHERE id = auth.uid();
        RAISE NOTICE '✅ Can query with auth.uid()';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '❌ Cannot query with auth.uid(): %', SQLERRM;
    END;
END $$;

-- =============================================
-- FINAL SUMMARY
-- =============================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🎯 AUTHENTICATION TEST SUMMARY';
    RAISE NOTICE '==============================';
    RAISE NOTICE '';
    RAISE NOTICE '✅ What should work:';
    RAISE NOTICE '   - User registration via API routes';
    RAISE NOTICE '   - User login and session management';
    RAISE NOTICE '   - RLS policies protecting user data';
    RAISE NOTICE '   - API key encryption/decryption';
    RAISE NOTICE '';
    RAISE NOTICE '⚠️  Known limitations:';
    RAISE NOTICE '   - No trigger on auth.users (using API fallback)';
    RAISE NOTICE '   - Manual user record creation required';
    RAISE NOTICE '';
    RAISE NOTICE '🧪 Next steps:';
    RAISE NOTICE '   1. Test registration from frontend';
    RAISE NOTICE '   2. Test login flow';
    RAISE NOTICE '   3. Verify user records are created';
    RAISE NOTICE '   4. Test RLS policies with real users';
    RAISE NOTICE '';
END $$;
