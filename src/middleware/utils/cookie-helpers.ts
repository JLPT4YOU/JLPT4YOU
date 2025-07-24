/**
 * Cookie Helper Utilities for Middleware
 * Provides secure and consistent cookie handling across middleware modules
 */

import { NextRequest, NextResponse } from 'next/server'
import type { Language, CookieConfig, CookieHelpers } from '../types/middleware'
import { COOKIE_CONFIG, getEnvironmentConfig } from '../config/constants'

// ===== COOKIE SETTING FUNCTIONS =====

/**
 * Set language preference cookie with secure options
 */
export function setLanguageCookie(response: NextResponse, language: Language): void {
  const config = COOKIE_CONFIG.LANGUAGE_COOKIE
  const envConfig = getEnvironmentConfig()
  
  response.cookies.set(config.name, language, {
    maxAge: config.maxAge,
    httpOnly: config.httpOnly,
    secure: envConfig.enableSecureCookies,
    sameSite: config.sameSite,
    path: '/'
  })
}

/**
 * Set secure cookie with environment-appropriate options
 */
export function setSecureCookie(
  response: NextResponse, 
  name: string, 
  value: string, 
  options: Partial<CookieConfig> = {}
): void {
  const envConfig = getEnvironmentConfig()
  
  response.cookies.set(name, value, {
    maxAge: options.maxAge || 60 * 60 * 24 * 7, // Default 1 week
    httpOnly: options.httpOnly ?? true,
    secure: envConfig.enableSecureCookies,
    sameSite: options.sameSite || 'lax',
    path: '/'
  })
}

// ===== COOKIE GETTING FUNCTIONS =====

/**
 * Get language preference from cookie
 */
export function getLanguageCookie(request: NextRequest): Language | undefined {
  const cookieValue = request.cookies.get(COOKIE_CONFIG.LANGUAGE_COOKIE.name)?.value
  
  if (!cookieValue) return undefined
  
  // Validate language value
  if (isValidLanguage(cookieValue)) {
    return cookieValue as Language
  }
  
  return undefined
}

/**
 * Get auth token from cookie
 */
export function getAuthCookie(request: NextRequest): string | undefined {
  return request.cookies.get(COOKIE_CONFIG.AUTH_COOKIE.name)?.value
}

/**
 * Get cookie value with validation
 */
export function getCookieValue(
  request: NextRequest, 
  cookieName: string, 
  validator?: (value: string) => boolean
): string | undefined {
  const cookieValue = request.cookies.get(cookieName)?.value
  
  if (!cookieValue) return undefined
  
  if (validator && !validator(cookieValue)) {
    return undefined
  }
  
  return cookieValue
}

// ===== COOKIE DELETION FUNCTIONS =====

/**
 * Delete cookie by setting it to expire
 */
export function deleteCookie(response: NextResponse, cookieName: string): void {
  response.cookies.set(cookieName, '', {
    maxAge: 0,
    expires: new Date(0),
    path: '/'
  })
}

/**
 * Clear all auth-related cookies
 */
export function clearAuthCookies(response: NextResponse): void {
  deleteCookie(response, COOKIE_CONFIG.AUTH_COOKIE.name)
  // Add other auth-related cookies here if needed
}

/**
 * Clear language preference cookie
 */
export function clearLanguageCookie(response: NextResponse): void {
  deleteCookie(response, COOKIE_CONFIG.LANGUAGE_COOKIE.name)
}

// ===== COOKIE VALIDATION FUNCTIONS =====

/**
 * Validate if language value is supported
 */
function isValidLanguage(value: string): boolean {
  return ['vn', 'jp', 'en'].includes(value)
}

/**
 * Validate cookie name format
 */
