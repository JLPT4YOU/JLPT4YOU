/**
 * Path Helper Utilities for Middleware
 * Provides path manipulation and analysis functions
 */

import type { Language, PathHelpers } from '../types/middleware'
import { ROUTE_PATHS } from '../config/constants'
import { STATIC_PATTERNS, LANGUAGE_PATTERNS } from '../config/patterns'

// ===== PATH VALIDATION FUNCTIONS =====

/**
 * Check if path is a static file
 */
export function isStaticFile(pathname: string): boolean {
  return STATIC_PATTERNS.NEXT_STATIC.test(pathname) ||
         STATIC_PATTERNS.STATIC_ASSETS.test(pathname) ||
         STATIC_PATTERNS.FAVICON.test(pathname) ||
         STATIC_PATTERNS.FILE_EXTENSION.test(pathname)
}

/**
 * Check if path is an API route
 */
export function isAPIRoute(pathname: string): boolean {
  return STATIC_PATTERNS.API_ROUTE.test(pathname)
}

/**
 * Check if middleware should skip processing this path
 */
export function shouldSkipMiddleware(pathname: string): boolean {
  // Skip static files and API routes
  if (ROUTE_PATHS.SKIP_PATHS.some(path => pathname.startsWith(path))) {
    return true
  }
  
  // Skip files with extensions
  if (pathname.includes('.') || ROUTE_PATHS.FILE_EXTENSIONS.some(ext => pathname.endsWith(ext))) {
    return true
  }
  
  return false
}

// ===== PATH NORMALIZATION FUNCTIONS =====

/**
 * Normalize path by removing trailing slashes and ensuring leading slash
 */
export function normalizePath(pathname: string): string {
  if (!pathname) return '/'
  
  // Ensure leading slash
  if (!pathname.startsWith('/')) {
    pathname = '/' + pathname
  }
  
  // Remove trailing slash except for root
  if (pathname !== '/' && pathname.endsWith('/')) {
    pathname = pathname.slice(0, -1)
  }
  
  return pathname
}

/**
 * Clean path by removing query parameters and fragments
 */
export function cleanPath(pathname: string): string {
  // Remove query parameters
  const queryIndex = pathname.indexOf('?')
  if (queryIndex !== -1) {
    pathname = pathname.substring(0, queryIndex)
  }
  
  // Remove fragments
  const fragmentIndex = pathname.indexOf('#')
  if (fragmentIndex !== -1) {
    pathname = pathname.substring(0, fragmentIndex)
  }
  
  return normalizePath(pathname)
}

/**
 * Decode URL-encoded path
 */
export function decodePath(pathname: string): string {
  try {
    return decodeURIComponent(pathname)
  } catch {
    // If decoding fails, return original path
    return pathname
  }
}

// ===== LANGUAGE PATH FUNCTIONS =====

/**
 * Extract language code from path
 */
export function extractLanguageFromPath(pathname: string): Language | null {
  const match = pathname.match(LANGUAGE_PATTERNS.LANGUAGE_PREFIX)
  if (!match) return null
  
  const langCode = match[1]
  
  // Convert numeric codes to language codes
  const mapping: Record<string, Language> = {
    '1': 'vn',
    '2': 'jp', 
    '3': 'en',
    'vn': 'vn',
    'jp': 'jp',
    'en': 'en'
  }
  
  return mapping[langCode] || null
}

/**
 * Check if path has language prefix
 */
export function hasLanguagePrefix(pathname: string): boolean {
  return LANGUAGE_PATTERNS.LANGUAGE_PREFIX.test(pathname)
}

/**
 * Remove language prefix from path
 */
export function removeLanguagePrefix(pathname: string): string {
  const match = pathname.match(LANGUAGE_PATTERNS.EXTRACT_LANGUAGE)
  if (match && match[2]) {
    return '/' + match[2]
  }
  return pathname
}

/**
 * Add language prefix to path
 */
export function addLanguagePrefix(pathname: string, language: Language): string {
  // Remove existing language prefix first
  const cleanPath = removeLanguagePrefix(pathname)
  
  // Handle special cases
  if (cleanPath === '/') {
    return `/auth/${language}/landing`
  }
  
  // Handle auth paths
  if (cleanPath.startsWith('/login') || cleanPath.startsWith('/register') || 
      cleanPath.startsWith('/forgot-password') || cleanPath.startsWith('/landing')) {
    const authPath = cleanPath.slice(1) // Remove leading slash
    return `/auth/${language}/${authPath}`
  }
  
  // Handle regular paths
  return `/${language}${cleanPath}`
}

// ===== PATH ANALYSIS FUNCTIONS =====

/**
 * Get path segments as array
 */
export function getPathSegments(pathname: string): string[] {
  return cleanPath(pathname)
    .split('/')
    .filter(segment => segment.length > 0)
}

/**
 * Get path depth (number of segments)
 */
