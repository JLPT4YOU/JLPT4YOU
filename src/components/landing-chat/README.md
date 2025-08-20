# 💬 iRIN Sensei Chat Widget

Bong bóng chat AI đơn giản cho landing page JLPT4YOU, giúp user hiểu rõ về trang web khi lần đầu truy cập.

## 🎯 Mục đích

- **iRIN Sensei**: AI giáo viên của nền tảng JLPT4YOU
- **Hỗ trợ user mới**: Giải đáp thắc mắc về trang web và tính năng
- **Độc lập**: Không liên quan đến hệ thống AI gốc của dự án
- **Đơn giản**: Giao diện clean, dễ sử dụng
- **Responsive**: Hoạt động tốt trên mọi thiết bị

## 📁 Cấu trúc Components

```
src/components/landing-chat/
├── chat-bubble.tsx           # Bong bóng chat chính
├── chat-interface.tsx        # Giao diện chat đầy đủ
├── chat-message.tsx          # Component tin nhắn
├── typing-indicator.tsx      # Hiệu ứng typing
├── landing-chat-widget.tsx   # Component tổng hợp
├── index.ts                 # Barrel exports
└── README.md               # Documentation
```

## 🎨 Design Features

### Chat Bubble
- **Icon**: Graduation cap (nón tốt nghiệp) thay vì message circle
- **Position**: Fixed bottom-right corner
- **Animation**: Pulse effect để thu hút sự chú ý
- **Behavior**: Ẩn khi chat interface mở
- **Shape**: Hình tròn hoàn hảo
- **Responsive**: Tự động điều chỉnh kích thước trên mobile
- **Accessibility**: ARIA labels và keyboard navigation

### Chat Interface
- **Desktop**: 350x500px overlay modal
- **Mobile**: Full-screen modal
- **Animation**: Smooth slide-up transition
- **Header**: iRIN Sensei với avatar graduation cap
- **Features**: Auto-scroll, no close/minimize buttons (click outside to close)

### Design System Integration
- **Colors**: Tuân thủ monochrome color palette
- **Typography**: Sử dụng font weight system
- **Spacing**: App spacing utilities
- **Components**: Tương thích với Button, Input components

## 🌐 Internationalization

Hỗ trợ đầy đủ 3 ngôn ngữ:

### Translation Keys
```typescript
landingChat: {
  bubble: {
    openLabel: string    // "Mở chat hỗ trợ"
    closeLabel: string   // "Đóng chat"
  }
  interface: {
    title: string        // "iRIN Sensei"
    subtitle: string     // "Hỗ trợ trực tuyến"
    placeholder: string  // "Nhập câu hỏi..."
    typing: string       // "iRIN đang trả lời..."
    welcomeMessage: string // "Tôi là iRIN - giáo viên AI của nền tảng JLPT4YOU..."
    responses: {
      default: string    // Câu trả lời mặc định (sẽ train AI sau)
    }
  }
}
```

### Supported Languages
- **Vietnamese** (vn): Ngôn ngữ chính
- **English** (en): Hỗ trợ quốc tế
- **Japanese** (jp): Phù hợp với JLPT learners

## 🤖 AI Response Logic

### Current Implementation
- **Simple Response**: Hiện tại chỉ trả về default response
- **Future AI Training**: Sẽ được train để hiểu và trả lời các câu hỏi về JLPT4YOU
- **Placeholder**: Chuẩn bị sẵn sàng cho tích hợp AI thực tế

### Future Features
- Keyword detection cho các chủ đề khác nhau
- Multi-language response intelligence
- Context-aware conversations
- Learning from user interactions

## ♿ Accessibility Features

### ARIA Support
- `role="dialog"` cho chat interface
- `aria-modal="true"` cho modal behavior
- `aria-live="polite"` cho message updates
- `aria-label` cho tất cả interactive elements

### Keyboard Navigation
- Tab navigation support
- Enter để gửi tin nhắn
- Escape để đóng chat (có thể thêm)

### Screen Reader Support
- Semantic HTML structure
- Proper heading hierarchy
- Descriptive labels

### Responsive Design
- Mobile-first approach
- Touch-friendly button sizes
- Readable text sizes
- High contrast mode support

## 🚀 Usage

### Basic Implementation
```tsx
import { LandingChatWidget } from '@/components/landing-chat'

function LandingPage({ translations }) {
  return (
    <div>
      {/* Your landing page content */}
      
      <LandingChatWidget translations={translations} />
    </div>
  )
}
```

### Individual Components
```tsx
import { 
  ChatBubble, 
  ChatInterface,
  ChatMessageComponent 
} from '@/components/landing-chat'

// Custom implementation
function CustomChat() {
  const [isOpen, setIsOpen] = useState(false)
  
  return (
    <>
      <ChatBubble 
        isOpen={isOpen}
        onToggle={() => setIsOpen(!isOpen)}
        translations={translations}
      />
      <ChatInterface
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        translations={translations}
      />
    </>
  )
}
```

## 🔧 Customization

### Styling
- Sử dụng Tailwind CSS classes
- CSS variables cho colors
- Responsive breakpoints
- Animation timing có thể điều chỉnh

### Behavior
- Delay animation có thể thay đổi
- AI response logic có thể mở rộng
- Message history có thể persist

## 📱 Mobile Optimization

### Responsive Breakpoints
- **Desktop**: md:w-96 md:h-[500px]
- **Tablet**: Tự động điều chỉnh
- **Mobile**: Full-screen modal

### Touch Interactions
- Large touch targets (44px minimum)
- Swipe gestures (có thể thêm)
- Haptic feedback (có thể thêm)

## 🔮 Future Enhancements

- [ ] Tích hợp API AI thực tế
- [ ] Persist chat history
- [ ] File upload support
- [ ] Voice input/output
- [ ] Analytics tracking
- [ ] A/B testing support
- [ ] Custom themes
- [ ] Emoji reactions

## 📝 Notes

- Component hoàn toàn độc lập với hệ thống chat chính
- Sử dụng mock responses, sẵn sàng tích hợp API
- Tuân thủ design system và coding standards
- Optimized cho performance và accessibility
