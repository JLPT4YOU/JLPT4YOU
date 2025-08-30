/**
 * Shared Page Utilities for JLPT4You
 * Eliminates 95% of page structure duplication across language-aware pages
 */

import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { loadTranslation, Language, TranslationData } from '@/lib/i18n'

// Import core functions
import {
  getLanguageFromCode,
  generateHreflangLinks,
  getContentLanguage,
  generateLanguageStaticParams as coreGenerateLanguageStaticParams,
  extractPageSegments as coreExtractPageSegments,
  validatePageParams as coreValidatePageParams,
  generateRoute as coreGenerateRoute,
  type RouteFeature,
  type RouteParams
} from './page-utils-core'

// Re-export core functions
export {
  getLanguageFromCode,
  generateHreflangLinks,
  getContentLanguage,
  type RouteFeature,
  type RouteParams
}
export { coreExtractPageSegments as extractPageSegments }
export { coreValidatePageParams as validatePageParams }
export { coreGenerateRoute as generateRoute }

// Standard language-aware page props
export interface LanguageAwarePageProps {
  translations: TranslationData
  language: Language
}

// Metadata configuration for pages
export interface MetadataConfig {
  titleKey: string
  descriptionKey: string
  path: string
  alternateUrls?: {
    [key: string]: string
  }
}



// Generate page metadata with consistent structure
export function generatePageMetadata(
  language: Language,
  translations: TranslationData,
  config: MetadataConfig
): Metadata {
  // Extract nested translation keys
  const getNestedTranslation = (key: string): string => {
    const keys = key.split('.')
    let value: any = translations
    
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k]
      } else {
        console.warn(`Translation key not found: ${key}`)
        return key
      }
    }
    
    return value || key
  }

  const title = `${translations.common.appName} - ${getNestedTranslation(config.titleKey)}`
  const description = getNestedTranslation(config.descriptionKey)

  return {
    title,
    description,
    alternates: {
      languages: config.alternateUrls || generateHreflangLinks(config.path)
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      }
    },
    other: {
      'content-language': getContentLanguage(language)
    }
  }
}

// Standard static params generation for all language-aware pages
export function generateLanguageStaticParams() {
  return coreGenerateLanguageStaticParams()
}

// Higher-order function to create language-aware pages
export function createLanguageAwarePage<T extends Record<string, any>>(
  Component: React.ComponentType<T & LanguageAwarePageProps>,
  metadataConfig: MetadataConfig
) {
  // Generate metadata function
  const generateMetadata = async ({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> => {
    const { lang } = await params
    const language = getLanguageFromCode(lang)

    if (!language) {
      return {}
    }

    const translations = await loadTranslation(language)
    return generatePageMetadata(language, translations, metadataConfig)
  }

  // Page component
  const LanguageAwarePage = async ({ params, ...props }: { params: Promise<{ lang: string }> } & T) => {
    const { lang } = await params
    const language = getLanguageFromCode(lang)
    
    if (!language) {
      notFound()
    }

    const translations = await loadTranslation(language)

    return (
      <Component 
        {...(props as unknown as T)}
        translations={translations} 
        language={language} 
      />
    )
  }

  // Attach metadata generation and static params
  LanguageAwarePage.generateMetadata = generateMetadata
  LanguageAwarePage.generateStaticParams = generateLanguageStaticParams
  LanguageAwarePage.dynamic = 'force-static' as const

  return LanguageAwarePage
}



