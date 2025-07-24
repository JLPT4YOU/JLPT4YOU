# 🔧 COMPLETE FIX: User Settings Update Issue

## 🚨 Vấn đề
- Migration đã chạy thành công
- Trang Settings hiển thị "cập nhật thành công" 
- Nhưng refresh lại trang thì tên không thay đổi
- Không có sự thay đổi trong Supabase database

## 🔍 Nguyên nhân có thể
1. **RLS Policies** chưa được setup đúng
2. **Permission** không cho phép user update
3. **Database connection** có vấn đề

## ✅ Giải pháp từng bước

### Bước 1: Kiểm tra Debug Tools
1. Truy cập: http://localhost:3001/debug
2. Nhấn **"Check Schema"** - đảm bảo các cột đã tồn tại
3. Nhấn **"Test User Update"** - xem lỗi cụ thể

### Bước 2: Sửa RLS Policies (Quan trọng nhất)
Vào **Supabase Dashboard → SQL Editor** và chạy:

```sql
-- 1. Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 2. Drop policies cũ
DROP POLICY IF EXISTS "users_select_own" ON public.users;
DROP POLICY IF EXISTS "users_update_own" ON public.users;

-- 3. Tạo policy mới cho SELECT
CREATE POLICY "users_select_own" ON public.users
    FOR SELECT USING (auth.uid() = id);

-- 4. Tạo policy mới cho UPDATE
CREATE POLICY "users_update_own" ON public.users
    FOR UPDATE USING (auth.uid() = id) 
    WITH CHECK (auth.uid() = id);

-- 5. Grant permissions
GRANT SELECT, UPDATE ON public.users TO authenticated;

-- 6. Test update
UPDATE public.users 
SET display_name = 'Test Update ' || extract(epoch from now())::text
WHERE id = auth.uid();

-- 7. Kiểm tra kết quả
SELECT id, email, name, display_name, avatar_icon 
FROM public.users 
WHERE id = auth.uid();
```

### Bước 3: Kiểm tra kết quả
Sau khi chạy script trên:
- ✅ Query cuối cùng sẽ hiển thị user data với `display_name` đã được update
- ✅ Nếu thấy `display_name` thay đổi → RLS đã hoạt động

### Bước 4: Test lại Settings
1. Quay lại: http://localhost:3001/settings
2. Thay đổi tên hiển thị
3. Nhấn "Lưu thay đổi"
4. Refresh trang → Tên sẽ được cập nhật

## 🔍 Debug chi tiết

### Nếu vẫn lỗi, kiểm tra:

#### A. Lỗi Permission
```
Error: new row violates row-level security policy
```
**Giải pháp**: Chạy lại script RLS ở Bước 2

#### B. Lỗi Column không tồn tại
```
Error: column "display_name" does not exist
```
**Giải pháp**: Chạy migration script:
```sql
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS display_name TEXT,
ADD COLUMN IF NOT EXISTS avatar_icon TEXT,
ADD COLUMN IF NOT EXISTS password_updated_at TIMESTAMPTZ;
```

#### C. Lỗi Connection
```
Error: Failed to connect to database
```
**Giải pháp**: Kiểm tra `.env.local` có đúng Supabase credentials

## 🛠️ Cải thiện đã thực hiện

### 1. Enhanced Error Messages
- User Settings Service giờ hiển thị lỗi cụ thể
- Debug tools có diagnosis và gợi ý giải pháp

### 2. Auto Refresh User Data
- Sau khi update thành công, tự động refresh data từ database
- Đảm bảo UI luôn sync với database

### 3. Better Debug Tools
- Debug page hiển thị lỗi chi tiết
- Test trực tiếp database operations

## 📋 Checklist

- [ ] Migration script đã chạy thành công
- [ ] RLS policies đã được setup
- [ ] Test update trong SQL Editor thành công
- [ ] Debug tools không báo lỗi
- [ ] Settings page cập nhật thành công
- [ ] Refresh trang vẫn giữ nguyên thay đổi

## 🎯 Kết quả mong đợi

Sau khi hoàn thành:
- ✅ Cập nhật tên hiển thị thành công
- ✅ Chọn avatar icon hoạt động
- ✅ Data được lưu vào Supabase
- ✅ Refresh trang vẫn giữ nguyên thay đổi
- ✅ Avatar hiển thị trong header

## 🆘 Nếu vẫn không được

1. **Check Console Logs**: Mở F12 → Console, xem lỗi chi tiết
2. **Check Network Tab**: Xem API calls có thành công không
3. **Check Supabase Logs**: Vào Dashboard → Logs
4. **Contact Support**: Cung cấp error logs cụ thể

---

**Thời gian sửa: ~5 phút**
**Độ khó: Trung bình (cần hiểu RLS)**
