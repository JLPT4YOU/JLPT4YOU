/**
 * Security & Headers Management Module
 * Handles security headers, cache headers, and response header management
 */

import { NextResponse } from 'next/server'
import type {
  Language,
  SecurityHeadersContext,
  SecurityHeadersResult,
  SecurityHeadersModule
} from '../types/middleware'
import { SECURITY_HEADERS, CACHE_HEADERS, LANGUAGE_CONFIG } from '../config/constants'
import { hasLanguagePrefix, extractLanguageFromPath } from '../utils/path-helpers'
import { getLanguageCookie } from '../utils/cookie-helpers'

// ===== SECURITY HEADERS CORE =====

/**
 * Generate security headers based on context
 */
export function generateSecurityHeaders(context: SecurityHeadersContext): SecurityHeadersResult {
  const { pathname, language, isAuthenticated } = context
  
  // Base security headers
  const headers: Record<string, string> = { ...SECURITY_HEADERS }
  
  // Add language-specific headers
  const langConfig = LANGUAGE_CONFIG[language]
  headers['Content-Language'] = langConfig.locale
  
  // Add cache control headers
  const cacheControl = applyCacheHeaders(pathname)
  if (cacheControl) {
    headers['Cache-Control'] = cacheControl
  }
  
  // Add security headers based on authentication status
  if (isAuthenticated) {
    headers['X-Authenticated'] = 'true'
  }
  
  // Add CSP headers for enhanced security
  const cspHeader = generateCSPHeader(pathname, isAuthenticated)
  if (cspHeader) {
    headers['Content-Security-Policy'] = cspHeader
  }
  
  return {
    headers,
    cacheControl
  }
}

/**
 * Apply cache headers based on pathname
 */
export function applyCacheHeaders(pathname: string): string | undefined {
  // Auth pages get specific cache headers
  if (pathname.startsWith('/auth/')) {
    return CACHE_HEADERS.AUTH_PAGES
  }
  
  // Static assets get long cache
  if (isStaticAsset(pathname)) {
    return 'public, max-age=31536000, immutable' // 1 year
  }
  
  // API routes get no cache
  if (pathname.startsWith('/api/')) {
    return 'no-cache, no-store, must-revalidate'
  }
  
  // Dynamic pages get short cache
  if (isDynamicPage(pathname)) {
    return 'public, max-age=300, stale-while-revalidate=3600' // 5 minutes
  }
  
  return undefined
}

// ===== CONTENT SECURITY POLICY =====

/**
 * Generate Content Security Policy header
 */
export function generateCSPHeader(pathname: string, isAuthenticated: boolean): string | null {
  // Base CSP directives
  const directives: Record<string, string[]> = {
    'default-src': ["'self'"],
    'script-src': ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
    'style-src': ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
    'font-src': ["'self'", 'https://fonts.gstatic.com'],
    'img-src': ["'self'", 'data:', 'https:'],
    'connect-src': [
      "'self'",
      'https://generativelanguage.googleapis.com',  // Gemini API
      'https://api.groq.com',                       // Groq API
      'https://prrizpzrdepnjjkyrimh.supabase.co'    // Supabase API
    ],
    'frame-ancestors': ["'none'"],
    'base-uri': ["'self'"],
    'form-action': ["'self'"]
  }
  
  // Add specific directives for auth pages
  if (pathname.startsWith('/auth/')) {
    directives['connect-src'].push('https://accounts.google.com')
  }
  
  // Add specific directives for exam pages
  if (pathname.includes('/test') || pathname.includes('/exam')) {
    directives['script-src'].push("'strict-dynamic'")
  }
  
  // Convert directives to CSP string
  const cspString = Object.entries(directives)
    .map(([directive, sources]) => `${directive} ${sources.join(' ')}`)
    .join('; ')
  
  return cspString
}

// ===== SECURITY VALIDATION =====

/**
 * Validate security headers
 */
export function validateSecurityHeaders(headers: Record<string, string>): {
  isValid: boolean
  issues: string[]
  recommendations: string[]
} {
  const issues: string[] = []
  const recommendations: string[] = []
  
  // Check required security headers
  const requiredHeaders = [
    'X-Frame-Options',
    'X-Content-Type-Options',
    'Referrer-Policy'
  ]
  
  requiredHeaders.forEach(header => {
    if (!headers[header]) {
      issues.push(`Missing required security header: ${header}`)
    }
  })
  
  // Check CSP header
  if (!headers['Content-Security-Policy']) {
    recommendations.push('Consider adding Content-Security-Policy header')
  }
  
  // Check HSTS header for production
  if (process.env.NODE_ENV === 'production' && !headers['Strict-Transport-Security']) {
    recommendations.push('Consider adding Strict-Transport-Security header for HTTPS')
  }
  
  return {
    isValid: issues.length === 0,
    issues,
    recommendations
  }
}

// ===== RESPONSE HEADER UTILITIES =====

/**
 * Apply headers to NextResponse
 */
export function applyHeadersToResponse(response: NextResponse, headers: Record<string, string>): void {
  Object.entries(headers).forEach(([key, value]) => {
    response.headers.set(key, value)
  })
}

/**
 * Set language-specific headers
 */
export function setLanguageHeaders(response: NextResponse, language: Language): void {
  const langConfig = LANGUAGE_CONFIG[language]
  response.headers.set('Content-Language', langConfig.locale)
  response.headers.set('X-Language', language)
}

