-- JLPT4YOU Migration Verification
-- Run this after migration to verify everything is working

-- =============================================================================
-- 1. Check users table structure
-- =============================================================================

SELECT 
    'USERS_TABLE_STRUCTURE' as check_type,
    column_name,
    data_type,
    is_nullable,
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
-- 2. Check user data integrity
-- =============================================================================

SELECT 
    'USER_DATA_VERIFICATION' as check_type,
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
-- 3. Check user_role enum values
-- =============================================================================

SELECT 
    'USER_ROLE_ENUM' as check_type,
    unnest(enum_range(NULL::user_role)) as enum_value,
    CASE 
        WHEN unnest(enum_range(NULL::user_role)) = 'Admin' THEN '✅ ADDED'
        ELSE '✅ EXISTING'
    END as status;

-- =============================================================================
-- 4. Check ai_models table removal
-- =============================================================================

SELECT 
    'AI_MODELS_TABLE_CHECK' as check_type,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_schema = 'public' AND table_name = 'ai_models'
        ) THEN '⚠️ STILL_EXISTS'
        ELSE '✅ REMOVED'
    END as table_status;

-- =============================================================================
-- 5. Check indexes
-- =============================================================================

SELECT 
    'INDEX_VERIFICATION' as check_type,
    indexname,
    tablename,
    '✅ EXISTS' as status
FROM pg_indexes 
WHERE schemaname = 'public'
AND tablename = 'users'
AND indexname LIKE 'idx_%'
ORDER BY indexname;

-- =============================================================================
-- 6. Test basic queries
-- =============================================================================

DO $$
DECLARE
    users_count INTEGER;
    api_keys_count INTEGER;
    admin_count INTEGER;
    display_name_count INTEGER;
    metadata_count INTEGER;
BEGIN
    -- Test basic counts
    SELECT COUNT(*) INTO users_count FROM public.users;
    SELECT COUNT(*) INTO api_keys_count FROM public.user_api_keys;
    SELECT COUNT(*) INTO admin_count FROM public.users WHERE role = 'Admin';
    SELECT COUNT(*) INTO display_name_count FROM public.users WHERE display_name IS NOT NULL;
    SELECT COUNT(*) INTO metadata_count FROM public.users WHERE metadata IS NOT NULL;
    
    RAISE NOTICE '';
    RAISE NOTICE '🧪 BASIC QUERY TESTS';
    RAISE NOTICE '===================';
    RAISE NOTICE 'Total users: %', users_count;
    RAISE NOTICE 'Total API keys: %', api_keys_count;
    RAISE NOTICE 'Admin users: %', admin_count;
    RAISE NOTICE 'Users with display_name: %', display_name_count;
    RAISE NOTICE 'Users with metadata: %', metadata_count;
    RAISE NOTICE '';
    
    -- Verify data integrity
    IF users_count > 0 AND display_name_count = users_count AND metadata_count = users_count THEN
        RAISE NOTICE '✅ DATA INTEGRITY: PASSED';
    ELSE
        RAISE NOTICE '⚠️ DATA INTEGRITY: Some users missing display_name or metadata';
    END IF;
    
END $$;

-- =============================================================================
-- 7. Final verification summary
-- =============================================================================

DO $$
DECLARE
    has_display_name BOOLEAN;
    has_metadata BOOLEAN;
    has_is_active BOOLEAN;
    has_admin_role BOOLEAN;
    ai_models_exists BOOLEAN;
    success_score INTEGER := 0;
BEGIN
    -- Check schema completeness
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'display_name'
    ) INTO has_display_name;
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'metadata'
    ) INTO has_metadata;
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'is_active'
    ) INTO has_is_active;
    
    -- Check Admin role
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
    IF has_display_name THEN success_score := success_score + 1; END IF;
    IF has_metadata THEN success_score := success_score + 1; END IF;
    IF has_is_active THEN success_score := success_score + 1; END IF;
    IF has_admin_role THEN success_score := success_score + 1; END IF;
    IF NOT ai_models_exists THEN success_score := success_score + 1; END IF;
    
    RAISE NOTICE '';
    RAISE NOTICE '📊 FINAL VERIFICATION SUMMARY';
    RAISE NOTICE '=============================';
    RAISE NOTICE 'display_name column: %', CASE WHEN has_display_name THEN '✅ ADDED' ELSE '❌ MISSING' END;
    RAISE NOTICE 'metadata column: %', CASE WHEN has_metadata THEN '✅ ADDED' ELSE '❌ MISSING' END;
    RAISE NOTICE 'is_active column: %', CASE WHEN has_is_active THEN '✅ ADDED' ELSE '❌ MISSING' END;
    RAISE NOTICE 'Admin role: %', CASE WHEN has_admin_role THEN '✅ ADDED' ELSE '❌ MISSING' END;
    RAISE NOTICE 'ai_models cleanup: %', CASE WHEN NOT ai_models_exists THEN '✅ REMOVED' ELSE '⚠️ STILL_EXISTS' END;
    RAISE NOTICE '';
    RAISE NOTICE 'Success Score: %/5', success_score;
    
    -- Final assessment
    IF success_score = 5 THEN
        RAISE NOTICE '🎉 MIGRATION VERIFICATION: PASSED';
        RAISE NOTICE 'All schema changes applied successfully';
        RAISE NOTICE 'Database is ready for production use';
    ELSIF success_score >= 3 THEN
        RAISE NOTICE '⚠️ MIGRATION VERIFICATION: PARTIAL';
        RAISE NOTICE 'Most changes applied, some manual fixes may be needed';
    ELSE
        RAISE NOTICE '❌ MIGRATION VERIFICATION: FAILED';
        RAISE NOTICE 'Migration did not complete successfully';
        RAISE NOTICE 'Please check errors and consider rollback';
    END IF;
    
    RAISE NOTICE '';
    RAISE NOTICE '🚀 NEXT STEPS:';
    RAISE NOTICE '1. Test application user settings page';
    RAISE NOTICE '2. Verify authentication works normally';
    RAISE NOTICE '3. Check admin user functions';
    RAISE NOTICE '4. Monitor application logs for errors';
    
END $$;
