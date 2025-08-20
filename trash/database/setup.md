# Database Setup Guide

## 🗄️ Hướng dẫn thiết lập Database Schema cho JLPT4YOU

### 1. **Truy cập Supabase Dashboard**
1. Đăng nhập vào https://supabase.com/dashboard
2. Chọn project `jlpt4you` của bạn
3. Vào **SQL Editor** từ sidebar

### 2. **Chạy Schema Script**
1. Copy toàn bộ nội dung file `database/schema.sql`
2. Paste vào SQL Editor
3. Click **Run** để thực thi

### 3. **Kiểm tra kết quả**
Sau khi chạy script, bạn sẽ có các bảng sau:

#### 📋 **Tables Created:**
- `public.users` - Thông tin người dùng
- `public.exam_results` - Kết quả thi
- `public.user_progress` - Tiến độ học tập
- `public.study_sessions` - Phiên học chi tiết

#### 🔐 **Security Features:**
- Row Level Security (RLS) enabled
- Policies để bảo vệ dữ liệu người dùng
- Triggers tự động cập nhật timestamps

#### ⚡ **Functions & Triggers:**
- `handle_new_user()` - Tự động tạo profile khi đăng ký
- `update_user_progress_stats()` - Cập nhật thống kê
- Auto-update `updated_at` timestamps

### 4. **Verification Steps**
Sau khi chạy schema, kiểm tra:

1. **Tables**: Vào **Table Editor** để xem các bảng đã tạo
2. **Authentication**: Vào **Authentication > Settings** 
3. **Policies**: Vào **Authentication > Policies** để xem RLS policies

### 5. **Next Steps**
Sau khi database schema đã sẵn sàng:
- Test kết nối từ ứng dụng
- Tích hợp Supabase Auth
- Tạo API routes cho database operations

### 🚨 **Important Notes**
- Schema này được thiết kế để tương thích với Supabase Auth
- RLS policies đảm bảo users chỉ truy cập được data của mình
- Triggers sẽ tự động tạo user profile khi đăng ký mới

### 🔧 **Troubleshooting**
Nếu gặp lỗi:
1. Kiểm tra extensions đã được enable
2. Đảm bảo có quyền admin trên project
3. Chạy từng phần của script nếu cần

---

**Ready to proceed?** Sau khi chạy schema thành công, chúng ta sẽ tiếp tục với việc tích hợp Authentication!
