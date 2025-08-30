/**
 * Optimized i18n Utilities
 * Consolidates duplicate logic and simplifies path/language management
 */

import { Language, SUPPORTED_LANGUAGES, DEFAULT_LANGUAGE } from './i18n-types'

/**
 * Cached regex for better performance
 */
const LANG_PREFIX_REGEX = new RegExp(`^/(${SUPPORTED_LANGUAGES.join('|')}|1|2|3)(/|$)`)
const LANG_CODE_MAP: Record<string, Language> = {
  '1': 'vn', '2': 'jp', '3': 'en',
  'vn': 'vn', 'jp': 'jp', 'en': 'en'
}

/**
 * Unified language detection from any input
 * Replaces: getLanguageFromPath, extractLanguageFromUrl, getLanguageFromCode
 */
export function detectLanguage(input: string): Language {
  const match = input.match(/^\/?(vn|jp|en|1|2|3)\b/)
  if (match) {
    return LANG_CODE_MAP[match[1]] || DEFAULT_LANGUAGE
  }
  return DEFAULT_LANGUAGE
}

/**
 * Path management utilities
 * Consolidates all path-related operations
 */
export class PathManager {
  /**
   * Check if path has language prefix
   */
  static hasLanguagePrefix(path: string): boolean {
    return LANG_PREFIX_REGEX.test(path)
  }

  /**
   * Remove language prefix from path
   * Replaces: removeLanguageFromPath, convertToCleanUrl
   */
  static removeLanguagePrefix(path: string): string {
    // Handle auth routes special case
    const authMatch = path.match(/^\/auth\/(vn|jp|en|1|2|3)(\/|$)/)
    if (authMatch) {
      return path.replace(/^\/auth\/(vn|jp|en|1|2|3)/, '/auth')
    }
    
    // Handle regular routes
    const cleaned = path.replace(LANG_PREFIX_REGEX, '/')
    return cleaned === '' ? '/' : cleaned
  }

  /**
   * Add language prefix to path
   * Replaces: convertToLanguagePrefixedUrl
   */
  static addLanguagePrefix(path: string, language: Language): string {
    const cleanPath = this.removeLanguagePrefix(path)
    
    // Handle empty path (root)
    if (cleanPath === '/') {
      return `/${language}`
    }
    
    // Add language prefix
    return `/${language}${cleanPath}`
  }

  /**
   * Get localized path based on authentication state
   * Consolidated logic for path generation
   */
  static getLocalizedPath(
    path: string, 
    language: Language, 
    isAuthenticated: boolean = false
  ): string {
    // Public/auth pages always need language prefix
    const publicPaths = ['/auth', '/login', '/register', '/forgot-password', '/landing']
    const isPublicPath = publicPaths.some(p => path === p || path.startsWith(p + '/'))
    
    if (isPublicPath) {
      return this.addLanguagePrefix(path, language)
    }
    
    // Protected pages: clean URLs for authenticated, prefixed for non-authenticated
    return isAuthenticated 
      ? this.removeLanguagePrefix(path)
      : this.addLanguagePrefix(path, language)
  }
}

/**
 * Route configuration - simplified and deduplicated
 */
export const ROUTES = {
  public: ['/auth', '/login', '/register', '/forgot-password', '/landing'],
  protected: ['/home', '/jlpt', '/challenge', '/driving', '/dict', '/study',
              '/library', '/exam-results', '/review-answers', '/settings']
} as const

/**
 * Check if route is protected
 */
export function isProtectedRoute(path: string): boolean {
  return ROUTES.protected.some(route => 
    path === route || path.startsWith(route + '/')
  )
}

/**
 * Check if route is public
 */
export function isPublicRoute(path: string): boolean {
  return ROUTES.public.some(route => 
    path === route || path.startsWith(route + '/')
  )
}

/**
 * Generate hreflang links for SEO
 * Optimized version
 */
export function generateHreflangLinks(
  currentPath: string, 
  baseUrl: string = 'https://jlpt4you.com'
) {
  const cleanPath = PathManager.removeLanguagePrefix(currentPath)
  
  return SUPPORTED_LANGUAGES.map(lang => ({
    rel: 'alternate',
    hreflang: lang === 'vn' ? 'vi' : lang,
    href: `${baseUrl}${PathManager.addLanguagePrefix(cleanPath, lang)}`
  }))
}
