# Báo cáo & Kế hoạch Tối ưu /irin sau Nâng cấp AI Proxy (2025-09-02)

Đây là tài liệu ghi nhận hiện trạng trang chat /irin sau khi chuyển sang mô hình AI proxy an toàn và đề xuất các bước phát triển, tối ưu tiếp theo.

---

## 1. Hiện trạng & Tính năng đã Hoàn thành

- **Bảo mật API Key:** Đã chuyển 100% logic gọi AI (Gemini, Groq) về backend. API key của người dùng được lưu trữ và sử dụng an toàn ở server, không còn lộ ra client.

- **Streaming Gemini Thật:** Đã nâng cấp streaming cho Gemini từ "giả-stream" (single-chunk) thành streaming thật sự qua `generateContentStream`. Client nhận được token ngay khi có, cải thiện trải nghiệm thấy rõ.

- **Hủy Stream (Abort):** Đã tích hợp `AbortController` cho phép người dùng hủy yêu cầu stream đang chạy, tiết kiệm token và thời gian.

- **Gemini Tools (Server-side):**
  - **Google Search:** Đã hoạt động. Server tự động gắn tool `googleSearch` khi client yêu cầu, giúp AI có thông tin real-time.
  - **URL Context:** Đã hoạt động. Server có thể nhận và xử lý tool `urlContext`.
  - **Code Execution:** Đã hoạt động. Server có thể nhận, xử lý và stream kết quả từ `executableCode` và `codeExecutionResult`.

- **Ngữ cảnh Thời gian Thực:** Server tự động chèn ngày giờ hiện tại vào system prompt, giúp AI trả lời chính xác các câu hỏi về thời gian ("hôm nay ngày mấy?").

- **Model Capability Guard:** Server đã có cơ chế "phòng vệ", chỉ gắn tool (Search, Code Execution) vào request nếu model được chọn thực sự hỗ trợ, tránh gây lỗi và lãng phí tài nguyên.

- **Dọn dẹp Console Log:** Đã lọc bỏ các log không cần thiết ở môi trường dev để dễ gỡ lỗi hơn.

---

## 2. Kế hoạch Tối ưu & Phát triển Tiếp theo

### Phase 1: Hoàn thiện Trải nghiệm Tools & UI

- **[ ] Thinking Mode cho Gemini 2.5:**
  - **Mục tiêu:** Kích hoạt chế độ "suy nghĩ" của các model Gemini 2.5 để có câu trả lời chất lượng hơn cho các câu hỏi phức tạp.
  - **Công việc:** Wire cờ `enableThinking` từ client và gắn `thinkingConfig` vào request ở server nếu model hỗ trợ.

- **[ ] UI Validation cho Tools:**
  - **Mục tiêu:** Giao diện người dùng (UI) phản ánh đúng khả năng của model đang chọn.
  - **Công việc:** Vô hiệu hóa (disable) các toggle bật/tắt tool (Search, Code Execution) nếu model hiện tại không hỗ trợ. Ví dụ: chọn Gemini 2.0 thì toggle "Code Execution" bị xám đi.

- **[ ] Tối ưu Hiển thị Code Execution:**
  - **Mục tiêu:** Hiển thị code và output một cách trực quan, dễ đọc.
  - **Công việc:** Cập nhật UI để render các khối `executableCode` và `codeExecutionResult` một cách riêng biệt, có thể kèm nút copy code.

### Phase 2: Hỗ trợ Đa phương thức (Multimodal)

- **[ ] Upload File/Ảnh:**
  - **Mục tiêu:** Cho phép người dùng upload ảnh (PNG, JPG) hoặc file (PDF) để hỏi đáp.
  - **Công việc:**
    1.  Tạo API route `/api/ai-proxy/attachments` để upload file lên Supabase Storage một cách an toàn.
    2.  Cập nhật route `/api/ai-proxy/chat` để nhận `parts` đa phương thức (chứa text và file URL).
    3.  Cập nhật UI cho phép đính kèm file.

### Phase 3: Nâng cao & Giám sát

- **[ ] Observability (Giám sát):**
  - **Mục tiêu:** Xây dựng hệ thống log và metric chi tiết để theo dõi hiệu năng và chi phí.
  - **Công việc:** Thêm `requestId`, structured logs (provider, model, duration, token in/out), và mã lỗi chuẩn (AI_PROXY_xxx) cho tất cả các endpoint proxy.

- **[ ] Quản lý Chi phí:**
  - **Mục tiêu:** Giúp người dùng nhận biết và kiểm soát chi phí.
  - **Công việc:** Hiển thị cảnh báo nhỏ khi người dùng chọn các model hoặc tool cao cấp (ví dụ: "Model này có thể tốn nhiều token hơn").

- **[ ] Tinh chỉnh System Prompt:**
  - **Mục tiêu:** Hướng dẫn AI sử dụng tools hiệu quả hơn.
  - **Công việc:** Bổ sung hướng dẫn vào system prompt về cách và khi nào nên dùng Search, Code Execution để cho ra kết quả tốt nhất.
