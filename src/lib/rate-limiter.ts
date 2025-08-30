/**
 * Rate Limiter Service for Landing Chat API
 * Implements in-memory rate limiting with IP-based tracking
 */

interface RateLimitData {
  messageCount: number
  characterCount: number
  firstRequestTime: number
  isBlocked: boolean
  blockUntil?: number
}

interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetTime: number
  isBlocked: boolean
  blockUntil?: number
  reason?: string
}

class RateLimiterService {
  private storage = new Map<string, RateLimitData>()
  private readonly MESSAGE_LIMIT = 5 // messages per minute
  private readonly CHARACTER_LIMIT = 2000 // characters per minute
  private readonly WINDOW_MS = 60 * 1000 // 1 minute
  private readonly BLOCK_DURATION_MS = 30 * 60 * 1000 // 30 minutes
  private readonly CLEANUP_INTERVAL = 5 * 60 * 1000 // 5 minutes

  constructor() {
    // Cleanup expired entries periodically
    setInterval(() => this.cleanup(), this.CLEANUP_INTERVAL)
  }

  /**
   * Check if request is allowed for given IP and message length
   */
  checkLimit(ip: string, messageLength: number): RateLimitResult {
    const now = Date.now()
    const data = this.storage.get(ip) || this.createNewEntry(now)

    // Check if IP is currently blocked
    if (data.isBlocked && data.blockUntil && now < data.blockUntil) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: data.blockUntil,
        isBlocked: true,
        blockUntil: data.blockUntil,
        reason: 'IP_BLOCKED'
      }
    }

    // Reset if window has passed
    if (now - data.firstRequestTime > this.WINDOW_MS) {
      data.messageCount = 0
      data.characterCount = 0
      data.firstRequestTime = now
      data.isBlocked = false
      data.blockUntil = undefined
    }

    // Check message limit
    if (data.messageCount >= this.MESSAGE_LIMIT) {
      this.blockIP(ip, now)
      return {
        allowed: false,
        remaining: 0,
        resetTime: data.firstRequestTime + this.WINDOW_MS,
        isBlocked: true,
        blockUntil: now + this.BLOCK_DURATION_MS,
        reason: 'MESSAGE_LIMIT_EXCEEDED'
      }
    }

    // Check character limit
    if (data.characterCount + messageLength > this.CHARACTER_LIMIT) {
      this.blockIP(ip, now)
      return {
        allowed: false,
        remaining: 0,
        resetTime: data.firstRequestTime + this.WINDOW_MS,
        isBlocked: true,
        blockUntil: now + this.BLOCK_DURATION_MS,
        reason: 'CHARACTER_LIMIT_EXCEEDED'
      }
    }

    // Update counters
    data.messageCount++
    data.characterCount += messageLength
    this.storage.set(ip, data)

    return {
      allowed: true,
      remaining: this.MESSAGE_LIMIT - data.messageCount,
      resetTime: data.firstRequestTime + this.WINDOW_MS,
      isBlocked: false
    }
  }

  /**
   * Get current rate limit status for IP
   */
  getStatus(ip: string): RateLimitResult {
    const now = Date.now()
    const data = this.storage.get(ip)

    if (!data) {
      return {
        allowed: true,
        remaining: this.MESSAGE_LIMIT,
        resetTime: now + this.WINDOW_MS,
        isBlocked: false
      }
    }

    // Check if blocked
    if (data.isBlocked && data.blockUntil && now < data.blockUntil) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: data.blockUntil,
        isBlocked: true,
        blockUntil: data.blockUntil
      }
    }

    // Check if window expired
    if (now - data.firstRequestTime > this.WINDOW_MS) {
      return {
        allowed: true,
        remaining: this.MESSAGE_LIMIT,
        resetTime: now + this.WINDOW_MS,
        isBlocked: false
      }
    }

    return {
      allowed: data.messageCount < this.MESSAGE_LIMIT,
      remaining: Math.max(0, this.MESSAGE_LIMIT - data.messageCount),
      resetTime: data.firstRequestTime + this.WINDOW_MS,
      isBlocked: false
    }
  }

  private createNewEntry(now: number): RateLimitData {
    return {
      messageCount: 0,
      characterCount: 0,
      firstRequestTime: now,
      isBlocked: false
    }
  }

  private blockIP(ip: string, now: number): void {
    const data = this.storage.get(ip) || this.createNewEntry(now)
    data.isBlocked = true
    data.blockUntil = now + this.BLOCK_DURATION_MS
    this.storage.set(ip, data)

    // Log spam attempt
    console.warn(`[Rate Limiter] IP ${ip} blocked for spam. Block until: ${new Date(data.blockUntil).toISOString()}`)
  }

  private cleanup(): void {
    const now = Date.now()
    const expiredKeys: string[] = []

    for (const [ip, data] of this.storage.entries()) {
      // Remove entries that are no longer blocked and outside window
      const windowExpired = now - data.firstRequestTime > this.WINDOW_MS
      const blockExpired = !data.isBlocked || !data.blockUntil || now > data.blockUntil

      if (windowExpired && blockExpired) {
        expiredKeys.push(ip)
      }
    }

    expiredKeys.forEach(key => this.storage.delete(key))
    
    if (expiredKeys.length > 0) {
      console.log(`[Rate Limiter] Cleaned up ${expiredKeys.length} expired entries`)
    }
  }

  /**
   * Get statistics for monitoring
   */
  getStats() {
    const now = Date.now()
    let activeEntries = 0
    let blockedIPs = 0

    for (const [, data] of this.storage.entries()) {
      if (now - data.firstRequestTime <= this.WINDOW_MS) {
        activeEntries++
      }
      if (data.isBlocked && data.blockUntil && now < data.blockUntil) {
        blockedIPs++
      }
    }

    return {
      totalEntries: this.storage.size,
      activeEntries,
      blockedIPs,
      timestamp: now
    }
  }
}

// Singleton instance
export const rateLimiter = new RateLimiterService()

// Helper function to get client IP
export function getClientIP(request: Request): string {
  // Try various headers for IP detection
  const forwarded = request.headers.get('x-forwarded-for')
  const realIP = request.headers.get('x-real-ip')
  const cfConnectingIP = request.headers.get('cf-connecting-ip')
  
  if (forwarded) {
    // x-forwarded-for can contain multiple IPs, take the first one
    return forwarded.split(',')[0].trim()
  }
  
  if (realIP) {
    return realIP
  }
  
  if (cfConnectingIP) {
    return cfConnectingIP
  }
  
  // Fallback - this won't work in production but useful for development
  return 'unknown'
}

// Input sanitization helper
export function sanitizeInput(input: string): string {
  if (typeof input !== 'string') {
    throw new Error('Input must be a string')
  }
  
  // Remove null bytes and control characters except newlines and tabs
  return input.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    .trim()
    .slice(0, 1000) // Hard limit on message length
}
