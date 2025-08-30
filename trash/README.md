# 🗑️ Trash Folder

## Mục đích
Thư mục này chứa các file đã được di chuyển khỏi production code để dọn dẹp dự án.

## Nội dung

### Test Pages (`test-pages/`)
- `test-balance/` - Trang test balance functionality (có hardcode colors)
- `test-topup/` - Trang test topup functionality (có hardcode colors)

### Auth Pages (`auth-pages/`)
- `page-simple.tsx` - Simple login page (có hardcode colors, không sử dụng)

## Lý do di chuyển
1. **Hardcode Colors**: Các trang này sử dụng hardcode màu sắc không tương thích với design system
2. **Demo/Test Code**: Không phải production code, chỉ dùng để test
3. **Code Quality**: Không tuân thủ coding standards của dự án

## Có thể khôi phục
Nếu cần thiết, các file này có thể được khôi phục và refactor để tuân thủ design system.

## Ngày di chuyển
2025-01-16 - Trong quá trình cleanup hardcode colors