export function getPathDepth(pathname: string): number {
  return getPathSegments(pathname).length
}

/**
 * Check if path is nested (has more than one segment)
 */
export function isNestedPath(pathname: string): boolean {
  return getPathDepth(pathname) > 1
}

/**
 * Get parent path
 */
export function getParentPath(pathname: string): string {
  const segments = getPathSegments(pathname)
  if (segments.length <= 1) return '/'
  
  return '/' + segments.slice(0, -1).join('/')
}

/**
 * Get last segment of path
 */
export function getLastSegment(pathname: string): string {
  const segments = getPathSegments(pathname)
  return segments[segments.length - 1] || ''
}

/**
 * Get first segment of path
 */
export function getFirstSegment(pathname: string): string {
  const segments = getPathSegments(pathname)
  return segments[0] || ''
}

// ===== PATH MATCHING FUNCTIONS =====

/**
 * Check if path matches pattern
 */
export function matchesPattern(pathname: string, pattern: string | RegExp): boolean {
  if (typeof pattern === 'string') {
    return pathname === pattern || pathname.startsWith(pattern + '/')
  }
  return pattern.test(pathname)
}

/**
 * Check if path starts with any of the given prefixes
 */
export function startsWithAny(pathname: string, prefixes: string[]): boolean {
  return prefixes.some(prefix => pathname.startsWith(prefix))
}

/**
 * Check if path ends with any of the given suffixes
 */
export function endsWithAny(pathname: string, suffixes: string[]): boolean {
  return suffixes.some(suffix => pathname.endsWith(suffix))
}

/**
 * Find matching pattern from array of patterns
 */
export function findMatchingPattern(pathname: string, patterns: (string | RegExp)[]): string | RegExp | null {
  return patterns.find(pattern => matchesPattern(pathname, pattern)) || null
}

// ===== PATH CONSTRUCTION FUNCTIONS =====

/**
 * Join path segments
 */
export function joinPaths(...segments: string[]): string {
  const joined = segments
    .filter(segment => segment && segment.length > 0)
    .map(segment => segment.replace(/^\/+|\/+$/g, '')) // Remove leading/trailing slashes
    .join('/')
  
  return normalizePath('/' + joined)
}

/**
 * Build path with query parameters
 */
export function buildPathWithQuery(pathname: string, params: Record<string, string>): string {
  const cleanedPath = cleanPath(pathname)
  const queryString = new URLSearchParams(params).toString()
  
  return queryString ? `${cleanedPath}?${queryString}` : cleanedPath
}

/**
 * Build absolute URL
 */
export function buildAbsoluteUrl(origin: string, pathname: string, params?: Record<string, string>): string {
  const path = params ? buildPathWithQuery(pathname, params) : cleanPath(pathname)
  return `${origin}${path}`
}

// ===== PATH VALIDATION FUNCTIONS =====

/**
 * Validate path format
 */
export function isValidPath(pathname: string): boolean {
  if (!pathname || typeof pathname !== 'string') return false
  if (!pathname.startsWith('/')) return false
  
  // Check for invalid characters
  const invalidChars = /[<>:"\\|?*]/
  if (invalidChars.test(pathname)) return false
  
  return true
}

/**
 * Validate language code in path
 */
export function hasValidLanguageInPath(pathname: string): boolean {
  const language = extractLanguageFromPath(pathname)
  return language !== null
}

// ===== PATH DEBUGGING FUNCTIONS =====

/**
 * Analyze path and return detailed information
 */
export function analyzePath(pathname: string) {
  const normalized = normalizePath(pathname)
  const cleaned = cleanPath(pathname)
  const segments = getPathSegments(cleaned)
  const language = extractLanguageFromPath(cleaned)
  
  return {
    original: pathname,
    normalized,
    cleaned,
    segments,
    depth: segments.length,
    isNested: segments.length > 1,
    hasLanguagePrefix: hasLanguagePrefix(cleaned),
    extractedLanguage: language,
    withoutLanguage: removeLanguagePrefix(cleaned),
    isStatic: isStaticFile(cleaned),
    isAPI: isAPIRoute(cleaned),
    shouldSkip: shouldSkipMiddleware(cleaned),
    parentPath: getParentPath(cleaned),
    lastSegment: getLastSegment(cleaned),
    firstSegment: getFirstSegment(cleaned)
  }
}

/**
 * Debug path processing
 */
export function debugPath(pathname: string, label: string = 'Path Analysis'): void {
  if (process.env.NODE_ENV !== 'development') return
  
  const analysis = analyzePath(pathname)
  console.debug(`[${label}]`, analysis)
}

// ===== PATH HELPERS IMPLEMENTATION =====

/**
 * Implementation of PathHelpers interface
 */
export const pathHelpers: PathHelpers = {
  isStaticFile,
  isAPIRoute,
  shouldSkipMiddleware
}

export default pathHelpers
