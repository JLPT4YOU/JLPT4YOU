-- FIX COMPLETE: User Settings Update Issue
-- Chạy toàn bộ script này trong Supabase SQL Editor

-- 1. Thêm các cột còn thiếu
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS display_name TEXT,
ADD COLUMN IF NOT EXISTS avatar_icon TEXT,
ADD COLUMN IF NOT EXISTS password_updated_at TIMESTAMPTZ;

-- 2. Copy dữ liệu từ name sang display_name cho user hiện tại
UPDATE public.users 
SET display_name = name 
WHERE display_name IS NULL AND name IS NOT NULL;

-- 3. Đảm bảo RLS policy cho phép user update chính mình
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;

CREATE POLICY "Users can update own profile" ON public.users
FOR UPDATE 
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- 4. Đảm bảo user có thể đọc thông tin của chính mình
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;

CREATE POLICY "Users can view own profile" ON public.users
FOR SELECT 
USING (auth.uid() = id);

-- 5. Enable RLS nếu chưa enable
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 6. Grant permissions
GRANT ALL ON public.users TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

-- 7. Kiểm tra kết quả - xem các cột đã được thêm chưa
SELECT 
    'Checking columns...' as status,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'users'
AND table_schema = 'public'
AND column_name IN ('display_name', 'avatar_icon', 'password_updated_at');

-- 8. Kiểm tra RLS policies
SELECT 
    'Checking RLS policies...' as status,
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'users';

-- Nếu mọi thứ OK, bạn sẽ thấy:
-- 1. Ba dòng cho 3 cột mới (display_name, avatar_icon, password_updated_at)
-- 2. Ít nhất 2 policies cho SELECT và UPDATE
