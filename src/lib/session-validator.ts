/**
 * ✅ ENHANCED SESSION VALIDATOR
 * Provides comprehensive server-side session validation
 * Features: Multi-method validation, error handling, performance optimization, security checks
 */

import { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { Session, User } from '@supabase/supabase-js'
import { logger } from './logger'

interface ValidationResult {
  valid: boolean
  session?: Session
  user?: User
  error?: string
  needsRefresh?: boolean
  expiresAt?: Date
  timeUntilExpiry?: number
  validationMethod?: 'session' | 'refresh' | 'user'
  securityFlags?: {
    isExpired: boolean
    expiresSoon: boolean
    hasValidUser: boolean
    hasValidToken: boolean
  }
}

interface ValidationOptions {
  enableRefresh?: boolean
  refreshThreshold?: number // minutes before expiry to trigger refresh
  enableUserValidation?: boolean
  logValidation?: boolean
  securityChecks?: boolean
}

export class SessionValidator {
  private static defaultOptions: ValidationOptions = {
    enableRefresh: true,
    refreshThreshold: 5, // 5 minutes
    enableUserValidation: true,
    logValidation: process.env.NODE_ENV === 'development',
    securityChecks: true
  }

  /**
   * ✅ MAIN VALIDATION METHOD: Comprehensive session validation
   */
  static async validateSession(
    request: NextRequest, 
    options: ValidationOptions = {}
  ): Promise<ValidationResult> {
    const opts = { ...this.defaultOptions, ...options }
    
    if (opts.logValidation) {
      logger.session('Starting session validation...')
    }

    try {
      const supabase = this.createSupabaseClient(request)
      
      // Method 1: Try to get existing session
      const sessionResult = await this.validateExistingSession(supabase, opts)
      
      if (sessionResult.valid) {
        return sessionResult
      }

      // Method 2: Try to refresh session if enabled
      if (opts.enableRefresh && sessionResult.needsRefresh) {
        const refreshResult = await this.validateWithRefresh(supabase, opts)
        
        if (refreshResult.valid) {
          return refreshResult
        }
      }

      // Method 3: Try user validation as fallback
      if (opts.enableUserValidation) {
        const userResult = await this.validateWithUser(supabase, opts)
        
        if (userResult.valid) {
          return userResult
        }
      }

      // All validation methods failed
      if (opts.logValidation) {
        logger.session('All validation methods failed')
      }

      return {
        valid: false,
        error: 'Session validation failed',
        validationMethod: 'session'
      }

    } catch (error) {
      if (opts.logValidation) {
        logger.error('Validation exception', error, 'SESSION')
      }

      return {
        valid: false,
        error: error instanceof Error ? error.message : 'Validation error',
        validationMethod: 'session'
      }
    }
  }

  /**
   * ✅ METHOD 1: Validate existing session
   */
  private static async validateExistingSession(
    supabase: any,
    options: ValidationOptions
  ): Promise<ValidationResult> {
    try {
      if (options.logValidation) {
        logger.session('Validating existing session...')
      }

      const { data: { session }, error } = await supabase.auth.getSession()
      
      if (error) {
        if (options.logValidation) {
          logger.session('Session error', { message: error.message })
        }
        return { 
          valid: false, 
          error: error.message, 
          needsRefresh: true,
          validationMethod: 'session'
        }
      }

      if (!session) {
        if (options.logValidation) {
          logger.session('No session found')
        }
        return { 
          valid: false, 
          error: 'No session found',
          validationMethod: 'session'
        }
      }

      // Perform security checks
      const securityResult = this.performSecurityChecks(session, options)
      
      if (!securityResult.valid) {
        return securityResult
      }

      if (options.logValidation) {
        logger.session('Session validation successful')
      }

      return {
        valid: true,
        session,
        user: session.user,
        expiresAt: new Date(session.expires_at! * 1000),
        timeUntilExpiry: (session.expires_at! * 1000) - Date.now(),
        needsRefresh: securityResult.needsRefresh,
        validationMethod: 'session',
        securityFlags: securityResult.securityFlags
      }

    } catch (error) {
      if (options.logValidation) {
        logger.error('Session validation failed', error, 'SESSION')
      }
      return { 
        valid: false, 
        error: error instanceof Error ? error.message : 'Session validation error',
        validationMethod: 'session'
      }
    }
  }

  /**
   * ✅ METHOD 2: Validate with refresh
   */
  private static async validateWithRefresh(
    supabase: any,
    options: ValidationOptions
  ): Promise<ValidationResult> {
    try {
      if (options.logValidation) {
        logger.session('Attempting session refresh...')
      }

      const { data: { session }, error } = await supabase.auth.refreshSession()
      
      if (error) {
        if (options.logValidation) {
          logger.session('Refresh error', { message: error.message })
        }
        return { 
          valid: false, 
          error: error.message,
          validationMethod: 'refresh'
        }
      }

      if (!session) {
        if (options.logValidation) {
          logger.session('Refresh did not return session')
        }
        return { 
          valid: false, 
          error: 'Refresh failed',
          validationMethod: 'refresh'
        }
      }

      // Perform security checks on refreshed session
      const securityResult = this.performSecurityChecks(session, options)
      
      if (!securityResult.valid) {
        return { ...securityResult, validationMethod: 'refresh' }
      }

      if (options.logValidation) {
        logger.session('Session refresh successful')
      }

      return {
        valid: true,
        session,
        user: session.user,
        expiresAt: new Date(session.expires_at! * 1000),
        timeUntilExpiry: (session.expires_at! * 1000) - Date.now(),
        validationMethod: 'refresh',
        securityFlags: securityResult.securityFlags
      }

    } catch (error) {
      if (options.logValidation) {
        logger.error('Refresh validation failed', error, 'SESSION')
      }
      return { 
        valid: false, 
        error: error instanceof Error ? error.message : 'Refresh validation error',
        validationMethod: 'refresh'
      }
    }
  }

  /**
   * ✅ METHOD 3: Validate with user check
   */
  private static async validateWithUser(
    supabase: any,
    options: ValidationOptions
  ): Promise<ValidationResult> {
    try {
      if (options.logValidation) {
        logger.session('Attempting user validation...')
      }

      const { data: { user }, error } = await supabase.auth.getUser()
      
      if (error) {
        if (options.logValidation) {
          logger.session('User validation error', { message: error.message })
        }
        return { 
          valid: false, 
          error: error.message,
          validationMethod: 'user'
        }
      }

      if (!user) {
        if (options.logValidation) {
          logger.session('No user found')
        }
        return { 
          valid: false, 
          error: 'No user found',
          validationMethod: 'user'
        }
      }

      if (options.logValidation) {
        logger.session('User validation successful')
      }

      return {
        valid: true,
        user,
        validationMethod: 'user',
        securityFlags: {
          isExpired: false,
          expiresSoon: false,
          hasValidUser: true,
          hasValidToken: false // User validation doesn't provide token info
        }
      }

    } catch (error) {
      if (options.logValidation) {
        logger.error('User validation failed', error, 'SESSION')
      }
      return { 
        valid: false, 
        error: error instanceof Error ? error.message : 'User validation error',
        validationMethod: 'user'
      }
    }
  }

  /**
   * ✅ SECURITY: Perform comprehensive security checks
   */
  private static performSecurityChecks(
    session: Session,
    options: ValidationOptions
  ): ValidationResult & { needsRefresh?: boolean; securityFlags?: any } {
    if (!options.securityChecks) {
      return { valid: true }
    }

    const now = new Date()
    const expiresAt = new Date(session.expires_at! * 1000)
    const timeUntilExpiry = expiresAt.getTime() - now.getTime()
    const refreshThreshold = (options.refreshThreshold || 5) * 60 * 1000 // Convert to ms

    const securityFlags = {
      isExpired: expiresAt <= now,
      expiresSoon: timeUntilExpiry < refreshThreshold && timeUntilExpiry > 0,
      hasValidUser: !!session.user && !!session.user.id,
      hasValidToken: !!session.access_token
    }

    // Check if session is expired
    if (securityFlags.isExpired) {
      if (options.logValidation) {
        logger.session('Session is expired')
      }
      return { 
        valid: false, 
        error: 'Session expired',
        needsRefresh: true,
        securityFlags
      }
    }

    // Check if session expires soon
    if (securityFlags.expiresSoon) {
      if (options.logValidation) {
        logger.session('Session expires soon, refresh recommended')
      }
      return { 
        valid: true, 
        needsRefresh: true,
        securityFlags
      }
    }

    // Check user validity
    if (!securityFlags.hasValidUser) {
      if (options.logValidation) {
        logger.session('Invalid user data')
      }
      return { 
        valid: false, 
        error: 'Invalid user data',
        securityFlags
      }
    }

    // Check token validity
    if (!securityFlags.hasValidToken) {
      if (options.logValidation) {
        logger.session('Invalid access token')
      }
      return { 
        valid: false, 
        error: 'Invalid access token',
        securityFlags
      }
    }

    return { 
      valid: true, 
      needsRefresh: false,
      securityFlags
    }
  }

  /**
   * ✅ UTILITY: Create Supabase client for validation
   * Rely on @supabase/ssr default httpOnly cookies (no custom mapping)
   */
  private static createSupabaseClient(request: NextRequest) {
    return createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value
          },
          set() {
            // No-op for validation - not modifying cookies during validation
          },
          remove() {
            // No-op for validation
          }
        }
      }
    )
  }

  /**
   * ✅ UTILITY: Quick session check (lightweight)
   */
  static async quickValidate(request: NextRequest): Promise<boolean> {
    try {
      const result = await this.validateSession(request, {
        enableRefresh: false,
        enableUserValidation: false,
        logValidation: false,
        securityChecks: false
      })
      
      return result.valid
    } catch {
      return false
    }
  }

  /**
   * ✅ UTILITY: Get session info without full validation
   */
  static async getSessionInfo(request: NextRequest): Promise<{
    hasSession: boolean
    expiresAt?: Date
    timeUntilExpiry?: number
    userEmail?: string
  }> {
    try {
      const supabase = this.createSupabaseClient(request)
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        return { hasSession: false }
      }

      return {
        hasSession: true,
        expiresAt: new Date(session.expires_at! * 1000),
        timeUntilExpiry: (session.expires_at! * 1000) - Date.now(),
        userEmail: session.user?.email
      }
    } catch {
      return { hasSession: false }
    }
  }

  /**
   * ✅ UTILITY: Validate session with custom error handling
   */
  static async validateWithErrorHandling(
    request: NextRequest,
    onError?: (error: string) => void
  ): Promise<ValidationResult> {
    try {
      return await this.validateSession(request)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Validation failed'
      onError?.(errorMessage)
      
      return {
        valid: false,
        error: errorMessage,
        validationMethod: 'session'
      }
    }
  }
}
