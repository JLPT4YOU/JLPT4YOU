-- FIX RLS POLICIES - Script đơn giản
-- Chạy từng đoạn một trong Supabase SQL Editor

-- 1. Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 2. Drop policies cũ (nếu có)
DROP POLICY IF EXISTS "users_select_own" ON public.users;
DROP POLICY IF EXISTS "users_update_own" ON public.users;
DROP POLICY IF EXISTS "users_insert_own" ON public.users;

-- 3. Tạo policy cho SELECT
CREATE POLICY "users_select_own" ON public.users
    FOR SELECT USING (auth.uid() = id);

-- 4. Tạo policy cho UPDATE
CREATE POLICY "users_update_own" ON public.users
    FOR UPDATE USING (auth.uid() = id) 
    WITH CHECK (auth.uid() = id);

-- 5. Grant permissions
GRANT SELECT, UPDATE ON public.users TO authenticated;

-- 6. Test update (thay đổi tên hiển thị)
UPDATE public.users 
SET display_name = 'Test ' || extract(epoch from now())::text
WHERE id = auth.uid();

-- 7. Kiểm tra kết quả
SELECT id, email, name, display_name, avatar_icon 
FROM public.users 
WHERE id = auth.uid();
