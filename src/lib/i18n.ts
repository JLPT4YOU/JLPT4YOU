// Server-side utilities (no React hooks)
// Client-side hooks are in use-translation.ts

// Re-export constants from centralized types
export { 
  SUPPORTED_LANGUAGES,
  DEFAULT_LANGUAGE,
  LANGUAGE_METADATA
} from './i18n-types'

// Re-export types separately for isolatedModules compatibility
export type {
  Language,
  TranslationData,
  CommonTranslations,
  AuthTranslations,
  ExamTranslations,
  TranslationPath,
  TranslationKey
} from './i18n-types'

// Re-export optimized utilities
export {
  detectLanguage,
  PathManager,
  ROUTES,
  isProtectedRoute,
  isPublicRoute
} from './i18n-utils'

// Import for internal use
import { SUPPORTED_LANGUAGES, DEFAULT_LANGUAGE, Language, TranslationData } from './i18n-types'
import { LANGUAGE_METADATA } from './i18n-types'

// Keep backward compatibility exports
export { PathManager as UrlUtils } from './i18n-utils'

/**
 * Legacy regex builders - kept for backward compatibility
 * Consider using PathManager methods instead
 */
export function buildLanguagePrefixRegex(options: { includeNumericLegacy?: boolean } = {}): string {
  const { includeNumericLegacy = true } = options
  const langCodes: string[] = [...SUPPORTED_LANGUAGES]
  if (includeNumericLegacy) {
    langCodes.push('1', '2', '3')
  }
  return `^/(${langCodes.join('|')})/`
}

export function getLanguagePrefixRegex(options: { includeNumericLegacy?: boolean } = {}): RegExp {
  const { includeNumericLegacy = true } = options
  const langCodes: string[] = [...SUPPORTED_LANGUAGES]
  if (includeNumericLegacy) {
    langCodes.push('1', '2', '3')
  }
  return new RegExp(`^/(${langCodes.join('|')})/`)
}

// Translation type definitions moved to i18n-types.ts

// Cache for loaded translations
const translationCache = new Map<Language, TranslationData>()

/**
 * Load translation data for a specific language
 */
export async function loadTranslation(language: Language): Promise<TranslationData> {
  // Check cache first
  if (translationCache.has(language)) {
    return translationCache.get(language)!
  }

  try {
    let translationModule;
    
    // Use static imports for better compatibility
    switch (language) {
      case 'en':
        translationModule = await import('@/translations/en.json');
        break;
      case 'vn':
        translationModule = await import('@/translations/vn.json');
        break;
      case 'jp':
        translationModule = await import('@/translations/jp.json');
        break;
      default:
        translationModule = await import('@/translations/en.json');
    }
    
    const data = translationModule.default as TranslationData

    // Cache the loaded translation
    translationCache.set(language, data)

    return data
  } catch (error) {
    console.error(`Failed to load translation for language: ${language}`, error)
    
    // Fallback to default language if not already trying it
    if (language !== DEFAULT_LANGUAGE) {
      return loadTranslation(DEFAULT_LANGUAGE)
    }
    
    throw new Error(`Failed to load translation for ${language}`)
  }
}

/**
 * Map language codes to Language type
 * Supports both string codes (vn, jp, en) and numeric codes (1, 2, 3)
 */
export function getLanguageFromCode(code: string): Language | null {
  switch (code) {
    case '1':
    case 'vn':
      return 'vn'
    case '2':
    case 'jp':
      return 'jp'
    case '3':
    case 'en':
      return 'en'
    default:
      return null
  }
}

/**
 * Extract language from pathname
 * Handles both old structure (/vn/path) and new structure (/auth/vn/path)
 * Also supports numeric codes for backward compatibility
 */
export function getLanguageFromPath(pathname: string): Language {
  const segments = pathname.split('/').filter(Boolean)

  // Handle new auth structure: /auth/[lang]/...
  if (segments[0] === 'auth' && segments[1]) {
    const langCode = segments[1]
    // Prioritize language codes, but support numeric codes for backward compatibility
    switch (langCode) {
      case 'vn':
      case '1':
        return 'vn'
      case 'jp':
      case '2':
        return 'jp'
      case 'en':
      case '3':
        return 'en'
      default:
        return DEFAULT_LANGUAGE
    }
  }

  // Handle old structure: /vn/path, /jp/path, /en/path (including legacy numeric codes)
  const firstSegment = segments[0]
  if (SUPPORTED_LANGUAGES.includes(firstSegment as Language)) {
    return firstSegment as Language
  }

  // Handle legacy numeric codes for standard URLs
  const legacyLanguage = getLanguageFromCode(firstSegment)
  if (legacyLanguage) {
    return legacyLanguage
  }

  return DEFAULT_LANGUAGE
}

