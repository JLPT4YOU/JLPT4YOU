# Gemini System Prompt Integration Fix

## 🐛 **PROBLEM IDENTIFIED**

**Error**: `ApiError: {"error":{"code":400,"message":"Please use a valid role: user, model.","status":"INVALID_ARGUMENT"}}`

**Root Cause**: Gemini API không hỗ trợ role "system" trong messages. Chỉ hỗ trợ "user" và "model" roles.

**Previous Implementation**: Đang cố gắng inject system prompt như một message với role "system"

## ✅ **SOLUTION IMPLEMENTED**

### **1. Updated Message Conversion**

#### **Before (Broken)**
```typescript
private convertMessages(messages: AIMessage[]): GeminiMessage[] {
  const convertedMessages = messages.map(msg => ({
    role: msg.role === 'assistant' ? 'model' : msg.role as 'user' | 'model' | 'system',
    parts: [{ text: msg.content }]
  }));

  // Prepend custom system prompt if no system message exists
  const hasSystemMessage = convertedMessages.some(msg => msg.role === 'system');
  if (!hasSystemMessage) {
    const systemPrompt = getCurrentSystemPrompt();
    convertedMessages.unshift({
      role: 'system',  // ❌ INVALID ROLE
      parts: [{ text: systemPrompt }]
    });
  }

  return convertedMessages;
}
```

#### **After (Fixed)**
```typescript
private convertMessages(messages: AIMessage[]): GeminiMessage[] {
  // Filter out system messages as Gemini handles them via systemInstruction
  return messages
    .filter(msg => msg.role !== 'system')
    .map(msg => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }]
    }));
}
```

### **2. Updated Gemini Config Function**

#### **Before**
```typescript
export function createGeminiConfig(overrides?: Partial<typeof DEFAULT_GEMINI_CONFIG>) {
  return {
    ...DEFAULT_GEMINI_CONFIG,
    systemInstruction: JLPT_SYSTEM_INSTRUCTION,  // ❌ Fixed instruction
    ...overrides,
  };
}
```

#### **After**
```typescript
export function createGeminiConfig(overrides?: Partial<typeof DEFAULT_GEMINI_CONFIG> & { systemInstruction?: string }) {
  const { systemInstruction, ...configOverrides } = overrides || {};
  
  return {
    ...DEFAULT_GEMINI_CONFIG,
    systemInstruction: systemInstruction || JLPT_SYSTEM_INSTRUCTION,  // ✅ Customizable
    ...configOverrides,
  };
}
```

### **3. Updated All Service Methods**

#### **sendMessage Method**
```typescript
const config = createGeminiConfig({
  temperature: options?.temperature,
  systemInstruction: getCurrentSystemPrompt(),  // ✅ Custom prompt
  thinkingConfig: {
    thinkingBudget: options?.thinkingConfig?.thinkingBudget ??
                   (options?.enableThinking ? -1 : 0)
  },
  tools: options?.enableGoogleSearch ? GEMINI_TOOLS :
         options?.enableTools ? GEMINI_TOOLS : []
});
```

#### **streamMessage Method**
```typescript
const config = createGeminiConfig({
  temperature: options?.temperature,
  systemInstruction: getCurrentSystemPrompt(),  // ✅ Custom prompt
  thinkingConfig: {
    thinkingBudget: options?.enableThinking ? -1 : 0
  },
  tools: options?.enableGoogleSearch ? GEMINI_TOOLS : 
         options?.enableTools ? GEMINI_TOOLS : []
});
```

#### **sendMessageWithFiles Method**
```typescript
const config = createGeminiConfig({
  temperature: options?.temperature,
  systemInstruction: getCurrentSystemPrompt(),  // ✅ Custom prompt
  thinkingConfig: {
    thinkingBudget: options?.enableThinking ? -1 : 0
  }
});
```

### **4. Updated Type Definitions**

