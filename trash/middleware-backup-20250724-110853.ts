/**
 * Enhanced Middleware for Dual-Mode Language Routing
 * Handles language detection, redirects, and regional targeting
 * Supports clean URLs for authenticated users and language-prefixed URLs for public access
 *
 * BACKUP CREATED: 2025-01-24 - Original middleware backed up before refactoring
 */

import { NextRequest, NextResponse } from 'next/server'

// Supported languages and their regions
const LANGUAGE_CONFIG = {
  vn: {
    code: 'vn' as const,
    locale: 'vi-VN' as const,
    regions: ['VN'] as readonly string[], // Vietnam
    currency: 'VND' as const
  },
  jp: {
    code: 'jp' as const,
    locale: 'ja-JP' as const,
    regions: ['JP'] as readonly string[], // Japan
    currency: 'JPY' as const
  },
  en: {
    code: 'en' as const,
    locale: 'en-US' as const,
    regions: ['US', 'GB', 'AU', 'CA', 'NZ', 'SG'] as readonly string[], // English-speaking countries
    currency: 'USD' as const
  }
}

// Route path constants
const ROUTE_PATHS = {
  AUTH_PATHS: ['/login', '/register', '/forgot-password', '/landing'] as string[],
  FEATURE_PATHS: ['/jlpt', '/challenge', '/driving'] as string[],
  HOME_PATHS: ['/home'] as string[],
  SKIP_PATHS: ['/_next/', '/api/', '/static/', '/favicon'] as string[],
  FILE_EXTENSIONS: ['.ico', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.css', '.js', '.json'] as string[]
}

// Language detection patterns
const LANGUAGE_PATTERNS = {
  LANGUAGE_PREFIX: /^\/(vn|jp|en|1|2|3)\//,
  LANGUAGE_AUTH_PATTERN: /^\/(vn|jp|en|1|2|3)\/(landing|login|register|forgot-password)$/,
  LANGUAGE_HOME_PATTERN: /^\/(vn|jp|en|1|2|3)\/home$/,
  EXTRACT_LANGUAGE: /^\/(vn|jp|en|1|2|3)\/(.*)$/
} as const

// Cookie configuration
const COOKIE_CONFIG = {
  LANGUAGE_COOKIE: {
    name: 'preferred-language',
    maxAge: 60 * 60 * 24 * 365, // 1 year
    httpOnly: false,
    sameSite: 'lax' as const
  },
  AUTH_COOKIE: {
    name: 'jlpt4you_auth_token'
  }
} as const

// Security headers
const SECURITY_HEADERS = {
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'X-Robots-Tag': 'index, follow'
} as const

// Cache headers
const CACHE_HEADERS = {
  AUTH_PAGES: 'public, max-age=3600, stale-while-revalidate=86400'
} as const

// Language mapping
const LANGUAGE_CODE_MAP = {
  '1': 'vn',
  '2': 'jp',
  '3': 'en',
  'vn': 'vn',
  'jp': 'jp',
  'en': 'en'
} as const

type Language = keyof typeof LANGUAGE_CONFIG

// Detect user's preferred language based on various signals
function detectPreferredLanguage(request: NextRequest): Language {
  // 1. Check URL path for explicit language
  const pathname = request.nextUrl.pathname
  if (pathname.startsWith('/auth/vn') || pathname.startsWith('/vn')) return 'vn'
  if (pathname.startsWith('/auth/jp') || pathname.startsWith('/jp')) return 'jp'
  if (pathname.startsWith('/auth/en') || pathname.startsWith('/en')) return 'en'

  // 2. Check cookie preference
  const cookieLang = request.cookies.get(COOKIE_CONFIG.LANGUAGE_COOKIE.name)?.value as Language
  if (cookieLang && LANGUAGE_CONFIG[cookieLang]) {
    return cookieLang
  }

  // 3. Check Accept-Language header
  const acceptLanguage = request.headers.get('accept-language')
  if (acceptLanguage) {
    // Parse Accept-Language header
    const languages = acceptLanguage
      .split(',')
      .map(lang => lang.split(';')[0].trim().toLowerCase())

    // Check for exact matches first
    if (languages.includes('vi') || languages.includes('vi-vn')) return 'vn'
    if (languages.includes('ja') || languages.includes('ja-jp')) return 'jp'
    if (languages.includes('en') || languages.some(l => l.startsWith('en-'))) return 'en'
  }

  // 4. Check geolocation (Cloudflare CF-IPCountry header)
  const country = request.headers.get('cf-ipcountry') ||
                  request.headers.get('x-vercel-ip-country')

  if (country) {
    // Find language by country
    for (const [lang, config] of Object.entries(LANGUAGE_CONFIG)) {
      if (config.regions.includes(country as string)) {
        return lang as Language
      }
    }
  }

  // 5. Default to Vietnamese (primary market)
  return 'vn'
}

// Check if path needs language redirect
function needsLanguageRedirect(pathname: string, isAuthenticated: boolean): boolean {
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
    if (authPaths.includes(pathname) || pathname === '/') {
      return true
    }
    return false
  }

  // For non-authenticated users, redirect as before
  // Check exact matches
  if (authPaths.includes(pathname) || homePaths.includes(pathname) || featurePaths.includes(pathname) || pathname === '/') {
    return true
  }

  // Check if path starts with feature paths (for nested routes)
  const isFeaturePath = featurePaths.some(feature => pathname.startsWith(feature + '/'))

  return isFeaturePath
}

