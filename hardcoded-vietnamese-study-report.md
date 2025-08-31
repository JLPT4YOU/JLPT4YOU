# Báo cáo Hardcoded Tiếng Việt trong Thư mục /study

## Tổng quan
Đã quét toàn bộ thư mục `/study` (bao gồm `src/app/study` và `src/components/study`) để tìm các đoạn text tiếng Việt được hardcode. Báo cáo này chi tiết từng file có chứa hardcoded Vietnamese strings.

## 1. Components Study (src/components/study/)

### 1.1 study-level-page-content.tsx
**Vị trí:** `src/components/study/study-level-page-content.tsx`
**Số lượng:** 5 hardcoded strings
**Mức độ ưu tiên:** 🟡 TRUNG BÌNH - Fallback text khi translation system fail

#### Chi tiết:
- **Line 42:** `'Lý thuyết'` (fallback cho theory title)
- **Line 43:** `'Học kiến thức cơ bản'` (fallback cho theory description)  
- **Line 52:** `'Thực hành'` (fallback cho practice title)
- **Line 53:** `'Bài tập ứng dụng'` (fallback cho practice description)
- **Line 65:** `'Chọn loại học tập'` (fallback cho select type subtitle)

### 1.2 study-practice-page-content.tsx
**Vị trí:** `src/components/study/study-practice-page-content.tsx`
**Số lượng:** 1 hardcoded string
**Mức độ ưu tiên:** 🟡 TRUNG BÌNH - Breadcrumb label

#### Chi tiết:
- **Line 35:** `'Bài tập'` (breadcrumb label)

### 1.3 study-theory-page-content.tsx
**Vị trí:** `src/components/study/study-theory-page-content.tsx`
**Số lượng:** 1 hardcoded string
**Mức độ ưu tiên:** 🟡 TRUNG BÌNH - Fallback message

#### Chi tiết:
- **Line 57:** `'Chúng tôi đang phát triển tính năng này để mang đến trải nghiệm học tập tốt nhất cho bạn.'` (fallback cho coming soon message)

### 1.4 practice/ExerciseDisplay.tsx
**Vị trí:** `src/components/study/practice/ExerciseDisplay.tsx`
**Số lượng:** 9 hardcoded strings
**Mức độ ưu tiên:** 🔴 CAO - User-facing exercise feedback và explanation labels

#### Chi tiết:
- **Line 239:** `'Bạn đã trả lời đúng'` / `'Bạn đã trả lời sai'` (feedback messages)
- **Line 247:** `'✓ Đáp án đúng:'` (correct answer label)
- **Line 254:** `'🌐 Dịch nghĩa:'` (translation label)
- **Line 261:** `'📚 Tại sao đúng:'` (explanation label)
- **Line 268:** `'❌ Tại sao các lựa chọn khác sai:'` (wrong answers label)
- **Line 291:** `'[object Object]hi chú thêm:'` (additional notes label)
- **Line 299:** `'📝 Ví dụ sử dụng:'` (example usage label)
- **Line 317:** `'💡 Ghi chú thêm:'` (duplicate additional notes)
- **Line 324[object Object]Ví dụ sử dụng:'` (duplicate example usage)

### 1.5 practice/ExerciseGenerator.tsx
**Vị trí:** `src/components/study/practice/ExerciseGenerator.tsx`
**Số lượng:** 5 hardcoded strings
**Mức độ ưu tiên:** [object Object] - Comments và UI labels

#### Chi tiết:
- **Line 37:** `// Gemini 2.5 Pro có thinking mode mặc định, không cần toggle` (comment)
- **Line 48:** `// Tự động tính offset từ lesson` (comment)
- **Line 121:** `'bài đọc'` (reading passage label)
- **Line 258:** `'Bài đọc'` (reading section label)
- **Line 261:** `'câu hỏi'` (questions label)

## 2. App Study Pages (src/app/study/)

### 2.1 [level]/theory/page.tsx
**Vị trí:** `src/app/study/[level]/theory/page.tsx`
**Số lượng:** 6 hardcoded strings
**Mức độ ưu tiên:** 🟡 TRUNG BÌNH - Fallback text và aria-labels

#### Chi tiết:
- **Line 51:** `aria-label="Học từ vựng cấp độ ${level.toUpperCase()}"` (accessibility label)
- **Line 57:** `'Từ vựng'` (fallback vocabulary title)
- **Line 58:** `'Học từ vựng theo cấp độ'` (fallback vocabulary description)
- **Line 66:** `aria-label="Học ngữ pháp cấp độ ${level.toUpperCase()}"` (accessibility label)
- **Line 72:** `'Ngữ pháp'` (fallback grammar title)
- **Line 73:** `'Học ngữ pháp theo cấp độ'` (fallback grammar description)

### 2.2 [level]/practice/grammar/page.tsx
**Vị trí:** `src/app/study/[level]/practice/grammar/page.tsx`
**Số lượng:** 6 hardcoded strings
**Mức độ ưu tiên:** 🔴 CAO - User-facing navigation và descriptions

#### Chi tiết:
- **Line 43:** `'Chọn phương thức học ngữ pháp'` (page subtitle)
- **Line 56:** `aria-label="Flashcard học ngữ pháp"` (accessibility label)
- **Line 63:** `'Học ngữ pháp qua thẻ ghi nhớ tương tác'` (flashcard description)
- **Line 71:** `aria-label="Trắc nghiệm AI ngữ pháp"` (accessibility label)
- **Line 77:** `'Trắc nghiệm AI'` (quiz title)
- **Line 78:** `'Luyện tập với câu hỏi do AI tạo ra'` (quiz description)