export function isValidCookieName(name: string): boolean {
  // Cookie name validation according to RFC 6265
  const validNamePattern = /^[a-zA-Z0-9!#$&'*+\-.^_`|~]+$/
  return validNamePattern.test(name)
}

/**
 * Validate cookie value format
 */
export function isValidCookieValue(value: string): boolean {
  // Basic validation - no control characters
  const invalidChars = /[\x00-\x1F\x7F]/
  return !invalidChars.test(value)
}

// ===== COOKIE SECURITY FUNCTIONS =====

/**
 * Generate secure cookie options based on environment
 */
export function getSecureCookieOptions(cookieConfig: CookieConfig): Record<string, any> {
  const envConfig = getEnvironmentConfig()
  
  return {
    maxAge: cookieConfig.maxAge,
    httpOnly: cookieConfig.httpOnly,
    secure: envConfig.enableSecureCookies,
    sameSite: cookieConfig.sameSite,
    path: '/'
  }
}

/**
 * Check if cookie should be secure based on environment
 */
export function shouldUseSecureCookies(): boolean {
  return getEnvironmentConfig().enableSecureCookies
}

// ===== COOKIE PARSING FUNCTIONS =====

/**
 * Parse cookie header string into key-value pairs
 */
export function parseCookieHeader(cookieHeader: string): Record<string, string> {
  const cookies: Record<string, string> = {}
  
  if (!cookieHeader) return cookies
  
  cookieHeader.split(';').forEach(cookie => {
    const [name, ...rest] = cookie.trim().split('=')
    if (name && rest.length > 0) {
      cookies[name] = rest.join('=')
    }
  })
  
  return cookies
}

/**
 * Extract specific cookie from cookie header
 */
export function extractCookieFromHeader(cookieHeader: string, cookieName: string): string | undefined {
  const cookies = parseCookieHeader(cookieHeader)
  return cookies[cookieName]
}

// ===== COOKIE UTILITY FUNCTIONS =====

/**
 * Check if cookie exists in request
 */
export function hasCookie(request: NextRequest, cookieName: string): boolean {
  return request.cookies.has(cookieName)
}

/**
 * Get all cookies from request
 */
export function getAllCookies(request: NextRequest): Record<string, string> {
  const cookies: Record<string, string> = {}
  
  request.cookies.getAll().forEach(cookie => {
    cookies[cookie.name] = cookie.value
  })
  
  return cookies
}

/**
 * Count number of cookies in request
 */
export function getCookieCount(request: NextRequest): number {
  return request.cookies.getAll().length
}

// ===== COOKIE DEBUGGING FUNCTIONS =====

/**
 * Log cookie information for debugging
 */
export function debugCookies(request: NextRequest, label: string = 'Cookies'): void {
  const envConfig = getEnvironmentConfig()
  
  if (!envConfig.enableLogging) return
  
  const cookies = getAllCookies(request)
  console.debug(`[${label}]`, {
    count: Object.keys(cookies).length,
    cookies: Object.keys(cookies),
    languageCookie: getLanguageCookie(request),
    hasAuthCookie: hasCookie(request, COOKIE_CONFIG.AUTH_COOKIE.name)
  })
}

/**
 * Analyze cookie security
 */
export function analyzeCookieSecurity(request: NextRequest): {
  hasSecureCookies: boolean
  hasHttpOnlyCookies: boolean
  cookieCount: number
  potentialIssues: string[]
} {
  const cookies = request.cookies.getAll()
  const issues: string[] = []
  
  const hasSecure = false
  const hasHttpOnly = false
  
  cookies.forEach(cookie => {
    // Note: NextRequest doesn't expose cookie attributes, 
    // so we can only check basic properties
    if (cookie.name.includes('auth') || cookie.name.includes('session')) {
      if (!shouldUseSecureCookies()) {
        issues.push(`Auth cookie ${cookie.name} may not be secure in production`)
      }
    }
  })
  
  return {
    hasSecureCookies: hasSecure,
    hasHttpOnlyCookies: hasHttpOnly,
    cookieCount: cookies.length,
    potentialIssues: issues
  }
}

// ===== COOKIE HELPERS IMPLEMENTATION =====

/**
 * Implementation of CookieHelpers interface
 */
export const cookieHelpers: CookieHelpers = {
  setLanguageCookie,
  getLanguageCookie,
  setSecureCookieOptions: getSecureCookieOptions
}

export default cookieHelpers
