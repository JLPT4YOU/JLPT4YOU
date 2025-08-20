import React from 'react'
import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { loadTranslation, getLanguageFromCode, generateHreflangLinksLegacy as generateHreflangLinks, Language, TranslationData } from '@/lib/i18n'

// Standard interface for page props (Next.js 15 compatible)
export interface ProtectedPageProps {
  params: Promise<{ lang: string }>
}

// Standard interface for dynamic pages (Next.js 15 compatible)
export interface DynamicProtectedPageProps {
  params: Promise<{ lang: string; [key: string]: string }>
}

// Generate static params for all languages
export function generateLanguageStaticParams() {
  return [
    { lang: 'vn' },
    { lang: 'en' },
    { lang: 'jp' }
  ]
}

// Create metadata generator function
export function createMetadataGenerator(
  titleKey: string,
  descriptionKey: string,
  route: string
) {
  return async function generateMetadata({ params }: ProtectedPageProps): Promise<Metadata> {
    const resolvedParams = await params
    const language = getLanguageFromCode(resolvedParams.lang)
    if (!language) {
      return {
        title: 'Page Not Found',
        description: 'The requested page could not be found.'
      }
    }
    
    try {
      const translations = await loadTranslation(language)
      
      // Get title and description from translation keys
      const title = getNestedValue(translations, titleKey) || 'JLPT4YOU'
      const description = getNestedValue(translations, descriptionKey) || 'JLPT practice platform'
      const appName = translations.common?.appName || 'JLPT4YOU'
      
      const fullTitle = title.includes(appName) ? title : `${title} - ${appName}`
      
      return {
        title: fullTitle,
        description,
        alternates: {
          languages: generateHreflangLinks(route, 'https://jlpt4you.com')
            .reduce((acc, link) => ({ ...acc, [link.hreflang]: link.href }), {})
        },
        openGraph: {
          title: fullTitle,
          description,
          type: 'website',
          locale: getOpenGraphLocale(language),
          alternateLocale: getAlternateLocales(language)
        }
      }
    } catch (error) {
      console.error('Failed to generate metadata:', error)
      return {
        title: 'JLPT4YOU',
        description: 'JLPT practice platform'
      }
    }
  }
}

// Create page component generator
export function createProtectedPageComponent<T extends Record<string, any> = {}>(
  ContentComponent: React.ComponentType<{
    language: Language
    translations: TranslationData
  } & T>,
  additionalPropsExtractor?: (params: any) => T
) {
  return async function ProtectedPage({ params }: DynamicProtectedPageProps) {
    const resolvedParams = await params
    const language = getLanguageFromCode(resolvedParams.lang)
    if (!language) notFound()
    
    try {
      const translations = await loadTranslation(language)
      const additionalProps = additionalPropsExtractor ? additionalPropsExtractor(resolvedParams) : {} as T
      
      return (
        <ContentComponent 
          language={language}
          translations={translations}
          {...additionalProps}
        />
      )
    } catch (error) {
      console.error('Failed to load translations:', error)
      notFound()
    }
  }
}

// Utility to get nested value from object using dot notation
function getNestedValue(obj: any, path: string): string | undefined {
  return path.split('.').reduce((current, key) => {
    return current && typeof current === 'object' ? current[key] : undefined
  }, obj)
}

// Get OpenGraph locale from language
function getOpenGraphLocale(language: Language): string {
  const localeMap = {
    vn: 'vi_VN',
    en: 'en_US',
    jp: 'ja_JP'
  }
  return localeMap[language] || 'en_US'
}

// Get alternate locales for OpenGraph
function getAlternateLocales(currentLanguage: Language): string[] {
  const allLocales = ['vi_VN', 'en_US', 'ja_JP']
  const currentLocale = getOpenGraphLocale(currentLanguage)
  return allLocales.filter(locale => locale !== currentLocale)
}

// Validate language parameter
export function validateLanguageParam(lang: string): Language | null {
  return getLanguageFromCode(lang)
}

// Create error handler for translation loading
export function createTranslationErrorHandler(fallbackRoute?: string) {
  return function handleTranslationError(error: Error) {
    console.error('Translation loading error:', error)
    
    if (fallbackRoute) {
      // Could redirect to fallback route
      // redirect(fallbackRoute)
    }
    
    // For now, just trigger 404
    notFound()
  }
}

// Standard loading state component
export function createLoadingComponent(title?: string) {
  return function LoadingComponent() {
    return (
      <div className="min-h-screen bg-background animate-pulse">
        <div className="h-16 bg-muted border-b border-border mb-6" />
        
        <div className="app-container">
          <div className="space-y-6">
            {title && (
              <div className="h-8 bg-muted rounded w-1/3" />
            )}
            
            <div className="space-y-4">
              <div className="h-4 bg-muted rounded w-full" />
              <div className="h-4 bg-muted rounded w-3/4" />
              <div className="h-4 bg-muted rounded w-1/2" />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-32 bg-muted rounded-lg" />
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }
}

// Type-safe translation key validator
export function validateTranslationKeys(
  translations: TranslationData,
  requiredKeys: string[]
): { valid: boolean; missingKeys: string[] } {
  const missingKeys: string[] = []
  
  for (const key of requiredKeys) {
    if (!getNestedValue(translations, key)) {
      missingKeys.push(key)
    }
  }
  
  return {
    valid: missingKeys.length === 0,
    missingKeys
  }
}

// Performance monitoring for translation loading
export function measureTranslationPerformance<T>(
  operation: () => Promise<T>,
  operationName: string
): Promise<T> {
  const startTime = performance.now()
  
  return operation().then(result => {
    const endTime = performance.now()
    const duration = endTime - startTime
    
    if (duration > 100 && process.env.NODE_ENV === 'development') {
      console.warn(`Slow translation operation: ${operationName} took ${duration.toFixed(2)}ms`)
    }
    
    return result
  }).catch(error => {
    const endTime = performance.now()
    const duration = endTime - startTime
    if (process.env.NODE_ENV === 'development') {
      console.error(`Translation operation failed: ${operationName} after ${duration.toFixed(2)}ms`, error)
    }
    throw error
  })
}
