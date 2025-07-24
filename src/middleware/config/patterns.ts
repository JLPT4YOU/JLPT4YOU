/**
 * Regular Expression Patterns for Middleware
 * Centralized regex patterns for URL matching and language detection
 */

import type { LanguagePatterns } from '../types/middleware'

// ===== LANGUAGE DETECTION PATTERNS =====

/**
 * Core language detection patterns
 */
export const LANGUAGE_PATTERNS: LanguagePatterns = {
  // Matches language prefix at start of path: /vn/, /jp/, /en/, /1/, /2/, /3/
  LANGUAGE_PREFIX: /^\/(vn|jp|en|1|2|3)\//,
  
  // Matches language-specific auth routes: /vn/login, /jp/register, etc.
  LANGUAGE_AUTH_PATTERN: /^\/(vn|jp|en|1|2|3)\/(login|register|forgot-password)$/,
  
  // Matches language-specific landing routes: /vn/landing, /jp/landing, etc.
  LANGUAGE_LANDING_PATTERN: /^\/(vn|jp|en|1|2|3)\/landing$/,
  
  // Matches language-specific home routes: /vn/home, /jp/home, etc.
  LANGUAGE_HOME_PATTERN: /^\/(vn|jp|en|1|2|3)\/home$/,
  
  // Extracts language and remaining path: /vn/some/path -> ['vn', 'some/path']
  EXTRACT_LANGUAGE: /^\/(vn|jp|en|1|2|3)\/(.*)$/
} as const

// ===== ROUTE MATCHING PATTERNS =====

/**
 * Auth route patterns
 */
export const AUTH_PATTERNS = {
  // Matches any auth route pattern
  AUTH_ROUTE: /^\/auth\//,
  
  // Matches auth routes with language: /auth/vn/login
  AUTH_WITH_LANGUAGE: /^\/auth\/(vn|jp|en|1|2|3)\/(login|register|forgot-password)$/,
  
  // Matches clean auth paths: /login, /register, etc.
  CLEAN_AUTH: /^\/(login|register|forgot-password)$/
} as const

/**
 * Feature route patterns
 */
export const FEATURE_PATTERNS = {
  // Matches JLPT routes
  JLPT_ROUTE: /^\/(vn|jp|en|1|2|3)?\/jlpt/,
  
  // Matches Challenge routes
  CHALLENGE_ROUTE: /^\/(vn|jp|en|1|2|3)?\/challenge/,
  
  // Matches Driving routes
  DRIVING_ROUTE: /^\/(vn|jp|en|1|2|3)?\/driving/,
  
  // Matches any feature route
  ANY_FEATURE: /^\/(vn|jp|en|1|2|3)?\/(jlpt|challenge|driving)/
} as const

/**
 * Static file patterns
 */
export const STATIC_PATTERNS = {
  // Matches Next.js static files
  NEXT_STATIC: /^\/_next\//,
  
  // Matches API routes
  API_ROUTE: /^\/api\//,
  
  // Matches static assets
  STATIC_ASSETS: /^\/static\//,
  
  // Matches favicon requests
  FAVICON: /^\/favicon/,
  
  // Matches file extensions
  FILE_EXTENSION: /\.[a-zA-Z0-9]+$/,
  
  // Matches common image extensions
  IMAGE_FILE: /\.(ico|png|jpg|jpeg|gif|svg|webp)$/i,
  
  // Matches common asset extensions
  ASSET_FILE: /\.(css|js|json|xml|txt|woff|woff2|ttf|eot)$/i
} as const

// ===== VALIDATION PATTERNS =====

/**
 * Language validation patterns
 */
export const VALIDATION_PATTERNS = {
  // Valid language codes
  VALID_LANGUAGE: /^(vn|jp|en|1|2|3)$/,
  
  // Valid locale format
  VALID_LOCALE: /^[a-z]{2}-[A-Z]{2}$/,
  
  // Valid country code
  VALID_COUNTRY: /^[A-Z]{2}$/
} as const

// ===== UTILITY FUNCTIONS =====

/**
 * Extract language code from URL path
 */
export function extractLanguageFromPath(pathname: string): string | null {
  const match = pathname.match(LANGUAGE_PATTERNS.LANGUAGE_PREFIX)
  return match ? match[1] : null
}

