# 🗃️ JLPT4YOU SQL Backup Tools

Bộ công cụ backup SQL cho database Supabase của dự án JLPT4YOU.

## 🚀 Tính năng

- ✅ **SQL Backup**: Schema + Data dưới dạng SQL portable
- ✅ **Khôi phục linh hoạt**: Restore toàn bộ hoặc từng phần
- ✅ **Lên lịch tự động**: Daily backup với cleanup
- ✅ **Quản lý backup**: List, view details, cleanup
- ✅ **Human-readable**: SQL files dễ đọc và chỉnh sửa
- ✅ **Version control friendly**: Có thể track changes
- ✅ **Portable**: Chạy được trên bất kỳ PostgreSQL nào

## 📋 Yêu cầu

1. **Environment Variables** trong `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

2. **Dependencies**: Đã có sẵn trong project
   - `@supabase/supabase-js`
   - `dotenv` (sẽ được cài tự động)

## 🛠️ Cài đặt

```bash
# Cài đặt dependency cần thiết
npm install dotenv

# Tạo thư mục backup
mkdir -p backups

# Setup scheduler (optional)
npm run backup:schedule -- --setup
```

## 📖 Hướng dẫn sử dụng

### 1. 🗃️ Tạo SQL Backup

```bash
# Backup toàn bộ (schema + data)
npm run backup:create

# Chỉ backup schema
npm run backup:create -- --schema-only

# Chỉ backup data
npm run backup:create -- --data-only

# Backup specific tables
npm run backup:create -- --tables=users,exam_results
```

### 2. 🔄 Khôi phục từ SQL Backup

```bash
# Restore schema từ SQL file
npm run backup:restore -- --schema=schema_2025-01-24_10-30-00.sql

# Restore data từ SQL file
npm run backup:restore -- --data=data_2025-01-24_10-30-00.sql

# Restore toàn bộ từ timestamp
npm run backup:restore -- --full=2025-01-24_10-30-00
```

### 3. 📋 Quản lý Backup

```bash
# Liệt kê tất cả backup files
npm run backup:list

# Xem chi tiết
npm run backup:list -- --detailed

# Xem thông tin file cụ thể
npm run backup:list -- --file=data_2025-01-24_10-30-00.json
```

### 4. ⏰ Lên lịch tự động

```bash
# Setup cấu hình scheduler
npm run backup:schedule -- --setup

# Chạy backup hàng ngày
npm run backup:schedule -- --run-daily

# Dọn dẹp backup cũ (giữ 7 ngày)
npm run backup:schedule -- --cleanup --keep=7

# Xem trạng thái scheduler
npm run backup:schedule -- --status
```

## 📁 Cấu trúc Files

```
backups/
├── data_2025-01-24_10-30-00.sql       # Data backup (SQL)
├── schema_2025-01-24_10-30-00.sql     # Schema backup (SQL)
├── manifest_2025-01-24_10-30-00.json  # Manifest file
├── schedule-config.json               # Scheduler config
└── schedule.log                       # Scheduler log
```

## 🔧 Cấu hình nâng cao

### Scheduler Configuration

File `backups/schedule-config.json`:

```json
{
  "enabled": true,
  "schedule": {
    "daily": true,
    "time": "02:00",
    "timezone": "Asia/Ho_Chi_Minh"
  },
  "retention": {
    "keepDays": 7,
    "keepWeeks": 4,
    "keepMonths": 6
  },
  "options": {
    "includeSchema": true,
    "includeData": true,
    "compress": false
  }
}
```

### Cron Job Setup

Để tự động backup hàng ngày, thêm vào crontab:

```bash
# Mở crontab
crontab -e

# Thêm dòng này (backup lúc 2h sáng hàng ngày)
0 2 * * * cd /path/to/jlpt4you && npm run backup:schedule -- --run-daily
```

## 📊 Monitoring

### Log Files

- **Scheduler log**: `backups/schedule.log`
- **Restore log**: `backups/restore_log_*.json`

### Status Check

```bash
# Kiểm tra trạng thái
npm run backup:schedule -- --status

