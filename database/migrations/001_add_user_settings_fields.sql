-- Migration: Add User Settings Fields
-- Date: 2025-01-24
-- Description: Thêm các trường cần thiết cho trang user settings

-- Thêm các cột mới vào bảng users
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS display_name TEXT,
ADD COLUMN IF NOT EXISTS avatar_icon TEXT,
ADD COLUMN IF NOT EXISTS password_updated_at TIMESTAMPTZ;

-- Cập nhật display_name từ name hiện tại cho các user đã có
UPDATE public.users 
SET display_name = name 
WHERE display_name IS NULL AND name IS NOT NULL;

-- Thêm comment cho các cột mới
COMMENT ON COLUMN public.users.display_name IS 'Tên hiển thị có thể khác với name gốc';
COMMENT ON COLUMN public.users.avatar_icon IS 'Tên icon từ lucide-react để làm avatar (ví dụ: User, Star, Heart)';
COMMENT ON COLUMN public.users.password_updated_at IS 'Thời gian đổi mật khẩu lần cuối';

-- Cập nhật function handle_new_user để xử lý các trường mới
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email, name, display_name, avatar_url)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'full_name'),
        COALESCE(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'full_name'),
        NEW.raw_user_meta_data->>'avatar_url'
    );

    -- Create initial progress record
    INSERT INTO public.user_progress (user_id)
    VALUES (NEW.id);

    RETURN NEW;
END;
$$ language 'plpgsql' SECURITY DEFINER;
