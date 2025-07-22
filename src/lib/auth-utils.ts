/**
 * Authentication utility functions
 * Provides helper functions for auth-related operations
 */

import { STORAGE_KEYS } from '@/lib/constants'
import { User } from '@/contexts/auth-context'

/**
 * Check if user is authenticated by verifying token and user data in localStorage
 */
export function isAuthenticated(): boolean {
  if (typeof window === 'undefined') return false
  
  try {
    const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN)
    const userData = localStorage.getItem(STORAGE_KEYS.USER_DATA)
    
    return !!(token && userData)
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
  if (typeof window === 'undefined') return null
  
  try {
    return localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN)
  } catch (error) {
    console.error('Error getting auth token:', error)
    return null
  }
}

/**
 * Clear all auth data from localStorage
 */
export function clearAuthData(): void {
  if (typeof window === 'undefined') return
  
  try {
    localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN)
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
 * Returns the intended destination or default to home page
 */
export function getLoginRedirectUrl(): string {
  if (typeof window === 'undefined') return '/vn/home'

  try {
    // Check if there's a redirect URL in session storage
    const redirectUrl = sessionStorage.getItem('auth_redirect_url')
    if (redirectUrl) {
      sessionStorage.removeItem('auth_redirect_url')
      return redirectUrl
    }

    // Try to detect language from current path for default redirect
    const pathname = window.location.pathname
    if (pathname.includes('/auth/vn/') || pathname.includes('/vn/')) {
      return '/vn/home'
    } else if (pathname.includes('/auth/jp/') || pathname.includes('/jp/')) {
      return '/jp/home'
    } else if (pathname.includes('/auth/en/') || pathname.includes('/en/')) {
      return '/en/home'
    }

    // Default to Vietnamese home page
    return '/vn/home'
  } catch (error) {
    console.error('Error getting login redirect URL:', error)
    return '/vn/home'
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
 * Get appropriate login URL based on current language/route
 */
export function getLoginUrl(currentPath?: string): string {
  if (typeof window === 'undefined') return '/auth/vn/login'
  
  const pathname = currentPath || window.location.pathname
  
  // Try to detect language from current path
  if (pathname.includes('/auth/vn/') || pathname.includes('/vn/')) {
    return '/auth/vn/login'
  } else if (pathname.includes('/auth/jp/') || pathname.includes('/jp/')) {
    return '/auth/jp/login'
  } else if (pathname.includes('/auth/en/') || pathname.includes('/en/')) {
    return '/auth/en/login'
  }
  
  // Default to Vietnamese
  return '/auth/vn/login'
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
