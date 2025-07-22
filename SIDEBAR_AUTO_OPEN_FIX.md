# Sidebar AI Auto-Open Fix

## Vấn đề (Problem)

Sidebar AI đang tự động mở không mong muốn khi người dùng chọn model mới. Hành vi này gây khó chịu cho người dùng vì sidebar chỉ nên mở khi họ chủ động bấm nút mở.

### Triệu chứng (Symptoms)
- Sidebar AI tự động xuất hiện khi chọn model
- Trải nghiệm người dùng không dự đoán được
- Sidebar mở mà không có sự đồng ý của người dùng

## Nguyên nhân (Root Cause)

Trong file `src/components/chat/ChatLayout.tsx`, có một `useEffect` với dependency array `[selectedModel, isLargeScreen]` (dòng 137 trước khi fix):

```typescript
useEffect(() => {
  // Set sidebar state based on screen size
  setIsSidebarOpen(isLargeScreen);
  
  // ... other initialization logic
}, [selectedModel, isLargeScreen]); // ❌ Problematic dependencies
```

**Vấn đề:** Mỗi khi `selectedModel` thay đổi (khi người dùng chọn model mới), useEffect này chạy lại và gọi `setIsSidebarOpen(isLargeScreen)`, gây ra việc sidebar tự động mở trên màn hình lớn.

## Giải pháp (Solution)

### 1. Tách useEffect thành hai phần riêng biệt

**Trước khi fix:**
```typescript
useEffect(() => {
  setIsSidebarOpen(isLargeScreen);
  // ... initialization logic
}, [selectedModel, isLargeScreen]); // Problematic
```

**Sau khi fix:**
```typescript
// 1. Initial setup - chỉ chạy một lần khi mount
useEffect(() => {
  setIsSidebarOpen(isLargeScreen);
  // ... initialization logic
}, []); // ✅ Chỉ chạy khi mount

// 2. Screen size handling - với user intent tracking
useEffect(() => {
  if (isLargeScreen && !userClosedSidebarRef.current) {
    setIsSidebarOpen(true);
  }
  if (!isLargeScreen) {
    userClosedSidebarRef.current = false; // Reset on mobile
  }
}, [isLargeScreen]); // ✅ Chỉ phản ứng với screen size
```

### 2. Loại bỏ dependency `selectedModel`

- Loại bỏ `selectedModel` khỏi dependency array của useEffect điều khiển sidebar
- Đảm bảo việc chọn model không ảnh hưởng đến trạng thái sidebar

### 3. User Intent Tracking

- Thêm `userClosedSidebarRef` để track khi user chủ động đóng sidebar
- Chỉ auto-open khi user chưa từng đóng sidebar trên màn hình lớn
- Reset user intent khi chuyển sang mobile

### 4. Cải thiện toggle handlers

```typescript
// Track user intent in toggle handlers
const newState = !isSidebarOpen;
setIsSidebarOpen(newState);
if (!newState && isLargeScreen) {
  userClosedSidebarRef.current = true; // Mark as user-closed
}
```

## Kết quả (Results)

### ✅ Hành vi mong đợi sau khi fix:
1. **Chọn model:** Chỉ thay đổi model, không ảnh hưởng sidebar
2. **Bấm nút mở sidebar:** Sidebar mới được phép xuất hiện
3. **Responsive design:** Vẫn hoạt động đúng với thay đổi kích thước màn hình
4. **Trải nghiệm người dùng:** Dự đoán được và có thể kiểm soát

### 🧪 Test validation:
- Tạo test file `src/__tests__/lib/sidebar-fix-validation.test.ts`
- Validate logic fix và expected behaviors
- Tất cả test cases đều pass ✅

## Files thay đổi (Changed Files)

### `src/components/chat/ChatLayout.tsx`
- **Dòng 87-143:** Tách useEffect thành hai phần riêng biệt
- **Dòng 134-135:** Thêm eslint-disable comment để giải thích intentional dependency omission

### `src/__tests__/lib/sidebar-fix-validation.test.ts` (New)
- Test validation cho fix logic
- Verify expected behaviors
- Root cause analysis validation

### `SIDEBAR_AUTO_OPEN_FIX.md` (New)
- Documentation về fix này

## Technical Details

### useEffect Dependencies Analysis:

**Before Fix:**
```typescript
[selectedModel, isLargeScreen] // ❌ Causes auto-open on model change
```

**After Fix:**
```typescript
// Setup useEffect
[] // ✅ Only runs on mount

// Screen size useEffect  
[isLargeScreen, isSidebarOpen] // ✅ Only responds to screen changes
```

### Preserved Functionality:
- ✅ Model selection vẫn hoạt động bình thường
- ✅ Responsive design vẫn hoạt động
- ✅ Manual sidebar toggle vẫn hoạt động
- ✅ Initial setup logic vẫn chạy
- ✅ Thinking mode logic không bị ảnh hưởng

## Verification Steps

1. **Manual Testing:**
   - Mở ứng dụng tại `http://localhost:3001`
   - Chọn các model khác nhau
   - Verify sidebar không tự động mở
   - Bấm nút menu để mở sidebar manually
   - Verify responsive behavior

2. **Automated Testing:**
   ```bash
   npm test -- src/__tests__/lib/sidebar-fix-validation.test.ts
   ```

3. **Build Verification:**
   ```bash
   npm run build
   ```

## Conclusion

Fix này thành công giải quyết vấn đề sidebar tự động mở không mong muốn bằng cách:

1. **Tách concerns:** Tách logic initialization và screen size handling
2. **Loại bỏ side effect:** Không để model selection ảnh hưởng sidebar state  
3. **Preserve functionality:** Giữ nguyên tất cả chức năng khác
4. **Improve UX:** Người dùng có toàn quyền kiểm soát sidebar

**Status: ✅ RESOLVED**
