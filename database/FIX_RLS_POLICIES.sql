-- FIX RLS POLICIES: Cho phép user update thông tin của chính họ
-- Chạy script này nếu vẫn gặp lỗi permission sau khi migration

-- Bước 1: Kiểm tra RLS hiện tại
SELECT 
    schemaname, 
    tablename, 
    rowsecurity 
FROM pg_tables 
WHERE tablename = 'users' AND schemaname = 'public';

-- Bước 2: Kiểm tra policies hiện tại
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'users' AND schemaname = 'public';

-- Bước 3: Enable RLS nếu chưa có
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Bước 4: Drop các policies cũ (nếu có)
DROP POLICY IF EXISTS "Users can view their own data" ON public.users;
DROP POLICY IF EXISTS "Users can update their own data" ON public.users;
DROP POLICY IF EXISTS "Users can insert their own data" ON public.users;
DROP POLICY IF EXISTS "Enable read access for users based on user_id" ON public.users;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON public.users;

-- Bước 5: Tạo policies mới
CREATE POLICY "users_select_own" ON public.users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "users_update_own" ON public.users
    FOR UPDATE USING (auth.uid() = id) 
    WITH CHECK (auth.uid() = id);

CREATE POLICY "users_insert_own" ON public.users
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Bước 6: Grant permissions
GRANT SELECT, UPDATE, INSERT ON public.users TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

-- Bước 7: Kiểm tra lại policies
SELECT 
    policyname,
    cmd,
    permissive,
    roles
FROM pg_policies 
WHERE tablename = 'users' AND schemaname = 'public'
ORDER BY policyname;

-- Bước 8: Test update với user hiện tại
-- (Thay YOUR_USER_ID bằng ID thực của bạn)
-- UPDATE public.users 
-- SET display_name = 'Test Update ' || NOW()
-- WHERE id = auth.uid();

-- Bước 9: Kiểm tra kết quả
SELECT 
    id,
    email,
    name,
    display_name,
    avatar_icon,
    updated_at
FROM public.users 
WHERE id = auth.uid();
