// TEMPLATE: Protected Page Implementation
// Copy this template and replace placeholders with actual values

// ============================================================================
// PAGE COMPONENT (Server-side) - src/app/[lang]/ROUTE_NAME/page.tsx
// ============================================================================

import { 
  createMetadataGenerator, 
  createProtectedPageComponent,
  generateLanguageStaticParams 
} from '@/lib/protected-page-utils'
import { COMPONENT_NAMEPageContent } from '@/components/ROUTE_NAME/COMPONENT_NAME-page-content'

// Generate static params for all languages
export const generateStaticParams = generateLanguageStaticParams

// Generate metadata with localized titles and SEO
export const generateMetadata = createMetadataGenerator(
  'pageTitle.TITLE_KEY',           // Replace with actual translation key
  'pageDescription.DESCRIPTION_KEY', // Replace with actual translation key  
  '/ROUTE_NAME'                    // Replace with actual route
)

// Main page component
export default createProtectedPageComponent(COMPONENT_NAMEPageContent)

// ============================================================================
// CONTENT COMPONENT (Client-side) - src/components/ROUTE_NAME/COMPONENT_NAME-page-content.tsx
// ============================================================================

"use client"

import { Language, TranslationData } from '@/lib/i18n'
import { ProtectedPageWrapper, useProtectedPage } from '@/components/layout/protected-page-wrapper'

interface COMPONENT_NAMEPageContentProps {
  language: Language
  translations: TranslationData
}

export function COMPONENT_NAMEPageContent({ language, translations }: COMPONENT_NAMEPageContentProps) {
  const { t, handleLanguageSwitch, isLoading } = useProtectedPage(language, translations)
  
  if (isLoading) {
    return <COMPONENT_NAMEPageSkeleton />
  }
  
  return (
    <ProtectedPageWrapper
      language={language}
      translations={translations}
      onLanguageSwitch={handleLanguageSwitch}
    >
      <div className="app-content">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            {t('pageTitle.TITLE_KEY')}
          </h1>
          <p className="text-muted-foreground">
            {t('pageDescription.DESCRIPTION_KEY')}
          </p>
        </div>
        
        {/* Main Content */}
        <div className="space-y-6">
          {/* Replace with actual content */}
          <div className="bg-card border border-border rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">
              {t('sections.SECTION_KEY')}
            </h2>
            
            {/* Content here */}
          </div>
        </div>
      </div>
    </ProtectedPageWrapper>
  )
}

// Loading skeleton
function COMPONENT_NAMEPageSkeleton() {
  return (
    <div className="min-h-screen bg-background animate-pulse">
      <div className="h-16 bg-muted border-b border-border mb-6" />
      
      <div className="app-container">
        <div className="app-content">
          <div className="mb-8">
            <div className="h-8 bg-muted rounded w-1/3 mb-2" />
            <div className="h-4 bg-muted rounded w-1/2" />
          </div>
          
          <div className="space-y-6">
            <div className="bg-muted rounded-lg h-32" />
            <div className="bg-muted rounded-lg h-32" />
            <div className="bg-muted rounded-lg h-32" />
          </div>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// TRANSLATION KEYS - Add to src/translations/*.json
// ============================================================================

/*
Add these keys to vn.json, en.json, jp.json:

{
  "pageTitle": {
    "TITLE_KEY": "Page Title in Vietnamese/English/Japanese"
  },
  "pageDescription": {
    "DESCRIPTION_KEY": "Page description in Vietnamese/English/Japanese"
  },
  "sections": {
    "SECTION_KEY": "Section title in Vietnamese/English/Japanese"
  }
}
*/

// ============================================================================
// IMPLEMENTATION CHECKLIST
// ============================================================================

/*
✅ Server Component:
- [ ] Replace ROUTE_NAME with actual route
- [ ] Replace COMPONENT_NAME with actual component name
- [ ] Replace TITLE_KEY with actual translation key
- [ ] Replace DESCRIPTION_KEY with actual translation key
- [ ] Update route path in generateMetadata

✅ Client Component:
- [ ] Replace COMPONENT_NAME with actual component name
- [ ] Replace translation keys with actual keys
- [ ] Implement actual content
- [ ] Customize loading skeleton
- [ ] Add error handling if needed

✅ Translation Keys:
- [ ] Add pageTitle.TITLE_KEY to all language files
- [ ] Add pageDescription.DESCRIPTION_KEY to all language files
- [ ] Add any additional keys used in content
- [ ] Verify consistency across all languages

✅ Testing:
- [ ] Test language switching works
- [ ] Test scroll preservation works
- [ ] Test SEO metadata is correct
- [ ] Test loading states work
- [ ] Test error handling works
- [ ] Test on mobile devices
- [ ] Test performance is acceptable

✅ SEO:
- [ ] Verify hreflang links are correct
- [ ] Verify page titles are localized
- [ ] Verify descriptions are localized
- [ ] Verify OpenGraph tags work
- [ ] Test with SEO tools
*/

// ============================================================================
// USAGE EXAMPLE
// ============================================================================

/*
For a page at /app/[lang]/jlpt/custom/page.tsx:

1. Copy template to src/app/[lang]/jlpt/custom/page.tsx
2. Replace:
   - ROUTE_NAME → jlpt/custom
   - COMPONENT_NAME → JlptCustom
   - TITLE_KEY → jlptCustom
   - DESCRIPTION_KEY → jlptCustom

3. Copy content component to src/components/jlpt/jlpt-custom-page-content.tsx
4. Add translation keys to all language files
5. Implement actual content
6. Test thoroughly
*/
