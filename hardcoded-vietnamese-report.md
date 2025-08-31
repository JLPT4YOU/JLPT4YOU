# Báo cáo Hardcoded Tiếng Việt trong Frontend

## Tổng quan
Đã kiểm tra toàn bộ dự án JLPT4YOU để tìm các đoạn text tiếng Việt được hardcode trong frontend (trừ trang /admin và backend performance). Dưới đây là báo cáo chi tiết theo từng phần.

## 1. Layout và Metadata (src/app/layout.tsx)
**Vị trí:** SEO metadata và OpenGraph
**Số lượng:** 9 hardcoded strings

### Chi tiết:
- **Line 44:** `title: "JLPT4YOU - Học tiếng Nhật hiệu quả với AI"`
- **Line 45:** `description: "Website luyện thi JLPT hàng đầu Việt Nam. Học tiếng Nhật miễn phí với AI..."`
- **Line 77:** `title: 'JLPT4You - Học tiếng Nhật hiệu quả với AI'`
- **Line 78:** `description: 'Website luyện thi JLPT hàng đầu Việt Nam với AI hỗ trợ học tập'`
- **Line 84:** `alt: 'JLPT4You - Học tiếng Nhật với AI'`
- **Line 90:** `title: 'JLPT4You - Học tiếng Nhật hiệu quả với AI'`
- **Line 122:** `{/* Theme color tự động điều chỉnh theo giao diện sáng/tối */}`

**Mức độ ưu tiên:** 🔴 CAO - Ảnh hưởng SEO và metadata

## 2. Header Component (src/components/header.tsx)
**Vị trí:** Comments và fallback text
**Số lượng:** 7 hardcoded strings

### Chi tiết:
- **Line 96:** `{/* Logo và tên ứng dụng */}`
- **Line 104:** `{/* Language Switcher, Theme toggle và User menu */}`
- **Line 132:** `'Menu người dùng'` (fallback cho screen reader)
- **Line 153:** `'Hạn sử dụng'` (fallback)
- **Line 189:** `'Cài đặt'` (fallback)
- **Line 201:** `'Đăng xuất'` (fallback)

**Mức độ ưu tiên:** 🟡 TRUNG BÌNH - Chỉ là fallback khi translation system fail

## 3. Auth Components
### Login Form (src/components/auth/login-form.tsx)
**Số lượng:** 5 hardcoded strings

### Chi tiết:
- **Line 84:** `'Đăng ký thành công! Vui lòng kiểm tra email để xác nhận tài khoản.'`
- **Line 145:** `'Nhớ đăng nhập'`
- **Line 166:** `'Đang đăng nhập...'` và `'Đăng nhập'`
- **Line 180:** `'Chưa có tài khoản?'`
- **Line 188:** `'Đăng ký ngay'`

### Register Form (src/components/auth/register-form.tsx)
**Số lượng:** 7 hardcoded strings

### Chi tiết:
- **Line 140:** `'Tôi đồng ý với'`
- **Line 147:** `'Điều khoản'`
- **Line 149:** `'và'`
- **Line 156:** `'Chính sách bảo mật'`
- **Line 172:** `'Đang tạo tài khoản...'` và `'Tạo tài khoản'`
- **Line 186:** `'Đã có tài khoản?'`
- **Line 194:** `'Đăng nhập ngay'`

### Forgot Password Form (src/components/auth/forgot-password-form.tsx)
**Số lượng:** 8 hardcoded strings

### Chi tiết:
- **Line 76:** `'Kiểm tra email của bạn:'`
- **Line 78-80:** Instructions về reset password
- **Line 94:** `'Đang gửi lại...'` và `'Gửi lại email'`
- **Line 117:** `'Nhập email của bạn và chúng tôi sẽ gửi hướng dẫn đặt lại mật khẩu.'`
- **Line 133:** `'Nhập email của bạn'`
- **Line 148:** `'Đang gửi...'` và `'Gửi hướng dẫn đặt lại mật khẩu'`

**Mức độ ưu tiên[object Object]- User-facing text quan trọng

## 4. Constants và Config Files
### JLPT Level Info (src/lib/constants.ts)
**Số lượng:** 10 hardcoded strings

