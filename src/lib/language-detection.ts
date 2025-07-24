/**
 * Dynamic Language Detection Utility
 * Shared between middleware and client-side components
 * Replaces hardcoded language redirects with intelligent detection
 */

import { NextRequest } from 'next/server'
import { Language, DEFAULT_LANGUAGE, SUPPORTED_LANGUAGES } from './i18n'

export interface LanguageDetectionOptions {
  request?: NextRequest
  cookieValue?: string
  acceptLanguageHeader?: string
  userAgent?: string
  pathname?: string
}

/**
 * Detect user's preferred language based on multiple signals
 * Priority order:
 * 1. URL path (explicit language selection)
 * 2. Cookie preference (user previously selected)
 * 3. Accept-Language header (browser preference)
 * 4. Default fallback (Vietnamese)
 */
export function detectUserLanguage(options: LanguageDetectionOptions = {}): Language {
  const { request, cookieValue, acceptLanguageHeader, pathname } = options

  // 1. Check URL path for explicit language
  if (pathname || request?.nextUrl.pathname) {
    const path = pathname || request!.nextUrl.pathname
    const langFromPath = extractLanguageFromPath(path)
    if (langFromPath) {
      return langFromPath
    }
  }

  // 2. Check cookie preference
  const cookieLang = cookieValue || request?.cookies.get('preferred-language')?.value
  if (cookieLang && SUPPORTED_LANGUAGES.includes(cookieLang as Language)) {
    return cookieLang as Language
  }

  // 3. Check Accept-Language header
  const acceptLang = acceptLanguageHeader || request?.headers.get('accept-language')
  if (acceptLang) {
    const detectedLang = parseAcceptLanguage(acceptLang)
    if (detectedLang) {
      return detectedLang
    }
  }

  // 4. Default fallback
  return DEFAULT_LANGUAGE
}

/**
 * Extract language from URL path
 * Supports both formats: /auth/vn/... and /vn/...
 * Also supports numeric codes: /auth/1/... = vn, /auth/2/... = jp, /auth/3/... = en
 */
function extractLanguageFromPath(pathname: string): Language | null {
  // Remove leading slash and split path
  const segments = pathname.replace(/^\/+/, '').split('/')
  
  // Check different patterns
  for (const segment of segments) {
    // Direct language codes
    if (SUPPORTED_LANGUAGES.includes(segment as Language)) {
      return segment as Language
    }
    
    // Numeric codes (backward compatibility)
    switch (segment) {
      case '1':
        return 'vn'
      case '2':
        return 'jp'
      case '3':
        return 'en'
    }
  }
  
  return null
}

/**
 * Parse Accept-Language header to detect preferred language
 */
function parseAcceptLanguage(acceptLanguage: string): Language | null {
  try {
    // Parse Accept-Language header (format: "en-US,en;q=0.9,vi;q=0.8")
    const languages = acceptLanguage
      .split(',')
      .map(lang => {
        const [code, qValue] = lang.trim().split(';q=')
        return {
          code: code.toLowerCase(),
          quality: qValue ? parseFloat(qValue) : 1.0
        }
      })
      .sort((a, b) => b.quality - a.quality)

    // Check each language in order of preference
    for (const { code } of languages) {
      // Direct matches
      if (code === 'vi' || code === 'vi-vn') return 'vn'
      if (code === 'ja' || code === 'ja-jp') return 'jp'
      if (code === 'en' || code.startsWith('en-')) return 'en'
      
      // Partial matches
      if (code.startsWith('vi')) return 'vn'
      if (code.startsWith('ja')) return 'jp'
      if (code.startsWith('en')) return 'en'
    }
  } catch (error) {
    console.warn('Failed to parse Accept-Language header:', error)
  }
  
  return null
}

/**
 * Client-side language detection (for React components)
 * Uses browser APIs when available
 */
export function detectClientLanguage(): Language {
  if (typeof window === 'undefined') {
    return DEFAULT_LANGUAGE
  }

  try {
    // Check localStorage preference
    const storedLang = localStorage.getItem('preferred-language')
    if (storedLang && SUPPORTED_LANGUAGES.includes(storedLang as Language)) {
      return storedLang as Language
    }

    // Check document cookie
    const cookieMatch = document.cookie.match(/preferred-language=([^;]+)/)
    if (cookieMatch && SUPPORTED_LANGUAGES.includes(cookieMatch[1] as Language)) {
      return cookieMatch[1] as Language
    }

    // Check browser language
    const browserLang = navigator.language.toLowerCase()
    if (browserLang.startsWith('vi')) return 'vn'
    if (browserLang.startsWith('ja')) return 'jp'
    if (browserLang.startsWith('en')) return 'en'

    // Check browser languages array
    for (const lang of navigator.languages) {
      const lowerLang = lang.toLowerCase()
      if (lowerLang.startsWith('vi')) return 'vn'
      if (lowerLang.startsWith('ja')) return 'jp'
      if (lowerLang.startsWith('en')) return 'en'
    }
  } catch (error) {
    console.warn('Failed to detect client language:', error)
  }

  return DEFAULT_LANGUAGE
}

/**
 * Generate redirect URL with detected language
 */
export function generateLanguageRedirectUrl(
  basePath: string,
  detectedLanguage: Language,
  preserveQuery?: string
): string {
  const cleanPath = basePath.startsWith('/') ? basePath.slice(1) : basePath

  // Auth routes should use /auth/[lang]/[path] format
  const authRoutes = ['login', 'register', 'forgot-password']
  const isAuthRoute = authRoutes.includes(cleanPath)

  let redirectUrl: string
  if (isAuthRoute) {
    redirectUrl = `/auth/${detectedLanguage}/${cleanPath}`
  } else {
    // Non-auth routes use /[lang]/[path] format
    redirectUrl = `/${detectedLanguage}/${cleanPath}`
  }

  if (preserveQuery) {
    redirectUrl += `?${preserveQuery}`
  }

  return redirectUrl
}

/**
 * Set language preference in cookie and localStorage
 */
export function setLanguagePreference(language: Language): void {
  if (typeof window !== 'undefined') {
    // Set cookie (for server-side detection)
    document.cookie = `preferred-language=${language}; path=/; max-age=${30 * 24 * 60 * 60}` // 30 days
    
    // Set localStorage (for client-side detection)
    try {
      localStorage.setItem('preferred-language', language)
    } catch (error) {
      console.warn('Failed to save language preference to localStorage:', error)
    }
  }
}

/**
 * Validate if a language code is supported
 */
export function isValidLanguage(code: string): code is Language {
  return SUPPORTED_LANGUAGES.includes(code as Language)
}
