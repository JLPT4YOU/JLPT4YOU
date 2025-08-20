-- JLPT4YOU Simple Safety Check
-- Kiểm tra nhanh trạng thái database trước migration

-- =============================================================================
-- 1. Check current users table structure
-- =============================================================================

SELECT 
    'USERS_TABLE_STRUCTURE' as check_type,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'users'
AND table_schema = 'public'
ORDER BY ordinal_position;

-- =============================================================================
-- 2. Check current user data
-- =============================================================================

SELECT 
    'CURRENT_USER_DATA' as check_type,
    id, 
    email, 
    name, 
    role,
    created_at
FROM public.users 
ORDER BY created_at;

-- =============================================================================
-- 3. Check if ai_models table exists
-- =============================================================================

SELECT 
    'AI_MODELS_TABLE_CHECK' as check_type,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_schema = 'public' AND table_name = 'ai_models'
        ) THEN 'EXISTS'
        ELSE 'NOT_EXISTS'
    END as table_status;

-- =============================================================================
-- 4. Check user_role enum values
-- =============================================================================

SELECT 
    'USER_ROLE_ENUM_VALUES' as check_type,
    unnest(enum_range(NULL::user_role)) as enum_value;

-- =============================================================================
-- 5. Check missing columns
-- =============================================================================

SELECT 
    'MISSING_COLUMNS_CHECK' as check_type,
    'display_name' as column_name,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'users' AND column_name = 'display_name'
        ) THEN 'EXISTS'
        ELSE 'MISSING'
    END as status
UNION ALL
SELECT 
    'MISSING_COLUMNS_CHECK' as check_type,
    'metadata' as column_name,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'users' AND column_name = 'metadata'
        ) THEN 'EXISTS'
        ELSE 'MISSING'
    END as status
UNION ALL
SELECT 
    'MISSING_COLUMNS_CHECK' as check_type,
    'is_active' as column_name,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'users' AND column_name = 'is_active'
        ) THEN 'EXISTS'
        ELSE 'MISSING'
    END as status;

-- =============================================================================
-- 6. Check Admin role in enum
-- =============================================================================

SELECT 
    'ADMIN_ROLE_CHECK' as check_type,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_enum 
            WHERE enumlabel = 'Admin' 
            AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role')
        ) THEN 'EXISTS'
        ELSE 'MISSING'
    END as admin_role_status;

-- =============================================================================
-- 7. Summary
-- =============================================================================

DO $$
DECLARE
    users_count INTEGER;
    api_keys_count INTEGER;
    missing_columns INTEGER := 0;
    has_admin_role BOOLEAN;
    ai_models_exists BOOLEAN;
BEGIN
    -- Count data
    SELECT COUNT(*) INTO users_count FROM public.users;
    SELECT COUNT(*) INTO api_keys_count FROM public.user_api_keys;
    
    -- Check missing columns
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'display_name'
    ) THEN
        missing_columns := missing_columns + 1;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'metadata'
    ) THEN
        missing_columns := missing_columns + 1;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'is_active'
    ) THEN
        missing_columns := missing_columns + 1;
    END IF;
    
    -- Check Admin role
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
    
    -- Report summary
    RAISE NOTICE '';
    RAISE NOTICE '📊 SAFETY CHECK SUMMARY';
    RAISE NOTICE '======================';
    RAISE NOTICE 'Users: % records', users_count;
    RAISE NOTICE 'API Keys: % records', api_keys_count;
    RAISE NOTICE 'Missing columns: %', missing_columns;
    RAISE NOTICE 'Admin role: %', CASE WHEN has_admin_role THEN 'EXISTS' ELSE 'MISSING' END;
    RAISE NOTICE 'ai_models table: %', CASE WHEN ai_models_exists THEN 'EXISTS' ELSE 'NOT_EXISTS' END;
    RAISE NOTICE '';
    
    IF missing_columns > 0 OR NOT has_admin_role THEN
        RAISE NOTICE '✅ MIGRATION RECOMMENDED';
        RAISE NOTICE 'Will fix % schema inconsistencies', missing_columns + CASE WHEN NOT has_admin_role THEN 1 ELSE 0 END;
    ELSE
        RAISE NOTICE 'ℹ️  SCHEMA ALREADY CONSISTENT';
    END IF;
    
    IF ai_models_exists THEN
        RAISE NOTICE '🗑️  Will remove unused ai_models table';
    END IF;
    
    RAISE NOTICE '';
    RAISE NOTICE '🚀 NEXT: Run database/fix-schema-inconsistencies.sql';
    
END $$;