/**
 * Get localized path for a given path and language
 *
 * **URL Structure Policy (Single Source of Truth):**
 *
 * **PUBLIC PAGES** - MUST include language prefix for SEO and accessibility:
 * - Landing page: `/vn/landing`, `/jp/landing`, `/en/landing`
 * - Auth pages: `/auth/vn/login`, `/auth/jp/register`, `/auth/en/forgot-password`
 *
 * **PRIVATE PAGES** - MUST use clean URLs without language prefix:
 * - Home: `/home` (not `/vn/home`)
 * - JLPT: `/jlpt/official/n3` (not `/vn/jlpt/official/n3`)
 * - Challenge: `/challenge/n2` (not `/jp/challenge/n2`)
 * - Driving: `/driving/honmen` (not `/en/driving/honmen`)
 * - All other authenticated routes: `/library`, `/settings`, etc.
 *
 * Language preference for private pages is handled via:
 * - User stored preferences (localStorage/database)
 * - Language context and translation hooks
 * - NOT via URL structure
 *
 * @param path The base path (with or without leading slash)
 * @param language The target language code
 * @returns Localized path following the URL structure policy
 */
export function getLocalizedPath(path: string, language: Language): string {
  // Remove leading slash
  const cleanPath = path.startsWith('/') ? path.slice(1) : path

  // Handle landing page - no auth prefix
  if (cleanPath === 'landing') {
    return `/${language}/landing`
  }

  // Handle auth-related paths - use language codes for SEO
  if (cleanPath === '' || cleanPath === 'login' || cleanPath === 'register' ||
      cleanPath === 'forgot-password') {
    const authPath = cleanPath === '' ? 'login' : cleanPath
    return `/auth/${language}/${authPath}`
  }

  // According to requirements, language parameter should ONLY exist on:
  // landing, login, register, forgot-password
  // All other routes (home, library, jlpt, etc.) should NOT have language prefix
  
  // For all other paths, return clean URL without language prefix
  // Language preference is stored and handled separately
  return `/${cleanPath}`
}

/**
 * Remove language prefix from path
 * Handles both old structure (/vn/path) and new structure (/auth/vn/path)
 * Also supports numeric codes for backward compatibility
 */
export function removeLanguageFromPath(pathname: string): string {
  const segments = pathname.split('/').filter(Boolean)

  // Handle new auth structure: /auth/[lang]/path -> /path
  if (segments[0] === 'auth' && segments[1] && segments[2]) {
    const langCode = segments[1]
    // Check if it's a valid language code (prioritize language codes, support numeric)
    if (['vn', 'jp', 'en', '1', '2', '3'].includes(langCode)) {
      return '/' + segments.slice(2).join('/')
    }
  }

  // Handle old structure: /vn/path -> /path (including legacy numeric codes)
  const firstSegment = segments[0]
  if (SUPPORTED_LANGUAGES.includes(firstSegment as Language) || ['1', '2', '3'].includes(firstSegment)) {
    return '/' + segments.slice(1).join('/')
  }

  return pathname
}

/**
 * Simple translation function for server and client components with fallback support
 */
export function createTranslationFunction(translations: TranslationData, fallbackTranslations?: TranslationData) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return function t(key: string): any {
    // Helper function to get value from translations object
    const getValue = (translationsObj: TranslationData, translationKey: string) => {
      const keys = translationKey.split('.')
      let value: unknown = translationsObj

      for (const k of keys) {
        if (value && typeof value === 'object' && k in value) {
          value = (value as Record<string, unknown>)[k]
        } else {
          return null
        }
      }

      return value
    }

    // Try primary translations first
    let value = getValue(translations, key)

    // If not found and fallback is available, try fallback
    if (value === null && fallbackTranslations) {
      value = getValue(fallbackTranslations, key)
      if (value !== null) {
        console.warn(`Translation key "${key}" not found in primary language, using fallback`)
      }
    }

    // If still not found, return the key as fallback
    if (value === null) {
      console.warn(`Translation key not found: ${key}`)
      return key
    }

    return value
  }
}

/**
 * Generate hreflang links for SEO
 * Note: Consider using the optimized version from i18n-utils instead
 */
export function generateHreflangLinksLegacy(currentPath: string, baseUrl: string = 'https://jlpt4you.com') {
  const cleanPath = removeLanguageFromPath(currentPath)
  
  return SUPPORTED_LANGUAGES.map(lang => ({
    hreflang: LANGUAGE_METADATA[lang].locale,
    href: `${baseUrl}${getLocalizedPath(cleanPath, lang)}`
  }))
}

/**
 * Route Management Utilities for Dual-Mode Language Routing
 */


/**
 * Convert clean URL to language-prefixed URL
 * Example: /jlpt/official -> /en/jlpt/official
 */
export function convertToLanguagePrefixedUrl(cleanUrl: string, language: Language): string {
  // Remove leading slash if present
  const path = cleanUrl.startsWith('/') ? cleanUrl.slice(1) : cleanUrl
  
  // Handle empty path (root)
  if (!path) {
    return `/${language}`
  }
  
  return `/${language}/${path}`
}

/**
 * Check if URL has language prefix
 */
export function hasLanguagePrefix(url: string): boolean {
  return getLanguagePrefixRegex().test(url)
}

