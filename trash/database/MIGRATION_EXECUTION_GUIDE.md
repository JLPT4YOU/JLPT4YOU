# 🛠️ JLPT4YOU Database Migration Execution Guide

**Ngày tạo:** 30/07/2025  
**Mục đích:** Hướng dẫn thực hiện migration an toàn cho database schema

## 🔍 Tình Trạng Hiện Tại

### ✅ Đã Hoàn Thành
- **Database backup:** `schema_2025-07-30_06-45-17-164Z.sql` + `data_2025-07-30_06-45-17-164Z.sql`
- **Code analysis:** Đã xác minh không có tính năng nào bị ảnh hưởng
- **Safety scripts:** Đã tạo pre-check và post-verification scripts

### 🔧 Cần Thực Hiện
- **Schema inconsistencies:** 4 vấn đề cần fix
- **Unused table cleanup:** ai_models table cần xóa

## 📋 Migration Steps

### Bước 1: Pre-Migration Safety Check
```sql
-- Chạy trong Supabase SQL Editor
\i database/pre-migration-safety-check.sql
```

**Mục đích:** Kiểm tra trạng thái hiện tại và đánh giá độ an toàn

### Bước 2: Execute Migration
```sql
-- Chạy trong Supabase SQL Editor
\i database/fix-schema-inconsistencies.sql
```

**Nội dung migration:**
- ✅ Thêm `Admin` vào user_role enum
- ✅ Thêm `display_name` column (cần thiết cho user settings)
- ✅ Thêm `metadata` column (cần thiết cho user data)
- ✅ Thêm `is_active` column (cần thiết cho user management)
- ✅ Xóa `ai_models` table (không được sử dụng)
- ✅ Fix `handle_new_user()` function

### Bước 3: Post-Migration Verification
```sql
-- Chạy trong Supabase SQL Editor
\i database/post-migration-verification.sql
```

**Mục đích:** Xác minh migration thành công và không có lỗi

## 🔒 Safety Measures

### 📁 Backup Protection
- **Schema backup:** `backups/schema_2025-07-30_06-45-17-164Z.sql`
- **Data backup:** `backups/data_2025-07-30_06-45-17-164Z.sql`
- **Rollback ready:** Có thể khôi phục 100% nếu cần

### 🧪 Code Verification
- **✅ ai_models table:** Không có code references, an toàn xóa
- **✅ display_name:** Được sử dụng trong user settings, cần thiết
- **✅ metadata:** Được sử dụng trong user profile, cần thiết
- **✅ Admin role:** Cần thiết cho admin user hiện tại

### 🔄 Rollback Plan
Nếu có vấn đề, chạy:
```sql
-- Khôi phục schema
\i backups/schema_2025-07-30_06-45-17-164Z.sql

-- Khôi phục data
\i backups/data_2025-07-30_06-45-17-164Z.sql
```

## 📊 Expected Results

### Schema Changes
```sql
-- users table sẽ có thêm:
ALTER TABLE public.users 
ADD COLUMN display_name TEXT,
ADD COLUMN metadata JSONB DEFAULT '{}'::jsonb,
ADD COLUMN is_active BOOLEAN DEFAULT true;

-- user_role enum sẽ có thêm:
ALTER TYPE user_role ADD VALUE 'Admin';

-- ai_models table sẽ bị xóa:
DROP TABLE public.ai_models CASCADE;
```

### Data Migration
- **display_name:** Sẽ được copy từ `name` column
- **metadata:** Sẽ được set default `{}`
- **is_active:** Sẽ được set default `true`
- **User data:** Không thay đổi, được bảo toàn 100%

## ⚠️ Important Notes

### Trước Khi Migration
1. **Đảm bảo backup đã tạo:** ✅ Completed
2. **Kiểm tra application offline:** Không cần thiết (schema-only changes)
3. **Thông báo users:** Không cần (downtime < 1 phút)

### Sau Migration
1. **Test user settings page:** Đảm bảo profile update hoạt động
2. **Test authentication:** Đảm bảo login/signup bình thường
3. **Check admin functions:** Đảm bảo admin role hoạt động
4. **Monitor logs:** Theo dõi errors trong 24h đầu

## 🎯 Success Criteria

### ✅ Migration Successful If:
- [ ] Pre-check shows "MIGRATION RECOMMENDED"
- [ ] Migration script runs without errors
- [ ] Post-verification shows "MIGRATION COMPLETED SUCCESSFULLY"
- [ ] User settings page hoạt động bình thường
- [ ] Authentication flow không bị ảnh hưởng
- [ ] Admin user vẫn có quyền Admin

### ❌ Rollback If:
- Migration script báo lỗi
- Post-verification score < 4/6
- User settings page bị lỗi
- Authentication bị break

## 🚀 Execution Commands

### Option 1: Manual Execution (Recommended)
```bash
# 1. Open Supabase SQL Editor
# 2. Copy-paste each script content
# 3. Run step by step
# 4. Review output after each step
```

### Option 2: File Upload
```bash
# 1. Upload scripts to Supabase
# 2. Run via \i command
# 3. Monitor output carefully
```

## 📞 Support

Nếu có vấn đề trong quá trình migration:

1. **Stop immediately** - Không tiếp tục nếu có lỗi
2. **Capture error logs** - Screenshot hoặc copy error message
3. **Run rollback** - Sử dụng backup files để khôi phục
4. **Report issue** - Ghi lại chi tiết để debug

---

**📁 Files Location:**
- `database/pre-migration-safety-check.sql`
- `database/fix-schema-inconsistencies.sql` 
- `database/post-migration-verification.sql`
- `backups/schema_2025-07-30_06-45-17-164Z.sql`
- `backups/data_2025-07-30_06-45-17-164Z.sql`
