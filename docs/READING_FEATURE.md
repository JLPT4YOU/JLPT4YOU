# Reading Comprehension Feature

## Tổng quan

Chức năng Reading Comprehension (Đọc hiểu) đã được thêm vào JLPT4YOU, cho phép người dùng luyện tập đọc hiểu với các bài đọc được tạo bởi AI kết hợp từ vựng và ngữ pháp phù hợp với từng level.

## Tính năng chính

### 1. Tùy chọn độ dài bài đọc
- **Short (Ngắn)**: 50-150 từ (phù hợp N5, N4)
- **Medium (Trung bình)**: 150-400 từ (phù hợp N3, N2)  
- **Long (Dài)**: 300-800+ từ (phù hợp N1, N2)

### 2. Số lượng bài đọc
- Tối đa 5 bài đọc mỗi lần
- Mỗi bài đọc có đúng 3 câu hỏi trắc nghiệm A, B, C, D
- Tổng cộng tối đa 15 câu hỏi (5 bài × 3 câu hỏi)

### 3. Loại câu hỏi
Mỗi bài đọc có 3 loại câu hỏi:
1. **Main idea / Overall comprehension**: Ý chính của bài đọc
2. **Specific detail / Information retrieval**: Chi tiết cụ thể trong bài
3. **Inference / Author's intention**: Suy luận và ý định tác giả

### 4. Tích hợp từ vựng và ngữ pháp
- AI tự động kết hợp 3-5 từ vựng từ database JLPT
- Sử dụng 2-3 mẫu ngữ pháp phù hợp với level
- Đảm bảo tính tự nhiên và mạch lạc của bài đọc

## Cách sử dụng

### Bước 1: Truy cập Reading Practice
1. Vào `/study/[level]/practice` (ví dụ: `/study/n5/practice`)
2. Click vào card "Đọc hiểu" (Reading Comprehension)

### Bước 2: Cấu hình bài tập
1. **Chọn độ dài bài đọc**: Short/Medium/Long
2. **Chọn số lượng bài đọc**: 1-5 bài
3. **Chọn độ khó**: Easy/Medium/Hard/Extremely Hard
4. **Chọn AI model**: Gemini 2.5 Flash (khuyến nghị)
5. Click "Tạo bài tập"

### Bước 3: Làm bài
1. Đọc kỹ bài đọc trong khung màu xám
2. Trả lời 3 câu hỏi cho mỗi bài đọc
3. Click "Tiếp theo" để chuyển sang câu hỏi tiếp theo
4. Xem giải thích chi tiết sau khi trả lời

### Bước 4: Xem kết quả
- Điểm số và độ chính xác
- Phân tích chi tiết từng câu trả lời
- Từ vựng và ngữ pháp đã sử dụng
- Khuyến nghị học tập

## Cấu trúc kỹ thuật

### API Endpoint
- **URL**: `/api/study/generate`
- **Method**: POST
- **Type**: `reading`

### Request Format
```json
{
  "level": "n5",
  "type": "reading", 
  "count": 3,
  "difficulty": "medium_short",
  "selectionMode": "random",
  "materialLimit": 30,
  "model": "gemini-2.5-flash"
}
```

### Response Format
```json
{
  "success": true,
  "data": {
    "questions": [
      {
        "id": "passage1_q1",
        "type": "reading_comprehension",
        "passage": "Bài đọc tiếng Nhật...",
        "question": "Câu hỏi 1",
        "options": ["A", "B", "C", "D"],
        "correct": 0,
        "explanation": { ... },
        "vocabulary_used": ["word1", "word2"],
        "grammar_used": ["pattern1", "pattern2"]
      }
    ]
  }
}
```

### Database Schema
Không cần thay đổi database schema. Reading sử dụng cùng cấu trúc Question interface với các field bổ sung:
- `passage`: Nội dung bài đọc
- `vocabulary_used`: Danh sách từ vựng sử dụng
- `grammar_used`: Danh sách ngữ pháp sử dụng

## Files đã thay đổi

### 1. Translations
- `src/translations/vn.json`
- `src/translations/jp.json` 
- `src/translations/en.json`

### 2. Components
- `src/app/study/[level]/practice/page.tsx` - Thêm Reading card
- `src/app/study/[level]/practice/reading/page.tsx` - Trang Reading mới
- `src/components/study/practice/ExerciseGenerator.tsx` - Thêm Reading options
- `src/components/study/practice/ExerciseDisplay.tsx` - Hiển thị passage

### 3. API & Logic
- `src/app/api/study/generate/route.ts` - Xử lý Reading type
- `src/lib/study/exercise-prompts.ts` - Reading prompt template
- `src/hooks/usePracticeExercise.ts` - Cập nhật Question interface

## Lưu ý quan trọng

1. **Yêu cầu API Key**: Cần Gemini API key để tạo bài đọc
2. **Thời gian tạo**: Reading mất nhiều thời gian hơn vocabulary/grammar (30-60s)
3. **Chất lượng**: AI tạo bài đọc tự nhiên nhưng cần review định kỳ
4. **Giới hạn**: Tối đa 5 bài đọc/lần để tránh quá tải

## Roadmap tương lai

- [ ] Thêm audio cho bài đọc (Text-to-Speech)
- [ ] Lưu bài đọc yêu thích
- [ ] Thống kê chi tiết theo chủ đề
- [ ] Import bài đọc từ file PDF/text
- [ ] Chế độ thi thử với thời gian giới hạn
