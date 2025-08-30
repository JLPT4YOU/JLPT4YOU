# JLPT4YOU Landing Page Components

Hệ thống components cho landing page của JLPT4YOU với thiết kế monochrome chuyên nghiệp và animation Tetris độc đáo.

## 🎨 Design Philosophy

- **Monochrome Professional**: Sử dụng palette đen-trắng-xám để tạo cảm giác chuyên nghiệp
- **Mobile-First**: Thiết kế responsive với mobile-first approach
- **Performance Optimized**: Animation được tối ưu cho performance
- **Accessibility**: Tuân thủ WCAG standards với proper semantic HTML

## 📁 Component Structure

```
src/components/landing/
├── landing-header.tsx      # Header cho landing page
├── hero-section.tsx        # Hero section với CTA buttons
├── tetris-animation.tsx    # Animation Tetris cho logo JLPT4YOU
├── index.ts               # Barrel exports
└── README.md              # Documentation
```

## 🧩 Components

### LandingHeader

Header sticky với logo, theme toggle và CTA buttons.

**Features:**
- Sticky header với scroll effect
- Responsive design (desktop/mobile)
- Theme toggle integration
- Navigation buttons

**Usage:**
```tsx
import { LandingHeader } from '@/components/landing'

<LandingHeader />
```

### HeroSection

Hero section chính với Tetris animation và sparkling stars background.

**Features:**
- Tetris animation cho logo JLPT4YOU
- Clean sparkling stars background (52 stars)
- Responsive typography
- Social proof metrics
- Dual CTA buttons

**Usage:**
```tsx
import { HeroSection } from '@/components/landing'

<HeroSection />
```

### TetrisAnimation

Animation Tetris độc đáo tạo thành chữ "JLPT4YOU".

**Features:**
- Smooth falling animation
- Staggered timing cho từng letter
- Hover effects
- Performance optimized với Framer Motion

**Props:**
- `isVisible: boolean` - Trigger animation

**Usage:**
```tsx
import { TetrisAnimation } from '@/components/landing'

<TetrisAnimation isVisible={true} />
```

### SimpleTetrisAnimation (Currently Used)

Text-based animation với graduation cap icon tạo thành "🎓 JLPT4YOU".

**Features:**
- Graduation cap icon animation
- Sequential letter drop animation
- Spring physics với natural bounce
- Alternating colors (foreground/primary)
- Hover effects với scale và lift
- Shadow trail effects

**Props:**
- `isVisible: boolean` - Trigger animation

**Usage:**
```tsx
import { SimpleTetrisAnimation } from '@/components/landing'

<SimpleTetrisAnimation isVisible={true} />
```

### KeyBenefitsSection

Section hiển thị 4 lợi ích chính của JLPT4You platform.

**Features:**
- Responsive grid layout (4 cols → 2 cols → 1 col)
- Scroll-triggered animations với stagger effect
- Hover effects cho benefit cards
- Monochrome design system
- Professional icons từ Lucide React

**Benefits:**
1. Luyện đề mô phỏng sát đề thi thật (FileText icon)
2. Giải thích đáp án tự động với iRIN Sensei (Bot icon)
3. Kho đề thi và từ vựng phong phú (Library icon)
4. Nguồn tài liệu độc quyền phong phú (Crown icon)

**Usage:**
```tsx
import { KeyBenefitsSection } from '@/components/landing'

<KeyBenefitsSection />
```

### AIExplanationDemo

Interactive demo component showcasing iRIN Sensei AI explanation feature.

**Features:**
- Real JLPT question với tiếng Nhật và furigana
- Clickable answer options với visual feedback
- Typewriter effect cho AI explanation (70ms per character)
- Cursor blinking animation
- Answer validation với correct/incorrect indicators
- Reset functionality để thử lại
- Responsive design cho mobile và desktop

**Demo Content:**
- JLPT N3 vocabulary question
- 4 multiple choice options (A, B, C, D)
- AI explanation từ "iRIN Sensei" với educational tone
- Visual feedback: CheckCircle/XCircle icons

**Typewriter Hook:**
- Custom `useTypewriter` hook với configurable speed
- Smooth character-by-character animation
- Blinking cursor effect
- State management cho typing status

**Usage:**
```tsx
import { AIExplanationDemo } from '@/components/landing'

<AIExplanationDemo />
```

### PricingSection

Pricing comparison section với Free và Premium tiers.

**Features:**
- Side-by-side card layout (desktop) → stacked (mobile)
- Premium tier highlighted với "KHUYẾN NGHỊ" badge
- Feature comparison với checkmarks và X marks
- Scroll-triggered animations với stagger effects
- Responsive design với proper breakpoints
- Monochrome design system consistency

**Pricing Tiers:**
- **Free**: $0 với basic features (5 đề/tháng, N5-N4 content)
- **Premium**: $1.99 với unlimited access và advanced features

**Visual Elements:**
- Crown icon cho Premium badge
- Check/X icons cho feature comparison
- Thicker border và subtle background cho Premium
- Hover effects với lift animation
- CTA buttons: outline (Free) vs filled (Premium)

