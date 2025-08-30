-- Fix Admin Role Issue
-- 1. Add Admin to enum (if not exists)
-- 2. Update admin user to have Admin role
-- 3. Verify the fix

-- =============================================================================
-- STEP 1: Add Admin to user_role enum
-- =============================================================================

DO $$
BEGIN
    -- Check if Admin role already exists
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'Admin' 
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role')
    ) THEN
        ALTER TYPE user_role ADD VALUE 'Admin';
        RAISE NOTICE '✅ Added Admin to user_role enum';
    ELSE
        RAISE NOTICE 'ℹ️  Admin role already exists in user_role enum';
    END IF;
END $$;

-- =============================================================================
-- STEP 2: Update admin user role
-- =============================================================================

-- Update the admin user to have Admin role
UPDATE public.users 
SET role = 'Admin'
WHERE email = 'jlpt4you.owner@gmail.com';

-- =============================================================================
-- STEP 3: Verify the fix
-- =============================================================================

-- Check enum values
SELECT 
    'USER_ROLE_ENUM_VALUES' as check_type,
    unnest(enum_range(NULL::user_role)) as enum_value;

-- Check admin user
SELECT 
    'ADMIN_USER_CHECK' as check_type,
    id,
    email,
    name,
    role,
    created_at
FROM public.users 
WHERE email = 'jlpt4you.owner@gmail.com';

-- Summary
DO $$
DECLARE
    admin_user_count INTEGER;
    has_admin_role BOOLEAN;
BEGIN
    -- Check if admin user has Admin role
    SELECT COUNT(*) INTO admin_user_count 
    FROM public.users 
    WHERE email = 'jlpt4you.owner@gmail.com' AND role = 'Admin';
    
    -- Check if Admin role exists in enum
    SELECT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'Admin' 
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role')
    ) INTO has_admin_role;
    
    RAISE NOTICE '';
    RAISE NOTICE '🔍 ADMIN ROLE FIX VERIFICATION';
    RAISE NOTICE '=============================';
    RAISE NOTICE 'Admin role in enum: %', CASE WHEN has_admin_role THEN '✅ EXISTS' ELSE '❌ MISSING' END;
    RAISE NOTICE 'Admin user with Admin role: %', CASE WHEN admin_user_count > 0 THEN '✅ FIXED' ELSE '❌ NOT_FIXED' END;
    RAISE NOTICE '';
    
    IF has_admin_role AND admin_user_count > 0 THEN
        RAISE NOTICE '🎉 ADMIN ROLE FIX COMPLETED!';
        RAISE NOTICE 'Admin user can now access admin dashboard';
    ELSE
        RAISE NOTICE '❌ ADMIN ROLE FIX FAILED';
        RAISE NOTICE 'Please check the errors above';
    END IF;
    
END $$;
