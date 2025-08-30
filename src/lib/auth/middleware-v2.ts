/**
 * Authentication Middleware V2 - Mock Implementation for Testing
 * This is a simplified version for testing purposes
 */

import { NextRequest, NextResponse } from 'next/server'

// Rate limiting cache
const rateLimitCache = new Map<string, { count: number; resetTime: number }>()

// Mock middleware function
export async function authMiddleware(request: NextRequest): Promise<NextResponse> {
  const pathname = request.nextUrl.pathname

  // Allow public routes (including root)
  if (pathname === '/' || pathname.startsWith('/api/health') || pathname.startsWith('/auth')) {
    return NextResponse.next()
  }

  // Mock authentication check
  const authToken = request.cookies.get('jlpt4you_auth_token')

  if (!authToken) {
    const loginUrl = new URL('/auth/login', request.nextUrl.origin)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

// Rate limiting functions
export function clearRateLimitCache(): void {
  rateLimitCache.clear()
}

export function getRateLimitStats(): Record<string, unknown> {
  return {
    totalRequests: rateLimitCache.size,
    activeIPs: Array.from(rateLimitCache.keys())
  }
}

// Security headers
export function addSecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline'")

  return response
}
