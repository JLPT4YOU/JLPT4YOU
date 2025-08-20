-- JLPT4YOU Database Migration - Clean Version
-- Safe to run multiple times (uses IF NOT EXISTS)
-- Generated: 2025-07-30

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
-- STEP 2: Add missing columns to users table
-- =============================================================================

-- Add display_name column
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS display_name TEXT;

-- Add metadata column
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- Add is_active column
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true NOT NULL;

-- Add comments for documentation
COMMENT ON COLUMN public.users.display_name IS 'Tên hiển thị có thể khác với name gốc';
COMMENT ON COLUMN public.users.metadata IS 'Additional user metadata in JSON format';
COMMENT ON COLUMN public.users.is_active IS 'Whether user account is active';

-- =============================================================================
-- STEP 3: Update existing data to match new schema
-- =============================================================================

-- Set display_name from name for existing users
UPDATE public.users 
SET display_name = name 
WHERE display_name IS NULL AND name IS NOT NULL;

-- Set default metadata for existing users
UPDATE public.users 
SET metadata = '{}'::jsonb 
WHERE metadata IS NULL;

-- Ensure all users are active by default
UPDATE public.users 
SET is_active = true 
WHERE is_active IS NULL;

-- =============================================================================
-- STEP 4: Fix handle_new_user function
-- =============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email, name, display_name, avatar_icon)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'full_name'),
        COALESCE(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'full_name'),
        NEW.raw_user_meta_data->>'avatar_icon'
    );

    -- Create initial progress record
    INSERT INTO public.user_progress (user_id)
    VALUES (NEW.id);

    RETURN NEW;
END;
$$ language 'plpgsql' SECURITY DEFINER;

-- =============================================================================
-- STEP 5: Remove unused ai_models table (if exists)
-- =============================================================================

DO $$
DECLARE
    table_exists BOOLEAN;
    row_count INTEGER := 0;
BEGIN
    -- Check if ai_models table exists
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'ai_models'
    ) INTO table_exists;
    
    IF table_exists THEN
        -- Get row count before dropping
        SELECT COUNT(*) INTO row_count FROM public.ai_models;
        
        -- Drop the table
        DROP TABLE public.ai_models CASCADE;
        RAISE NOTICE '✅ Dropped unused ai_models table (% rows removed)', row_count;
    ELSE
        RAISE NOTICE 'ℹ️  ai_models table does not exist';
    END IF;
END $$;

-- =============================================================================
-- STEP 6: Create missing indexes (if needed)
-- =============================================================================

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_users_active ON public.users(is_active);
CREATE INDEX IF NOT EXISTS idx_users_display_name ON public.users(display_name);

-- =============================================================================
-- STEP 7: Migration completion summary
-- =============================================================================

DO $$
DECLARE
    users_count INTEGER;
    api_keys_count INTEGER;
    has_display_name BOOLEAN;
    has_metadata BOOLEAN;
    has_admin_role BOOLEAN;
    ai_models_exists BOOLEAN;
BEGIN
    -- Count current data
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
    
    -- Report results
    RAISE NOTICE '';
    RAISE NOTICE '🎉 MIGRATION COMPLETED SUCCESSFULLY!';
    RAISE NOTICE '===================================';
    RAISE NOTICE 'Data preserved: % users, % API keys', users_count, api_keys_count;
    RAISE NOTICE 'display_name column: %', CASE WHEN has_display_name THEN '✅ ADDED' ELSE '❌ MISSING' END;
    RAISE NOTICE 'metadata column: %', CASE WHEN has_metadata THEN '✅ ADDED' ELSE '❌ MISSING' END;
    RAISE NOTICE 'Admin role: %', CASE WHEN has_admin_role THEN '✅ ADDED' ELSE '❌ MISSING' END;
    RAISE NOTICE 'ai_models cleanup: %', CASE WHEN NOT ai_models_exists THEN '✅ REMOVED' ELSE '⚠️ STILL_EXISTS' END;
    RAISE NOTICE '';
    RAISE NOTICE '🚀 Next Steps:';
    RAISE NOTICE '1. Test user settings page in application';
    RAISE NOTICE '2. Verify authentication flow works';
    RAISE NOTICE '3. Check admin functions';
    RAISE NOTICE '';
    
END $$;
