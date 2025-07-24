/**
 * Authentication & Route Protection Module
 * Handles authentication checking, protected route detection, and auth-related redirects
 */

import { NextRequest } from 'next/server'
import type {
  Language,
  AuthenticationContext,
  AuthenticationResult,
  AuthenticationModule
} from '../types/middleware'
import { COOKIE_CONFIG, TESTING_CONFIG } from '../config/constants'
import { LANGUAGE_PATTERNS } from '../config/patterns'
import { isPublicRoute, isProtectedRoute as isRouteProtected } from '../config/routes'
import { getAuthCookie } from '../utils/cookie-helpers'

// ===== AUTHENTICATION CORE =====

/**
 * Check if user is authenticated based on cookies
 */
export function isAuthenticated(request: NextRequest): boolean {
  // Check for auth token in cookies
  const authToken = getAuthCookie(request)
  return !!authToken
}

/**
 * Check if route requires authentication
 */
export function isProtectedRoute(pathname: string): boolean {
  // Use the route configuration logic
  return isRouteProtected(pathname)
}

/**
 * Comprehensive authentication check with context
 */
export function checkAuthentication(context: AuthenticationContext): AuthenticationResult {
  const { request, pathname, isAuthenticated: userAuthenticated, needsAuth } = context
  
  // If route doesn't need auth, allow access
  if (!needsAuth) {
    return {
      isAuthenticated: userAuthenticated,
      needsAuth: false,
      shouldRedirect: false
    }
  }
  
  // Check for testing bypass
  const isTestingExamPage = shouldBypassAuthForTesting(pathname)
  if (isTestingExamPage && TESTING_CONFIG.SKIP_AUTH_FOR_TESTING) {
    return {
      isAuthenticated: true, // Bypass auth for testing
      needsAuth: false,
      shouldRedirect: false
    }
  }
  
  // If user is not authenticated and route needs auth, redirect to login
  if (needsAuth && !userAuthenticated) {
    const redirectUrl = generateAuthRedirectUrl(request, pathname)
    return {
      isAuthenticated: false,
      needsAuth: true,
      shouldRedirect: true,
      redirectUrl
    }
  }
  
  // User is authenticated and route needs auth - allow access
  return {
    isAuthenticated: userAuthenticated,
    needsAuth: true,
    shouldRedirect: false
  }
}

// ===== ROUTE PROTECTION LOGIC =====

/**
 * Enhanced route protection check with detailed analysis
 */
export function analyzeRouteProtection(pathname: string): {
  isPublic: boolean
  isProtected: boolean
  isAuthRoute: boolean
  isLanguageAuthRoute: boolean
  isLanguageHomeRoute: boolean
  requiresAuth: boolean
} {
  // Check if it's a public route
  const isPublic = isPublicRoute(pathname)
  
  // Check if it's an auth route
  const isAuthRoute = pathname.startsWith('/auth/') || 
                     ['/login', '/register', '/forgot-password', '/landing'].includes(pathname)
  
  // Check if it's a language-specific auth route (e.g., /vn/landing, /jp/login)
  const isLanguageAuthRoute = LANGUAGE_PATTERNS.LANGUAGE_AUTH_PATTERN.test(pathname)
  
  // Check if it's a language-specific home route (e.g., /vn/home, /jp/home)
  const isLanguageHomeRoute = LANGUAGE_PATTERNS.LANGUAGE_HOME_PATTERN.test(pathname)
  
  // Determine if route is protected
  const isProtected = !isPublic && !isAuthRoute && !isLanguageAuthRoute
  
  // Home routes ARE protected (need auth) even if they have language prefix
  const requiresAuth = isProtected || isLanguageHomeRoute
  
  return {
    isPublic,
    isProtected,
    isAuthRoute,
    isLanguageAuthRoute,
    isLanguageHomeRoute,
    requiresAuth
  }
}

/**
 * Check if route should bypass authentication for testing
 */
export function shouldBypassAuthForTesting(pathname: string): boolean {
  if (!TESTING_CONFIG.SKIP_AUTH_FOR_TESTING) {
    return false
  }
  
  return TESTING_CONFIG.TESTING_PATHS.some(path => pathname.includes(path))
}

// ===== AUTH REDIRECT LOGIC =====

/**
 * Generate authentication redirect URL
 */
export function generateAuthRedirectUrl(request: NextRequest, pathname: string): string {
  // Detect preferred language for redirect
  const preferredLanguage = detectLanguageForAuth(request, pathname)
  
  // Generate login URL with appropriate language
  const loginUrl = `${request.nextUrl.origin}/auth/${preferredLanguage}/login`
  
  return loginUrl
}

