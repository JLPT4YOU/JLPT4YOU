-- Cleanup Users Table - Xóa các cột dư thừa
-- Chạy script này trong Supabase SQL Editor để xóa các cột không cần thiết

-- Xóa các cột dư thừa
ALTER TABLE public.users DROP COLUMN IF EXISTS phone;
ALTER TABLE public.users DROP COLUMN IF EXISTS date_of_birth;
ALTER TABLE public.users DROP COLUMN IF EXISTS preferred_language;
ALTER TABLE public.users DROP COLUMN IF EXISTS timezone;
ALTER TABLE public.users DROP COLUMN IF EXISTS metadata;

-- Cập nhật function handle_new_user để không thêm các trường đã xóa
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email, name, avatar_url)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'full_name'),
        NEW.raw_user_meta_data->>'avatar_url'
    );
    RETURN NEW;
END;
$$ language 'plpgsql' SECURITY DEFINER;

-- Kiểm tra cấu trúc bảng sau khi cleanup
-- Uncomment dòng dưới để xem cấu trúc bảng
-- SELECT column_name, data_type, is_nullable, column_default 
-- FROM information_schema.columns 
-- WHERE table_name = 'users' AND table_schema = 'public'
-- ORDER BY ordinal_position;
