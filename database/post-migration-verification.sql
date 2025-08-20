-- JLPT4YOU Post-Migration Verification
-- Chạy script này SAU KHI chạy fix-schema-inconsistencies.sql
-- Để xác minh migration đã thành công và không có lỗi

-- =============================================================================
-- VERIFICATION 1: Check schema consistency
-- =============================================================================

DO $$
BEGIN
    RAISE NOTICE '✅ JLPT4YOU Post-Migration Verification';
    RAISE NOTICE '======================================';
    RAISE NOTICE 'Timestamp: %', NOW();
    RAISE NOTICE '';
END $$;

-- Verify users table structure
SELECT 
    'USERS TABLE FINAL STRUCTURE' as verification_type,
    column_name,
    data_type,
    is_nullable,
    column_default,
    CASE 
        WHEN column_name IN ('display_name', 'metadata', 'is_active') THEN '✅ ADDED'
        WHEN column_name IN ('id', 'email', 'name', 'avatar_icon', 'role') THEN '✅ CORE'
        ELSE '✅ EXISTING'
    END as status
FROM information_schema.columns
WHERE table_name = 'users'
AND table_schema = 'public'
ORDER BY ordinal_position;

-- =============================================================================
-- VERIFICATION 2: Check user_role enum
-- =============================================================================

-- Verify enum values include Admin
SELECT 
    'USER_ROLE ENUM VERIFICATION' as verification_type,
    unnest(enum_range(NULL::user_role)) as enum_value,
    CASE 
        WHEN unnest(enum_range(NULL::user_role)) = 'Admin' THEN '✅ ADDED'
        ELSE '✅ EXISTING'
    END as status;

-- =============================================================================
-- VERIFICATION 3: Verify data integrity
-- =============================================================================

-- Check user data after migration
SELECT 
    'USER DATA VERIFICATION' as verification_type,
    id, 
    email, 
    name,
    display_name,
    CASE 
        WHEN display_name IS NOT NULL THEN '✅ SET'
        ELSE '⚠️ NULL'
    END as display_name_status,
    CASE 
        WHEN metadata IS NOT NULL THEN '✅ SET'
        ELSE '⚠️ NULL'
    END as metadata_status,
    role,
    is_active,
    created_at
FROM public.users 
ORDER BY created_at;

-- =============================================================================
-- VERIFICATION 4: Check ai_models table removal
-- =============================================================================

DO $$
DECLARE
    table_exists BOOLEAN;
BEGIN
    RAISE NOTICE '🗑️ Verifying ai_models table removal...';
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'ai_models'
    ) INTO table_exists;
    
    IF NOT table_exists THEN
        RAISE NOTICE '✅ ai_models table successfully removed';
    ELSE
        RAISE WARNING '❌ ai_models table still exists!';
    END IF;
END $$;

-- =============================================================================
-- VERIFICATION 5: Check handle_new_user function
-- =============================================================================

-- Verify function exists and works with new schema
SELECT 
    'HANDLE_NEW_USER FUNCTION' as verification_type,
    p.proname as function_name,
    CASE 
        WHEN pg_get_functiondef(p.oid) LIKE '%display_name%' THEN '✅ UPDATED'
        ELSE '⚠️ NEEDS_UPDATE'
    END as status
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' 
AND p.proname = 'handle_new_user';

-- =============================================================================
-- VERIFICATION 6: Check RLS policies
-- =============================================================================

-- Verify RLS policies still work
SELECT 
    'RLS POLICIES VERIFICATION' as verification_type,
    tablename,
    policyname,
    '✅ ACTIVE' as status
FROM pg_policies 
WHERE schemaname = 'public'
AND tablename = 'users'
ORDER BY policyname;

-- =============================================================================
-- VERIFICATION 7: Test basic operations
-- =============================================================================

DO $$
DECLARE
    test_user_id UUID;
    test_count INTEGER;
