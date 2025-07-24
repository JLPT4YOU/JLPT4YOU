# 🚨 FIX: "column users.display_name does not exist"

## Vấn đề
Lỗi: `Không tìm thấy người dùng: column users.display_name does not exist`

## Nguyên nhân
Database Supabase chưa có các cột mới cần thiết cho User Settings.

## ✅ Giải pháp nhanh (2 phút)

### Bước 1: Truy cập Supabase
1. Đăng nhập [Supabase Dashboard](https://supabase.com/dashboard)
2. Chọn project **jlpt4you**
3. Vào **SQL Editor** (biểu tượng database ở sidebar)

### Bước 2: Chạy Migration Script
Copy toàn bộ nội dung file `database/QUICK_MIGRATION.sql` và paste vào SQL Editor, sau đó nhấn **Run**:

```sql
-- QUICK MIGRATION: Add User Settings Fields
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS display_name TEXT,
ADD COLUMN IF NOT EXISTS avatar_icon TEXT,
ADD COLUMN IF NOT EXISTS password_updated_at TIMESTAMPTZ;

UPDATE public.users 
SET display_name = name 
WHERE display_name IS NULL AND name IS NOT NULL;

COMMENT ON COLUMN public.users.display_name IS 'Tên hiển thị có thể khác với name gốc';
COMMENT ON COLUMN public.users.avatar_icon IS 'Tên icon từ lucide-react để làm avatar';
COMMENT ON COLUMN public.users.password_updated_at IS 'Thời gian đổi mật khẩu lần cuối';

-- Kiểm tra kết quả
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'users' 
AND table_schema = 'public'
AND column_name IN ('display_name', 'avatar_icon', 'password_updated_at');
```

### Bước 3: Kiểm tra kết quả
Sau khi chạy script, bạn sẽ thấy:
- ✅ Query thành công
- ✅ 3 dòng kết quả hiển thị các cột mới
- ✅ Không có lỗi

### Bước 4: Test lại Settings
1. Quay lại ứng dụng: http://localhost:3001/settings
2. Thử cập nhật tên hiển thị
3. Chọn avatar icon
4. Nhấn "Lưu thay đổi"
5. ✅ Sẽ thấy thông báo "Cập nhật thông tin thành công!"

## 🔍 Debug Tools

Nếu muốn kiểm tra chi tiết:
1. Truy cập: http://localhost:3001/debug
2. Nhấn "Check Schema" - xem các cột có tồn tại không
3. Nhấn "Test User Update" - test cập nhật user

## 🛡️ Nếu vẫn lỗi RLS Policy

Nếu sau migration vẫn lỗi permission, chạy thêm script này:

```sql
-- Enable RLS và tạo policies
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can update their own data" ON public.users
FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can view their own data" ON public.users
FOR SELECT USING (auth.uid() = id);

GRANT UPDATE ON public.users TO authenticated;
```

## ✅ Kết quả mong đợi

Sau khi fix:
- ✅ Trang Settings hoạt động bình thường
- ✅ Có thể cập nhật tên hiển thị
- ✅ Có thể chọn avatar icon
- ✅ Avatar hiển thị trong header
- ✅ Có thể đổi mật khẩu

## 📁 Files liên quan

- `database/QUICK_MIGRATION.sql` - Script migration nhanh
- `database/migrations/001_add_user_settings_fields.sql` - Migration đầy đủ
- `database/schema.sql` - Schema hoàn chỉnh

---

**Thời gian thực hiện: ~2 phút**
**Độ khó: Dễ (chỉ cần copy-paste và chạy SQL)**
