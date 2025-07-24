/**
 * Main Middleware Function - Refactored Version
 * Clean, modular implementation using all middleware modules
 * Reduced from 409 lines to ~150 lines with improved maintainability
 */

import { NextRequest, NextResponse } from 'next/server'
import type { 
  Language, 
  MiddlewareContext, 
  MiddlewareResult 
} from './types/middleware'

// Import all modules
import { 
  detectPreferredLanguage,
  createLanguageDetectionContext,
  getLanguagePreference
} from './modules/language-detection'

import {
  isAuthenticated,
  checkAuthentication,
  createAuthenticationContext
} from './modules/authentication'

import {
  generateRedirectUrl,
  createUrlGenerationContext
} from './modules/url-generation'

import {
  generateSecurityHeaders,
  applyHeadersToResponse
} from './modules/security-headers'

import { setLanguageCookie } from './utils/cookie-helpers'

// Import utilities
import { shouldSkipMiddleware } from './utils/path-helpers'
import { debugCookies } from './utils/cookie-helpers'

// Import configuration
import { ERROR_CONFIG, PERFORMANCE_CONFIG } from './config/constants'

// ===== MAIN MIDDLEWARE FUNCTION =====

/**
 * Enhanced Middleware for Dual-Mode Language Routing
 * Handles language detection, redirects, and regional targeting
 * Supports clean URLs for authenticated users and language-prefixed URLs for public access
 */
export async function middleware(request: NextRequest): Promise<NextResponse> {
  const startTime = performance.now()
  
  try {
    // Early exit for paths that should skip middleware
    const pathname = request.nextUrl.pathname
    if (shouldSkipMiddleware(pathname)) {
      return NextResponse.next()
    }
    
    // Debug logging in development
    if (ERROR_CONFIG.ENABLE_LOGGING) {
      console.debug('[Middleware] Processing:', pathname)
      debugCookies(request, 'Request Cookies')
    }
    
    // Step 1: Language Detection
    const languageContext = createLanguageDetectionContext(request)
    const languageResult = detectPreferredLanguage(languageContext)
    const detectedLanguage = languageResult.detectedLanguage
    
    // Step 2: Authentication Check
    const userAuthenticated = isAuthenticated(request)
    const authContext = createAuthenticationContext(request)
    const authResult = checkAuthentication(authContext)
    
    // Step 3: URL Generation and Redirect Logic
    const urlContext = createUrlGenerationContext(request, detectedLanguage, userAuthenticated)
    const urlResult = generateRedirectUrl(urlContext)
    
    // Step 4: Handle Redirects
    if (urlResult.shouldRedirect && urlResult.redirectUrl) {
      const response = NextResponse.redirect(urlResult.redirectUrl)
      
      // Set language cookie for future requests
      setLanguageCookie(response, detectedLanguage)
      
      // Apply security headers
      const securityContext = {
        pathname,
        language: detectedLanguage,
        isAuthenticated: userAuthenticated
      }
      const securityResult = generateSecurityHeaders(securityContext)
      applyHeadersToResponse(response, securityResult.headers)
      
      // Performance logging
      logPerformance(startTime, 'redirect', pathname)
      
      return response
    }
    
    // Step 5: Handle Authentication Redirects
    if (authResult.shouldRedirect && authResult.redirectUrl) {
      const response = NextResponse.redirect(authResult.redirectUrl)
      
      // Set language cookie
      setLanguageCookie(response, detectedLanguage)
      
      // Apply security headers
      const securityContext = {
        pathname,
        language: detectedLanguage,
        isAuthenticated: false
      }
      const securityResult = generateSecurityHeaders(securityContext)
      applyHeadersToResponse(response, securityResult.headers)
      
      // Performance logging
      logPerformance(startTime, 'auth-redirect', pathname)
      
      return response
    }
    
    // Step 6: Continue with Request (No Redirect Needed)
    const response = NextResponse.next()
    
    // Set language cookie if not already set
    const currentLanguage = getLanguagePreference(request, pathname)
    setLanguageCookie(response, currentLanguage)
    
    // Apply security headers
    const securityContext = {
      pathname,
      language: currentLanguage,
      isAuthenticated: userAuthenticated
    }
    const securityResult = generateSecurityHeaders(securityContext)
    applyHeadersToResponse(response, securityResult.headers)
    
    // Performance logging
    logPerformance(startTime, 'continue', pathname)
    
    return response
    
  } catch (error) {
    // Error handling
    console.error('[Middleware Error]', {
      pathname: request.nextUrl.pathname,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    })
    
    // Return basic response with security headers in case of error
    const response = NextResponse.next()
    
    // Apply minimal security headers
    response.headers.set('X-Frame-Options', 'DENY')
    response.headers.set('X-Content-Type-Options', 'nosniff')
    
    return response
  }
}

// ===== HELPER FUNCTIONS =====

/**
 * Log performance metrics
 */
function logPerformance(startTime: number, action: string, pathname: string): void {
  if (!ERROR_CONFIG.ENABLE_PERFORMANCE_MONITORING) return
  
  const duration = performance.now() - startTime
  const threshold = PERFORMANCE_CONFIG.LANGUAGE_DETECTION_TIMEOUT + 
                   PERFORMANCE_CONFIG.URL_GENERATION_TIMEOUT + 
                   PERFORMANCE_CONFIG.HEADER_PROCESSING_TIMEOUT
  
  if (duration > threshold) {
    console.warn('[Middleware Performance]', {
      action,
      pathname,
      duration: `${duration.toFixed(2)}ms`,
      threshold: `${threshold}ms`,
      status: 'slow'
    })
  } else if (ERROR_CONFIG.ENABLE_LOGGING) {
    console.debug('[Middleware Performance]', {
      action,
      pathname,
      duration: `${duration.toFixed(2)}ms`,
      status: 'normal'
    })
  }
}

/**
 * Create middleware context for debugging
 */
function createMiddlewareContext(
  request: NextRequest,
  language: Language,
  isAuthenticated: boolean
): MiddlewareContext {
  const pathname = request.nextUrl.pathname
  
  // Create contexts for each module
  const languageContext = createLanguageDetectionContext(request)
  const authContext = createAuthenticationContext(request)
  const urlContext = createUrlGenerationContext(request, language, isAuthenticated)
  
  // Get results from each module
  const languageResult = detectPreferredLanguage(languageContext)
  const authResult = checkAuthentication(authContext)
  const urlResult = generateRedirectUrl(urlContext)
  const securityResult = generateSecurityHeaders({
    pathname,
    language,
    isAuthenticated
  })
  
  return {
    request,
    pathname,
    languageDetection: languageResult,
    authentication: authResult,
    urlGeneration: urlResult,
    securityHeaders: securityResult
  }
}

/**
 * Debug middleware processing
 */
export function debugMiddleware(request: NextRequest): MiddlewareContext {
  const pathname = request.nextUrl.pathname
  const userAuthenticated = isAuthenticated(request)
  const language = getLanguagePreference(request, pathname)
  
  return createMiddlewareContext(request, language, userAuthenticated)
}

// ===== MIDDLEWARE CONFIGURATION =====

/**
 * Middleware configuration for Next.js
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
  ],
}

// ===== EXPORTS =====

export default middleware

// Export helper functions for testing
export {
  logPerformance,
  createMiddlewareContext
}
