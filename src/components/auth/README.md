# JLPT4YOU Authentication System

Hệ thống authentication chuyên nghiệp cho ứng dụng JLPT4YOU với thiết kế monochrome và trải nghiệm người dùng hiện đại.

## 🎨 Design Philosophy

- **Monochrome Professional**: Sử dụng palette đen-trắng-xám để tạo cảm giác chuyên nghiệp
- **Mobile-First**: Thiết kế responsive với split-screen trên desktop, single-column trên mobile
- **Accessibility**: Tuân thủ WCAG 2.1 AA với keyboard navigation và screen reader support
- **Consistency**: Sử dụng design system hiện có (spacing, typography, colors)

## 📁 Component Structure

```
src/components/auth/
├── auth-layout.tsx          # Layout wrapper với brand side và form side
├── login-form.tsx           # Form đăng nhập với validation
├── register-form.tsx        # Form đăng ký với password strength
├── password-input.tsx       # Input mật khẩu với show/hide và caps lock
├── social-login.tsx         # Nút đăng nhập social media
├── forgot-password-form.tsx # Form quên mật khẩu
├── index.ts                 # Barrel exports
└── README.md               # Documentation này
```

## 🚀 Routes

- `/login` - Trang đăng nhập (no header)
- `/register` - Trang đăng ký (no header)
- `/forgot-password` - Quên mật khẩu (no header)
- `/auth-demo` - Demo page để test các tính năng
- `/pattern-demo` - Showcase background patterns

**Note**: Auth pages sử dụng `ConditionalHeaderWrapper` trong root layout để conditionally hide header.

## ✨ Features

### Authentication Features
- ✅ Real-time form validation
- ✅ Show/hide password toggle
- ✅ Caps Lock indicator
- ✅ Password strength meter
- ✅ Social login (Google, Facebook, Apple)
- ✅ Remember me checkbox
- ✅ Forgot password flow
- ✅ Terms & conditions acceptance

### Design & UX Features
- ✅ Responsive split-screen layout
- ✅ Monochrome professional design
- ✅ Dark/light mode support
- ✅ Smooth form transitions
- ✅ Loading states & feedback
- ✅ Error handling & messaging
- ✅ Mobile-optimized interface
- ✅ Consistent spacing system
- ✅ Rich background patterns với learning icons
- ✅ Dual-side patterns (brand + form sides)
- ✅ Header-free auth experience
- ✅ Enhanced visual depth với varied icon sizes

## 🔧 Usage

### Basic Login Form
```tsx
import { LoginForm } from '@/components/auth'

export default function LoginPage() {
  return (
    <AuthLayout title="Đăng nhập" subtitle="Chào mừng bạn quay trở lại">
      <LoginForm onSwitchToRegister={() => router.push('/register')} />
    </AuthLayout>
  )
}
```

### Password Input with Validation
```tsx
import { PasswordInput } from '@/components/auth'

function MyForm() {
  const [password, setPassword] = useState('')
  
  return (
    <PasswordInput
      value={password}
      onChange={setPassword}
      showStrengthMeter={true}
      showCapsLockWarning={true}
    />
  )
}
```

## 🎯 Test Credentials

Để test login flow:
- **Email**: demo@jlpt4you.com
- **Password**: demo123

## 📱 Responsive Behavior

### Desktop (≥1024px)
- Split-screen layout với brand side (trái) và form side (phải)
- Brand side hiển thị logo, features, testimonial
- Form side chứa form authentication với desktop spacing

### Tablet (768px - 1023px)
- Single column layout với vertical centering
- Enhanced spacing và typography
- Form full-width với max-width constraint
- Optimized button heights và touch targets

### Mobile (<768px)
- **Perfect vertical centering** với `min-h-screen` và `justify-center`
- **Professional spacing**: `px-4 py-8` cho proper margins
- **Enhanced typography**: Responsive text sizes với `md:` breakpoints
- **Touch-optimized**: Button heights `h-10 md:h-12` cho better UX
- **Mobile-specific patterns**: Icons positioned để avoid form overlap
- **No header interference**: Clean full-screen experience

## 🎨 Design Tokens

Sử dụng design tokens từ `globals.css`:

```css
/* Colors */
--background: oklch(0.99 0 0)     /* Light mode background */
--foreground: oklch(0.11 0 0)     /* Text color */
--muted: oklch(0.95 0 0)          /* Muted backgrounds */
--accent: oklch(0.93 0 0)         /* Hover states */
--primary: oklch(0.11 0 0)        /* Primary buttons */

/* Spacing */
--spacing-xs: 0.5rem    /* 8px */
--spacing-sm: 0.75rem   /* 12px */
--spacing-md: 1rem      /* 16px */
--spacing-lg: 1.5rem    /* 24px */
--spacing-xl: 2rem      /* 32px */
```

## 🔒 Security Considerations

- Password requirements: 8+ characters, uppercase, lowercase, number
- Rate limiting simulation trong forms
- HTTPS-only trong production
- Email verification flow
- Secure password reset tokens

## 🚀 Future Enhancements

- [ ] Two-factor authentication (2FA)
- [ ] Biometric login (Face ID, Touch ID)
- [ ] OAuth integration với providers thực
- [ ] Session management
- [ ] Account verification email templates
- [ ] Password policy customization
- [ ] Login attempt monitoring
- [ ] Device management

## 📝 Best Practices Applied

1. **No password confirmation field** - Sử dụng show/hide thay thế
2. **Email thay vì username** - Dễ nhớ hơn cho users
3. **Social login options** - Giảm friction trong registration
4. **Clear error messages** - Giải thích rõ lỗi và cách khắc phục
5. **Instant validation** - Feedback ngay lập tức khi user nhập
6. **Remember me option** - Explicit choice cho users
7. **Easy password recovery** - Link prominent và flow đơn giản
8. **Relevant button labels** - "Đăng nhập", "Tạo tài khoản" thay vì "Submit"

## 🎨 Color Palette

Hệ thống sử dụng monochrome palette với subtle variations:

- **Pure White**: `oklch(1 0 0)` - Cards, inputs
- **Off-White**: `oklch(0.99 0 0)` - Main background  
- **Light Gray**: `oklch(0.95 0 0)` - Muted backgrounds
- **Medium Gray**: `oklch(0.44 0 0)` - Muted text
- **Dark Gray**: `oklch(0.11 0 0)` - Primary text, buttons
- **Pure Black**: `oklch(0 0 0)` - High contrast elements

## 📊 Performance

- Lazy loading cho social login icons
- Optimized bundle size với tree shaking
- Minimal re-renders với proper state management
- Fast form validation với debounced inputs
- Efficient responsive breakpoints

---

**Developed for JLPT4YOU** - Professional Japanese Learning Platform
