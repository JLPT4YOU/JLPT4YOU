/**
 * PDF Security Utilities
 * Provides security functions for PDF proxy protection
 */

import { NextRequest } from 'next/server'

// Rate limiting removed - not needed for this use case

/**
 * Get client identifier for rate limiting
 */
export function getClientIdentifier(request: NextRequest, userId?: string): string {
  // If we have a user ID, use it for more accurate rate limiting
  if (userId) {
    return `user:${userId}`
  }

  // Fallback to IP-based identification
  const forwarded = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')
  const ip = forwarded?.split(',')[0] || realIp || 'unknown'

  // Include user agent for additional uniqueness
  const userAgent = request.headers.get('user-agent') || 'unknown'

  return `ip:${ip}:${userAgent.slice(0, 50)}`
}

/**
 * Validate referrer to prevent hotlinking
 */
export function validateReferrer(request: NextRequest): boolean {
  const referer = request.headers.get('referer')
  
  // Allow empty referer (direct access)
  if (!referer) {
    return true
  }
  
  // Get allowed domains
  const allowedDomains = [
    process.env.NEXT_PUBLIC_SITE_URL,
    'jlpt-4-you.vercel.app', // ✅ FIXED: Add production domain
    'jlpt4you.com', // ✅ FIXED: Add custom domain if exists
    'localhost',
    '127.0.0.1'
  ].filter(Boolean)
  
  // Check if referer matches allowed domains
  try {
    const refererUrl = new URL(referer)
    return allowedDomains.some(domain => 
      refererUrl.hostname.includes(domain!) || 
      refererUrl.hostname === domain
    )
  } catch {
    return false
  }
}

/**
 * Check if request is from a bot/crawler
 */
export function isBotRequest(request: NextRequest): boolean {
  const userAgent = request.headers.get('user-agent')?.toLowerCase() || ''
  
  const botPatterns = [
    'bot', 'crawler', 'spider', 'scraper',
    'wget', 'curl', 'python', 'java',
    'googlebot', 'bingbot', 'slurp',
    'facebookexternalhit', 'twitterbot'
  ]
  
  return botPatterns.some(pattern => userAgent.includes(pattern))
}

/**
 * Generate security headers for PDF response
 */
export function getSecurityHeaders(fileName?: string) {
  return {
    'Content-Type': 'application/pdf',
    'Content-Disposition': `inline; filename="${fileName || 'document.pdf'}"`,
    // Security headers
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'SAMEORIGIN',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    // Cache control - prevent caching
    'Cache-Control': 'private, no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
    // Prevent download
    'X-Download-Options': 'noopen',
    'X-Permitted-Cross-Domain-Policies': 'none',
    // Content Security Policy
    'Content-Security-Policy': "default-src 'none'; object-src 'none'; frame-ancestors 'self';"
  }
}

/**
 * Validate file path to prevent directory traversal
 */
export function validateFilePath(filePath: string): boolean {
  // Check for directory traversal patterns
  const dangerousPatterns = [
    '../', '..\\', './', '.\\',
    '%2e%2e', '%2f', '%5c',
    'null', 'con', 'prn', 'aux'
  ]
  
  const normalizedPath = filePath.toLowerCase()
  return !dangerousPatterns.some(pattern => 
    normalizedPath.includes(pattern)
  )
}

/**
 * Log security events
 */
export function logSecurityEvent(
  event: string, 
  details: Record<string, any>, 
  severity: 'low' | 'medium' | 'high' = 'medium'
) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    event,
    severity,
    details
  }
  
  // In production, send to logging service
  console.warn('[PDF Security]', logEntry)
}

/**
 * Comprehensive security check for PDF requests
 */
export function performSecurityCheck(request: NextRequest, bookId: string, userId?: string) {
  const clientId = getClientIdentifier(request, userId)
  const results = {
    allowed: true,
    reasons: [] as string[],
    rateLimitInfo: null as any
  }

  // Only allow authenticated users - no anonymous access
  if (!userId) {
    results.allowed = false
    results.reasons.push('Authentication required')
    logSecurityEvent('unauthenticated_access', { clientId, bookId }, 'high')
    return results
  }

  // Rate limiting disabled - removed for better user experience
  results.rateLimitInfo = { allowed: true, remaining: 999, resetTime: Date.now() + 60000 }

  // Bot detection
  if (isBotRequest(request)) {
    results.allowed = false
    results.reasons.push('Bot request detected')
    logSecurityEvent('bot_request', { clientId, bookId, userId, userAgent: request.headers.get('user-agent') }, 'low')
  }

  // Referrer validation (only in production)
  if (process.env.NODE_ENV === 'production' && !validateReferrer(request)) {
    results.allowed = false
    results.reasons.push('Invalid referrer')
    logSecurityEvent('invalid_referrer', {
      clientId,
      bookId,
      userId,
      referer: request.headers.get('referer')
    }, 'high')
  }

  return results
}

// Rate limiting cleanup removed
