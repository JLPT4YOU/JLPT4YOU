# Client-only API Keys Migration (Gemini & Groq for iRIN)

Created: 2025-09-01
Owner: JLPT4YOU Engineering
Status: Draft (for review before implementation)

1) Mục tiêu

- Chuyển lưu trữ API key của người dùng (Gemini, Groq) sang client-only (localStorage).
- Loại bỏ hoàn toàn việc lưu key đã mã hóa ở Supabase và bỏ các bước decrypt key từ server.
- Giảm độ phức tạp và bề mặt tấn công: không còn bảng user_api_keys, không còn các API /api/user/keys/*, không cần APP_ENCRYPT_SECRET.
- Giữ trải nghiệm người dùng tốt: nhập/validate key tại Settings/Modal, sau đó chat hoạt động ngay.

2) Phạm vi (Scope)

- Áp dụng cho iRIN chat và 2 provider: Google Gemini, Groq.
- Ảnh hưởng tới: UI nhập key, AIProviderManager, Gemini/Groq services, API routes user/keys, DB migrations.
- Không ảnh hưởng tới các proxy dictionary (Tracau/JDict) hay khu vực khác.

3) Hiện trạng (Pointers quan trọng)

- Server-side lưu/giải mã:
  - Lưu key (encrypt + upsert):
    - src/app/api/user/keys/[provider]/route.ts (PUT/DELETE)
  - Trả key đã decrypt cho client:
    - src/app/api/user/keys/[provider]/decrypt/route.ts
  - Trạng thái đã cấu hình:
    - src/app/api/user/keys/route.ts (GET)
  - Secure wrapper tự fetch key khi cần:
    - src/lib/secure-ai-service-wrapper.ts (gọi /api/user/keys/{provider}/decrypt)
  - Helper cũ:
    - src/lib/api-key-service.ts (cache + decrypt)
  - Bảng Supabase:
    - database/migrations/20250725_user_api_keys.sql (table user_api_keys)

- UI nhập key (hiện gọi API server để lưu):
  - src/components/multi-provider-api-key-modal.tsx

- Base service hiện đang NO-OP với localStorage (đang ép server-only):
  - src/lib/ai-config.ts → getApiKeyFromStorage() trả null, saveApiKeyToStorage() no-op

4) Kiến trúc mới (Client-only)

- Lưu trữ: localStorage của trình duyệt người dùng.
  - Khóa đề xuất:
    - ai:gemini:apiKey
    - ai:groq:apiKey
- Truy xuất: services (Gemini/Groq) đọc từ localStorage hoặc từ configure(apiKey) khi người dùng lưu.
- Không còn fetch tới /api/user/keys/*; không tồn tại server decrypt.
- Đăng xuất: mặc định giữ key trong localStorage (tuỳ chọn mở rộng: thêm nút Clear Keys hoặc auto-clear on logout nếu cần).
- Bảo mật: chấp nhận rủi ro lưu client-side. Đã có cảnh báo trong docs/settings-api-keys.md; sẽ bổ sung cảnh báo rõ ràng hơn.

5) Luồng người dùng sau khi chuyển đổi

- User mở Settings → API Keys modal.
- Nhập key Gemini/Groq → Validate trực tiếp (SDK/provider) → Lưu localStorage → aiProviderManager.configureProvider(provider, key).
- Chat khởi chạy, services gọi ensureConfigured() và sử dụng key đã lưu.

6) Thay đổi kỹ thuật theo module

A. Loại bỏ server endpoints & helpers (deprecate → remove)
- Xoá các endpoint và file sau:
  - src/app/api/user/keys/[provider]/route.ts (PUT/DELETE)
  - src/app/api/user/keys/[provider]/decrypt/route.ts
  - src/app/api/user/keys/route.ts (GET status)
- Xoá helpers liên quan:
  - src/lib/api-key-service.ts
  - src/lib/secure-ai-service-wrapper.ts
- Gỡ bỏ mọi tham chiếu APP_ENCRYPT_SECRET khỏi code và ENV.

B. Bật lại localStorage cho BaseAIService
- File: src/lib/ai-config.ts
- Cập nhật hai hàm sau với guard window để tránh SSR issues:

```ts
protected getApiKeyFromStorage(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const key = localStorage.getItem(`ai:${this.storageKeyPrefix}:apiKey`);
    return key || null;
  } catch {
    return null;
  }
}

protected saveApiKeyToStorage(apiKey: string): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(`ai:${this.storageKeyPrefix}:apiKey`, apiKey);
  } catch {
    // ignore write errors (private mode, quotas, etc.)
  }
}
```

C. Cập nhật Gemini/Groq services
- Files: src/lib/gemini-service.ts, src/lib/groq-service.ts
- Giữ nguyên API hiện tại (constructor và configure đã tương thích).
- Đảm bảo gọi saveApiKeyToStorage(apiKey) trong configure() (Gemini đã có; Groq tương tự).

D. Cập nhật AIProviderManager
- File: src/lib/ai-provider-manager.ts
- Bỏ createSecureAIService wrapper; thay bằng getGeminiService() và getGroqService() trực tiếp.
- configureProvider(provider, apiKey?)
  - Nếu có apiKey: gọi service.configure(apiKey).
  - Nếu không: chỉ phát event config-changed hoặc refresh state.
- isProviderConfigured(provider)
  - Kiểm tra service.getApiKeyFromStorage() (gián tiếp qua constructor/flag) hoặc service.configured.

E. Cập nhật UI nhập key
- File: src/components/multi-provider-api-key-modal.tsx
- Loại bỏ fetch tới /api/user/keys*.
- Validate xong: gọi aiProviderManager.validateApiKey(provider, key), nếu OK thì aiProviderManager.configureProvider(provider, key) → service sẽ lưu localStorage.
- Trạng thái “Configured”: đọc từ localStorage (isProviderConfigured) thay vì gọi API.
- Bổ sung cảnh báo UI: “Keys are stored only in your browser. Clearing browser data will remove them.”

F. Dọn tài liệu & ENV
- docs/settings-api-keys.md: cập nhật mục Security để nêu rõ client-only, không gửi key lên server.
- Xoá APP_ENCRYPT_SECRET khỏi .env.* và code.

7) Thay đổi Database (Migration)

- Thêm migration drop bảng:
  - database/migrations/20250901_drop_user_api_keys.sql

Nội dung gợi ý:
```sql
-- Drop user_api_keys if exists
DROP TABLE IF EXISTS public.user_api_keys;
```
- Kiểm tra và xoá policy/trigger liên quan nếu có.

8) Kế hoạch rollout an toàn

- Pha 1 (song song, không phá vỡ):
  - Implement client-only path (localStorage) và chuyển UI sang dùng trực tiếp.
  - Tạm thời giữ các API /api/user/keys/* (nhưng không dùng) để tiện rollback nhanh.
- Pha 2 (cleanup):
  - Xoá hoàn toàn endpoints /api/user/keys/*, secure wrapper, helpers cũ.
  - Chạy migration drop bảng user_api_keys.
  - Gỡ APP_ENCRYPT_SECRET.

9) Test Plan

- Unit
  - BaseAIService.get/save localStorage (tránh SSR), error tolerance khi localStorage không khả dụng.
  - Gemini/Groq: configure() → ensureConfigured() → sendMessage/stream.
- Integration
  - MultiProviderApiKeyModal: validate → configure → gửi chat thành công.
  - Chuyển provider, đổi model mặc định, luồng thinking/files (Gemini) nếu có.
- E2E
  - Nhập key hợp lệ/không hợp lệ.
  - Update key, clear key (xóa localStorage), refresh trang; trạng thái Configured hiển thị đúng.
- Security
  - Không còn network call tới /api/user/keys/*.
  - Không còn tham chiếu APP_ENCRYPT_SECRET.
  - Không dùng localStorage trong SSR.

10) Rủi ro & giảm thiểu

- Mất key khi xoá dữ liệu trình duyệt → hiển thị cảnh báo rõ ràng; có nút Re-enter dễ tiếp cận.
- Key lộ trên máy người dùng → đã chấp nhận theo thiết kế client-only; bổ sung docs và cảnh báo UI.
- Lỗi đồng bộ đa tab → cân nhắc lắng nghe window.storage để cập nhật UI trạng thái Configured.
- Key cũ đã lưu ở server sẽ không dùng nữa → thông báo người dùng cần nhập lại key lần đầu sau cập nhật.

11) Backout (Rollback)

- Giữ nhánh/backup trước khi xoá endpoints & bảng.
- Nếu cần quay lại: revert commits, khôi phục endpoints /api/user/keys/*, secure wrapper, APP_ENCRYPT_SECRET và bảng user_api_keys.

12) Checklist thay đổi file

- XÓA
  - src/lib/secure-ai-service-wrapper.ts
  - src/lib/api-key-service.ts
  - src/app/api/user/keys/[provider]/decrypt/route.ts
  - src/app/api/user/keys/[provider]/route.ts
  - src/app/api/user/keys/route.ts

- SỬA
  - src/lib/ai-config.ts (bật localStorage get/save như snippet ở trên)
  - src/lib/gemini-service.ts (đảm bảo saveApiKeyToStorage trong configure – hiện đã có)
  - src/lib/groq-service.ts (đảm bảo hành vi tương tự Gemini)
  - src/lib/ai-provider-manager.ts (bỏ secure wrapper, dùng services trực tiếp; cập nhật configure/isProviderConfigured)
  - src/components/multi-provider-api-key-modal.tsx (bỏ API calls; validate→configure→update trạng thái)
  - docs/settings-api-keys.md (bổ sung cảnh báo client-only)

- THÊM
  - database/migrations/20250901_drop_user_api_keys.sql (DROP TABLE)
  - Cập nhật README này vào repo: docs/README_CLIENT_ONLY_KEYS_MIGRATION.md

13) Thời gian & phân công (đề xuất)

- Dev: 0.5–1 ngày
- Test & fix: 0.5 ngày
- Rollout & DB cleanup: 0.5 ngày

14) Ghi chú hiển thị cho người dùng

- “API keys are stored only in your browser (localStorage). They’re not sent to JLPT4YOU servers.”
- “If you clear browser data or switch browsers/devices, you’ll need to re-enter your keys.”
- “Groq in browser may require ‘dangerouslyAllowBrowser’ – review provider docs if applicable.”

15) Tài liệu tham chiếu nội bộ

- UI hiện tại & mô tả: docs/settings-api-keys.md
- Các file dịch vụ: src/lib/gemini-service.ts, src/lib/groq-service.ts
- Provider manager: src/lib/ai-provider-manager.ts
- Modal: src/components/multi-provider-api-key-modal.tsx
- Endpoints sẽ gỡ: src/app/api/user/keys/*
- Bảng sẽ drop: database/migrations/20250725_user_api_keys.sql

