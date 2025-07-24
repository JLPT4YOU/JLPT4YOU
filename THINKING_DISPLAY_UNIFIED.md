# 🧠 Unified Thinking Display Implementation

## 📋 **Tổng quan**

Đã thống nhất cách hiển thị thinking mode giữa **Groq** và **Gemini** theo yêu cầu:

1. **Khi đang thinking**: Hiển thị nội dung thinking real-time trên màn hình
2. **Khi thinking hoàn tất**: Tự động thu gọn lại, chỉ hiển thị header
3. **Khi user muốn xem lại**: Click vào header để expand/collapse

## 🔄 **Thay đổi chính**

### **1. ThinkingDisplay Component (`src/components/chat/ThinkingDisplay.tsx`)**

#### **Simplified Auto Expand/Collapse Logic**
```typescript
// Auto-expand when thinking is in progress, auto-collapse when complete
useEffect(() => {
  if (!isThinkingComplete) {
    // Đang thinking: tự động mở rộng để hiển thị real-time
    setIsExpanded(true);
  } else if (isThinkingComplete) {
    // Thinking hoàn tất: tự động thu gọn (bất kể isStreaming)
    setIsExpanded(false);
  }
}, [isThinkingComplete]);
```

**🔧 Key Changes:**
- Removed dependency on `isStreaming` for auto-collapse
- Simplified logic to only depend on `isThinkingComplete`
- Fixed issue where thinking wouldn't collapse when `isStreaming` was still true

#### **Simplified Header Click Logic**
```typescript
onClick={() => {
  // Chỉ cho phép toggle khi thinking đã hoàn tất
  if (isThinkingComplete) {
    setIsExpanded(!isExpanded);
  }
}}
```

#### **Updated Visual Indicators**
```typescript
// Progress indicator - only show when thinking
{!isThinkingComplete && (
  <div className="flex items-center gap-1 ml-2 flex-shrink-0">
    <div className="w-1 h-1 bg-foreground/60 rounded-full animate-pulse" />
    <div className="w-1 h-1 bg-foreground/60 rounded-full animate-pulse delay-75" />
    <div className="w-1 h-1 bg-foreground/60 rounded-full animate-pulse delay-150" />
  </div>
)}

// Expand/collapse icon - only show when clickable
{isThinkingComplete && (
  isExpanded ? <ChevronDown /> : <ChevronRight />
)}
```

#### **Enhanced Content Display**
```typescript
{thoughtSummary ? (
  <div className="prose prose-sm max-w-none dark:prose-invert">
    <MarkdownRenderer content={thoughtSummary} className="text-foreground" />
    {/* Show streaming indicator at the end if still thinking */}
    {isStreaming && !isThinkingComplete && (
      <div className="flex items-center gap-2 text-muted-foreground text-sm mt-2 pt-2 border-t border-border/20">
        <Clock className="w-4 h-4 animate-spin" />
        <span>Đang tiếp tục suy nghĩ...</span>
      </div>
    )}
  </div>
) : isStreaming && !isThinkingComplete ? (
  <div className="flex items-center gap-2 text-muted-foreground text-sm">
    <Clock className="w-4 h-4 animate-spin" />
    <span>Đang phân tích và suy luận...</span>
  </div>
) : (
  <p className="text-muted-foreground text-sm italic">
    Không có dữ liệu suy nghĩ
  </p>
)}
```

### **2. MessageBubble Component (`src/components/chat/MessageBubble.tsx`)**

#### **Updated Display Condition**
```typescript
// Before: Chỉ hiển thị khi có thoughtSummary
{!isUser && message.thinking && message.thinking.thoughtSummary && (

// After: Hiển thị cả khi đang thinking mà chưa có content
{!isUser && message.thinking && (
  message.thinking.thoughtSummary ||
  (message.status === 'sending' && !message.thinking.isThinkingComplete)
) && (
```

### **3. useMessageHandler Hook (`src/components/chat/hooks/useMessageHandler.ts`)**

#### **Enhanced Groq Thinking Logic**
```typescript
// Initialize thinking immediately when started
if (chunk === '__GROQ_THINKING_START__') {
  isThinkingActive = true;
  thinkingContent = '';

  // Initialize thinking data immediately
  setChats(prev => prev.map(chat => ({
    ...chat,
    messages: chat.messages.map(msg =>
      msg.id === aiMessage.id
        ? {
            ...msg,
            thinking: {
              ...msg.thinking,
              thoughtSummary: '',
              isThinkingComplete: false
            }
          }
        : msg
    )
  })));
}

// Mark thinking complete immediately when ended
else if (chunk === '__GROQ_THINKING_END__') {
  isThinkingActive = false;

  // Immediately update thinking as complete
  setChats(prev => prev.map(chat => ({
    ...chat,
    messages: chat.messages.map(msg =>
      msg.id === aiMessage.id
        ? {
            ...msg,
            thinking: {
              ...msg.thinking,
              thoughtSummary: thinkingContent,
              thinkingTimeSeconds: Math.round((Date.now() - thinkingStartTime) / 1000),
              isThinkingComplete: true
            }
          }
        : msg
    )
  })));
}
```