#### **GeminiMessage Interface**
```typescript
// Before
export interface GeminiMessage {
  role: 'user' | 'model' | 'system';  // ❌ Invalid system role
  parts: Array<{...}>;
}

// After
export interface GeminiMessage {
  role: 'user' | 'model';  // ✅ Only valid roles
  parts: Array<{...}>;
}
```

#### **Helper Functions**
```typescript
// Before
export const createGeminiMessage = (
  content: string, 
  role: 'user' | 'model' | 'system' = 'user'  // ❌ Invalid system role
): GeminiMessage => ({...});

// After
export const createGeminiMessage = (
  content: string, 
  role: 'user' | 'model' = 'user'  // ✅ Only valid roles
): GeminiMessage => ({...});
```

## 🔧 **TECHNICAL DETAILS**

### **Gemini API System Instruction**

Gemini API sử dụng `systemInstruction` field trong config thay vì system message:

```typescript
const response = await this.client.models.generateContent({
  model,
  config: {
    ...otherConfig,
    systemInstruction: "Your custom system prompt here"  // ✅ Correct way
  },
  contents: [
    // Only user and model messages here
  ]
});
```

### **Custom Prompt Integration Flow**

```
User Custom Config → getCurrentSystemPrompt() → createGeminiConfig() → Gemini API
     ↓                        ↓                        ↓                ↓
Custom Settings → Composed Prompt → systemInstruction → AI Response
```

### **Message Processing**

```
AIMessage[] → Filter System → Convert Roles → GeminiMessage[]
     ↓              ↓              ↓              ↓
[user, assistant, → [user, assistant] → [user, model] → Valid for API
 system]
```

## ✅ **VALIDATION**

### **Fixed Issues**
- ✅ **API Error**: No more "invalid role" errors
- ✅ **Custom Prompts**: Working with Gemini API
- ✅ **Type Safety**: All TypeScript errors resolved
- ✅ **Functionality**: All service methods updated

### **Maintained Features**
- ✅ **Custom Prompt System**: Still works perfectly
- ✅ **Identity Preservation**: iRIN Sensei identity maintained
- ✅ **Security**: Validation and sanitization active
- ✅ **Versatility**: Multi-topic discussions enabled

### **Test Scenarios**
- ✅ **Basic Chat**: Simple user messages work
- ✅ **Custom Prompts**: Settings applied correctly
- ✅ **Streaming**: Real-time responses work
- ✅ **File Upload**: Multimodal functionality intact
- ✅ **Thinking Mode**: Advanced features work

## 📁 **FILES MODIFIED**

1. **`src/lib/gemini-service.ts`**
   - Updated `convertMessages()` method
   - Modified all API call methods
   - Fixed type definitions
   - Updated helper functions

2. **`src/lib/gemini-config.ts`**
   - Enhanced `createGeminiConfig()` function
   - Added systemInstruction override support

## 🎯 **RESULT**

### **Before Fix**
```
❌ ApiError: Please use a valid role: user, model
❌ Chat functionality broken
❌ Custom prompts not working
```

### **After Fix**
```
✅ Gemini API calls successful
✅ Custom prompts working perfectly
✅ iRIN Sensei responds with custom personality
✅ All chat features functional
```

## 🚀 **IMPACT**

### **User Experience**
- **Seamless Chat**: No more API errors
- **Custom AI**: Personalized iRIN Sensei behavior
- **Versatile Discussions**: Any topic conversations
- **Professional Identity**: Maintained brand consistency

### **Technical Benefits**
- **Proper API Integration**: Following Gemini best practices
- **Type Safety**: All TypeScript errors resolved
- **Maintainable Code**: Clean, well-structured implementation
- **Future-Proof**: Ready for Gemini API updates

## 🎉 **CONCLUSION**

Successfully fixed the Gemini API integration issue by properly using `systemInstruction` instead of system messages. The custom prompt system now works perfectly with Gemini API while maintaining all security and identity preservation features.

**iRIN Sensei is now fully functional with custom prompts and versatile conversation capabilities!** 🌟
