/**
 * Route Configuration for Middleware
 * Centralized route definitions and route-related utilities
 */

import type { Language } from '../types/middleware'
import { ROUTE_PATHS } from './constants'

// ===== ROUTE CATEGORIES =====

/**
 * Public routes that don't require authentication
 */
export const PUBLIC_ROUTES = [
  '/',
  '/auth',
  ...ROUTE_PATHS.AUTH_PATHS
] as const

/**
 * Protected routes that require authentication
 */
export const PROTECTED_ROUTES = [
  ...ROUTE_PATHS.HOME_PATHS,
  ...ROUTE_PATHS.FEATURE_PATHS
] as const

/**
 * Routes that should always have language prefixes (for SEO)
 */
export const ALWAYS_PREFIXED_ROUTES = [
  '/auth',
  ...ROUTE_PATHS.AUTH_PATHS
] as const

/**
 * Routes that support clean URLs for authenticated users
 */
export const CLEAN_URL_SUPPORTED_ROUTES = [
  ...ROUTE_PATHS.HOME_PATHS,
  ...ROUTE_PATHS.FEATURE_PATHS,
  '/exam-results',
  '/review-answers',
  '/settings'
] as const

/**
 * Routes that should be skipped by middleware
 */
export const SKIP_ROUTES = [
  ...ROUTE_PATHS.SKIP_PATHS,
  '/robots.txt',
  '/sitemap.xml',
  '/manifest.json'
] as const

// ===== ROUTE CLASSIFICATION FUNCTIONS =====

/**
 * Check if a route is public (doesn't require authentication)
 */
export function isPublicRoute(pathname: string): boolean {
  // Check exact matches
  if (PUBLIC_ROUTES.includes(pathname as any)) {
    return true
  }
  
  // Check if it starts with auth patterns
  if (pathname.startsWith('/auth/')) {
    return true
  }
  
  // Check language-specific auth routes
  const languageAuthPattern = /^\/(vn|jp|en|1|2|3)\/(login|register|forgot-password)$/
  if (languageAuthPattern.test(pathname)) {
    return true
  }
  
  // Check language-specific landing routes
  const languageLandingPattern = /^\/(vn|jp|en|1|2|3)\/landing$/
  if (languageLandingPattern.test(pathname)) {
    return true
  }
  
  return false
}

/**
 * Check if a route is protected (requires authentication)
 */
export function isProtectedRoute(pathname: string): boolean {
  // If it's a public route, it's not protected
  if (isPublicRoute(pathname)) {
    return false
  }
  
  // Check if it's a language-specific home route (these ARE protected)
  const languageHomePattern = /^\/(vn|jp|en|1|2|3)\/home$/
  if (languageHomePattern.test(pathname)) {
    return true
  }
  
  // All other routes are considered protected by default
  return true
}

/**
 * Check if a route should always have language prefix
 */
export function shouldAlwaysHavePrefix(pathname: string): boolean {
  return ALWAYS_PREFIXED_ROUTES.some(route => 
    pathname === route || pathname.startsWith(route + '/')
  )
}

/**
 * Check if a route supports clean URLs for authenticated users
 */
export function supportsCleanUrl(pathname: string): boolean {
  return CLEAN_URL_SUPPORTED_ROUTES.some(route => 
    pathname === route || pathname.startsWith(route + '/')
  )
}

/**
 * Check if middleware should skip processing this route
 */
export function shouldSkipRoute(pathname: string): boolean {
  // Check skip paths
  if (SKIP_ROUTES.some(path => pathname.startsWith(path))) {
    return true
  }
  
  // Check file extensions
  if (pathname.includes('.') || ROUTE_PATHS.FILE_EXTENSIONS.some(ext => pathname.endsWith(ext))) {
    return true
  }
  
  return false
}

// ===== URL GENERATION FUNCTIONS =====

/**
 * Generate auth URL with language
 */
export function generateAuthUrl(authType: string, language: Language, origin: string): string {
  return `${origin}/auth/${language}/${authType}`
}

/**
 * Generate feature URL with language
 */
export function generateFeatureUrl(feature: string, language: Language, origin: string): string {
  return `${origin}/${language}/${feature}`
}

/**
 * Generate home URL with language
 */
export function generateHomeUrl(language: Language, origin: string): string {
  return `${origin}/${language}/home`
}

/**
 * Generate landing page URL
 */
export function generateLandingUrl(language: Language, origin: string): string {
  return `${origin}/${language}/landing`
}

/**
 * Generate login URL with language
 */
export function generateLoginUrl(language: Language, origin: string): string {
  return `${origin}/auth/${language}/login`
}

// ===== ROUTE TRANSFORMATION FUNCTIONS =====

/**
 * Convert clean URL to language-prefixed URL
 */
