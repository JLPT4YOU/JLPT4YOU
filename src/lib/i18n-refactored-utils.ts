// Refactored i18n utilities - Remove duplicates and simplify

import { Language, SUPPORTED_LANGUAGES, DEFAULT_LANGUAGE } from './i18n'

/**
 * Unified language detection from path
 * Replaces: getLanguageFromPath, extractLanguageFromUrl, getLanguageFromCode
 */
export function detectLanguage(input: string): Language {
  // Try to match language prefix in path
  const pathMatch = input.match(/^\/?(vn|jp|en|1|2|3)\b/)
  
  if (pathMatch) {
    const code = pathMatch[1]
    // Map legacy numeric codes if needed
    const langMap: Record<string, Language> = {
      '1': 'vn', '2': 'jp', '3': 'en',
      'vn': 'vn', 'jp': 'jp', 'en': 'en'
    }
    return langMap[code] || DEFAULT_LANGUAGE
  }
  
  return DEFAULT_LANGUAGE
}

/**
 * Unified path manipulation
 * Replaces: removeLanguageFromPath, convertToCleanUrl, hasLanguagePrefix
 */
export class PathManager {
  private static readonly LANG_PREFIX_REGEX = /^\/?(vn|jp|en|1|2|3)(\/|$)/
  
  static hasLanguagePrefix(path: string): boolean {
    return this.LANG_PREFIX_REGEX.test(path)
  }
  
  static removeLanguagePrefix(path: string): string {
    const cleaned = path.replace(this.LANG_PREFIX_REGEX, '/')
    return cleaned === '' ? '/' : cleaned
  }
  
  static addLanguagePrefix(path: string, language: Language): string {
    const cleanPath = this.removeLanguagePrefix(path)
    return `/${language}${cleanPath}`
  }
}

/**
 * Simplified route configuration
 * Replaces: ROUTE_CONFIG with duplicate arrays
 */
export const ROUTES = {
  public: ['/auth', '/login', '/register', '/forgot-password', '/landing'],
  protected: ['/home', '/jlpt', '/challenge', '/driving', '/dict', '/study', '/library', '/exam-results', '/review-answers', '/settings']
} as const

export function isProtectedRoute(path: string): boolean {
  return ROUTES.protected.some(route => 
    path === route || path.startsWith(route + '/')
  )
}

export function isPublicRoute(path: string): boolean {
  return ROUTES.public.some(route => 
    path === route || path.startsWith(route + '/')
  )
}
