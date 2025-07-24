# 🔧 Migration Guide - User Settings Fields

## Vấn đề
Trang Settings không thể cập nhật thông tin user vì thiếu các trường mới trong database.

## Giải pháp
Cần chạy migration script để thêm các trường mới vào bảng `users`.

## 📋 Các bước thực hiện

### Bước 1: Truy cập Supabase Dashboard
1. Đăng nhập vào [Supabase Dashboard](https://supabase.com/dashboard)
2. Chọn project `jlpt4you`
3. Vào phần **SQL Editor** (biểu tượng database ở sidebar)

### Bước 2: Chạy Migration Script
Copy và paste đoạn SQL sau vào SQL Editor, sau đó nhấn **Run**:

```sql
-- Migration: Add User Settings Fields
-- Date: 2025-01-24
-- Description: Thêm các trường cần thiết cho trang user settings

-- Thêm các cột mới vào bảng users (nếu chưa có)
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS display_name TEXT,
ADD COLUMN IF NOT EXISTS avatar_icon TEXT,
ADD COLUMN IF NOT EXISTS password_updated_at TIMESTAMPTZ;

-- Thêm comment cho các cột mới
COMMENT ON COLUMN public.users.display_name IS 'Tên hiển thị có thể khác với name gốc';
COMMENT ON COLUMN public.users.avatar_icon IS 'Tên icon từ lucide-react để làm avatar (ví dụ: User, Star, Heart)';
COMMENT ON COLUMN public.users.password_updated_at IS 'Thời gian đổi mật khẩu lần cuối';

-- Cập nhật display_name từ name hiện tại cho các user đã có
UPDATE public.users 
SET display_name = name 
WHERE display_name IS NULL AND name IS NOT NULL;

-- Verify migration
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'users' 
AND table_schema = 'public'
AND column_name IN ('display_name', 'avatar_icon', 'password_updated_at');
```

### Bước 3: Kiểm tra kết quả
Sau khi chạy script, bạn sẽ thấy:
- ✅ 3 cột mới được thêm vào bảng `users`
- ✅ Các user hiện tại có `display_name` được copy từ `name`
- ✅ Query cuối cùng hiển thị thông tin các cột mới

### Bước 4: Test trang Settings
1. Quay lại ứng dụng: http://localhost:3001/settings
2. Thử cập nhật tên hiển thị hoặc chọn avatar icon
3. Nhấn "Lưu thay đổi"
4. Kiểm tra xem có thông báo thành công không

## 🔍 Debug Tools

Nếu vẫn gặp lỗi, sử dụng debug tools:

1. **Truy cập debug page**: http://localhost:3001/debug
2. **Check Schema**: Kiểm tra xem các trường đã được thêm chưa
3. **Test User Update**: Test trực tiếp việc cập nhật user

## 🛡️ Row Level Security (RLS)

Nếu vẫn gặp lỗi permission, có thể cần cập nhật RLS policies:

```sql
-- Cho phép user update các trường mới
CREATE POLICY "Users can update their own profile" ON public.users
FOR UPDATE USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Hoặc update policy hiện tại
ALTER POLICY "Users can update their own data" ON public.users
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);
```

## 📝 Các trường mới

| Trường | Kiểu | Mô tả |
|--------|------|-------|
| `display_name` | TEXT | Tên hiển thị trong ứng dụng |
| `avatar_icon` | TEXT | Tên icon từ lucide-react (User, Star, etc.) |
| `password_updated_at` | TIMESTAMPTZ | Thời gian đổi mật khẩu lần cuối |

## ✅ Kết quả mong đợi

Sau khi migration thành công:
- ✅ Trang Settings hoạt động bình thường
- ✅ Có thể cập nhật tên hiển thị
- ✅ Có thể chọn avatar icon từ 50+ icons
- ✅ Có thể đổi mật khẩu
- ✅ Avatar icon hiển thị trong header và home page

## 🆘 Hỗ trợ

Nếu gặp vấn đề:
1. Kiểm tra console log trong browser (F12)
2. Kiểm tra server logs trong terminal
3. Sử dụng debug tools tại `/debug`
4. Kiểm tra Supabase logs trong dashboard