export function addLanguagePrefix(pathname: string, language: Language): string {
  // Handle root path
  if (pathname === '/') {
    return `/${language}/landing`
  }
  
  // Handle auth paths
  if (ROUTE_PATHS.AUTH_PATHS.includes(pathname as any)) {
    const authPath = pathname.slice(1) // Remove leading slash
    return `/auth/${language}/${authPath}`
  }
  
  // Handle home path
  if (pathname === '/home') {
    return `/${language}/home`
  }
  
  // Handle feature paths
  if (ROUTE_PATHS.FEATURE_PATHS.some(feature => pathname.startsWith(feature))) {
    const path = pathname.slice(1) // Remove leading slash
    return `/${language}/${path}`
  }
  
  return pathname
}

/**
 * Remove language prefix from URL
 */
export function removeLanguagePrefix(pathname: string): string {
  const match = pathname.match(/^\/(vn|jp|en|1|2|3)\/(.*)$/)
  if (match && match[2]) {
    return '/' + match[2]
  }
  return pathname
}

/**
 * Normalize route path (handle trailing slashes, etc.)
 */
export function normalizeRoutePath(pathname: string): string {
  // Remove trailing slash except for root
  if (pathname !== '/' && pathname.endsWith('/')) {
    pathname = pathname.slice(0, -1)
  }
  
  // Ensure leading slash
  if (!pathname.startsWith('/')) {
    pathname = '/' + pathname
  }
  
  return pathname
}

// ===== ROUTE ANALYSIS FUNCTIONS =====

/**
 * Analyze route and return detailed information
 */
export function analyzeRoute(pathname: string) {
  const normalizedPath = normalizeRoutePath(pathname)
  
  return {
    original: pathname,
    normalized: normalizedPath,
    isPublic: isPublicRoute(normalizedPath),
    isProtected: isProtectedRoute(normalizedPath),
    shouldSkip: shouldSkipRoute(normalizedPath),
    alwaysPrefixed: shouldAlwaysHavePrefix(normalizedPath),
    supportsCleanUrl: supportsCleanUrl(normalizedPath),
    category: getRouteCategory(normalizedPath)
  }
}

/**
 * Get route category
 */
export function getRouteCategory(pathname: string): string {
  if (shouldSkipRoute(pathname)) return 'SKIP'
  if (pathname.startsWith('/auth/') || ROUTE_PATHS.AUTH_PATHS.includes(pathname as any)) return 'AUTH'
  if (ROUTE_PATHS.HOME_PATHS.includes(pathname as any)) return 'HOME'
  if (ROUTE_PATHS.FEATURE_PATHS.some(feature => pathname.startsWith(feature))) return 'FEATURE'
  if (pathname === '/') return 'ROOT'
  return 'OTHER'
}

// ===== ROUTE VALIDATION FUNCTIONS =====

/**
 * Validate if a route path is valid
 */
export function isValidRoutePath(pathname: string): boolean {
  try {
    // Basic validation
    if (!pathname || typeof pathname !== 'string') return false
    if (!pathname.startsWith('/')) return false
    
    // Check for invalid characters
    const invalidChars = /[<>:"\\|?*]/
    if (invalidChars.test(pathname)) return false
    
    return true
  } catch {
    return false
  }
}

/**
 * Validate route configuration
 */
export function validateRouteConfig(): boolean {
  try {
    // Check that all route arrays are defined
    const requiredArrays = [PUBLIC_ROUTES, PROTECTED_ROUTES, ALWAYS_PREFIXED_ROUTES, CLEAN_URL_SUPPORTED_ROUTES]
    
    for (const array of requiredArrays) {
      if (!Array.isArray(array) || array.length === 0) {
        console.error('Invalid route configuration: missing or empty route array')
        return false
      }
    }
    
    return true
  } catch (error) {
    console.error('Route configuration validation failed:', error)
    return false
  }
}

export default {
  // Route arrays
  PUBLIC_ROUTES,
  PROTECTED_ROUTES,
  ALWAYS_PREFIXED_ROUTES,
  CLEAN_URL_SUPPORTED_ROUTES,
  SKIP_ROUTES,

  // Classification functions
  isPublicRoute,
  isProtectedRoute,
  shouldAlwaysHavePrefix,
  supportsCleanUrl,
  shouldSkipRoute,

  // URL generation functions
  generateAuthUrl,
  generateFeatureUrl,
  generateHomeUrl,
  generateLandingUrl,
  generateLoginUrl,

  // Transformation functions
  addLanguagePrefix,
  removeLanguagePrefix,
  normalizeRoutePath,

  // Analysis functions
  analyzeRoute,
  getRouteCategory,

  // Validation functions
  isValidRoutePath,
  validateRouteConfig
}