/**
 * Set cache headers
 */
export function setCacheHeaders(response: NextResponse, cacheControl: string): void {
  response.headers.set('Cache-Control', cacheControl)
  response.headers.set('Vary', 'Accept-Language, Cookie')
}

/**
 * Set security headers
 */
export function setSecurityHeaders(response: NextResponse): void {
  Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
    response.headers.set(key, value)
  })
}

// ===== HEADER ANALYSIS =====

/**
 * Analyze current language from various sources
 */
export function analyzeCurrentLanguage(
  pathname: string,
  isAuthenticated: boolean,
  cookieLanguage?: Language,
  preferredLanguage?: Language
): Language {
  // 1. Check auth routes with language
  if (pathname.includes('/auth/vn')) return 'vn'
  if (pathname.includes('/auth/jp')) return 'jp'
  if (pathname.includes('/auth/en')) return 'en'
  
  // 2. Check language prefix in path
  if (hasLanguagePrefix(pathname)) {
    const pathLanguage = extractLanguageFromPath(pathname)
    if (pathLanguage) return pathLanguage
  }
  
  // 3. For clean URLs (authenticated users), use stored preference
  if (isAuthenticated && cookieLanguage) {
    return cookieLanguage
  }
  
  // 4. Use preferred language
  if (preferredLanguage) {
    return preferredLanguage
  }
  
  // 5. Default to Vietnamese
  return 'vn'
}

// ===== HELPER FUNCTIONS =====

/**
 * Check if path is a static asset
 */
function isStaticAsset(pathname: string): boolean {
  const staticExtensions = ['.js', '.css', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.woff', '.woff2']
  return staticExtensions.some(ext => pathname.endsWith(ext))
}

/**
 * Check if path is a dynamic page
 */
function isDynamicPage(pathname: string): boolean {
  // Pages that change frequently
  const dynamicPaths = ['/home', '/jlpt', '/challenge', '/driving']
  return dynamicPaths.some(path => pathname.startsWith(path))
}

/**
 * Get security level based on pathname
 */
export function getSecurityLevel(pathname: string): 'low' | 'medium' | 'high' {
  // High security for auth and admin pages
  if (pathname.startsWith('/auth/') || pathname.startsWith('/admin/')) {
    return 'high'
  }
  
  // Medium security for user pages
  if (pathname.startsWith('/home') || pathname.startsWith('/settings')) {
    return 'medium'
  }
  
  // Low security for public pages
  return 'low'
}

// ===== PERFORMANCE OPTIMIZATION =====

/**
 * Cache headers for performance
 */
const headerCache = new Map<string, Record<string, string>>()

/**
 * Get cached headers or generate new ones
 */
export function getCachedHeaders(cacheKey: string, generator: () => Record<string, string>): Record<string, string> {
  if (headerCache.has(cacheKey)) {
    return headerCache.get(cacheKey)!
  }
  
  const headers = generator()
  headerCache.set(cacheKey, headers)
  
  // Clear cache after 5 minutes
  setTimeout(() => {
    headerCache.delete(cacheKey)
  }, 5 * 60 * 1000)
  
  return headers
}

/**
 * Clear header cache
 */
export function clearHeaderCache(): void {
  headerCache.clear()
}

// ===== DEBUGGING UTILITIES =====

/**
 * Debug headers for development
 */
export function debugHeaders(headers: Record<string, string>, label: string = 'Headers'): void {
  if (process.env.NODE_ENV !== 'development') return
  
  console.debug(`[${label}]`, {
    count: Object.keys(headers).length,
    headers: Object.keys(headers),
    securityHeaders: Object.keys(headers).filter(key => 
      key.startsWith('X-') || key.includes('Security') || key.includes('Policy')
    ),
    cacheHeaders: Object.keys(headers).filter(key => 
      key.includes('Cache') || key === 'Vary' || key === 'ETag'
    )
  })
}

/**
 * Analyze header security
 */
export function analyzeHeaderSecurity(headers: Record<string, string>): {
  score: number
  strengths: string[]
  weaknesses: string[]
} {
  const strengths: string[] = []
  const weaknesses: string[] = []
  let score = 0
  
  // Check for security headers
  if (headers['X-Frame-Options']) {
    strengths.push('X-Frame-Options present')
    score += 20
  } else {
    weaknesses.push('Missing X-Frame-Options')
  }
  
  if (headers['Content-Security-Policy']) {
    strengths.push('CSP header present')
    score += 30
  } else {
    weaknesses.push('Missing Content-Security-Policy')
  }
  
  if (headers['X-Content-Type-Options']) {
    strengths.push('X-Content-Type-Options present')
    score += 15
  } else {
    weaknesses.push('Missing X-Content-Type-Options')
  }
  
  if (headers['Referrer-Policy']) {
    strengths.push('Referrer-Policy present')
    score += 15
  } else {
    weaknesses.push('Missing Referrer-Policy')
  }
  
  if (headers['Strict-Transport-Security']) {
    strengths.push('HSTS header present')
    score += 20
  } else if (process.env.NODE_ENV === 'production') {
    weaknesses.push('Missing HSTS header in production')
  }
  
  return { score, strengths, weaknesses }
}

// ===== MODULE IMPLEMENTATION =====

/**
 * Security Headers Module implementation
 */
export const securityHeadersModule: SecurityHeadersModule = {
  generateSecurityHeaders,
  applyCacheHeaders
}

export default securityHeadersModule