/**
 * Check if path has language prefix
 */
export function hasLanguagePrefix(pathname: string): boolean {
  return LANGUAGE_PATTERNS.LANGUAGE_PREFIX.test(pathname)
}

/**
 * Check if path is an auth route
 */
export function isAuthRoute(pathname: string): boolean {
  return AUTH_PATTERNS.AUTH_ROUTE.test(pathname) ||
         AUTH_PATTERNS.CLEAN_AUTH.test(pathname) ||
         AUTH_PATTERNS.AUTH_WITH_LANGUAGE.test(pathname)
}

/**
 * Check if path is a feature route
 */
export function isFeatureRoute(pathname: string): boolean {
  return FEATURE_PATTERNS.ANY_FEATURE.test(pathname)
}

/**
 * Check if path is a static file or should be skipped
 */
export function isStaticFile(pathname: string): boolean {
  return STATIC_PATTERNS.NEXT_STATIC.test(pathname) ||
         STATIC_PATTERNS.API_ROUTE.test(pathname) ||
         STATIC_PATTERNS.STATIC_ASSETS.test(pathname) ||
         STATIC_PATTERNS.FAVICON.test(pathname) ||
         STATIC_PATTERNS.FILE_EXTENSION.test(pathname)
}

/**
 * Get clean path without language prefix
 */
export function getCleanPath(pathname: string): string {
  const match = pathname.match(LANGUAGE_PATTERNS.EXTRACT_LANGUAGE)
  if (match && match[2]) {
    return '/' + match[2]
  }
  return pathname
}

/**
 * Check if language code is valid
 */
export function isValidLanguageCode(code: string): boolean {
  return VALIDATION_PATTERNS.VALID_LANGUAGE.test(code)
}

/**
 * Normalize language code (convert numeric to string)
 */
export function normalizeLanguageCode(code: string): string {
  const mapping: Record<string, string> = {
    '1': 'vn',
    '2': 'jp',
    '3': 'en'
  }
  return mapping[code] || code
}

// ===== PATTERN TESTING UTILITIES =====

/**
 * Test multiple patterns against a path
 */
export function testPatterns(pathname: string, patterns: RegExp[]): boolean {
  return patterns.some(pattern => pattern.test(pathname))
}

/**
 * Get all matching patterns for a path
 */
export function getMatchingPatterns(pathname: string): string[] {
  const matches: string[] = []
  
  if (LANGUAGE_PATTERNS.LANGUAGE_PREFIX.test(pathname)) matches.push('LANGUAGE_PREFIX')
  if (LANGUAGE_PATTERNS.LANGUAGE_AUTH_PATTERN.test(pathname)) matches.push('LANGUAGE_AUTH')
  if (LANGUAGE_PATTERNS.LANGUAGE_HOME_PATTERN.test(pathname)) matches.push('LANGUAGE_HOME')
  if (AUTH_PATTERNS.AUTH_ROUTE.test(pathname)) matches.push('AUTH_ROUTE')
  if (FEATURE_PATTERNS.ANY_FEATURE.test(pathname)) matches.push('FEATURE_ROUTE')
  if (STATIC_PATTERNS.NEXT_STATIC.test(pathname)) matches.push('STATIC_FILE')
  
  return matches
}

/**
 * Debug function to analyze a path
 */
export function analyzePath(pathname: string) {
  return {
    original: pathname,
    hasLanguagePrefix: hasLanguagePrefix(pathname),
    extractedLanguage: extractLanguageFromPath(pathname),
    cleanPath: getCleanPath(pathname),
    isAuth: isAuthRoute(pathname),
    isFeature: isFeatureRoute(pathname),
    isStatic: isStaticFile(pathname),
    matchingPatterns: getMatchingPatterns(pathname)
  }
}

export default {
  LANGUAGE_PATTERNS,
  AUTH_PATTERNS,
  FEATURE_PATTERNS,
  STATIC_PATTERNS,
  VALIDATION_PATTERNS,
  // Utility functions
  extractLanguageFromPath,
  hasLanguagePrefix,
  isAuthRoute,
  isFeatureRoute,
  isStaticFile,
  getCleanPath,
  isValidLanguageCode,
  normalizeLanguageCode,
  testPatterns,
  getMatchingPatterns,
  analyzePath
}
