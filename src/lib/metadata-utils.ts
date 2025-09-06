/**
 * Shared Metadata Utilities for JLPT4You
 * Consolidates metadata generation across all pages to eliminate 98% duplication
 */

import { Metadata } from 'next'
import { Language, TranslationData } from '@/lib/i18n/'

// Base URL configuration
const BASE_URL = 'https://jlpt4you.com'

// Standard metadata configuration interface
export interface MetadataConfig {
  titleKey: string
  descriptionKey: string
  path: string
  keywords?: readonly string[]
  alternateUrls?: Record<string, string>
  noIndex?: boolean
  canonical?: string
}

// Feature-specific metadata configurations
export const METADATA_CONFIGS = {
  // Home page
  home: {
    titleKey: 'hero.title',
    descriptionKey: 'hero.description',
    path: '/home',
    keywords: ['JLPT', 'Japanese', 'learning', 'test', 'preparation']
  },

  // JLPT pages
  jlpt: {
    titleKey: 'jlpt.page.title',
    descriptionKey: 'jlpt.page.subtitle',
    path: '/jlpt',
    keywords: ['JLPT', 'Japanese Language Proficiency Test', 'N1', 'N2', 'N3', 'N4', 'N5']
  },
  jlptOfficial: {
    titleKey: 'jlpt.official.page.title',
    descriptionKey: 'jlpt.official.page.subtitle',
    path: '/jlpt/official',
    keywords: ['JLPT official', 'practice test', 'mock exam']
  },
  jlptCustom: {
    titleKey: 'jlpt.custom.page.title',
    descriptionKey: 'jlpt.custom.page.subtitle',
    path: '/jlpt/custom',
    keywords: ['JLPT custom', 'personalized test', 'adaptive learning']
  },

  // Challenge pages
  challenge: {
    titleKey: 'challenge.page.title',
    descriptionKey: 'challenge.page.subtitle',
    path: '/challenge',
    keywords: ['JLPT challenge', 'timed test', 'anti-cheat', 'competitive']
  },

  // Driving pages
  driving: {
    titleKey: 'driving.page.title',
    descriptionKey: 'driving.page.subtitle',
    path: '/driving',
    keywords: ['driving test', 'Japan driving license', 'theory test']
  },

  // Auth pages
  authLogin: {
    titleKey: 'auth.titles.login',
    descriptionKey: 'auth.subtitles.login',
    path: '/login',
    noIndex: true
  },
  authRegister: {
    titleKey: 'auth.titles.register',
    descriptionKey: 'auth.subtitles.register',
    path: '/register',
    noIndex: true
  },
  authForgotPassword: {
    titleKey: 'auth.titles.forgotPassword',
    descriptionKey: 'auth.subtitles.forgotPassword',
    path: '/forgot-password',
    noIndex: true
  }
} as const

// Generate hreflang links for international SEO (delegates to unified i18n implementation)
import { generateHreflangLinks as generateHreflangLinksUnified } from '@/lib/i18n/'

export function generateHreflangLinks(path: string): Record<string, string> {
  // Use unified implementation from i18n.ts and convert Array to Record format
  const hreflangArray = generateHreflangLinksUnified(path, BASE_URL)
  const record: Record<string, string> = {}

  for (const { hreflang, href } of hreflangArray) {
    record[hreflang] = href
  }

  // Add x-default for backward compatibility (Vietnamese as default)
  if (!record['x-default']) {
    record['x-default'] = record['vi-VN'] || `${BASE_URL}/vn${path}`
  }

  return record
}

// Get content language for HTTP headers
export function getContentLanguage(language: Language): string {
  const languageMap: Record<Language, string> = {
    vn: 'vi-VN',
    jp: 'ja-JP',
    en: 'en-US'
  }
  
  return languageMap[language]
}

