# Test Plan: PDF Annotation Scaling Fix

## Vấn đề cần test
Khi zoom PDF in/out, annotation phải luôn nằm đúng vị trí trên nội dung PDF, không bị lệch.

## Test Cases

### Test Case 1: Vẽ annotation ở scale mặc định
1. Mở PDF viewer tại http://localhost:3001/test/pdf-annotation
2. Click vào pen tool để kích hoạt annotation
3. Vẽ một đường thẳng trên một từ cụ thể trong PDF
4. Ghi nhớ vị trí từ đó

### Test Case 2: Zoom in và kiểm tra vị trí
1. Sau khi vẽ annotation ở Test Case 1
2. Click zoom in (+ button) để phóng to PDF
3. Kiểm tra xem annotation có còn nằm đúng trên từ đó không
4. Annotation phải scale theo và vẫn nằm đúng vị trí

### Test Case 3: Zoom out và kiểm tra vị trí  
1. Từ trạng thái zoom in ở Test Case 2
2. Click zoom out (- button) để thu nhỏ PDF
3. Kiểm tra xem annotation có còn nằm đúng trên từ đó không
4. Annotation phải scale theo và vẫn nằm đúng vị trí

### Test Case 4: Vẽ annotation ở scale khác nhau
1. Zoom PDF đến scale khác (ví dụ 1.5x)
2. Vẽ annotation mới trên một từ khác
3. Zoom in/out và kiểm tra cả 2 annotation
4. Cả 2 annotation phải luôn nằm đúng vị trí

### Test Case 5: Multiple zoom levels
1. Vẽ annotation ở scale 1.0
2. Zoom to 1.5x, vẽ annotation khác
3. Zoom to 2.0x, vẽ annotation thứ 3
4. Zoom về 1.0x và kiểm tra tất cả annotation
5. Tất cả phải nằm đúng vị trí

## Expected Results
- ✅ Annotation luôn nằm đúng vị trí trên PDF content
- ✅ Annotation scale theo zoom level
- ✅ Brush size scale theo zoom level
- ✅ Không có lag hoặc glitch khi zoom
- ✅ Annotation vẽ ở scale khác nhau đều hoạt động đúng

### Test Case 6: Highlight Tool Fix
1. Kích hoạt highlight tool
2. Chọn màu highlight (ví dụ: vàng)
3. Tô highlight lên text trong PDF
4. Kiểm tra text vẫn hiển thị rõ ràng (không bị mất)
5. Highlight phải có hiệu ứng trong suốt

## Actual Results
### Fix 1: Coordinate Scaling ✅
- Đã sửa coordinate normalization
- Annotation giờ scale đúng theo zoom level
- Vị trí annotation luôn chính xác

### Fix 2: Highlight Tool ✅
- Thay đổi từ `multiply` blend mode sang `source-over` với alpha transparency
- Highlight color được convert thành rgba với alpha = 0.3
- Brush size của highlight tự động x3 để tạo hiệu ứng tô rộng hơn
- Text không còn bị mất khi highlight

### Fix 3: Undo/Redo Functionality ✅
- Implement history stack để lưu trữ các state của strokes
- Undo: restore previous state, save current to redo stack
- Redo: restore from redo stack, save current to history
- Auto-update canUndo/canRedo button states
- Support up to 50 history states để tránh memory issues

## Test Cases cho Undo/Redo

### Test Case 7: Basic Undo/Redo
1. Vẽ một stroke
2. Click undo button → stroke biến mất
3. Click redo button → stroke xuất hiện lại
4. Kiểm tra button states (enabled/disabled)

### Test Case 8: Multiple Strokes Undo/Redo
1. Vẽ 3 strokes khác nhau
2. Undo 2 lần → chỉ còn 1 stroke
3. Redo 1 lần → có 2 strokes
4. Vẽ stroke mới → redo stack bị clear

### Test Case 9: Mixed Tools Undo/Redo
1. Vẽ với pen tool
2. Vẽ với highlight tool
3. Vẽ với eraser tool
4. Test undo/redo với tất cả các tool

## Technical Implementation
- Coordinates được normalize về PDF dimensions gốc (width, height)
- Khi render, coordinates được scale theo current scale factor
- Mouse input được convert đúng về normalized coordinates
- Canvas size được setup đúng theo scaled dimensions
