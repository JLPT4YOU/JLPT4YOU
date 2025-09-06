/**
 * Main i18n module for JLPT4You
 * Consolidated from multiple files and optimized
 */

// Re-export types and constants
export {
  SUPPORTED_LANGUAGES,
  DEFAULT_LANGUAGE,
  LANGUAGE_METADATA,
  type Language,
  type TranslationData,
  type CommonTranslations,
  type AuthTranslations,
  type ExamTranslations,
  type TranslationPath,
  type TranslationKey
} from './types'

// Re-export utilities
export {
  detectLanguage,
  PathManager,
  ROUTES,
  isProtectedRoute,
  isPublicRoute,
  generateHreflangLinks
} from './utils'

// Import for internal use
import { SUPPORTED_LANGUAGES, DEFAULT_LANGUAGE, Language, TranslationData } from './types'

// Backward compatibility aliases
export { PathManager as UrlUtils } from './utils'

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
 */
export function getLanguageFromPath(pathname: string): Language {
  const segments = pathname.split('/').filter(Boolean)

  // Handle new auth structure: /auth/[lang]/...
  if (segments[0] === 'auth' && segments[1]) {
    const langCode = segments[1]
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
    }
  }

  // Handle old direct structure: /[lang]/...
  if (segments[0]) {
    const langCode = segments[0]
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
    }
  }

  return DEFAULT_LANGUAGE
}

/**
 * Remove language prefix from path
 */
export function removeLanguageFromPath(path: string): string {
  // Handle auth routes
  const authMatch = path.match(/^\/auth\/(vn|jp|en|1|2|3)(\/|$)/)
  if (authMatch) {
    return path.replace(/^\/auth\/(vn|jp|en|1|2|3)/, '/auth')
  }
  
  // Handle regular routes
  const langPrefixPattern = new RegExp(`^/(${SUPPORTED_LANGUAGES.join('|')}|1|2|3)(/|$)`)
  const cleaned = path.replace(langPrefixPattern, '/')
  return cleaned === '' ? '/' : cleaned
}

/**
 * Get localized path
 */
export function getLocalizedPath(path: string, language: Language): string {
  const cleanPath = removeLanguageFromPath(path)
  
  if (cleanPath === '/') {
    return `/${language}`
  }
  
  return `/${language}${cleanPath}`
}

/**
 * Create translation function with fallback support
 */
export function createTranslationFunction(translations: TranslationData, fallbackTranslations?: TranslationData) {
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
 * Legacy regex builders - kept for backward compatibility
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