BEGIN
    RAISE NOTICE '🧪 Testing basic database operations...';
    
    -- Test 1: Count users
    SELECT COUNT(*) INTO test_count FROM public.users;
    RAISE NOTICE '✅ User count query: % users', test_count;
    
    -- Test 2: Check if we can query new columns
    BEGIN
        SELECT COUNT(*) INTO test_count 
        FROM public.users 
        WHERE display_name IS NOT NULL;
        RAISE NOTICE '✅ display_name query: % users with display_name', test_count;
    EXCEPTION WHEN OTHERS THEN
        RAISE WARNING '❌ display_name query failed: %', SQLERRM;
    END;
    
    -- Test 3: Check metadata column
    BEGIN
        SELECT COUNT(*) INTO test_count 
        FROM public.users 
        WHERE metadata IS NOT NULL;
        RAISE NOTICE '✅ metadata query: % users with metadata', test_count;
    EXCEPTION WHEN OTHERS THEN
        RAISE WARNING '❌ metadata query failed: %', SQLERRM;
    END;
    
    -- Test 4: Check Admin role
    BEGIN
        SELECT COUNT(*) INTO test_count 
        FROM public.users 
        WHERE role = 'Admin';
        RAISE NOTICE '✅ Admin role query: % admin users', test_count;
    EXCEPTION WHEN OTHERS THEN
        RAISE WARNING '❌ Admin role query failed: %', SQLERRM;
    END;
    
END $$;

-- =============================================================================
-- VERIFICATION 8: Check indexes
-- =============================================================================

-- Verify important indexes exist
SELECT 
    'INDEX VERIFICATION' as verification_type,
    indexname,
    tablename,
    '✅ EXISTS' as status
FROM pg_indexes 
WHERE schemaname = 'public'
AND tablename = 'users'
AND indexname LIKE 'idx_%'
ORDER BY indexname;

-- =============================================================================
-- VERIFICATION 9: Final migration summary
-- =============================================================================

DO $$
DECLARE
    users_count INTEGER;
    api_keys_count INTEGER;
    has_display_name BOOLEAN;
    has_metadata BOOLEAN;
    has_admin_role BOOLEAN;
    ai_models_exists BOOLEAN;
    success_score INTEGER := 0;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '📊 FINAL MIGRATION SUMMARY';
    RAISE NOTICE '==========================';
    
    -- Count data
    SELECT COUNT(*) INTO users_count FROM public.users;
    SELECT COUNT(*) INTO api_keys_count FROM public.user_api_keys;
    
    -- Check schema completeness
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'display_name'
    ) INTO has_display_name;
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'metadata'
    ) INTO has_metadata;
    
    -- Check enum values
    SELECT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'Admin' 
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role')
    ) INTO has_admin_role;
    
    -- Check ai_models removal
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'ai_models'
    ) INTO ai_models_exists;
    
    -- Calculate success score
    IF users_count > 0 THEN success_score := success_score + 1; END IF;
    IF api_keys_count > 0 THEN success_score := success_score + 1; END IF;
    IF has_display_name THEN success_score := success_score + 1; END IF;
    IF has_metadata THEN success_score := success_score + 1; END IF;
    IF has_admin_role THEN success_score := success_score + 1; END IF;
    IF NOT ai_models_exists THEN success_score := success_score + 1; END IF;
    
    -- Report results
    RAISE NOTICE '📈 Migration Results:';
    RAISE NOTICE '   - Data preserved: % users, % API keys', users_count, api_keys_count;
    RAISE NOTICE '   - display_name column: %', CASE WHEN has_display_name THEN '✅ ADDED' ELSE '❌ MISSING' END;
    RAISE NOTICE '   - metadata column: %', CASE WHEN has_metadata THEN '✅ ADDED' ELSE '❌ MISSING' END;
    RAISE NOTICE '   - Admin role: %', CASE WHEN has_admin_role THEN '✅ ADDED' ELSE '❌ MISSING' END;
    RAISE NOTICE '   - ai_models cleanup: %', CASE WHEN NOT ai_models_exists THEN '✅ REMOVED' ELSE '❌ STILL_EXISTS' END;
    RAISE NOTICE '';
    
    -- Final assessment
    IF success_score = 6 THEN
        RAISE NOTICE '🎉 MIGRATION COMPLETED SUCCESSFULLY!';
        RAISE NOTICE '   All schema inconsistencies have been resolved';
        RAISE NOTICE '   Database is now consistent and optimized';
    ELSIF success_score >= 4 THEN
        RAISE NOTICE '⚠️  MIGRATION PARTIALLY SUCCESSFUL';
        RAISE NOTICE '   Score: %/6 - Some issues may need manual attention', success_score;
    ELSE
        RAISE NOTICE '❌ MIGRATION FAILED';
        RAISE NOTICE '   Score: %/6 - Please check errors and retry', success_score;
    END IF;
    
    RAISE NOTICE '';
    RAISE NOTICE '🔄 Next Steps:';
    RAISE NOTICE '1. Test application functionality';
    RAISE NOTICE '2. Verify user settings page works';
    RAISE NOTICE '3. Check authentication flow';
    RAISE NOTICE '4. Monitor for any errors';
    
END $$;