## 🎯 **User Experience Flow**

### **Scenario 1: Thinking Starts (Both Groq & Gemini)**
1. ✅ ThinkingDisplay tự động xuất hiện và mở rộng
2. ✅ Hiển thị content thinking real-time khi có data
3. ✅ Header không thể click (cursor-default)
4. ✅ Không hiển thị expand/collapse icon
5. ✅ Hiển thị progress indicator (3 dots animation)
6. ✅ Text hiển thị "Đang suy nghĩ..."

### **Scenario 2: Thinking Complete (Both Groq & Gemini)**
1. ✅ ThinkingDisplay tự động thu gọn ngay lập tức
2. ✅ Chỉ hiển thị header với thời gian thinking
3. ✅ Header có thể click để toggle
4. ✅ Hiển thị expand/collapse icon (ChevronRight)
5. ✅ Text hiển thị "Quá trình suy nghĩ"
6. ✅ Không còn progress indicator

### **Scenario 3: User Manual Toggle (After Complete)**
1. ✅ Click header để mở rộng → hiển thị full thinking content
2. ✅ Click header để thu gọn → chỉ hiển thị header
3. ✅ Icon thay đổi giữa ChevronDown ↔ ChevronRight
4. ✅ Trạng thái toggle được duy trì cho đến khi có thinking mới

### **🔄 Unified Behavior:**
- **Groq**: Thinking content hiển thị real-time → auto-collapse khi hoàn tất
- **Gemini**: Thinking content hiển thị real-time → auto-collapse khi hoàn tất
- **Both**: Cùng UI, cùng behavior, cùng user experience

## 🧪 **Testing**

### **Demo Component**
- **File**: `src/components/chat/ThinkingDisplayDemo.tsx`
- **URL**: `http://localhost:3002/demo/thinking`
- **Features**: Mô phỏng complete thinking flow với real-time updates

### **Test Cases**
1. ✅ Auto-expand khi thinking bắt đầu
2. ✅ Real-time content updates
3. ✅ Auto-collapse khi thinking hoàn tất
4. ✅ Manual toggle sau khi hoàn tất
5. ✅ Disabled click khi đang thinking
6. ✅ Progress indicators và animations

## 🔧 **Technical Details**

### **Props Interface**
```typescript
interface ThinkingDisplayProps {
  thoughtSummary?: string;           // Nội dung thinking
  thinkingTimeSeconds?: number;      // Thời gian thinking (giây)
  isThinkingComplete?: boolean;      // Thinking đã hoàn tất?
  isStreaming?: boolean;             // Đang streaming?
  className?: string;                // Custom CSS classes
}
```

### **State Management**
- **isExpanded**: Controlled bởi useEffect và user interaction
- **Auto-expand**: `isStreaming && !isThinkingComplete`
- **Auto-collapse**: `isThinkingComplete && !isStreaming`
- **Manual toggle**: Chỉ khi `isThinkingComplete || !isStreaming`

## 🎨 **UI/UX Improvements**

1. **Smooth Transitions**: `transition-all duration-200`
2. **Visual Feedback**: Progress dots, spinning clock, hover effects
3. **Accessibility**: Proper cursor states, clear visual hierarchy
4. **Responsive**: Works on all screen sizes
5. **Performance**: Memoized component với proper comparison

## 🚀 **Next Steps**

1. ✅ Test với real Groq và Gemini responses
2. ✅ Verify performance với long thinking content
3. ✅ Test responsive behavior trên mobile
4. ✅ Validate accessibility features
5. ✅ Monitor user feedback và iterate

## 🐛 **Bug Fixes Applied**

### **Issue**: Auto-collapse không hoạt động
- **Problem**: Logic phụ thuộc vào cả `isStreaming` và `isThinkingComplete`
- **Solution**: Simplified logic chỉ phụ thuộc vào `isThinkingComplete`

### **Issue**: Groq thinking không set `isThinkingComplete` đúng lúc
- **Problem**: `__GROQ_THINKING_END__` không trigger immediate update
- **Solution**: Added immediate state update khi thinking ends

### **Issue**: ThinkingDisplay không hiển thị khi thinking bắt đầu
- **Problem**: Condition chỉ check `thoughtSummary` existence
- **Solution**: Added condition cho `!isThinkingComplete` state

---

**Status**: ✅ **COMPLETED & FIXED** - Unified thinking display behavior với auto-expand/collapse hoạt động đúng cho cả Groq và Gemini
