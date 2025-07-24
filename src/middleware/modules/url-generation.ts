/**
 * URL Generation & Routing Module
 * Handles redirect URL generation, clean URL handling, and dual-mode routing
 */

import { NextRequest } from 'next/server'
import type {
  Language,
  URLGenerationContext,
  URLGenerationResult,
  URLGenerationModule
} from '../types/middleware'
import { ROUTE_PATHS } from '../config/constants'
import { LANGUAGE_PATTERNS } from '../config/patterns'
import { hasLanguagePrefix, removeLanguagePrefix } from '../utils/path-helpers'

// ===== URL GENERATION CORE =====

/**
 * Generate redirect URL based on context
 */
export function generateRedirectUrl(context: URLGenerationContext): URLGenerationResult {
  const { pathname, language, request, isAuthenticated } = context
  
  // Check if we need to redirect to clean URL for authenticated users
  if (shouldRedirectToCleanUrl(pathname, isAuthenticated)) {
    const cleanUrl = getCleanUrl(pathname)
    const redirectUrl = buildUrlWithQuery(request, cleanUrl)
    
    return {
      shouldRedirect: true,
      redirectUrl,
      redirectType: 'clean-url'
    }
  }
  
  // Check if we need language redirect
  if (needsLanguageRedirect(pathname, isAuthenticated)) {
    const redirectUrl = generateLanguageRedirectUrl(pathname, language, request)
    
    return {
      shouldRedirect: true,
      redirectUrl,
      redirectType: 'language'
    }
  }
  
  // No redirect needed
  return {
    shouldRedirect: false,
    redirectType: 'none'
  }
}

// ===== LANGUAGE REDIRECT LOGIC =====

/**
 * Check if path needs language redirect
 */