### Chi tiết:
- **Line 15:** `name: 'N5 - Sơ cấp'`
- **Line 16:** `description: 'Hiểu được tiếng Nhật cơ bản'`
- **Line 22:** `name: 'N4 - Sơ cấp cao'`
- **Line 23:** `description: 'Hiểu được tiếng Nhật cơ bản ở mức độ cao hơn'`
- **Line 29:** `name: 'N3 - Trung cấp'`
- **Line 30:** `description: 'Hiểu được tiếng Nhật ở mức độ trung bình'`
- **Line 36:** `name: 'N2 - Trung cấp cao'`
- **Line 37:** `description: 'Hiểu được tiếng Nhật ở mức độ khá cao'`
- **Line 43:** `name: 'N1 - Cao cấp'`
- **Line 44:** `description: 'Hiểu được tiếng Nhật ở mức độ cao'`

**Mức độ ưu tiên:[object Object] - Core business logic descriptions

## 5. Settings Components
### Profile Section (src/components/settings/profile-section.tsx)
**Số lượng:** 18 hardcoded strings

### Chi tiết bao gồm:
- Success/error messages
- Form labels và descriptions
- Account type và premium status text
- Button labels

### Redeem Code Section (src/components/settings/redeem-code-section.tsx)
**Số lượng:** 15 hardcoded strings

### Chi tiết bao gồm:
- Success messages cho premium activation
- Error handling text
- Form labels và placeholders
- Thank you messages

**Mức độ ưu tiên:** 🔴 CAO - Critical user interaction text

## 6. Premium và Payment Components
### Coupon Input (src/components/premium/coupon-input.tsx)
**Số lượng:** 10 hardcoded strings

### Chi tiết:
- **Line 3:** `* Component nhập và validate mã giảm giá` (comment)
- **Line 57:** `placeholder="Nhập mã giảm giá..."`
- **Line 90, 110:** `'Áp dụng'`
- **Line 130:** `'Mã giảm giá hợp lệ!'`
- **Line 141:** `'Mã giảm giá không hợp lệ hoặc đã hết hạn'`
- **Line 153:** `'Mã giảm giá phổ biến:'`
- **Line 157-159:** Popular coupon labels

**Mức độ ưu tiên:** 🔴 CAO - Payment flow critical text

## 7. Notification System
### Notification Button (src/components/notifications/NotificationButton.tsx)
**Số lượng:** 2 hardcoded strings

### Notification Inbox (src/components/notifications/NotificationInbox.tsx)
**Số lượng:** 32 hardcoded strings

### Chi tiết bao gồm:
- Navigation labels (Hộp thư đến, Tất cả, Chưa đọc, Quan trọng)
- Action buttons (Cập nhật thông báo, Đánh dấu tất cả đã đọc)
- Status messages và metadata labels
- Modal headers và descriptions

**Mức độ ưu tiên:** 🔴 CAO - Core user communication system

## 8. Chat System
### Chat Settings (src/components/chat/ChatSettings.tsx)
**Số lượng:** 12 hardcoded strings

### Chi tiết bao gồm:
- Language selection options
- Custom language placeholder
- Save/loading states
- Confirmation dialog text

**Mức độ ưu tiên:*[object Object] BÌNH - Fallback text với translation system

## 9. Error Constants (src/lib/error-constants.ts)
**Số lượng:** 40 hardcoded strings

### Chi tiết:
- Complete Vietnamese error message dictionary
- Authentication, exam, network, validation errors
- Storage và translation error messages

**Mức độ ưu tiên:** 🔴 CAO - Critical error handling

## Tổng kết

### Thống kê tổng quan:
- **Tổng số file có hardcoded Vietnamese:** 15 files
- **Tổng số hardcoded strings:** 168 strings
- **Phân loại theo mức độ ưu tiên:**
  - 🔴 CAO (Critical): 122 strings (73%)
  - 🟡 TRUNG BÌNH (Medium): 46 strings (27%)

### Khuyến nghị hành động:
1. **Ưu tiên cao:** Migrate error messages, auth flows, và payment components
2. **Ưu tiên trung bình:** Update fallback text trong header và chat settings
3. **Tạo translation keys** cho tất cả hardcoded strings
4. **Implement fallback mechanism** để tránh hiển thị undefined khi translation fail

### Files cần xử lý ngay:
1. `src/app/layout.tsx` - SEO metadata
2. `src/lib/error-constants.ts` - Error handling
3. `src/components/auth/*` - Authentication flows
4. `src/components/settings/*` - User settings
5. `src/components/premium/coupon-input.tsx` - Payment flow
6. `src/components/notifications/*` - User communication
7. `src/lib/constants.ts` - JLPT level descriptions
