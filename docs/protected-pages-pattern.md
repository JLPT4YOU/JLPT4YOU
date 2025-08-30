# Protected Pages Pattern Design

## 🎯 **Enhanced Server-side Pattern**

### **Overview**
Unified pattern cho tất cả protected pages với:
- ✅ Server-side initial translation loading (SEO + Performance)
- ✅ Client-side language switching (UX)
- ✅ Scroll preservation (User experience)
- ✅ Error handling (Reliability)

---

## 📋 **Pattern Structure**

### **1. Page Component (Server-side)**
```typescript
// src/app/[lang]/example/page.tsx
import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { loadTranslation, getLanguageFromCode, generateHreflangLinks } from '@/lib/i18n'
import { ExamplePageContent } from '@/components/example/example-page-content'

interface PageProps {
  params: { lang: string }
}

export async function generateStaticParams() {
  return [
    { lang: 'vn' },
    { lang: 'en' },
    { lang: 'jp' }
  ]
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const language = getLanguageFromCode(params.lang)
  if (!language) return { title: 'Page Not Found' }
  
  const translations = await loadTranslation(language)
  const title = `${translations.pageTitle.example} - ${translations.common.appName}`
  
  return {
    title,
    description: translations.pageDescription.example,
    alternates: {
      languages: generateHreflangLinks(`/example`, 'https://jlpt4you.com')
        .reduce((acc, link) => ({ ...acc, [link.hreflang]: link.href }), {})
    }
  }
}

export default async function ExamplePage({ params }: PageProps) {
  const language = getLanguageFromCode(params.lang)
  if (!language) notFound()
  
  try {
    const translations = await loadTranslation(language)
    
    return (
      <ExamplePageContent 
        language={language}
        translations={translations}
      />
    )
  } catch (error) {
    console.error('Failed to load translations:', error)
    notFound()
  }
}
```

### **2. Content Component (Client-side)**
```typescript
// src/components/example/example-page-content.tsx
"use client"

import { useEffect } from 'react'
import { Language, TranslationData } from '@/lib/i18n'
import { useTranslations } from '@/hooks/use-translations'
import { useScrollPreservation } from '@/lib/use-scroll-preservation'
import { ProtectedRoute } from '@/components/auth/protected-route'

interface ExamplePageContentProps {
  language: Language
  translations: TranslationData
}

export function ExamplePageContent({ language, translations }: ExamplePageContentProps) {
  const { t, switchLanguage, isLoading } = useTranslations(translations, language)
  const { preserveScroll } = useScrollPreservation()
  
  // Handle language switching with scroll preservation
  const handleLanguageSwitch = async (newLanguage: Language) => {
    preserveScroll()
    await switchLanguage(newLanguage)
  }
  
  if (isLoading) {
    return <ExamplePageSkeleton />
  }
  
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        {/* Header with language switcher */}
        <Header 
          onLanguageSwitch={handleLanguageSwitch}
          currentLanguage={language}
        />
        
        {/* Main content */}
        <main className="app-container">
          <h1 className="text-3xl font-bold mb-6">
            {t('pageTitle.example')}
          </h1>
          
          {/* Page content */}
          <div className="app-content">
            {/* Content here */}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  )
}

function ExamplePageSkeleton() {
  return (
    <div className="min-h-screen bg-background animate-pulse">
      <div className="h-16 bg-muted mb-6" />
      <div className="app-container">
        <div className="h-8 bg-muted rounded mb-6 w-1/3" />
        <div className="space-y-4">
          <div className="h-4 bg-muted rounded w-full" />
          <div className="h-4 bg-muted rounded w-3/4" />
          <div className="h-4 bg-muted rounded w-1/2" />
        </div>
      </div>
    </div>
  )
}
```

---

## 🔧 **Implementation Guidelines**

### **Required Features for All Protected Pages:**

#### ✅ **1. Server-side Requirements**
- `generateStaticParams()` for all 3 languages
- `generateMetadata()` with localized titles/descriptions
- `loadTranslation()` for initial translations
- `getLanguageFromCode()` for language validation
- `notFound()` for invalid languages
- Error handling with try-catch

#### ✅ **2. Client-side Requirements**
- `useTranslations()` hook for dynamic switching
- `useScrollPreservation()` for smooth transitions
- `ProtectedRoute` wrapper for authentication
- Loading skeleton for better UX
- Language switcher integration

#### ✅ **3. SEO Requirements**
- Hreflang links in metadata
- Localized page titles and descriptions
- Static generation for all languages
- Proper error pages (404)

#### ✅ **4. UX Requirements**
- Loading states during language switching
- Scroll position preservation
- Smooth transitions
- Error boundaries

---

## 📊 **Pattern Benefits**

### **🚀 Performance**
- Server-side rendering for initial load
- Static generation for fast delivery
- Client-side caching for subsequent switches
- Optimized bundle splitting

### **🔍 SEO**
- Perfect SEO with server-side rendering
- Hreflang tags for international SEO
- Localized metadata
- Search engine friendly URLs

### **👤 User Experience**
- Instant initial page load
- Smooth language switching
- Scroll preservation
- Loading feedback

### **🛠️ Developer Experience**
- Consistent pattern across all pages
- Reusable components
- Type safety
- Easy maintenance

---

## 🎯 **Implementation Priority**

### **Phase 1: Core Pages (High Priority)**
1. `/home` - Main dashboard
2. `/jlpt/*` - JLPT test pages
3. `/challenge/*` - Challenge mode
4. `/driving/*` - Driving test pages

### **Phase 2: Exam Pages (Medium Priority)**
1. Test execution pages
2. Test setup pages
3. Results pages
4. Review pages

### **Phase 3: Enhancement (Low Priority)**
1. Advanced error handling
2. Performance optimizations
3. Analytics integration
4. A/B testing support

---

## 📋 **Checklist for Each Page**

### **Server Component ✅**
- [ ] `generateStaticParams()` implemented
- [ ] `generateMetadata()` with hreflang
- [ ] `loadTranslation()` error handling
- [ ] Language validation with `notFound()`
- [ ] Proper TypeScript interfaces

### **Client Component ✅**
- [ ] `useTranslations()` hook
- [ ] `useScrollPreservation()` hook
- [ ] `ProtectedRoute` wrapper
- [ ] Loading skeleton component
- [ ] Language switcher integration

### **Testing ✅**
- [ ] Language switching works
- [ ] Scroll preservation works
- [ ] SEO metadata correct
- [ ] Error handling works
- [ ] Performance acceptable

---

## 🔄 **Migration Strategy**

### **Step 1: Identify Current Pattern**
- Server-side only: Add client-side switching
- Client-side only: Add server-side rendering
- No translation: Full implementation

### **Step 2: Create Components**
- Page content component
- Loading skeleton
- Error boundary

### **Step 3: Update Page**
- Add server-side metadata
- Implement client-side switching
- Add error handling

### **Step 4: Test & Validate**
- Language switching
- SEO metadata
- Performance
- Error cases

This pattern ensures consistency, performance, and excellent user experience across all protected pages.
