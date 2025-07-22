# Code Execution Implementation for Gemini 2.5 Models

## Tóm tắt
Code execution đã được implement đầy đủ cho Gemini models 2.5 series. Tính năng này tự động kích hoạt khi phát hiện code keywords trong tin nhắn của user.

## Trạng thái hiện tại

### ✅ Đã implement:

1. **Model Capabilities Detection** (`src/lib/model-utils.ts`)
   - `supportsCodeExecution(modelId)`: Trả về `true` cho models có chứa "2.5"
   - `false` cho Groq models và Gemini models khác

2. **Code Keywords Detection** (`src/lib/chat-utils.ts`)
   - `detectCodeKeywords(content, keywords)`: Phát hiện từ khóa lập trình
   - Sử dụng localized keywords từ translations

3. **Auto-enable Logic** (`src/components/chat/ChatLayout.tsx`)
   - **handleSendMessage**: `enableCodeExecution: hasCodeKeywords && modelSupportsCodeExecution`
   - **generateAIResponse**: Tương tự logic cho retry/regenerate

### 🎯 Logic hoạt động:

```typescript
// Detect code keywords in user message
const hasCodeKeywords = detectCodeKeywords(content, getLocalizedKeywords());
const modelSupportsCodeExecution = supportsCodeExecution(modelToUse);

// Enable code execution if both conditions met
const geminiOptions = {
  enableCodeExecution: hasCodeKeywords && modelSupportsCodeExecution,
  // ... other options
};
```

### 📋 Models hỗ trợ:
- ✅ **Gemini 2.5 Flash**: `gemini-2.5-flash`
- ✅ **Gemini 2.5 Pro**: `gemini-2.5-pro` 
- ❌ **Gemini 2.0 Flash**: Không hỗ trợ
- ❌ **Groq Models**: Không hỗ trợ

### 🔧 Thay đổi đã thực hiện:

**ChatLayout.tsx** - Sửa logic trong `generateAIResponse`:
```typescript
// Trước: enableCodeExecution: false (hardcoded)
// Sau: 
const lastUserMessage = messages.filter(msg => msg.role === 'user').pop();
const hasCodeKeywords = lastUserMessage ? detectCodeKeywords(lastUserMessage.content, getLocalizedKeywords()) : false;
const modelSupportsCodeExecution = supportsCodeExecution(modelToUse);

enableCodeExecution: hasCodeKeywords && modelSupportsCodeExecution
```

### 🧪 Test Cases:

1. **Gemini 2.5 + Code Keywords**: ✅ Code execution enabled
2. **Gemini 2.5 + No Code Keywords**: ❌ Code execution disabled  
3. **Gemini 2.0 + Code Keywords**: ❌ Code execution disabled
4. **Groq + Code Keywords**: ❌ Code execution disabled

### 🌐 Localized Keywords:
Code keywords được lấy từ translations:
- `t('chat.keywords.programming')` 
- Hỗ trợ đa ngôn ngữ (Vietnamese, Japanese, English)

## Kết quả:
✅ **Code execution hoạt động đúng cho Gemini 2.5 models**
✅ **Tự động phát hiện code keywords**  
✅ **Logic nhất quán giữa send message và retry**
✅ **Build thành công không có lỗi**

Code execution sẽ tự động kích hoạt khi user gửi tin nhắn có chứa từ khóa lập trình và sử dụng Gemini 2.5 models!
