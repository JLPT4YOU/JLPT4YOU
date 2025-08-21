import { NextRequest, NextResponse } from 'next/server'
import { detectUserLanguage, generateLanguageRedirectUrl } from '@/lib/language-detection'

/**
 * Handle legacy auth route redirects
 * Consolidates /login, /register, /forgot-password redirects
 */
export function handleAuthRedirects(request: NextRequest): NextResponse | null {
  const { pathname } = request.nextUrl
  
  // Handle legacy auth routes
  if (pathname === '/login' || pathname === '/register' || pathname === '/forgot-password') {
    const acceptLanguage = request.headers.get('accept-language') || ''
    const cookieValue = request.cookies.get('preferred-language')?.value
    
    const detectedLanguage = detectUserLanguage({
      acceptLanguageHeader: acceptLanguage,
      cookieValue,
      pathname,
    })
    
    const routeName = pathname.slice(1) // Remove leading slash
    const target = generateLanguageRedirectUrl(routeName, detectedLanguage)
    
    return NextResponse.redirect(new URL(target, request.url))
  }
  
  return null
}