### 2.3 [level]/practice/grammar/flashcard/page.tsx
**Vị trí:** `src/app/study/[level]/practice/grammar/flashcard/page.tsx`
**Số lượng:** 13 hardcoded strings
**Mức độ ưu tiên:** [object Object] learning functionality

#### Chi tiết:
- **Line 45:** `'Không có nghĩa'` (no meaning fallback)
- **Line 54:** `'Cấu trúc:'` (structure label)
- **Line 59:** `'Cách dùng:'` (usage label)
- **Line 66:** `'Ví dụ:'` (example label)
- **Line 97:** `'Không thể tải ngữ pháp. Vui lòng thử lại.'` (error message)
- **Line 111:** `'Hoàn thành! Bạn đã học ${session.cards.length} ngữ pháp với độ chính xác ${Math.round((session.correctAnswers / session.totalAnswers) * 100)}%'` (completion message)
- **Line 136:** `'Chuẩn bị flashcard cho ${level.toUpperCase()}'` (loading message)
- **Line 157:** `'Có lỗi xảy ra'` (error state title)
- **Line 166:** `'Thử lại'` (retry button)
- **Line 187:** `'Không có ngữ pháp'` (empty state title)
- **Line 190:** `'Không tìm thấy ngữ pháp cho cấp độ ${level.toUpperCase()}'` (empty state message)
- **Line 196:** `'Quay lại'` (back button)
- **Line 214:** `'Flashcard ngữ pháp ${level.toUpperCase()}'` (page title)

### 2.4 [level]/practice/vocabulary/page.tsx
**Vị trí:** `src/app/study/[level]/practice/vocabulary/page.tsx`
**Số lượng:** 6 hardcoded strings
**Mức độ ưu tiên:** 🔴 CAO - User-facing navigation và descriptions

#### Chi tiết:
- **Line 43:** `'Chọn phương thức học từ vựng'` (page subtitle)
- **Line 56:** `aria-label="Flashcard học từ vựng"` (accessibility label)
- **Line 63:** `'Học từ vựng qua thẻ ghi nhớ tương tác'` (flashcard description)
- **Line 71:** `aria-label="Trắc nghiệm AI từ vựng"` (accessibility label)
- **Line 77:** `'Trắc nghiệm AI'` (quiz title)
- **Line 78:** `'Luyện tập với câu hỏi do AI tạo ra'` (quiz description)

### 2.5 [level]/practice/vocabulary/flashcard/page.tsx
**Vị trí:** `src/app/study/[level]/practice/vocabulary/flashcard/page.tsx`
**Số lượng:** 9 hardcoded strings
**Mức độ ưu tiên:** 🔴 CAO - Core learning functionality

#### Chi tiết:
- **Line 52:** `'Không có nghĩa'` (no meaning fallback)
- **Line 56:** `'Đọc:'` (reading label)
- **Line 66:** `'Loại từ:'` (part of speech label)
- **Line 71:** `'Ví dụ:'` (example label)
- **Line 95:** `'Không thể tải từ vựng. Vui lòng thử lại.'` (error message)
- **Line 109:** `'Hoàn thành! Bạn đã học ${session.cards.length} từ vựng với độ chính xác ${Math.round((session.correctAnswers / session.totalAnswers) * 100)}%'` (completion message)
- **Line 134:** `'Chuẩn bị flashcard cho ${level.toUpperCase()}'` (loading message)
- **Line 155:** `'Có lỗi xảy ra'` (error state title)
- **Line 164:** `'Thử lại'` (retry button)

## Tổng kết

### Thống kê tổng quan:
- **Tổng số file có hardcoded Vietnamese:** 10 files
- **Tổng số hardcoded strings:** 61 strings
- **Phân loại theo mức độ ưu tiên:**
  - 🔴 CAO (Critical): 43 strings (70.5%)
  - [object Object] (Medium): 18 strings (29.5%)

### Phân tích theo loại:
1. **Exercise Display & Feedback (9 strings):** Labels cho explanation sections
2. **Flashcard Functionality (22 strings):** Core learning features
3. **Navigation & UI (15 strings):** Page titles, descriptions, buttons
4. **Error Handling (8 strings):** Error messages và retry actions
5. **Accessibility Labels (7 strings):** aria-label attributes

### Khuyến nghị hành động:

#### Ưu tiên cao (Cần xử lý ngay):
1. **ExerciseDisplay.tsx** - Exercise feedback và explanation labels
2. **Flashcard pages** - Core learning functionality text
3. **Practice navigation pages** - User-facing descriptions

#### Ưu tiên trung bình:
1. **Fallback text** trong các component chính
2. **Comments** trong code (có thể để lại)
3. **Breadcrumb labels**

### Files cần xử lý ngay:
1. `src/components/study/practice/ExerciseDisplay.tsx`
2. `src/app/study/[level]/practice/grammar/flashcard/page.tsx`
3. `src/app/study/[level]/practice/vocabulary/flashcard/page.tsx`
4. `src/app/study/[level]/practice/grammar/page.tsx`
5. `src/app/study/[level]/practice/vocabulary/page.tsx`
6. `src/app/study/[level]/theory/page.tsx`
7. `src/components/study/study-level-page-content.tsx`

### Giải pháp đề xuất:
1. **Tạo translation keys** cho tất cả hardcoded strings
2. **Implement fallback mechanism** để tránh hiển thị undefined
3. **Standardize error messages** thông qua error constants
4. **Update accessibility labels** để support đa ngôn ngữ
