# User Prompt Generator System

## Tổng quan

Hệ thống User Prompt Generator được tạo để giải quyết vấn đề của hệ thống prompt cũ - việc tạo prompt có thể ảnh hưởng đến core identity của iRIN.

## Vấn đề của hệ thống cũ

```
❌ HỆ THỐNG CŨ:
Core iRIN + User Input → AI Generator → Mixed Prompt
(Core identity có thể bị ảnh hưởng trong quá trình tạo)
```

## Giải pháp mới

```
✅ HỆ THỐNG MỚI:
Bước 1: User Input → AI Generator → Pure User Prompt (không có core)
Bước 2: Core iRIN + Pure User Prompt → Final Combined Prompt
```

## Cấu trúc Files

### 1. `src/lib/user-prompt-generator.ts`
**Chức năng chính:**
- `generateUserPrompt()`: Tạo prompt user thuần túy với Professional Prompt Engineering
- `combinePrompts()`: Kết hợp core + user prompt
- `saveUserPromptConfig()`: Lưu cấu hình
- `getUserPromptConfig()`: Load cấu hình

**Ví dụ sử dụng:**
```typescript
const userInputs = {
  preferredName: "Long",
  desiredTraits: "vui vẻ, hài hước",
  personalInfo: "developer, thích công nghệ",
  additionalRequests: "sử dụng emoji"
};

const userPrompt = await generateUserPrompt(userInputs);
// Output: "Gọi user bằng tên Long. Phản hồi vui vẻ, hài hước..."

const finalPrompt = combinePrompts(corePrompt, userPrompt);
```

### 2. `src/components/chat/UserPromptGenerator.tsx`
**UI Component cho:**
- Form nhập thông tin user (4 trường)
- Button tạo prompt
- Preview prompt đã tạo
- Preview kết hợp với core
- Quản lý lưu/load config

### 3. `src/components/chat/PromptSettingsTab.tsx`
**Tab container:**
- Tab "User Prompt (Mới)" - khuyến nghị
- Tab "Hệ thống cũ" - backup
- Status overview
- Hướng dẫn sử dụng

## Workflow

### Bước 1: Tạo User Prompt
```
User Input:
├── Tên gọi: "Long"
├── Đặc điểm: "vui vẻ, hài hước"
├── Thông tin: "developer"
└── Yêu cầu: "dùng emoji"

↓ Professional Prompt Engineer (Gemini Flash 2.0)

User Prompt:
"Address the user as Long. Communicate with a cheerful, humorous style.
Use appropriate emojis and provide practical examples when discussing topics..."
```

### Bước 2: Kết hợp với Core
```
Core Prompt:
"You are iRIN, a versatile AI teacher from JLPT4YOU..."

+

User Prompt:
"Gọi user bằng tên Long. Phản hồi vui vẻ, hài hước..."

=

Final Prompt:
"You are iRIN, a versatile AI teacher from JLPT4YOU...

Address the user as Long. Respond with cheerful, humorous style...

Apply the above communication style in all conversations with the user."
```

## Ưu điểm

### 🔒 Bảo mật
- Core identity không bao giờ bị ảnh hưởng
- User prompt được tạo riêng biệt
- Không có risk jailbreak core

### 🎯 Chính xác & Chuyên nghiệp
- Professional Prompt Engineer phân tích và tối ưu yêu cầu
- AI chỉ tập trung tạo phần giao tiếp với kỹ thuật chuyên nghiệp
- Không cần lo về identity confusion
- Kết quả nhất quán và chất lượng cao

### 🔧 Linh hoạt
- Dễ debug từng phần
- Có thể thay đổi user prompt mà không ảnh hưởng core
- Preview rõ ràng từng bước

### 📊 Kiểm soát
- Tách biệt storage (user prompt riêng)
- Có thể reset/clear dễ dàng
- Backup với hệ thống cũ

## Cách sử dụng

### 1. Trong Code
```typescript
import { 
  createAndSaveUserPrompt,
  getUserPromptForCombination 
} from '@/lib/user-prompt-generator';

// Tạo user prompt
const config = await createAndSaveUserPrompt(userInputs);

// Lấy user prompt để kết hợp
const userPrompt = getUserPromptForCombination();
```

### 2. Trong UI
1. Mở Settings → Prompt Settings
2. Chọn tab "User Prompt (Mới)"
3. Điền 4 trường thông tin
4. Click "Tạo Prompt"
5. Xem preview và lưu

### 3. Tích hợp với Chat
Hệ thống tự động sử dụng user prompt khi có:
```typescript
// Trong prompt-storage.ts
export function composeSystemPrompt() {
  const corePrompt = CORE_IDENTITY_PROMPT;
  const languageInstruction = getLanguageInstruction();
  const userPrompt = getUserPromptForCombination();
  
  return combinePrompts(corePrompt + languageInstruction, userPrompt);
}
```

## Testing

### Test Cases
- [ ] Tạo user prompt thành công
- [ ] User prompt không chứa core identity
- [ ] Kết hợp prompt hoạt động đúng
- [ ] Lưu/load config hoạt động
- [ ] Preview hiển thị chính xác
- [ ] Core identity không bị ảnh hưởng

### Manual Testing
1. Chạy `node test-user-prompt-system.js`
2. Mở http://localhost:3001
3. Vào Settings → Prompt Settings
4. Test cả 2 tab
5. Kiểm tra kết quả trong chat

## Migration

### Từ hệ thống cũ
- Hệ thống cũ vẫn hoạt động (backup)
- User có thể chuyển dần sang hệ thống mới
- Không cần migration data

### Khuyến nghị
- Sử dụng User Prompt cho user mới
- Giữ hệ thống cũ cho compatibility
- Dần dần deprecate hệ thống cũ

## Kết luận

Hệ thống User Prompt Generator giải quyết triệt để vấn đề core identity bị ảnh hưởng, đồng thời cung cấp trải nghiệm tốt hơn cho user trong việc tùy chỉnh cách giao tiếp của iRIN.
