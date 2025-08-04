/**
 * 🔒 ADMIN AUTHENTICATION UTILITIES
 * Centralized admin authentication and authorization logic
 * Version: 1.0
 */

import { NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@supabase/supabase-js'
import { supabaseAdmin } from '@/lib/supabase'

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
 */
export async function requireAdminAuth(request: NextRequest): Promise<AdminAuthResult> {
  try {
    const cookieStore = await cookies()
    const authToken = cookieStore.get('jlpt4you_auth_token')?.value

    if (!authToken) {
      logSecurityEvent({
        event: 'admin_access_denied_no_token',
        ip: request.ip || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
        timestamp: new Date().toISOString()
      })
      return { error: 'Authentication required', status: 401 }
    }

    // Create Supabase client with auth token
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        },
      }
    )

    // Verify user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      logSecurityEvent({
        event: 'admin_access_denied_invalid_token',
        ip: request.ip || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
        timestamp: new Date().toISOString(),
        details: { authError: authError?.message }
      })
      return { error: 'Invalid authentication', status: 401 }
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
      logSecurityEvent({
        event: 'admin_access_denied_user_not_found',
        userId: user.id,
        userEmail: user.email || 'unknown',
        ip: request.ip || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
        timestamp: new Date().toISOString(),
        details: { roleError: roleError?.message }
      })
      return { error: 'User not found in database', status: 404 }
    }

    if (userData.role !== 'Admin') {
      logSecurityEvent({
        event: 'admin_access_denied_insufficient_role',
        userId: user.id,
        userEmail: userData.email,
        ip: request.ip || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
        timestamp: new Date().toISOString(),
        details: { userRole: userData.role }
      })
      return { 
        error: 'Forbidden: Admin access required', 
        status: 403
      }
    }

    // Log successful admin access
    logSecurityEvent({
      event: 'admin_access_granted',
      userId: user.id,
      userEmail: userData.email,
      ip: request.ip || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
      timestamp: new Date().toISOString()
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
    logSecurityEvent({
      event: 'admin_auth_error',
      ip: request.ip || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
      timestamp: new Date().toISOString(),
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

/**
 * 📊 LOG SECURITY EVENT
 * Logs security-related events for monitoring and audit
 */
export function logSecurityEvent(event: SecurityEvent): void {
  // Log to console (in production, send to monitoring service)
  const logLevel = event.event.includes('denied') || event.event.includes('error') ? 'warn' : 'info'
  
  if (logLevel === 'warn') {
    console.warn(`🚨 SECURITY EVENT: ${event.event}`, {
      userId: event.userId,
      userEmail: event.userEmail,
      ip: event.ip,
      userAgent: event.userAgent,
      timestamp: event.timestamp,
      details: event.details
    })
  } else {
    console.log(`🔒 SECURITY EVENT: ${event.event}`, {
      userId: event.userId,
      userEmail: event.userEmail,
      ip: event.ip,
      timestamp: event.timestamp
    })
  }

  // TODO: In production, send to monitoring service
  // Example: sendToMonitoringService(event)
}

/**
 * 🛡️ ADMIN ACTION LOGGER
 * Logs admin actions for audit trail
 */
export function logAdminAction(action: {
  adminId: string
  adminEmail: string
  action: string
  targetUserId?: string
  targetUserEmail?: string
  details?: any
  ip?: string
  userAgent?: string
}): void {
  console.log(`🔒 ADMIN ACTION: ${action.action}`, {
    adminId: action.adminId,
    adminEmail: action.adminEmail,
    targetUserId: action.targetUserId,
    targetUserEmail: action.targetUserEmail,
    ip: action.ip,
    userAgent: action.userAgent,
    timestamp: new Date().toISOString(),
    details: action.details
  })

  // TODO: In production, send to audit logging service
  // Example: sendToAuditService(action)
}

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
