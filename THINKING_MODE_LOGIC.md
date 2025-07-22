# Thinking Mode Logic Documentation

## 📋 **Overview**

Thinking Mode trong JLPT4YOU được thiết kế để chỉ **PRO_2_5 model** tự động bật, còn lại các 2.5 models khác để user tự quyết định.

## 🎯 **Logic Rules**

### **1. Model Support**
```typescript
supportsThinking(modelId: string): boolean
```
- ✅ **GEMINI_MODELS.PRO_2_5** - Supports thinking
- ✅ **GEMINI_MODELS.FLASH_2_5** - Supports thinking
- ✅ **GEMINI_MODELS.FLASH_LITE_2_5** - Supports thinking
- ✅ **GEMINI_MODELS.FLASH_PREVIEW_2_5** - Supports thinking
- ❌ **GEMINI_MODELS.FLASH_2_0** - Does NOT support thinking
- ❌ **GEMINI_MODELS.FLASH_EXP_2_0** - Does NOT support thinking
- ❌ **GEMINI_MODELS.PRO_1_5** - Does NOT support thinking

### **2. Auto-Enable Logic**
```typescript
shouldAutoEnableThinking(modelId: string): boolean
```
- ✅ **GEMINI_MODELS.PRO_2_5** - AUTO-ENABLES thinking
- ❌ **GEMINI_MODELS.FLASH_2_5** - Does NOT auto-enable (user decides)
- ❌ **GEMINI_MODELS.FLASH_LITE_2_5** - Does NOT auto-enable (user decides)
- ❌ **GEMINI_MODELS.FLASH_PREVIEW_2_5** - Does NOT auto-enable (user decides)
- ❌ **All other models** - Does NOT auto-enable

### **3. Code Execution Support**
```typescript
supportsCodeExecution(modelId: string): boolean
```
- ✅ **GEMINI_MODELS.PRO_2_5** - Supports code execution
- ✅ **GEMINI_MODELS.FLASH_2_5** - Supports code execution
- ✅ **GEMINI_MODELS.FLASH_LITE_2_5** - Supports code execution
- ✅ **GEMINI_MODELS.FLASH_PREVIEW_2_5** - Supports code execution
- ❌ **GEMINI_MODELS.FLASH_2_0** - Does NOT support code execution
- ❌ **GEMINI_MODELS.FLASH_LITE_2_0** - Does NOT support code execution
- ❌ **GEMINI_MODELS.FLASH_EXP_2_0** - Does NOT support code execution
- ❌ **All older models** - Does NOT support code execution

## 🔧 **Implementation Details**

### **Files Updated:**

1. **`src/lib/model-utils.ts`**
   - `shouldAutoEnableThinking()` - Only returns true for PRO_2_5
   - `getRecommendedSettings()` - Uses shouldAutoEnableThinking logic

2. **`src/components/chat/ChatLayout.tsx`**
   - useEffect auto-enable logic updated to use `shouldAutoEnableThinking()`

3. **`src/hooks/use-chat.ts`**
   - useEffect auto-enable logic updated to use `shouldAutoEnableThinking()`

4. **`src/lib/gemini-config.ts`**
   - Maintains `supportsThinking()` function for model capability checking

### **UI Behavior:**

1. **Thinking Toggle Button** (`InputArea.tsx`):
   - Shows for all 2.5 models EXCEPT PRO_2_5
   - PRO_2_5 doesn't show toggle (always enabled)
   - Non-2.5 models don't show toggle (not supported)

2. **Model Selection**:
   - When user selects PRO_2_5: Thinking auto-enables
   - When user selects FLASH_2_5/FLASH_LITE_2_5: Thinking stays as user preference
   - When user selects non-2.5 models: Thinking disabled (not supported)

## 🧪 **Test Cases**

```typescript
// PRO_2_5 - Auto-enables
expect(shouldAutoEnableThinking(GEMINI_MODELS.PRO_2_5)).toBe(true);
expect(supportsThinking(GEMINI_MODELS.PRO_2_5)).toBe(true);

// FLASH_2_5 - Supports but doesn't auto-enable
expect(shouldAutoEnableThinking(GEMINI_MODELS.FLASH_2_5)).toBe(false);
expect(supportsThinking(GEMINI_MODELS.FLASH_2_5)).toBe(true);

// FLASH_LITE_2_5 - Supports but doesn't auto-enable  
expect(shouldAutoEnableThinking(GEMINI_MODELS.FLASH_LITE_2_5)).toBe(false);
expect(supportsThinking(GEMINI_MODELS.FLASH_LITE_2_5)).toBe(true);

// Non-2.5 models - No support
expect(shouldAutoEnableThinking(GEMINI_MODELS.FLASH_2_0)).toBe(false);
expect(supportsThinking(GEMINI_MODELS.FLASH_2_0)).toBe(false);
```

## 🎮 **User Experience Flow**

### **Scenario 1: User selects PRO_2_5**
1. Model changes to PRO_2_5
2. Thinking mode AUTO-ENABLES
3. No toggle button shown (always on)
4. User sees thinking process in responses

### **Scenario 2: User selects FLASH_2_5**
1. Model changes to FLASH_2_5
2. Thinking mode RESETS to OFF (default behavior)
3. Toggle button shown - user can enable/disable
4. User controls thinking mode manually

### **Scenario 3: User selects FLASH_2_0**
1. Model changes to FLASH_2_0
2. Thinking mode DISABLED (not supported)
3. No toggle button shown (not supported)
4. No thinking process in responses

## 🔄 **Migration Notes**

### **Before Fix:**
- All 2.5 models auto-enabled thinking
- Users couldn't control thinking for FLASH_2_5/FLASH_LITE_2_5
- Thinking toggle stayed ON when switching between 2.5 models

### **After Fix:**
- Only PRO_2_5 auto-enables thinking
- FLASH_2_5/FLASH_LITE_2_5 RESET to OFF when selected (user must manually enable)
- Clear distinction between auto-enable vs user-controlled models
- Better user control and experience

## 🚀 **Benefits**

1. **User Control**: Users can choose thinking mode for FLASH_2_5/FLASH_LITE_2_5
2. **Performance**: Thinking mode only when needed/wanted
3. **Clarity**: Clear distinction between model capabilities
4. **Flexibility**: Different behavior for different model tiers

## 📝 **Summary**

- **PRO_2_5**: Premium model → Auto-enable thinking (best experience)
- **FLASH_2_5/FLASH_LITE_2_5**: Standard models → User choice (flexibility)
- **Other models**: No thinking support → Disabled (clear limitations)

This provides the best balance between automation and user control! 🎉
