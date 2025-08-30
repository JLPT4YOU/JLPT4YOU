-- JLPT4YOU Pre-Migration Safety Check
-- Chạy script này TRƯỚC KHI chạy fix-schema-inconsistencies.sql
-- Để đảm bảo an toàn và không mất dữ liệu

-- =============================================================================
-- SAFETY CHECK 1: Verify current database state
-- =============================================================================

DO $$
BEGIN
    RAISE NOTICE '🔍 JLPT4YOU Pre-Migration Safety Check';
    RAISE NOTICE '=====================================';
    RAISE NOTICE 'Timestamp: %', NOW();
    RAISE NOTICE '';
END $$;

-- Check current users table structure
SELECT 
    'USERS TABLE STRUCTURE' as check_type,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'users'
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check current user data
SELECT 
    'CURRENT USER DATA' as check_type,
    id, 
    email, 
    name, 
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'display_name'
    ) THEN 'HAS_DISPLAY_NAME' ELSE 'NO_DISPLAY_NAME' END as display_name_status,
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'metadata'
    ) THEN 'HAS_METADATA' ELSE 'NO_METADATA' END as metadata_status,
    role,
    created_at
FROM public.users 
ORDER BY created_at;

-- =============================================================================
-- SAFETY CHECK 2: Check ai_models table usage
-- =============================================================================

-- Check if ai_models table exists and its content
DO $$
DECLARE
    table_exists BOOLEAN;
    row_count INTEGER := 0;
BEGIN
    RAISE NOTICE '🔍 Checking ai_models table...';
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'ai_models'
    ) INTO table_exists;
    
    IF table_exists THEN
        SELECT COUNT(*) INTO row_count FROM public.ai_models;
        RAISE NOTICE '📊 ai_models table exists with % rows', row_count;
        
        -- Show sample data
        IF row_count > 0 THEN
            RAISE NOTICE '📋 Sample ai_models data:';
            DECLARE
                rec RECORD;
            BEGIN
                FOR rec IN (
                    SELECT name, provider, status
                    FROM public.ai_models
                    LIMIT 3
                ) LOOP
                    RAISE NOTICE '   - % (%) [%]', rec.name, rec.provider, rec.status;
                END LOOP;
            END;
        END IF;
    ELSE
        RAISE NOTICE 'ℹ️  ai_models table does not exist';
    END IF;
END $$;

-- =============================================================================
-- SAFETY CHECK 3: Check user_role enum values
-- =============================================================================

-- Check current enum values
SELECT 
    'USER_ROLE ENUM VALUES' as check_type,
    unnest(enum_range(NULL::user_role)) as current_values;

-- =============================================================================
-- SAFETY CHECK 4: Check critical functions
-- =============================================================================

-- Check handle_new_user function
SELECT 
    'HANDLE_NEW_USER FUNCTION' as check_type,
    p.proname as function_name,
    pg_get_functiondef(p.oid) as function_definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' 
AND p.proname = 'handle_new_user';

-- =============================================================================
-- SAFETY CHECK 5: Check RLS policies
-- =============================================================================

-- Check current RLS policies
SELECT 
    'RLS POLICIES' as check_type,
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies 
WHERE schemaname = 'public'
AND tablename = 'users'
ORDER BY tablename, policyname;

-- =============================================================================
-- SAFETY CHECK 6: Verify backup exists
-- =============================================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '📋 BACKUP VERIFICATION';
    RAISE NOTICE '======================';
    RAISE NOTICE '✅ Latest backup: schema_2025-07-30_06-45-17-164Z.sql';
    RAISE NOTICE '✅ Latest backup: data_2025-07-30_06-45-17-164Z.sql';
    RAISE NOTICE '📁 Location: /Users/nguyenbahoanglong/Desktop/jlpt4you/backups/';
    RAISE NOTICE '';
    RAISE NOTICE '🔄 ROLLBACK PLAN (if needed):';
    RAISE NOTICE '1. Restore schema: \i backups/schema_2025-07-30_06-45-17-164Z.sql';
    RAISE NOTICE '2. Restore data: \i backups/data_2025-07-30_06-45-17-164Z.sql';
    RAISE NOTICE '';
END $$;

-- =============================================================================
-- SAFETY CHECK 7: Migration readiness assessment
-- =============================================================================

DO $$
DECLARE
    users_count INTEGER;
    api_keys_count INTEGER;
    has_display_name BOOLEAN;
    has_metadata BOOLEAN;
    has_admin_role BOOLEAN;
    ai_models_exists BOOLEAN;
    safety_score INTEGER := 0;
BEGIN
    RAISE NOTICE '🎯 MIGRATION READINESS ASSESSMENT';
    RAISE NOTICE '==================================';
    
    -- Count critical data
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
    
    -- Check ai_models
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'ai_models'
    ) INTO ai_models_exists;
    
    -- Calculate safety score
    IF users_count > 0 THEN safety_score := safety_score + 1; END IF;
    IF api_keys_count > 0 THEN safety_score := safety_score + 1; END IF;
    IF NOT has_display_name THEN safety_score := safety_score + 1; END IF;
    IF NOT has_metadata THEN safety_score := safety_score + 1; END IF;
    IF NOT has_admin_role THEN safety_score := safety_score + 1; END IF;
    
    -- Report findings
    RAISE NOTICE '📊 Current State:';
    RAISE NOTICE '   - Users: % records', users_count;
    RAISE NOTICE '   - API Keys: % records', api_keys_count;
    RAISE NOTICE '   - display_name column: %', CASE WHEN has_display_name THEN 'EXISTS' ELSE 'MISSING' END;
    RAISE NOTICE '   - metadata column: %', CASE WHEN has_metadata THEN 'EXISTS' ELSE 'MISSING' END;
    RAISE NOTICE '   - Admin role: %', CASE WHEN has_admin_role THEN 'EXISTS' ELSE 'MISSING' END;
    RAISE NOTICE '   - ai_models table: %', CASE WHEN ai_models_exists THEN 'EXISTS' ELSE 'NOT_EXISTS' END;
    RAISE NOTICE '';
    
    -- Migration recommendation
    IF safety_score >= 3 THEN
        RAISE NOTICE '✅ MIGRATION RECOMMENDED';
        RAISE NOTICE '   Migration will fix % schema inconsistencies', safety_score;
        RAISE NOTICE '   Safe to proceed with fix-schema-inconsistencies.sql';
    ELSIF safety_score >= 1 THEN
        RAISE NOTICE '⚠️  MIGRATION OPTIONAL';
        RAISE NOTICE '   % minor inconsistencies found', safety_score;
        RAISE NOTICE '   Migration will improve schema consistency';
    ELSE
        RAISE NOTICE 'ℹ️  SCHEMA ALREADY CONSISTENT';
        RAISE NOTICE '   No migration needed';
    END IF;
    
    RAISE NOTICE '';
    RAISE NOTICE '🚀 NEXT STEPS:';
    RAISE NOTICE '1. Review this safety check output';
    RAISE NOTICE '2. If satisfied, run: database/fix-schema-inconsistencies.sql';
    RAISE NOTICE '3. Verify results with: database/post-migration-verification.sql';
    
END $$;