/**
 * Detect language for authentication redirect
 */
function detectLanguageForAuth(request: NextRequest, pathname: string): Language {
  // 1. Check if URL already has language
  if (pathname.startsWith('/auth/vn') || pathname.startsWith('/vn')) return 'vn'
  if (pathname.startsWith('/auth/jp') || pathname.startsWith('/jp')) return 'jp'
  if (pathname.startsWith('/auth/en') || pathname.startsWith('/en')) return 'en'
  
  // 2. Check cookie preference
  const cookieLang = request.cookies.get(COOKIE_CONFIG.LANGUAGE_COOKIE.name)?.value as Language
  if (cookieLang && ['vn', 'jp', 'en'].includes(cookieLang)) {
    return cookieLang
  }
  
  // 3. Check Accept-Language header
  const acceptLanguage = request.headers.get('accept-language')
  if (acceptLanguage) {
    if (acceptLanguage.includes('vi') || acceptLanguage.includes('vi-vn')) return 'vn'
    if (acceptLanguage.includes('ja') || acceptLanguage.includes('ja-jp')) return 'jp'
    if (acceptLanguage.includes('en')) return 'en'
  }
  
  // 4. Default to Vietnamese
  return 'vn'
}

// ===== SESSION MANAGEMENT =====

/**
 * Validate authentication token
 */
export function validateAuthToken(token: string): boolean {
  // Basic validation - check if token exists and is not empty
  if (!token || typeof token !== 'string' || token.trim().length === 0) {
    return false
  }
  
  // Additional validation can be added here
  // For now, we just check if token exists
  return true
}

/**
 * Check if authentication token is expired
 */
export function isAuthTokenExpired(request: NextRequest): boolean {
  // This would typically check token expiration
  // For now, we assume tokens don't expire on client side
  // Server-side validation would handle expiration
  return false
}

/**
 * Get authentication status with detailed information
 */
export function getAuthenticationStatus(request: NextRequest): {
  isAuthenticated: boolean
  hasToken: boolean
  tokenValid: boolean
  tokenExpired: boolean
} {
  const authToken = getAuthCookie(request)
  const hasToken = !!authToken
  const tokenValid = hasToken ? validateAuthToken(authToken) : false
  const tokenExpired = hasToken ? isAuthTokenExpired(request) : false
  const isAuthenticated = hasToken && tokenValid && !tokenExpired
  
  return {
    isAuthenticated,
    hasToken,
    tokenValid,
    tokenExpired
  }
}

// ===== ROLE-BASED ACCESS CONTROL =====

/**
 * Check if user has required role (placeholder for future implementation)
 */
export function hasRequiredRole(request: NextRequest, requiredRole: string): boolean {
  // Placeholder for role-based access control
  // This would typically decode JWT token and check roles
  return true
}

/**
 * Check if route requires specific role
 */
export function getRequiredRole(pathname: string): string | null {
  // Admin routes
  if (pathname.startsWith('/admin')) {
    return 'admin'
  }
  
  // Teacher routes (if any)
  if (pathname.startsWith('/teacher')) {
    return 'teacher'
  }
  
  // No specific role required
  return null
}

// ===== AUTHENTICATION UTILITIES =====

/**
 * Create authentication context from request
 */
export function createAuthenticationContext(request: NextRequest): AuthenticationContext {
  const pathname = request.nextUrl.pathname
  const userAuthenticated = isAuthenticated(request)
  const needsAuth = isProtectedRoute(pathname)
  const isTestingExamPage = shouldBypassAuthForTesting(pathname)
  
  return {
    request,
    pathname,
    isAuthenticated: userAuthenticated,
    needsAuth,
    isTestingExamPage
  }
}

/**
 * Debug authentication for development
 */
export function debugAuthentication(context: AuthenticationContext): void {
  if (process.env.NODE_ENV !== 'development') return
  
  const { pathname, isAuthenticated, needsAuth, isTestingExamPage } = context
  const authStatus = getAuthenticationStatus(context.request)
  const routeAnalysis = analyzeRouteProtection(pathname)
  
  console.debug('[Auth Debug]', {
    pathname,
    isAuthenticated,
    needsAuth,
    isTestingExamPage,
    authStatus,
    routeAnalysis
  })
}

// ===== MODULE IMPLEMENTATION =====

/**
 * Authentication Module implementation
 */
export const authenticationModule: AuthenticationModule = {
  isAuthenticated,
  isProtectedRoute,
  checkAuthentication
}

export default authenticationModule