// Generate redirect URL with proper language
function generateRedirectUrl(pathname: string, language: Language, request: NextRequest): string {
  const baseUrl = request.nextUrl.origin
  const searchParams = request.nextUrl.searchParams.toString()
  const queryString = searchParams ? `?${searchParams}` : ''

  // Handle root path
  if (pathname === '/') {
    return `${baseUrl}/auth/${language}/landing${queryString}`
  }

  // Handle auth paths
  if (ROUTE_PATHS.AUTH_PATHS.includes(pathname)) {
    const authPath = pathname.slice(1) // Remove leading slash
    return `${baseUrl}/auth/${language}/${authPath}${queryString}`
  }

  // Handle home path
  if (pathname === '/home') {
    return `${baseUrl}/${language}/home${queryString}`
  }

  // Handle feature paths (both exact and nested)
  // Check for exact match
  if (ROUTE_PATHS.FEATURE_PATHS.includes(pathname)) {
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

// Check if route requires authentication
function isProtectedRoute(pathname: string): boolean {
  // Auth pages that don't require authentication
  const publicRoutes = ['/auth', ...ROUTE_PATHS.AUTH_PATHS]

  // Check if pathname starts with any auth route pattern
  const isAuthRoute = publicRoutes.some(route =>
    pathname === route ||
    pathname.startsWith(`/auth/`) ||
    pathname.startsWith(`${route}/`)
  )

  // If it's an auth route, it's not protected
  if (isAuthRoute) return false

  // Check if it's a language-specific auth route (e.g., /vn/landing, /jp/login)
  const isLanguageAuthRoute = LANGUAGE_PATTERNS.LANGUAGE_AUTH_PATTERN.test(pathname)
  if (isLanguageAuthRoute) return false

  // Check if it's a language-specific home route (e.g., /vn/home, /jp/home)
  const isLanguageHomeRoute = LANGUAGE_PATTERNS.LANGUAGE_HOME_PATTERN.test(pathname)
  if (isLanguageHomeRoute) return true // Home routes ARE protected (need auth)

  // All other routes are protected
  return true
}

// Check if user is authenticated based on cookies
function isAuthenticated(request: NextRequest): boolean {
  // Check for auth token in cookies
  const authToken = request.cookies.get(COOKIE_CONFIG.AUTH_COOKIE.name)?.value
  return !!authToken
}

// Check if URL has language prefix
function hasLanguagePrefix(pathname: string): boolean {
  return LANGUAGE_PATTERNS.LANGUAGE_PREFIX.test(pathname)
}

// Extract language from URL path
function extractLanguageFromPath(pathname: string): Language | null {
  const match = pathname.match(LANGUAGE_PATTERNS.LANGUAGE_PREFIX)
  if (!match) return null

  const langCode = match[1] as keyof typeof LANGUAGE_CODE_MAP
  return LANGUAGE_CODE_MAP[langCode] || null
}

// Convert language-prefixed URL to clean URL
function getCleanUrl(pathname: string): string {
  const match = pathname.match(LANGUAGE_PATTERNS.EXTRACT_LANGUAGE)
  if (!match) return pathname
  return '/' + match[2]
}

// Check if authenticated user is accessing language-prefixed URL that should be clean
function shouldRedirectToCleanUrl(pathname: string, isAuthenticated: boolean): boolean {
  if (!isAuthenticated) return false
  if (!hasLanguagePrefix(pathname)) return false
  
  // Don't redirect auth routes - they need language prefixes for SEO
  if (LANGUAGE_PATTERNS.LANGUAGE_AUTH_PATTERN.test(pathname)) {
    return false
  }
  
  // Redirect all other language-prefixed routes for authenticated users
  return true
}

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // Skip middleware for static files and API routes
  if (
    ROUTE_PATHS.SKIP_PATHS.some(path => pathname.startsWith(path)) ||
    pathname.includes('.') ||
    ROUTE_PATHS.FILE_EXTENSIONS.some(ext => pathname.endsWith(ext))
  ) {
    return NextResponse.next()
  }

  // Detect preferred language
  const preferredLanguage = detectPreferredLanguage(request)

  // Check authentication for protected routes
  const needsAuth = isProtectedRoute(pathname)
  const userAuthenticated = isAuthenticated(request)

  // DUAL-MODE ROUTING: Handle clean URLs for authenticated users
  if (shouldRedirectToCleanUrl(pathname, userAuthenticated)) {
    const cleanUrl = getCleanUrl(pathname)
    const searchParams = request.nextUrl.searchParams.toString()
    const queryString = searchParams ? `?${searchParams}` : ''
    const redirectUrl = `${request.nextUrl.origin}${cleanUrl}${queryString}`
    
    // Extract language from the original URL and store it
    const extractedLanguage = extractLanguageFromPath(pathname)
    const response = NextResponse.redirect(redirectUrl, 302)
    
    // Store the language preference for the authenticated user
    if (extractedLanguage) {
      response.cookies.set(COOKIE_CONFIG.LANGUAGE_COOKIE.name, extractedLanguage, {
        maxAge: COOKIE_CONFIG.LANGUAGE_COOKIE.maxAge,
        httpOnly: COOKIE_CONFIG.LANGUAGE_COOKIE.httpOnly,
        secure: process.env.NODE_ENV === 'production',
        sameSite: COOKIE_CONFIG.LANGUAGE_COOKIE.sameSite
      })
    }
    
    return response
  }

  // TEMPORARY: Skip auth for testing exam pages
  const isTestingExamPage = pathname.includes('/test') || pathname.includes('/jlpt') || pathname.includes('/challenge')

  if (needsAuth && !userAuthenticated && !isTestingExamPage) {
    // User is trying to access protected route without authentication
    // Redirect to login page with appropriate language
    const loginUrl = `${request.nextUrl.origin}/auth/${preferredLanguage}/login`
    const response = NextResponse.redirect(loginUrl, 302)

    // Set language preference cookie
    response.cookies.set(COOKIE_CONFIG.LANGUAGE_COOKIE.name, preferredLanguage, {
      maxAge: COOKIE_CONFIG.LANGUAGE_COOKIE.maxAge,
      httpOnly: COOKIE_CONFIG.LANGUAGE_COOKIE.httpOnly,
      secure: process.env.NODE_ENV === 'production',
      sameSite: COOKIE_CONFIG.LANGUAGE_COOKIE.sameSite
    })

    return response
  }

  // Check if we need to redirect to language-specific version
  if (needsLanguageRedirect(pathname, userAuthenticated)) {
    const redirectUrl = generateRedirectUrl(pathname, preferredLanguage, request)
    const response = NextResponse.redirect(redirectUrl, 302)

    // Set language preference cookie
    response.cookies.set(COOKIE_CONFIG.LANGUAGE_COOKIE.name, preferredLanguage, {
      maxAge: COOKIE_CONFIG.LANGUAGE_COOKIE.maxAge,
      httpOnly: COOKIE_CONFIG.LANGUAGE_COOKIE.httpOnly,
      secure: process.env.NODE_ENV === 'production',
      sameSite: COOKIE_CONFIG.LANGUAGE_COOKIE.sameSite
    })

    return response
  }

  // Add security and SEO headers
  const response = NextResponse.next()
  
  // Security and SEO headers
  Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
    response.headers.set(key, value)
  })
  
  // Language-specific headers - handle both prefixed and clean URLs
  let currentLang: Language
  if (pathname.includes('/auth/vn')) {
    currentLang = 'vn'
  } else if (pathname.includes('/auth/jp')) {
    currentLang = 'jp'
  } else if (pathname.includes('/auth/en')) {
    currentLang = 'en'
  } else if (hasLanguagePrefix(pathname)) {
    currentLang = extractLanguageFromPath(pathname) || preferredLanguage
  } else {
    // For clean URLs (authenticated users), use stored preference
    currentLang = userAuthenticated ?
      (request.cookies.get(COOKIE_CONFIG.LANGUAGE_COOKIE.name)?.value as Language || preferredLanguage) :
      preferredLanguage
  }
  
  const langConfig = LANGUAGE_CONFIG[currentLang]
  response.headers.set('Content-Language', langConfig.locale)
  
  // Cache headers for better performance
  if (pathname.startsWith('/auth/')) {
    response.headers.set('Cache-Control', CACHE_HEADERS.AUTH_PAGES)
  }
  
  return response
}

// Configure which paths the middleware should run on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - robots.txt (robots file)
     * - sitemap.xml (sitemap file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)',
  ],
}
