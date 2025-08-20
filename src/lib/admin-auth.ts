/**
 * 🔒 ADMIN AUTHENTICATION UTILITIES
 * Centralized admin authentication and authorization logic
 * Version: 1.0
 */

import { NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { supabaseAdmin } from '@/utils/supabase/admin'
import { logAuthEvent, logSecurityEvent as logSecurityEventMonitoring } from '@/lib/monitoring'

export interface AdminAuthResult {
  user?: {
    id: string
    email: string
    role: string
  }
  error?: string
  status?: number
}

export interface SecurityEvent {
  event: string
  userId?: string
  userEmail?: string
  ip?: string
  userAgent?: string
  timestamp: string
  details?: any
}

/**
 * 🔒 REQUIRE ADMIN AUTHENTICATION
 * Verifies user is authenticated and has admin role
 * Supports both Authorization header and cookies
 */
export async function requireAdminAuth(request: NextRequest): Promise<AdminAuthResult> {
  try {
    let user: any = null
    let authError: any = null

    // Method 1: Try Authorization header first (for API calls)
    const authHeader = request.headers.get('authorization')
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7)

      const supabaseWithToken = createSupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          global: {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        }
      )

      const { data: { user: tokenUser }, error: tokenError } = await supabaseWithToken.auth.getUser()
      if (!tokenError && tokenUser) {
        user = tokenUser
      } else {
        authError = tokenError
      }
    }

    // Method 2: Fallback to cookies if Authorization header failed
    if (!user) {
      const cookieStore = await cookies()

      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            get(name: string) {
              return cookieStore.get(name)?.value
            },
            set() {
              // API routes can't set cookies
            },
            remove() {
              // API routes can't remove cookies
            },
          },
        }
      )

      const { data: { user: cookieUser }, error: cookieError } = await supabase.auth.getUser()
      if (!cookieError && cookieUser) {
        user = cookieUser
      } else {
        authError = cookieError
      }
    }

    // If both methods failed
    if (!user) {
      logSecurityEventMonitoring({
        event: 'admin_access_denied_no_session',
        level: 'warn',
        ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
        details: {
          authError: authError?.message,
          hasAuthHeader: !!authHeader,
          authMethod: authHeader ? 'bearer_token' : 'cookies'
        }
      })
      return { error: 'Authentication required', status: 401 }
    }

    // Verify user has admin role
    if (!supabaseAdmin) {
      return { error: 'Server configuration error', status: 500 }
    }

    const { data: userData, error: roleError } = await supabaseAdmin
      .from('users')
      .select('role, email')
      .eq('id', user.id)
      .single()

    if (roleError || !userData) {
      logSecurityEventMonitoring({
        event: 'admin_access_denied_user_not_found',
        level: 'error',
        userId: user.id,
        userEmail: user.email || 'unknown',
        ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
        details: { roleError: roleError?.message }
      })
      return { error: 'User not found in database', status: 404 }
    }

    if (userData.role !== 'Admin') {
      logSecurityEventMonitoring({
        event: 'admin_access_denied_insufficient_role',
        level: 'error',
        userId: user.id,
        userEmail: userData.email,
        ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
        details: { userRole: userData.role }
      })
      return {
        error: 'Forbidden: Admin access required',
        status: 403
      }
    }

    // Log successful admin access
    logAuthEvent({
      event: 'admin_access_granted',
      level: 'info',
      userId: user.id,
      userEmail: userData.email,
      ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
      details: { role: userData.role }
    })

    return { 
      user: { 
        id: user.id, 
        email: userData.email, 
        role: userData.role 
      }, 
      error: undefined 
    }

  } catch (error) {
    console.error('Admin authentication error:', error)
    logSecurityEventMonitoring({
      event: 'admin_auth_error',
      level: 'error',
      ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
      details: { error: error instanceof Error ? error.message : 'Unknown error' }
    })
    return { error: 'Authentication failed', status: 500 }
  }
}

/**
 * 🔒 CHECK ADMIN ROLE (without full auth)
 * Checks if a user ID has admin role
 */
export async function checkAdminRole(userId: string): Promise<boolean> {
  try {
    if (!supabaseAdmin) {
      return false
    }

    const { data: userData, error } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('id', userId)
      .single()

    return !error && userData?.role === 'Admin'
  } catch (error) {
    console.error('Admin role check error:', error)
    return false
  }
}

// Note: Security logging and admin action auditing are already implemented
// via the monitoring system imported at the top of this file:
// - logSecurityEventMonitoring() for security events
// - logAuthEvent() for authentication events
// These functions are actively used throughout this file for comprehensive audit trails.

/**
 * 🔍 VALIDATE ADMIN REQUEST
 * Validates common admin request patterns
 */
export function validateAdminRequest(data: any): { valid: boolean; error?: string } {
  // Common validation rules for admin requests
  if (!data || typeof data !== 'object') {
    return { valid: false, error: 'Invalid request data' }
  }

  // Add more validation rules as needed
  return { valid: true }
}

/**
 * 🚨 RATE LIMITING FOR ADMIN ACTIONS
 * Simple in-memory rate limiting (in production, use Redis)
 */
const adminActionCounts = new Map<string, { count: number; resetTime: number }>()

export function checkAdminRateLimit(adminId: string, maxActions = 100, windowMs = 60000): boolean {
  const now = Date.now()
  const key = `admin_${adminId}`
  const current = adminActionCounts.get(key)

  if (!current || now > current.resetTime) {
    adminActionCounts.set(key, { count: 1, resetTime: now + windowMs })
    return true
  }

  if (current.count >= maxActions) {
    return false
  }

  current.count++
  return true
}

/**
 * 🔒 ADMIN AUTH MIDDLEWARE HELPER
 * Helper for use in API routes
 */
export async function withAdminAuth<T>(
  request: NextRequest,
  handler: (adminUser: { id: string; email: string; role: string }) => Promise<T>
): Promise<T | Response> {
  const authResult = await requireAdminAuth(request)
  
  if (authResult.error) {
    return new Response(
      JSON.stringify({ error: authResult.error }),
      { 
        status: authResult.status || 500,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }

  return handler(authResult.user!)
}
