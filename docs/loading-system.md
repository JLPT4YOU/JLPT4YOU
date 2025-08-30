# 🎯 Loading System - JLPT4YOU

Hệ thống loading với hiệu ứng chữ lướt song và icon mũ tốt nghiệp cho trải nghiệm người dùng mượt mà.

## ✨ Tính năng

### 🎨 Loading Screen
- **Icon mũ tốt nghiệp** với animation xoay và scale
- **Chữ JLPT4YOU** với hiệu ứng lướt song (wave animation)
- **Progress bar** với gradient màu
- **Floating particles** xung quanh icon
- **Custom loading message** cho từng trang

### 🔄 Page Transitions
- **Tự động loading** khi chuyển trang
- **Smooth transitions** với Framer Motion
- **Intelligent detection** - chỉ hiển thị khi thực sự cần
- **Configurable duration** cho từng use case

### 🎛️ Loading Controls
- **Global loading state** với React Context
- **Manual loading triggers** cho async operations
- **Custom messages** cho từng action
- **Automatic cleanup** để tránh memory leaks

## 🚀 Cách sử dụng

### 1. Navigation với Loading

```tsx
import { LoadingLink } from "@/components/ui/loading-link"

// Thay thế Link thông thường
<LoadingLink 
  href="/vn/jlpt"
  loadingMessage="Đang tải JLPT..."
  className="your-classes"
>
  Đi đến JLPT
</LoadingLink>
```

### 2. Manual Loading Control

```tsx
import { useLoadingState } from "@/contexts/loading-context"

function MyComponent() {
  const { withLoading, startLoading, stopLoading, setMessage } = useLoadingState()

  // Async operation với loading
  const handleAsyncAction = async () => {
    await withLoading(
      async () => {
        // Your async code here
        await fetchData()
      },
      "Đang tải dữ liệu..."
    )
  }

  // Manual control
  const handleManualLoading = () => {
    setMessage("Custom message...")
    startLoading()
    
    setTimeout(() => {
      stopLoading()
    }, 2000)
  }
}
```

### 3. Global Loading Context

```tsx
import { useLoading } from "@/contexts/loading-context"

function MyComponent() {
  const { 
    isGlobalLoading, 
    startGlobalLoading, 
    stopGlobalLoading, 
    setLoadingMessage 
  } = useLoading()

  // Check loading state
  if (isGlobalLoading) {
    // Component is in loading state
  }
}
```

## 🏗️ Kiến trúc

### Components
```
src/components/ui/
├── loading-screen.tsx          # Main loading screen component
├── loading-link.tsx           # Enhanced Link with loading
└── index.ts                   # Exports

src/components/layout/
├── page-transition-wrapper.tsx    # Page transition handler
└── global-loading-overlay.tsx     # Global loading overlay

src/contexts/
└── loading-context.tsx           # Loading state management

src/hooks/
└── use-page-loading.ts           # Page loading utilities
```

### Integration
- **Layout Level**: `PageTransitionWrapper` trong `app/layout.tsx`
- **Global State**: `LoadingProvider` wrap toàn bộ app
- **Component Level**: `LoadingLink` thay thế `Link` thông thường

## ⚙️ Configuration

### LoadingScreen Props
```tsx
interface LoadingScreenProps {
  isVisible: boolean
  onComplete?: () => void
  duration?: number        // Default: 2000ms
  message?: string        // Default: "Đang tải..."
}
```

### LoadingLink Props
```tsx
interface LoadingLinkProps {
  href: string
  children: React.ReactNode
  className?: string
  onClick?: () => void
  replace?: boolean       // Default: false
  scroll?: boolean       // Default: true
  prefetch?: boolean     // Default: true
  loadingDelay?: number  // Default: 100ms
  loadingMessage?: string // Default: "Đang chuyển trang..."
}
```

### PageTransitionWrapper Props
```tsx
interface PageTransitionWrapperProps {
  children: React.ReactNode
  enableTransitions?: boolean  // Default: true
  loadingDuration?: number    // Default: 1000ms
}
```

## 🎨 Customization

### Thay đổi Animation
```tsx
// Trong loading-screen.tsx
const letterAnimation = {
  initial: { y: 50, opacity: 0, rotateX: -90 },
  animate: { y: [50, -10, 0], opacity: 1, rotateX: 0 },
  transition: {
    duration: 0.6,
    delay: 0.8 + index * 0.1,
    ease: [0.25, 0.46, 0.45, 0.94]
  }
}
```

### Custom Loading Messages
```tsx
// Theo ngôn ngữ
const messages = {
  vn: "Đang tải...",
  en: "Loading...",
  jp: "読み込み中..."
}
```

### Styling
```css
/* Custom loading styles */
.loading-screen {
  background: linear-gradient(135deg, var(--background) 0%, var(--muted) 100%);
}

.loading-icon {
  filter: drop-shadow(0 4px 8px rgba(0,0,0,0.1));
}
```

## 🧪 Testing

### Demo Page
Truy cập `/loading-demo` để test tất cả tính năng:
- Navigation loading
- Manual loading controls
- Custom messages
- Different durations

### Test Cases
```tsx
// Test navigation loading
<LoadingLink href="/test" loadingMessage="Testing...">
  Test Link
</LoadingLink>

// Test async loading
const testAsync = async () => {
  await withLoading(
    () => new Promise(resolve => setTimeout(resolve, 2000)),
    "Testing async..."
  )
}

// Test manual loading
const testManual = () => {
  startLoading()
  setTimeout(stopLoading, 1500)
}
```

## 🔧 Troubleshooting

### Common Issues

1. **Loading không hiển thị**
   - Kiểm tra `LoadingProvider` đã wrap app chưa
   - Verify `enableTransitions` prop

2. **Animation lag**
   - Reduce `loadingDuration`
   - Check device performance

3. **Memory leaks**
   - Components tự động cleanup
   - Manual cleanup trong useEffect

### Performance Tips
- Sử dụng `loadingDelay` để tránh flash loading
- Set `prefetch={false}` cho links ít dùng
- Optimize animation với `will-change: transform`

## 📱 Responsive Design

Loading system tự động responsive:
- **Mobile**: Smaller icons, compact text
- **Tablet**: Medium size elements
- **Desktop**: Full size với all effects

## 🎯 Best Practices

1. **Consistent Messages**: Sử dụng i18n cho loading messages
2. **Appropriate Duration**: 800-1200ms cho page transitions
3. **User Feedback**: Luôn có loading state cho actions > 200ms
4. **Graceful Fallbacks**: Handle loading errors properly
5. **Performance**: Lazy load heavy components

## 🔮 Future Enhancements

- [ ] Skeleton loading cho specific components
- [ ] Progress tracking cho file uploads
- [ ] Custom loading animations per route
- [ ] Loading analytics và performance metrics
- [ ] Voice feedback cho accessibility