**Usage:**
```tsx
import { PricingSection } from '@/components/landing'

<PricingSection />
```

### WhyChooseUsSection

Problem-solution comparison section showcasing JLPT4YOU advantages.

**Features:**
- Problem vs Solution comparison table
- Responsive layout: table (desktop) → stacked cards (mobile)
- Scroll-triggered animations với stagger effects
- Visual icons cho each problem category
- Call-to-action summary với emotional appeal
- Monochrome design với accent colors cho status indicators

**Content Structure:**
- **Problems**: Common JLPT learning challenges
- **Solutions**: How JLPT4YOU addresses each problem
- **CTA Summary**: Emotional problem statement + solution + value proposition

**Visual Elements:**
- AlertTriangle icons cho problems (red)
- CheckCircle icons cho solutions (green)
- Category icons (Clock, DollarSign, BookOpen, Bot)
- Subtle background tint cho solution side
- Emoji accents cho key messages

**Usage:**
```tsx
import { WhyChooseUsSection } from '@/components/landing'

<WhyChooseUsSection />
```

### FinalCTASection

Final call-to-action section với dark background và star animations.

**Features:**
- Dark background (bg-foreground) với white text
- Animated star pattern background
- Key benefits highlight với star icons
- Dual CTA buttons (Free + Premium)
- Trust signals (no credit card, cancel anytime)
- Scroll-triggered animations với stagger effects

**Visual Elements:**
- Animated stars background (20 stars với random positions)
- Star icons cho benefits
- ArrowRight icon với hover animation
- Heart icon cho "Made with love" message

**Usage:**
```tsx
import { FinalCTASection } from '@/components/landing'

<FinalCTASection />
```

### Footer

Comprehensive footer với links, contact info, và legal pages.

**Features:**
- 5-column responsive layout (brand + 4 link sections)
- Brand section với logo, description, contact info
- Organized link sections: Product, JLPT Levels, Support, Legal
- Bottom footer với copyright, "made with love", trust badges
- Scroll-triggered animations cho all sections
- Monochrome design với subtle hover effects

**Link Sections:**
- **Product**: Features, Pricing, AI Demo, Resources
- **JLPT Levels**: N5, N4, N3, N2, N1 links
- **Support**: Help center, Contact, FAQ, Guide
- **Legal**: Terms, Privacy, Refund policy

**Usage:**
```tsx
import { Footer } from '@/components/landing'

<Footer />
```

## 🎭 Animation Details

### Tetris Animation

Animation được thiết kế để tạo hiệu ứng các khối Tetris rơi xuống và xếp thành chữ "JLPT4YOU":

1. **Initial State**: Blocks bắt đầu từ trên cao với random rotation
2. **Falling Effect**: Smooth animation với custom easing
3. **Staggered Timing**: Mỗi letter có delay khác nhau
4. **Final State**: Blocks xếp thành chữ hoàn chỉnh

**Performance Optimizations:**
- Sử dụng `transform` thay vì `position` changes
- Optimized easing curves
- Proper animation cleanup

## 🎨 Design System Integration

### Colors
Sử dụng hệ màu monochrome hiện có:
- `bg-primary` - Màu chính
- `bg-foreground` - Màu text chính
- `bg-muted` - Màu nhạt
- `text-muted-foreground` - Text phụ

### Spacing
Sử dụng utility classes hiện có:
- `app-container` - Container padding
- `app-section` - Section spacing
- `app-content` - Content max-width
- `app-gap-*` - Consistent gaps

### Typography
- Responsive font sizes với breakpoints
- Proper line heights cho readability
- Semantic heading hierarchy

## 📱 Responsive Design

### Breakpoints
- **Mobile**: < 768px
- **Tablet**: 768px - 1024px  
- **Desktop**: > 1024px

### Mobile Optimizations
- Reduced font sizes
- Stacked button layout
- Simplified navigation
- Optimized touch targets (≥ 44px)

## 🚀 Performance

### Animation Performance
- Hardware acceleration với `transform`
- Optimized timing functions
- Proper cleanup và memory management
- Reduced motion support

### Bundle Size
- Tree-shaking friendly exports
- Lazy loading cho heavy animations
- Minimal dependencies

## 🔧 Development

### Prerequisites
- Next.js 15+
- TypeScript
- Tailwind CSS v4
- Framer Motion

### Installation
```bash
npm install framer-motion
```

### Usage Example
```tsx
// pages/landing.tsx
import { LandingHeader, HeroSection } from '@/components/landing'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <LandingHeader />
      <HeroSection />
    </div>
  )
}
```

## 🎯 Future Enhancements

- [ ] Additional landing page sections (features, testimonials, pricing)
- [ ] More animation variants
- [ ] A/B testing support
- [ ] Analytics integration
- [ ] SEO optimizations

## 📝 Notes

- Animation timing có thể được adjust trong `tetris-animation.tsx`
- Colors có thể được customize thông qua CSS variables
- Responsive breakpoints tuân theo Tailwind CSS standards
- All components support dark/light mode tự động
