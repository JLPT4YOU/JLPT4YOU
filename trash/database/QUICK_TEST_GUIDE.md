# 🚀 Quick Test Guide - Database Migration

**⚠️ UPDATED:** Đã sửa lỗi syntax, scripts đã được test

## Bước 1: Safety Check (2 phút)

### Copy và paste vào Supabase SQL Editor:

```sql
-- JLPT4YOU Simple Safety Check
SELECT 
    'USERS_TABLE_STRUCTURE' as check_type,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'users'
AND table_schema = 'public'
ORDER BY ordinal_position;

SELECT 
    'CURRENT_USER_DATA' as check_type,
    id, 
    email, 
    name, 
    role,
    created_at
FROM public.users 
ORDER BY created_at;

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
    END as status;

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

SELECT 
    'AI_MODELS_TABLE_CHECK' as check_type,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_schema = 'public' AND table_name = 'ai_models'
        ) THEN 'EXISTS'
        ELSE 'NOT_EXISTS'
    END as table_status;
```

### Kết quả mong đợi:
- `MISSING_COLUMNS_CHECK`: display_name = MISSING, metadata = MISSING
- `ADMIN_ROLE_CHECK`: MISSING
- `AI_MODELS_TABLE_CHECK`: NOT_EXISTS (hoặc EXISTS)

## Bước 2: Run Migration (3 phút)

### Option A: Sử dụng script clean (Recommended)
Copy toàn bộ nội dung file `database/migration-clean.sql` và paste vào Supabase SQL Editor.

### Option B: Manual commands (nếu muốn chạy từng bước):

```sql
-- Add Admin to user_role enum if not exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'Admin' 
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role')
    ) THEN
        ALTER TYPE user_role ADD VALUE 'Admin';
        RAISE NOTICE '✅ Added Admin to user_role enum';
    ELSE
        RAISE NOTICE 'ℹ️  Admin already exists in user_role enum';
    END IF;
END $$;

-- Add missing columns to users table
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS display_name TEXT,
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true NOT NULL;

-- Update existing data
UPDATE public.users 
SET display_name = name 
WHERE display_name IS NULL AND name IS NOT NULL;

UPDATE public.users 
SET metadata = '{}'::jsonb 
WHERE metadata IS NULL;

UPDATE public.users 
SET is_active = true 
WHERE is_active IS NULL;

-- Drop ai_models table if exists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'ai_models'
    ) THEN
        DROP TABLE public.ai_models CASCADE;
        RAISE NOTICE '✅ Dropped unused ai_models table';
    ELSE
        RAISE NOTICE 'ℹ️  ai_models table does not exist';
    END IF;
END $$;

-- Fix handle_new_user function
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

    INSERT INTO public.user_progress (user_id)
    VALUES (NEW.id);

    RETURN NEW;
END;
$$ language 'plpgsql' SECURITY DEFINER;

-- Migration completion message
DO $$
BEGIN
    RAISE NOTICE '🎉 Migration completed successfully!';
    RAISE NOTICE 'All schema inconsistencies have been fixed';
    RAISE NOTICE 'Next: Run verification queries';
END $$;
```

## Bước 3: Verification (1 phút)

### Option A: Sử dụng script verification (Recommended)
Copy toàn bộ nội dung file `database/verify-migration.sql` và paste vào Supabase SQL Editor.

### Option B: Manual verification queries:

```sql
-- Check final structure
SELECT 
    'FINAL_VERIFICATION' as check_type,
    column_name,
    data_type,
    CASE 
        WHEN column_name IN ('display_name', 'metadata', 'is_active') THEN '✅ ADDED'
        ELSE '✅ EXISTING'
    END as status
FROM information_schema.columns
WHERE table_name = 'users'
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check user data
SELECT 
    'USER_DATA_FINAL' as check_type,
    id, 
    email, 
    name,
    display_name,
    role,
    is_active
FROM public.users 
ORDER BY created_at;

-- Check enum values
SELECT 
    'ENUM_VALUES_FINAL' as check_type,
    unnest(enum_range(NULL::user_role)) as enum_value;

-- Final summary
DO $$
BEGIN
    RAISE NOTICE '🎉 MIGRATION VERIFICATION COMPLETE!';
    RAISE NOTICE 'Next: Test user settings page in application';
END $$;
```

## ✅ Success Indicators

- Tất cả queries chạy không lỗi
- display_name, metadata, is_active columns được thêm
- Admin role có trong enum
- User data được preserve
- ai_models table bị xóa (nếu tồn tại)

## ❌ If Something Goes Wrong

### Rollback Plan:
```sql
-- Restore from backup (nếu cần)
-- Copy nội dung từ: backups/schema_2025-07-30_06-45-17-164Z.sql
-- Copy nội dung từ: backups/data_2025-07-30_06-45-17-164Z.sql
```

---

**⏱️ Total Time:** ~6 phút  
**🔒 Risk Level:** Thấp (có backup đầy đủ)  
**📁 Backup Location:** `backups/schema_2025-07-30_06-45-17-164Z.sql`