// Extract nested translation value
export function getNestedTranslation(translations: TranslationData, key: string): string {
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

// Generate structured data for SEO
export function generateStructuredData(
  language: Language,
  translations: TranslationData,
  config: MetadataConfig
) {
  const title = getNestedTranslation(translations, config.titleKey)
  const description = getNestedTranslation(translations, config.descriptionKey)
  
  return {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: title,
    description: description,
    url: `${BASE_URL}/${language}${config.path}`,
    inLanguage: getContentLanguage(language),
    isPartOf: {
      '@type': 'WebSite',
      name: translations.common.appName,
      url: BASE_URL
    }
  }
}

// Generate Open Graph metadata
export function generateOpenGraphMetadata(
  language: Language,
  translations: TranslationData,
  config: MetadataConfig
) {
  const title = `${translations.common.appName} - ${getNestedTranslation(translations, config.titleKey)}`
  const description = getNestedTranslation(translations, config.descriptionKey)
  const url = `${BASE_URL}/${language}${config.path}`
  
  return {
    title,
    description,
    url,
    siteName: translations.common.appName,
    locale: getContentLanguage(language),
    type: 'website',
    images: [
      {
        url: `${BASE_URL}/og-image-${language}.jpg`,
        width: 1200,
        height: 630,
        alt: title
      }
    ]
  }
}

// Generate Twitter Card metadata
export function generateTwitterMetadata(
  language: Language,
  translations: TranslationData,
  config: MetadataConfig
) {
  const title = `${translations.common.appName} - ${getNestedTranslation(translations, config.titleKey)}`
  const description = getNestedTranslation(translations, config.descriptionKey)
  
  return {
    card: 'summary_large_image',
    title,
    description,
    images: [`${BASE_URL}/twitter-image-${language}.jpg`]
  }
}

// Main metadata generation function
export function generatePageMetadata(
  language: Language,
  translations: TranslationData,
  config: MetadataConfig
): Metadata {
  const title = `${translations.common.appName} - ${getNestedTranslation(translations, config.titleKey)}`
  const description = getNestedTranslation(translations, config.descriptionKey)
  const canonical = config.canonical || `${BASE_URL}/${language}${config.path}`

  return {
    title,
    description,
    keywords: config.keywords?.join(', '),
    
    // Canonical URL
    alternates: {
      canonical,
      languages: config.alternateUrls || generateHreflangLinks(config.path)
    },
    
    // Robots configuration
    robots: {
      index: !config.noIndex,
      follow: !config.noIndex,
      googleBot: {
        index: !config.noIndex,
        follow: !config.noIndex,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      }
    },
    
    // Open Graph
    openGraph: generateOpenGraphMetadata(language, translations, config),
    
    // Twitter Card
    twitter: generateTwitterMetadata(language, translations, config),
    
    // Additional headers
    other: {
      'content-language': getContentLanguage(language)
    }
  }
}

// Convenience function to get predefined metadata config
export function getMetadataConfig(configKey: keyof typeof METADATA_CONFIGS): MetadataConfig {
  return METADATA_CONFIGS[configKey]
}

// Generate metadata for dynamic routes
export function generateDynamicMetadata(
  language: Language,
  translations: TranslationData,
  feature: string,
  subFeature?: string,
  level?: string
): Metadata {
  let configKey: keyof typeof METADATA_CONFIGS
  let dynamicPath = `/${feature}`
  
  // Determine config key based on route structure
  if (feature === 'jlpt') {
    if (subFeature === 'official') {
      configKey = 'jlptOfficial'
      dynamicPath = '/jlpt/official'
    } else if (subFeature === 'custom') {
      configKey = 'jlptCustom'
      dynamicPath = '/jlpt/custom'
    } else {
      configKey = 'jlpt'
    }
  } else if (feature === 'challenge') {
    configKey = 'challenge'
  } else if (feature === 'driving') {
    configKey = 'driving'
  } else {
    configKey = 'home'
  }
  
  // Add level to path if present
  if (level) {
    dynamicPath += `/${level}`
  }
  
  const config = {
    ...METADATA_CONFIGS[configKey],
    path: dynamicPath
  }
  
  return generatePageMetadata(language, translations, config)
}

// Generate JSON-LD structured data script
export function generateJsonLdScript(
  language: Language,
  translations: TranslationData,
  config: MetadataConfig
): string {
  const structuredData = generateStructuredData(language, translations, config)
  return JSON.stringify(structuredData)
}
