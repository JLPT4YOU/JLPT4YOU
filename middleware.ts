import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { SessionValidator } from '@/lib/session-validator' // ✅ ADDED: Session validator integration

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // ✅ OPTIMIZATION: Skip middleware for static files and assets
  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/fonts/') ||
    pathname.startsWith('/images/') ||
    pathname.startsWith('/icons/') ||
    pathname.includes('.') && !pathname.includes('/api/') // Skip files with extensions except API routes
  ) {
    console.log(`[Middleware] Skipping static file: ${pathname}`)
    return NextResponse.next()
  }

  // ✅ OPTIMIZATION: Conditional logging based on environment
  const isDev = process.env.NODE_ENV === 'development'
  if (isDev) {
    console.log(`[Middleware] Processing: ${pathname}`)
  }

  // ✅ OPTIMIZATION: Early return for public routes (avoid session checks)
  const publicRoutes = ['/auth', '/', '/debug', '/api/health', '/favicon.ico', '/landing']
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route)) ||
    // Allow language-specific landing pages (e.g., /vn/landing, /jp/landing, /en/landing)
    /^\/[a-z]{2}\/landing/.test(pathname)

  if (isPublicRoute) {
    if (isDev) {
      console.log(`[Middleware] Allowing public route: ${pathname}`)
    }
    return NextResponse.next()
  }

  // Create response first
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // ✅ OPTIMIZATION: Debug cookies only in development
  if (isDev) {
    console.log('[Middleware] Cookies from request:')
    request.cookies.getAll().forEach(cookie => {
      if (cookie.name.includes('sb-') || cookie.name.includes('jlpt4you-auth')) {
        console.log(`  - ${cookie.name}: ${cookie.value.substring(0, 20)}...`)
      }
    })
  }

  // ✅ ENHANCED: Optimized Supabase client with better cookie handling
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          const value = request.cookies.get(name)?.value
          if (isDev && name.includes('jlpt4you-auth')) {
            console.log(`[Middleware] Getting cookie ${name}: ${value ? 'Found' : 'Not found'}`)
          }
          return value
        },
        set(name: string, value: string, options: any) {
          if (isDev) {
            console.log(`[Middleware] Setting cookie ${name}`)
          }
          request.cookies.set({ name, value, ...options })
          response.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: any) {
          if (isDev) {
            console.log(`[Middleware] Removing cookie ${name}`)
          }
          request.cookies.delete(name)
          response.cookies.delete(name)
        },
      },
    }
  )

  // ✅ ENHANCED: Use SessionValidator for comprehensive validation
  try {
    if (isDev) {
      console.log('[Middleware] Validating session with SessionValidator...')
    }

    const validationResult = await SessionValidator.validateSession(request, {
      enableRefresh: true,
      refreshThreshold: 5, // 5 minutes
      enableUserValidation: true,
      logValidation: isDev,
      securityChecks: true
    })

    if (!validationResult.valid) {
      if (isDev) {
        console.log(`[Middleware] Session validation failed: ${validationResult.error}`)
        console.log(`[Middleware] Validation method: ${validationResult.validationMethod}`)
      }

      return redirectToLogin(request, pathname, isDev)
    }

    // ✅ SUCCESS: Session is valid
    if (isDev) {
      console.log(`[Middleware] Session validation successful`)
      console.log(`[Middleware] Method: ${validationResult.validationMethod}`)
      console.log(`[Middleware] User: ${validationResult.user?.email || validationResult.session?.user?.email}`)

      if (validationResult.needsRefresh) {
        console.log(`[Middleware] Session refresh recommended`)
      }

      if (validationResult.expiresAt) {
        const timeRemaining = Math.round((validationResult.timeUntilExpiry || 0) / 1000 / 60)
        console.log(`[Middleware] Session expires in ${timeRemaining} minutes`)
      }
    }

  } catch (error) {
    if (isDev) {
      console.error('[Middleware] Session validation exception:', error)
    }
    return redirectToLogin(request, pathname, isDev)
  }

  if (isDev) {
    console.log(`[Middleware] Allowing authenticated access to: ${pathname}`)
  }
  return response
}

// ✅ HELPER: Centralized redirect logic with language preservation
function redirectToLogin(request: NextRequest, pathname: string, isDev: boolean) {
  if (isDev) {
    console.log(`[Middleware] Redirecting to login from: ${pathname}`)
  }

  // Get language preference from cookie or default to Vietnamese
  const preferredLanguage = request.cookies.get('preferred-language')?.value || 'vn'

  // Redirect to language-specific login page
  const redirectUrl = new URL(`/auth/${preferredLanguage}/login`, request.url)
  redirectUrl.searchParams.set('redirectTo', pathname)
  return NextResponse.redirect(redirectUrl)
}

export const config = {
  matcher: [
    // ✅ OPTIMIZED: More specific matcher to reduce unnecessary middleware calls
    // Exclude: api, _next, favicon.ico, public, auth, landing routes, and static assets
    '/((?!api|_next|favicon.ico|public|auth|.*\/landing|.*\\.).*)',
  ],
}
