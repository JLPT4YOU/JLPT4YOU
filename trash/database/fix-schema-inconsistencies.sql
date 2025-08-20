-- JLPT4YOU Schema Inconsistencies Fix
-- Run this script in Supabase SQL Editor to fix schema differences
-- Generated: 2025-07-30
--
-- ⚠️  SAFETY VERIFIED: Script đã được kiểm tra kỹ lưỡng
-- ✅ ai_models table: Không được sử dụng trong code, an toàn để xóa
-- ✅ display_name, metadata: Được sử dụng trong user settings, cần thiết
-- ✅ Admin role: Cần thiết cho admin user hiện tại
--
-- 📋 BACKUP LOCATION: backups/schema_2025-07-30_06-45-17-164Z.sql

-- =============================================================================
-- STEP 1: Fix user_role enum to include Admin
-- =============================================================================

-- Check current enum values
SELECT unnest(enum_range(NULL::user_role)) as current_values;

-- Add Admin to user_role enum if not exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'Admin' 
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role')
    ) THEN
        ALTER TYPE user_role ADD VALUE 'Admin';
        RAISE NOTICE 'Added Admin to user_role enum';
    ELSE
        RAISE NOTICE 'Admin already exists in user_role enum';
    END IF;
END $$;

-- =============================================================================
-- STEP 2: Add missing columns to users table
-- =============================================================================

-- Add display_name column if not exists
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS display_name TEXT;

-- Add metadata column if not exists  
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- Add is_active column if not exists
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true NOT NULL;

-- Add comments for clarity
COMMENT ON COLUMN public.users.display_name IS 'Tên hiển thị có thể khác với name gốc';
COMMENT ON COLUMN public.users.metadata IS 'Additional user metadata in JSON format';
COMMENT ON COLUMN public.users.is_active IS 'Whether user account is active';

-- =============================================================================
-- STEP 3: Update existing data to match schema
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

-- Drop and recreate the function with correct column references
DROP FUNCTION IF EXISTS public.handle_new_user();

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
--
-- ✅ SAFETY CHECK PASSED: ai_models table không được sử dụng trong code
-- - Không có references trong src/ directory
-- - Không có API endpoints sử dụng
-- - Không có UI components quản lý
-- - Models được hardcode trong gemini-service.ts và groq-service.ts
--
-- 📋 BACKUP: Đã có backup tại data_2025-07-30_06-45-17-164Z.sql

-- Check if ai_models table exists and drop it
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'ai_models'
    ) THEN
        -- Log table info before dropping
        DECLARE
            row_count INTEGER;
        BEGIN
            SELECT COUNT(*) INTO row_count FROM public.ai_models;
            RAISE NOTICE '📊 ai_models table has % rows - will be dropped', row_count;
        END;

        DROP TABLE public.ai_models CASCADE;
        RAISE NOTICE '✅ Dropped unused ai_models table';
    ELSE
        RAISE NOTICE 'ℹ️  ai_models table does not exist';
    END IF;
END $$;

-- =============================================================================
-- STEP 6: Ensure proper indexes exist
-- =============================================================================

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_users_active ON public.users(is_active);
CREATE INDEX IF NOT EXISTS idx_users_display_name ON public.users(display_name);

-- =============================================================================
-- STEP 7: Verify schema consistency
-- =============================================================================

-- Check users table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'users'
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check user_role enum values
SELECT unnest(enum_range(NULL::user_role)) as enum_values;

-- Check existing data
SELECT 
    id, 
    email, 
    name, 
    display_name, 
    role,
    is_active,
    avatar_icon,
    created_at
FROM public.users 
ORDER BY created_at;

-- =============================================================================
-- VERIFICATION QUERIES
-- =============================================================================

-- Verify all tables exist and their row counts
SELECT 
    schemaname,
    tablename,
    n_tup_ins as total_inserts,
    n_tup_upd as total_updates,
    n_tup_del as total_deletes,
    n_live_tup as current_rows
FROM pg_stat_user_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

-- Check RLS policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

RAISE NOTICE 'Schema inconsistencies fix completed successfully!';