# Xem log gần nhất
tail -f backups/schedule.log
```

## 🚨 Troubleshooting

### Lỗi thường gặp

1. **Missing environment variables**
   ```
   ❌ Missing Supabase environment variables
   ```
   **Giải pháp**: Kiểm tra `.env.local` có đầy đủ variables

2. **Permission denied**
   ```
   ❌ Cannot read backup directory
   ```
   **Giải pháp**: Tạo thư mục `backups/` và set quyền

3. **Table not found**
   ```
   ⚠️ Table users not found in backup
   ```
   **Giải pháp**: Kiểm tra tên table trong backup file

4. **RLS Policy Error**
   ```
   ❌ Row Level Security policy violation
   ```
   **Giải pháp**: Đảm bảo sử dụng Service Role Key

### Debug Mode

Để debug chi tiết, thêm log:

```javascript
// Trong script backup
console.log('Debug info:', { table, data, error })
```

## 🔐 Bảo mật

1. **Service Role Key**: Chỉ sử dụng trong server environment
2. **Backup Files**: Chứa sensitive data, không commit vào git
3. **Access Control**: Hạn chế quyền truy cập thư mục `backups/`

## 📈 Performance

- **Batch Size**: 100 rows/batch để tránh timeout
- **Memory Usage**: Streaming cho large datasets
- **Compression**: Có thể enable trong config (future)

## 🔄 Workflow khuyến nghị

1. **Development**: Manual backup trước khi thay đổi schema
2. **Staging**: Daily backup với retention 7 ngày
3. **Production**: Daily backup với retention 30 ngày + weekly/monthly

```bash
# Development workflow
npm run backup:create -- --schema-only  # Trước khi migrate
# ... make changes ...
npm run backup:restore -- --latest      # Nếu cần rollback

# Production workflow
npm run backup:schedule -- --setup      # Setup một lần
# Cron job sẽ tự động chạy daily backup
```

## 🗃️ SQL Backup Features

### Ưu điểm của SQL Backup:
- ✅ **Portable**: Có thể chạy trên bất kỳ PostgreSQL nào
- ✅ **Human-readable**: Dễ đọc và chỉnh sửa
- ✅ **Version control friendly**: Có thể track changes
- ✅ **Selective restore**: Dễ dàng chọn lọc data cần restore

### Cấu trúc SQL Files:

#### Schema SQL:
```sql
-- Extensions và types
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE TYPE user_role AS ENUM ('Free', 'Premium', 'Admin');

-- Table definitions
CREATE TABLE IF NOT EXISTS public.users (
    id UUID,
    email TEXT,
    name TEXT,
    ...
);

-- Functions và triggers
CREATE OR REPLACE FUNCTION public.handle_new_user() ...
```

#### Data SQL:
```sql
-- Clear existing data
DELETE FROM public.users;

-- Insert data in batches
INSERT INTO public.users (id, email, name, ...) VALUES
    ('uuid1', 'user1@example.com', 'User 1', ...),
    ('uuid2', 'user2@example.com', 'User 2', ...);
```

### Sử dụng SQL Backup:

1. **Tạo SQL backup**:
   ```bash
   npm run backup:create -- --format=sql
   ```

2. **Review SQL files** trước khi restore:
   ```bash
   cat backups/schema_2025-01-24_10-30-00.sql
   cat backups/data_2025-01-24_10-30-00.sql
   ```

3. **Restore từ SQL**:
   ```bash
   # Restore schema trước
   npm run backup:restore-sql -- --schema=schema_2025-01-24_10-30-00.sql

   # Sau đó restore data
   npm run backup:restore-sql -- --data=data_2025-01-24_10-30-00.sql
   ```

### ⚠️ Lưu ý quan trọng:
- SQL restore yêu cầu review manual trước khi thực thi
- Schema SQL có thể cần điều chỉnh cho environment cụ thể
- Data SQL sẽ xóa data hiện tại trước khi insert
- Kiểm tra permissions và RLS policies sau restore

## 🆘 Support

Nếu gặp vấn đề:

1. Kiểm tra log files trong `backups/`
2. Verify Supabase connection
3. Check table permissions và RLS policies
4. Test với sample data trước
5. **SQL issues**: Review generated SQL files manually

---

**Made with ❤️ for JLPT4YOU Project**
