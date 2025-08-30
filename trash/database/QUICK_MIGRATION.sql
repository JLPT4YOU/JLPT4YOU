-- QUICK MIGRATION: Add User Settings Fields
-- Chạy script này trong Supabase SQL Editor để sửa lỗi "column users.display_name does not exist"

-- Bước 1: Thêm các cột mới (nếu chưa có)
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS display_name TEXT,
ADD COLUMN IF NOT EXISTS avatar_icon TEXT,
ADD COLUMN IF NOT EXISTS password_updated_at TIMESTAMPTZ;

-- Bước 2: Cập nhật display_name từ name cho user hiện tại
UPDATE public.users 
SET display_name = name 
WHERE display_name IS NULL AND name IS NOT NULL;

-- Bước 3: Thêm comment mô tả
COMMENT ON COLUMN public.users.display_name IS 'Tên hiển thị có thể khác với name gốc';
COMMENT ON COLUMN public.users.avatar_icon IS 'Tên icon từ lucide-react để làm avatar';
COMMENT ON COLUMN public.users.password_updated_at IS 'Thời gian đổi mật khẩu lần cuối';

-- Bước 4: Kiểm tra kết quả
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'users'
AND table_schema = 'public'
AND column_name IN ('display_name', 'avatar_icon', 'password_updated_at')
ORDER BY column_name;

-- Bước 5: Kiểm tra dữ liệu user mẫu
SELECT 
    id, 
    email, 
    name, 
    display_name, 
    avatar_icon,
    password_updated_at,
    created_at
FROM public.users 
LIMIT 3;
