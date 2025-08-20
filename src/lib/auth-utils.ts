/**
 * Authentication utility functions
 * Provides helper functions for auth-related operations
 */

import { STORAGE_KEYS } from '@/lib/constants'
import { User } from '@supabase/supabase-js'

/**
 * Check if user is authenticated by verifying token and user data in localStorage
 */
export function isAuthenticated(): boolean {
  if (typeof window === 'undefined') return false

  try {
    const userData = localStorage.getItem(STORAGE_KEYS.USER_DATA)

    return !!userData
  } catch (error) {
    console.error('Error checking authentication status:', error)
    return false
  }
}

/**
 * Get current user data from localStorage
 */
export function getCurrentUser(): User | null {
  if (typeof window === 'undefined') return null
  
  try {
    const userData = localStorage.getItem(STORAGE_KEYS.USER_DATA)
    if (!userData) return null
    
    return JSON.parse(userData)
  } catch (error) {
    console.error('Error getting current user:', error)
    return null
  }
}

/**
 * Get auth token from localStorage
 */
export function getAuthToken(): string | null {
  // Auth token is now managed by Supabase session
  return null
}

/**
 * Clear all auth data from localStorage
 */
export function clearAuthData(): void {
  if (typeof window === 'undefined') return

  try {
    localStorage.removeItem(STORAGE_KEYS.USER_DATA)
  } catch (error) {
    console.error('Error clearing auth data:', error)
  }
}

/**
 * Check if current route requires authentication
 */
export function isProtectedRoute(pathname: string): boolean {
  // Auth pages that don't require authentication
  const publicRoutes = [
    '/auth',
    '/login',
    '/register', 
    '/forgot-password',
    '/landing'
  ]
  
  // Check if pathname starts with any auth route pattern
  const isAuthRoute = publicRoutes.some(route => 
    pathname === route || 
    pathname.startsWith(`/auth/`) ||
    pathname.startsWith(`${route}/`)
  )
  
  // If it's an auth route, it's not protected
  if (isAuthRoute) return false
  
  // All other routes are protected
  return true
}

/**
 * Get redirect URL after successful login
 * Returns the intended destination or default to clean home page
 * Language preference is preserved in cookies/localStorage for UI language
 */
export function getLoginRedirectUrl(): string {
  if (typeof window === 'undefined') {
    return '/home' // Clean URL for SSR
  }

  try {
    // Check if there's a redirect URL in session storage
    const redirectUrl = sessionStorage.getItem('auth_redirect_url')
    if (redirectUrl) {
      sessionStorage.removeItem('auth_redirect_url')

      // Convert language-prefixed URLs to clean URLs for authenticated users
      if (redirectUrl.match(/^\/(vn|jp|en)\//)) {
        const cleanUrl = redirectUrl.replace(/^\/(vn|jp|en)/, '')
        return cleanUrl || '/home'
      }

      return redirectUrl
    }

    // Always redirect to clean URL /home for authenticated users
    // Language preference is handled by the UI components using stored preference
    return '/home'
  } catch (error) {
    console.error('Error getting login redirect URL:', error)
    return '/home'
  }
}

/**
 * Set redirect URL for after login
 */
export function setLoginRedirectUrl(url: string): void {
  if (typeof window === 'undefined') return
  
  try {
    sessionStorage.setItem('auth_redirect_url', url)
  } catch (error) {
    console.error('Error setting login redirect URL:', error)
  }
}

/**
 * Get current language preference from multiple sources
 */
function getCurrentLanguagePreference(): string {
  if (typeof window === 'undefined') return 'vn'

  try {
    // 1. Check current URL path first (highest priority)
    const currentPath = window.location.pathname
    const pathLanguage = detectLanguageFromPath(currentPath)
    if (pathLanguage !== 'vn' || currentPath.includes('/vn/')) {
      return pathLanguage
    }

    // 2. Check localStorage
    const storedLang = localStorage.getItem('preferred-language')
    if (storedLang && ['vn', 'jp', 'en'].includes(storedLang)) {
      return storedLang
    }

    // 3. Check cookie
    const cookieMatch = document.cookie.match(/preferred-language=([^;]+)/)
    if (cookieMatch && ['vn', 'jp', 'en'].includes(cookieMatch[1])) {
      return cookieMatch[1]
    }

    // 4. Default fallback
    return 'vn'
  } catch (error) {
    console.error('Error getting current language preference:', error)
    return 'vn'
  }
}

/**
 * Detect current language from pathname
 */
function detectLanguageFromPath(pathname?: string): string {
  if (typeof window === 'undefined') return 'vn'

  const path = pathname || window.location.pathname

  // Try to detect language from current path
  if (path.includes('/auth/vn/') || path.includes('/vn/')) {
    return 'vn'
  } else if (path.includes('/auth/jp/') || path.includes('/jp/')) {
    return 'jp'
  } else if (path.includes('/auth/en/') || path.includes('/en/')) {
    return 'en'
  }

  // Default to Vietnamese
  return 'vn'
}

/**
 * Get appropriate login URL based on current language preference
 * Uses stored language preference for authenticated users
 */
export function getLoginUrl(currentPath?: string): string {
  if (typeof window !== 'undefined') {
    // For authenticated users, use stored language preference
    const currentLanguage = getCurrentLanguagePreference()
    return `/auth/${currentLanguage}/login`
  }

  // Fallback for SSR
  const lang = detectLanguageFromPath(currentPath)
  return `/auth/${lang}/login`
}

/**
 * Set language preference when user navigates to a language-specific page
 */
export function setLanguagePreferenceFromPath(pathname: string): void {
  if (typeof window === 'undefined') return

  const language = detectLanguageFromPath(pathname)
  if (language) {
    try {
      // Set cookie (for server-side detection)
      document.cookie = `preferred-language=${language}; path=/; max-age=${30 * 24 * 60 * 60}` // 30 days

      // Set localStorage (for client-side detection)
      localStorage.setItem('preferred-language', language)
    } catch (error) {
      console.error('Error setting language preference:', error)
    }
  }
}

/**
 * Get appropriate register URL based on current language/route
 */
export function getRegisterUrl(currentPath?: string): string {
  const lang = detectLanguageFromPath(currentPath)
  return `/auth/${lang}/register`
}

/**
 * Get appropriate forgot password URL based on current language/route
 */
export function getForgotPasswordUrl(currentPath?: string): string {
  const lang = detectLanguageFromPath(currentPath)
  return `/auth/${lang}/forgot-password`
}

/**
 * Validate user session and return user data if valid
 */
export function validateSession(): { isValid: boolean; user: User | null } {
  if (!isAuthenticated()) {
    return { isValid: false, user: null }
  }
  
  const user = getCurrentUser()
  if (!user) {
    clearAuthData()
    return { isValid: false, user: null }
  }
  
  return { isValid: true, user }
}
