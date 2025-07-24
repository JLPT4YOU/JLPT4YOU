/**
 * Supabase Authentication Middleware
 * Handles authentication and route protection with Supabase
 */

import { NextRequest, NextResponse } from 'next/server'

// Protected routes that require authentication
const PROTECTED_ROUTES = [
  '/home',
  '/profile',
  '/jlpt',
  '/challenge',
  '/driving',
  '/settings'
]

// Public routes that don't require authentication
const PUBLIC_ROUTES = [
  '/',
  '/auth',
  '/test-auth'
]

// Admin routes that require admin role
const ADMIN_ROUTES = [
  '/admin'
]

type Language = 'vn' | 'jp' | 'en'

/**
 * Check if a route is protected
 */
function isProtectedRoute(pathname: string): boolean {
  return PROTECTED_ROUTES.some(route => pathname.startsWith(route))
}

/**
 * Check if a route is admin-only
 */
function isAdminRoute(pathname: string): boolean {
  return ADMIN_ROUTES.some(route => pathname.startsWith(route))
}

/**
 * Check if a route is public
 */
function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some(route => pathname === route || pathname.startsWith(route))
}

/**
 * Detect preferred language from request
 */
function detectPreferredLanguage(request: NextRequest): Language {
  // Check cookie first
  const cookieLanguage = request.cookies.get('preferred-language')?.value
  if (cookieLanguage && ['vn', 'jp', 'en'].includes(cookieLanguage)) {
    return cookieLanguage as Language
  }

  // Check URL path for explicit language
  const pathname = request.nextUrl.pathname
  if (pathname.startsWith('/auth/vn') || pathname.startsWith('/vn')) return 'vn'
  if (pathname.startsWith('/auth/jp') || pathname.startsWith('/jp')) return 'jp'
  if (pathname.startsWith('/auth/en') || pathname.startsWith('/en')) return 'en'

  // Check Accept-Language header
  const acceptLanguage = request.headers.get('accept-language')
  if (acceptLanguage) {
    if (acceptLanguage.includes('ja')) return 'jp'
    if (acceptLanguage.includes('en')) return 'en'
  }

  // Default to Vietnamese
  return 'vn'
}

/**
 * Check if user is authenticated by checking cookies
 */
function isAuthenticated(request: NextRequest): boolean {
  // Check for Supabase session cookie (pattern may vary)
  const cookies = request.cookies.getAll()
  const hasAuthCookie = cookies.some(cookie =>
    cookie.name.includes('supabase') ||
    cookie.name.includes('auth-token') ||
    cookie.name.includes('sb-')
  )
  return hasAuthCookie
}
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
  const authPaths = ['/login', '/register', '/forgot-password', '/landing']
  const homePaths = ['/home']
  const featurePaths = ['/jlpt', '/challenge', '/driving']

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
  const authPaths = ['/login', '/register', '/forgot-password', '/landing']
  if (authPaths.includes(pathname)) {
    const authPath = pathname.slice(1) // Remove leading slash
    return `${baseUrl}/auth/${language}/${authPath}${queryString}`
  }

  // Handle home path
  if (pathname === '/home') {
    return `${baseUrl}/${language}/home${queryString}`
  }

  // Handle feature paths (both exact and nested)
  const featurePaths = ['/jlpt', '/challenge', '/driving']

  // Check for exact match
  if (featurePaths.includes(pathname)) {
    const featurePath = pathname.slice(1) // Remove leading slash
    return `${baseUrl}/${language}/${featurePath}${queryString}`
  }

  // Check for nested paths (e.g., /jlpt/custom/n3/test)
  for (const feature of featurePaths) {
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

  // Check if it's a language-specific auth route (e.g., /vn/landing, /jp/login)
  const languageAuthPattern = /^\/(vn|jp|en|1|2|3)\/(landing|login|register|forgot-password)$/
  const isLanguageAuthRoute = languageAuthPattern.test(pathname)
  if (isLanguageAuthRoute) return false

  // Check if it's a language-specific home route (e.g., /vn/home, /jp/home)
  const languageHomePattern = /^\/(vn|jp|en|1|2|3)\/home$/
  const isLanguageHomeRoute = languageHomePattern.test(pathname)
  if (isLanguageHomeRoute) return true // Home routes ARE protected (need auth)

  // All other routes are protected
  return true
}

// Check if user is authenticated based on cookies
function isAuthenticated(request: NextRequest): boolean {
  // Check for auth token in cookies
  const authToken = request.cookies.get('jlpt4you_auth_token')?.value
  return !!authToken
}

// Check if URL has language prefix
function hasLanguagePrefix(pathname: string): boolean {
  return pathname.match(/^\/(vn|jp|en|1|2|3)\//) !== null
}

// Extract language from URL path
function extractLanguageFromPath(pathname: string): Language | null {
  const match = pathname.match(/^\/(vn|jp|en|1|2|3)\//)
  if (!match) return null
  
  const langCode = match[1]
  switch (langCode) {
    case 'vn':
    case '1':
      return 'vn'
    case 'jp':
    case '2':
      return 'jp'
    case 'en':
    case '3':
      return 'en'
    default:
      return null
  }
}

// Convert language-prefixed URL to clean URL
function getCleanUrl(pathname: string): string {
  const match = pathname.match(/^\/(vn|jp|en|1|2|3)\/(.*)$/)
  if (!match) return pathname
  return '/' + match[2]
}

// Check if authenticated user is accessing language-prefixed URL that should be clean
function shouldRedirectToCleanUrl(pathname: string, isAuthenticated: boolean): boolean {
  if (!isAuthenticated) return false
  if (!hasLanguagePrefix(pathname)) return false
  
  // Don't redirect auth routes - they need language prefixes for SEO
  if (pathname.match(/^\/(vn|jp|en|1|2|3)\/(landing|login|register|forgot-password)/)) {
    return false
  }
  
  // Redirect all other language-prefixed routes for authenticated users
  return true
}

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // Skip middleware for static files and API routes
  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/api/') ||
    pathname.startsWith('/static/') ||
    pathname.includes('.') ||
    pathname.startsWith('/favicon')
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
      response.cookies.set('preferred-language', extractedLanguage, {
        maxAge: 60 * 60 * 24 * 365, // 1 year
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax'
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
    response.cookies.set('preferred-language', preferredLanguage, {
      maxAge: 60 * 60 * 24 * 365, // 1 year
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax'
    })

    return response
  }

  // Check if we need to redirect to language-specific version
  if (needsLanguageRedirect(pathname, userAuthenticated)) {
    const redirectUrl = generateRedirectUrl(pathname, preferredLanguage, request)
    const response = NextResponse.redirect(redirectUrl, 302)

    // Set language preference cookie
    response.cookies.set('preferred-language', preferredLanguage, {
      maxAge: 60 * 60 * 24 * 365, // 1 year
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax'
    })

    return response
  }

  // Add security and SEO headers
  const response = NextResponse.next()
  
  // Security headers
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
  
  // SEO headers
  response.headers.set('X-Robots-Tag', 'index, follow')
  
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
      (request.cookies.get('preferred-language')?.value as Language || preferredLanguage) : 
      preferredLanguage
  }
  
  const langConfig = LANGUAGE_CONFIG[currentLang]
  response.headers.set('Content-Language', langConfig.locale)
  
  // Cache headers for better performance
  if (pathname.startsWith('/auth/')) {
    response.headers.set('Cache-Control', 'public, max-age=3600, stale-while-revalidate=86400')
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
