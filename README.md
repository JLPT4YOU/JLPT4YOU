# 🎓 JLPT4YOU - Nền tảng học tập JLPT thông minh

[![Next.js](https://img.shields.io/badge/Next.js-15.3.5-black)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-blue)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-SSR-green)](https://supabase.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-38bdf8)](https://tailwindcss.com/)

Nền tảng học tập JLPT (Japanese Language Proficiency Test) với AI hỗ trợ, hệ thống thi thử đa dạng và giao diện đa ngôn ngữ (Việt Nam, Nhật Bản, English).

## ✨ Tính năng chính

### 🎯 Hệ thống thi thử
- **JLPT Official**: Đề thi mô phỏng chính thức (N1-N5)
- **JLPT Custom**: Tùy chỉnh đề thi theo nhu cầu
- **Challenge Mode**: Chế độ thách thức với anti-cheat
- **Driving Test**: Thi bằng lái xe (Honmen/Karimen)

### 🤖 AI Integration
- **Multi-Provider**: Groq (Llama), Google Gemini, Mistral AI
- **Chat Interface**: Hỗ trợ học tập với AI
- **PDF Processing**: Phân tích tài liệu học tập
- **Smart Explanations**: Giải thích chi tiết với typewriter effect

### 🌍 Đa ngôn ngữ (i18n)
- **3 ngôn ngữ**: Tiếng Việt, 日本語, English
- **SEO-friendly URLs**: `/vn/`, `/jp/`, `/en/`
- **Dynamic switching**: Chuyển đổi ngôn ngữ real-time
- **Fallback system**: Xử lý thiếu translation

### 👤 Quản lý người dùng
- **Role-based Access**: Free, Premium, Admin
- **Supabase Auth**: SSR authentication
- **User Dashboard**: Theo dõi tiến độ
- **Premium Features**: Tải PDF, AI unlimited

## 🏗️ Kiến trúc kỹ thuật

### Tech Stack
```
Frontend:  Next.js 15 (App Router) + React 19 + TypeScript
Styling:   Tailwind CSS v4 + Framer Motion
Backend:   Supabase (Auth + Database + Storage)
AI:        Groq + Google Gemini + Mistral
Testing:   Jest + Testing Library + Playwright
```

### Cấu trúc thư mục
```
src/
├── app/                    # Next.js App Router
│   ├── [lang]/            # i18n routes (landing)
│   ├── auth/              # Authentication pages
│   ├── api/               # API routes
│   ├── jlpt/              # JLPT test system
│   ├── challenge/         # Challenge mode
│   ├── driving/           # Driving test
│   └── library/           # Study materials
├── components/            # React components
├── contexts/              # React contexts
├── hooks/                 # Custom hooks
├── lib/                   # Utilities & services
├── translations/          # i18n JSON files
└── types/                 # TypeScript definitions
```

## 🚀 Bắt đầu

### Yêu cầu hệ thống
- Node.js 18+
- npm/yarn/pnpm
- Supabase account

### Cài đặt
```bash
# Clone repository
git clone https://github.com/your-org/jlpt4you.git
cd jlpt4you

# Cài đặt dependencies
npm install

# Cấu hình environment
cp .env.example .env.local
# Điền thông tin Supabase, AI API keys

# Chạy development server
npm run dev
```

### Environment Variables
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# AI Providers
GROQ_API_KEY=your_groq_key
GOOGLE_AI_API_KEY=your_gemini_key
MISTRAL_API_KEY=your_mistral_key

# App Config
NEXT_PUBLIC_DOMAIN=localhost:3000
NODE_ENV=development
```

## 📝 Scripts

```bash
# Development
npm run dev              # Start dev server
npm run build           # Production build
npm run start           # Start production server

# Testing
npm run test            # Run unit tests
npm run test:watch      # Watch mode
npm run test:coverage   # Coverage report
npm run test:ci         # CI testing

# Code Quality
npm run lint            # ESLint check
npm run type-check      # TypeScript check

# Analysis
npm run analyze         # Bundle analyzer
npm run analyze:server  # Server bundle
npm run analyze:browser # Client bundle
```

## 🧪 Testing

### Test Coverage
- **Target**: 80% core functionality, 95% auth/middleware
- **Current**: 10% (cần cải thiện)
- **Tools**: Jest + Testing Library + Playwright

### Test Categories
```bash
# Unit Tests
src/__tests__/auth/rbac.test.ts        # RBAC permissions
src/__tests__/auth/middleware.test.ts  # Auth middleware

# Integration Tests (planned)
- Login/redirect flows
- JLPT exam workflows  
- i18n language switching
- API endpoints

# E2E Tests (planned)
- Complete user journeys
- Cross-browser testing
- Performance benchmarks
```

## 🔒 Bảo mật

### Authentication
- **Supabase SSR**: Server-side rendering auth
- **Session Management**: Secure cookie handling
- **Role-based Access Control**: Free/Premium/Admin
- **Route Protection**: Middleware validation

### API Security
- **Input Validation**: Zod schemas
- **Rate Limiting**: Upstash Redis
- **CORS Configuration**: Controlled origins
- **SQL Injection**: Supabase RLS policies

## 🌐 Internationalization

### Supported Languages
- 🇻🇳 **Vietnamese** (vn) - Primary
- 🇯🇵 **Japanese** (jp) - Native content
- 🇺🇸 **English** (en) - International

### i18n Implementation
```typescript
// Translation usage
const { t } = useTranslations()
const title = t('exam.jlpt.title')

// Language switching
const { switchLanguage } = useLanguageContext()
await switchLanguage('jp')
```

### SEO Features
- **Hreflang tags**: Multi-language SEO
- **Structured data**: Rich snippets
- **Dynamic sitemaps**: Auto-generated
- **Meta optimization**: Per-language content

## 📊 Performance

### Optimization Features
- **Bundle Splitting**: Dynamic imports
- **Image Optimization**: Next.js Image
- **Font Loading**: Google Fonts optimization
- **Caching Strategy**: ISR + SWR patterns

### Monitoring
- **Web Vitals**: Core performance metrics
- **Bundle Analysis**: Size tracking
- **Error Tracking**: Comprehensive logging
- **Performance Budget**: < 100ms route generation

## 🎨 Design System

### Color Palette
- **Monochrome**: Grayscale-only design
- **Dark Mode**: Warm tones, reduced contrast
- **Accessibility**: WCAG AA compliance

### Components
- **Utility Classes**: app-container, app-section
- **Responsive Grid**: 5-4-3-2-1 scaling
- **Consistent Spacing**: Systematic padding/margin

## 🤝 Contributing

### Development Workflow
1. Fork repository
2. Create feature branch
3. Follow coding standards
4. Add tests for new features
5. Submit pull request

### Code Standards
- **TypeScript**: Strict mode enabled
- **ESLint**: Next.js + TypeScript rules
- **Prettier**: Code formatting
- **Conventional Commits**: Commit message format

## 📈 Roadmap

### Phase 1: Stability & Security (Q1 2024)
- [ ] Fix build pipeline issues
- [ ] Secure authentication cookies
- [ ] Consolidate auth routes
- [ ] Type safety improvements

### Phase 2: Architecture & i18n (Q2 2024)
- [ ] Unified i18n strategy
- [ ] Reduce code duplication
- [ ] Enhanced SEO implementation
- [ ] Comprehensive testing

### Phase 3: Performance & UX (Q3 2024)
- [ ] Bundle optimization
- [ ] Accessibility improvements
- [ ] Mobile experience
- [ ] Advanced AI features

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Supabase**: Backend infrastructure
- **Vercel**: Deployment platform
- **OpenAI/Groq/Google**: AI capabilities
- **Next.js Team**: Framework excellence

---

**Made with ❤️ for Japanese language learners worldwide**