export function needsLanguageRedirect(pathname: string, isAuthenticated: boolean): boolean {
  // Skip if already has language prefix
  if (pathname.match(/^\/(vn|jp|en|1|2|3)\//)) {
    return false
  }
  
  // Skip auth paths (they have their own handling)
  if (pathname.startsWith('/auth/')) {
    return false
  }
  
  // Paths that should be redirected to language-specific versions
  const authPaths = ROUTE_PATHS.AUTH_PATHS
  const homePaths = ROUTE_PATHS.HOME_PATHS
  const featurePaths = ROUTE_PATHS.FEATURE_PATHS
  
  // For authenticated users, don't redirect clean URLs to language-prefixed URLs
  if (isAuthenticated) {
    // Only redirect auth paths and root path for authenticated users
    if (authPaths.includes(pathname as any) || pathname === '/') {
      return true
    }
    return false
  }
  
  // For non-authenticated users, redirect as before
  // Check exact matches
  if (authPaths.includes(pathname as any) || homePaths.includes(pathname as any) || featurePaths.includes(pathname as any) || pathname === '/') {
    return true
  }
  
  // Check if path starts with feature paths (for nested routes)
  const isFeaturePath = featurePaths.some(feature => pathname.startsWith(feature + '/'))
  
  return isFeaturePath
}

/**
 * Generate language-specific redirect URL
 */
export function generateLanguageRedirectUrl(pathname: string, language: Language, request: NextRequest): string {
  const baseUrl = request.nextUrl.origin
  const searchParams = request.nextUrl.searchParams.toString()
  const queryString = searchParams ? `?${searchParams}` : ''
  
  // Handle root path
  if (pathname === '/') {
    return `${baseUrl}/${language}/landing${queryString}`
  }
  
  // Handle auth paths
  if (ROUTE_PATHS.AUTH_PATHS.includes(pathname as any)) {
    const authPath = pathname.slice(1) // Remove leading slash
    // Special handling for landing page - no auth prefix
    if (authPath === 'landing') {
      return `${baseUrl}/${language}/landing${queryString}`
    }
    return `${baseUrl}/auth/${language}/${authPath}${queryString}`
  }
  
  // Handle home path
  if (pathname === '/home') {
    return `${baseUrl}/${language}/home${queryString}`
  }
  
  // Handle feature paths (both exact and nested)
  // Check for exact match
  if (ROUTE_PATHS.FEATURE_PATHS.includes(pathname as any)) {
    const featurePath = pathname.slice(1) // Remove leading slash
    return `${baseUrl}/${language}/${featurePath}${queryString}`
  }
  
  // Check for nested paths (e.g., /jlpt/custom/n3/test)
  for (const feature of ROUTE_PATHS.FEATURE_PATHS) {
    if (pathname.startsWith(feature + '/')) {
      const fullPath = pathname.slice(1) // Remove leading slash
      return `${baseUrl}/${language}/${fullPath}${queryString}`
    }
  }
  
  return `${baseUrl}${pathname}${queryString}`
}

// ===== CLEAN URL LOGIC =====

/**
 * Check if authenticated user is accessing language-prefixed URL that should be clean
 */
export function shouldRedirectToCleanUrl(pathname: string, isAuthenticated: boolean): boolean {
  if (!isAuthenticated) return false
  if (!hasLanguagePrefix(pathname)) return false

  // Don't redirect auth routes - they need language prefixes for SEO
  if (LANGUAGE_PATTERNS.LANGUAGE_AUTH_PATTERN.test(pathname)) {
    return false
  }

  // Don't redirect landing routes - they need language prefixes for SEO
  if (LANGUAGE_PATTERNS.LANGUAGE_LANDING_PATTERN.test(pathname)) {
    return false
  }

  // Redirect all other language-prefixed routes for authenticated users
  return true
}

/**
 * Convert language-prefixed URL to clean URL
 */
export function getCleanUrl(pathname: string): string {
  const match = pathname.match(LANGUAGE_PATTERNS.EXTRACT_LANGUAGE)
  if (!match) return pathname
  return '/' + match[2]
}

// ===== URL BUILDING UTILITIES =====

/**
 * Build URL with query parameters preserved
 */
export function buildUrlWithQuery(request: NextRequest, pathname: string): string {
  const searchParams = request.nextUrl.searchParams.toString()
  const queryString = searchParams ? `?${searchParams}` : ''
  return `${request.nextUrl.origin}${pathname}${queryString}`
}

/**
 * Build absolute URL with optional query parameters
 */
export function buildAbsoluteUrl(origin: string, pathname: string, queryParams?: Record<string, string>): string {
  let url = `${origin}${pathname}`
  
  if (queryParams && Object.keys(queryParams).length > 0) {
    const searchParams = new URLSearchParams(queryParams)
    url += `?${searchParams.toString()}`
  }
  
  return url
}

/**
 * Extract query parameters from request
 */
export function extractQueryParams(request: NextRequest): Record<string, string> {
  const params: Record<string, string> = {}
  
  request.nextUrl.searchParams.forEach((value, key) => {
    params[key] = value
  })
  
  return params
}

// ===== SPECIALIZED URL GENERATORS =====

/**
 * Generate auth URL with language
 */
export function generateAuthUrl(authType: string, language: Language, origin: string, queryParams?: Record<string, string>): string {
  const basePath = `/auth/${language}/${authType}`
  return buildAbsoluteUrl(origin, basePath, queryParams)
}

/**
 * Generate feature URL with language
 */
export function generateFeatureUrl(feature: string, language: Language, origin: string, queryParams?: Record<string, string>): string {
  const basePath = `/${language}/${feature}`
  return buildAbsoluteUrl(origin, basePath, queryParams)
}

/**
 * Generate home URL with language
 */
export function generateHomeUrl(language: Language, origin: string, queryParams?: Record<string, string>): string {
  const basePath = `/${language}/home`
  return buildAbsoluteUrl(origin, basePath, queryParams)
}

/**
 * Generate landing page URL
 */
export function generateLandingUrl(language: Language, origin: string, queryParams?: Record<string, string>): string {
  const basePath = `/${language}/landing`
  return buildAbsoluteUrl(origin, basePath, queryParams)
}

/**
 * Generate login URL
 */
export function generateLoginUrl(language: Language, origin: string, queryParams?: Record<string, string>): string {
  return generateAuthUrl('login', language, origin, queryParams)
}

// ===== URL ANALYSIS UTILITIES =====

/**
 * Analyze URL and provide detailed information
 */
export function analyzeUrl(pathname: string, isAuthenticated: boolean): {
  original: string
  hasLanguagePrefix: boolean
  extractedLanguage: string | null
  cleanUrl: string
  needsLanguageRedirect: boolean
  shouldRedirectToClean: boolean
  urlType: 'auth' | 'feature' | 'home' | 'root' | 'other'
} {
  const hasLangPrefix = hasLanguagePrefix(pathname)
  const extractedLang = hasLangPrefix ? extractLanguageFromPath(pathname) : null
  const cleanUrl = hasLangPrefix ? getCleanUrl(pathname) : pathname
  const needsLangRedirect = needsLanguageRedirect(pathname, isAuthenticated)
  const shouldRedirectClean = shouldRedirectToCleanUrl(pathname, isAuthenticated)
  
  let urlType: 'auth' | 'feature' | 'home' | 'root' | 'other' = 'other'
  if (pathname === '/') urlType = 'root'
  else if (pathname.startsWith('/auth/') || ROUTE_PATHS.AUTH_PATHS.includes(pathname as any)) urlType = 'auth'
  else if (ROUTE_PATHS.HOME_PATHS.includes(cleanUrl as any)) urlType = 'home'
  else if (ROUTE_PATHS.FEATURE_PATHS.some(feature => cleanUrl.startsWith(feature))) urlType = 'feature'
  
  return {
    original: pathname,
    hasLanguagePrefix: hasLangPrefix,
    extractedLanguage: extractedLang,
    cleanUrl,
    needsLanguageRedirect: needsLangRedirect,
    shouldRedirectToClean: shouldRedirectClean,
    urlType
  }
}

/**
 * Extract language from path (helper function)
 */
function extractLanguageFromPath(pathname: string): string | null {
  const match = pathname.match(LANGUAGE_PATTERNS.LANGUAGE_PREFIX)
  return match ? match[1] : null
}

// ===== URL VALIDATION =====

/**
 * Validate URL format
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

/**
 * Validate pathname format
 */
export function isValidPathname(pathname: string): boolean {
  if (!pathname || typeof pathname !== 'string') return false
  if (!pathname.startsWith('/')) return false
  
  // Check for invalid characters
  const invalidChars = /[<>:"\\|?*]/
  return !invalidChars.test(pathname)
}

// ===== URL GENERATION CONTEXT UTILITIES =====

/**
 * Create URL generation context from request
 */
export function createUrlGenerationContext(
  request: NextRequest, 
  language: Language, 
  isAuthenticated: boolean
): URLGenerationContext {
  return {
    pathname: request.nextUrl.pathname,
    language,
    request,
    isAuthenticated
  }
}

/**
 * Debug URL generation for development
 */
export function debugUrlGeneration(context: URLGenerationContext): void {
  if (process.env.NODE_ENV !== 'development') return
  
  const analysis = analyzeUrl(context.pathname, context.isAuthenticated)
  const result = generateRedirectUrl(context)
  
  console.debug('[URL Generation Debug]', {
    context: {
      pathname: context.pathname,
      language: context.language,
      isAuthenticated: context.isAuthenticated
    },
    analysis,
    result
  })
}

// ===== MODULE IMPLEMENTATION =====

/**
 * URL Generation Module implementation
 */
export const urlGenerationModule: URLGenerationModule = {
  generateRedirectUrl,
  needsLanguageRedirect,
  shouldRedirectToCleanUrl
}

export default urlGenerationModule
