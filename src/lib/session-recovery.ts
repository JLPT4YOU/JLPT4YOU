/**
 * ✅ ENHANCED SESSION RECOVERY SYSTEM
 * Provides comprehensive session recovery with multiple fallback methods
 * Features: Supabase recovery, refresh token recovery, local storage backup, retry logic
 */

import { createClient } from '@/utils/supabase/client'
import { SessionStorage } from './session-storage'
import { Session, User } from '@supabase/supabase-js'
import { logger } from './logger'

interface RecoveryResult {
  success: boolean
  session?: Session
  user?: User
  method?: 'supabase' | 'refresh' | 'storage' | 'none'
  error?: string
  attempts?: number
}

interface RecoveryOptions {
  maxRetries?: number
  retryDelay?: number
  enableStorageRecovery?: boolean
  enableRefreshRecovery?: boolean
  logRecovery?: boolean
}

export class SessionRecovery {
  private static supabase = createClient()
  private static defaultOptions: RecoveryOptions = {
    maxRetries: 3,
    retryDelay: 1000, // 1 second
    enableStorageRecovery: true,
    enableRefreshRecovery: true,
    logRecovery: process.env.NODE_ENV === 'development'
  }

  /**
   * ✅ MAIN RECOVERY METHOD: Attempts all recovery methods in order
   */
  static async recoverSession(options: RecoveryOptions = {}): Promise<RecoveryResult> {
    const opts = { ...this.defaultOptions, ...options }
    
    if (opts.logRecovery) {
      logger.session('Starting comprehensive session recovery...')
    }

    // Method 1: Try to get session from Supabase directly
    const supabaseResult = await this.recoverFromSupabase(opts)
    if (supabaseResult.success) {
      return supabaseResult
    }

    // Method 2: Try to refresh session with stored refresh token
    if (opts.enableRefreshRecovery) {
      const refreshResult = await this.recoverFromRefreshToken(opts)
      if (refreshResult.success) {
        return refreshResult
      }
    }

    // Method 3: Try to recover from local storage backup
    if (opts.enableStorageRecovery) {
      const storageResult = await this.recoverFromStorage(opts)
      if (storageResult.success) {
        return storageResult
      }
    }

    // All methods failed
    if (opts.logRecovery) {
      logger.session('All recovery methods failed')
    }

    return {
      success: false,
      method: 'none',
      error: 'All recovery methods exhausted',
      attempts: opts.maxRetries
    }
  }

  /**
   * ✅ METHOD 1: Recover from Supabase session
   */
  private static async recoverFromSupabase(options: RecoveryOptions): Promise<RecoveryResult> {
    try {
      if (options.logRecovery) {
        logger.session('Attempting Supabase session recovery...')
      }

      const { data: { session }, error } = await this.supabase.auth.getSession()
      
      if (error) {
        if (options.logRecovery) {
          logger.session('Supabase session error', { message: error.message })
        }
        return { success: false, error: error.message, method: 'supabase' }
      }

      if (session && this.isSessionValid(session)) {
        if (options.logRecovery) {
          logger.session('Session recovered from Supabase')
        }
        
        // Save to storage for future recovery
        SessionStorage.saveSession(session)
        
        return {
          success: true,
          session,
          user: session.user,
          method: 'supabase'
        }
      }

      if (options.logRecovery) {
        logger.session('No valid session found in Supabase')
      }
      
      return { success: false, error: 'No valid session', method: 'supabase' }
    } catch (error) {
      if (options.logRecovery) {
        logger.error('Supabase recovery failed', error, 'SESSION')
      }
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
        method: 'supabase'
      }
    }
  }

  /**
   * ✅ METHOD 2: Recover using refresh token
   */
  private static async recoverFromRefreshToken(options: RecoveryOptions): Promise<RecoveryResult> {
    try {
      if (options.logRecovery) {
        logger.session('Attempting refresh token recovery...')
      }

      const { data: { session }, error } = await this.supabase.auth.refreshSession()
      
      if (error) {
        if (options.logRecovery) {
          logger.session('Refresh token error', { message: error.message })
        }
        return { success: false, error: error.message, method: 'refresh' }
      }

      if (session && this.isSessionValid(session)) {
        if (options.logRecovery) {
          logger.session('Session recovered via refresh token')
        }
        
        // Save refreshed session to storage
        SessionStorage.saveSession(session)
        
        return {
          success: true,
          session,
          user: session.user,
          method: 'refresh'
        }
      }

      if (options.logRecovery) {
        logger.session('Refresh token did not return valid session')
      }
      
      return { success: false, error: 'Refresh failed', method: 'refresh' }
    } catch (error) {
      if (options.logRecovery) {
        logger.error('Refresh token recovery failed', error, 'SESSION')
      }
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
        method: 'refresh'
      }
    }
  }

  /**
   * ✅ METHOD 3: Recover from local storage backup
   */
  private static async recoverFromStorage(options: RecoveryOptions): Promise<RecoveryResult> {
    try {
      if (options.logRecovery) {
        logger.session('Attempting storage recovery...')
      }

      const storedSession = SessionStorage.getSession()
      
      if (!storedSession) {
        if (options.logRecovery) {
          logger.session('No session found in storage')
        }
        return { success: false, error: 'No stored session', method: 'storage' }
      }

      if (!this.isSessionValid(storedSession)) {
        if (options.logRecovery) {
          logger.session('Stored session is invalid or expired')
        }
        SessionStorage.clearSession() // Clean up invalid session
        return { success: false, error: 'Stored session invalid', method: 'storage' }
      }

      // Validate stored session with Supabase
      const isValidWithSupabase = await this.validateStoredSession(storedSession)
      
      if (!isValidWithSupabase) {
        if (options.logRecovery) {
          logger.session('Stored session not valid with Supabase')
        }
        SessionStorage.clearSession() // Clean up invalid session
        return { success: false, error: 'Session not valid with server', method: 'storage' }
      }

      if (options.logRecovery) {
        logger.session('Session recovered from storage')
      }
      
      return {
        success: true,
        session: storedSession,
        user: storedSession.user,
        method: 'storage'
      }
    } catch (error) {
      if (options.logRecovery) {
        logger.error('Storage recovery failed', error, 'SESSION')
      }
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
        method: 'storage'
      }
    }
  }

  /**
   * ✅ UTILITY: Validate session with server
   */
  private static async validateStoredSession(session: Session): Promise<boolean> {
    try {
      // Set the session in Supabase client temporarily for validation
      await this.supabase.auth.setSession({
        access_token: session.access_token,
        refresh_token: session.refresh_token || ''
      })

      // Try to get user info to validate session
      const { data: { user }, error } = await this.supabase.auth.getUser()
      
      return !error && !!user
    } catch (error) {
      return false
    }
  }

  /**
   * ✅ UTILITY: Check if session is valid
   */
  private static isSessionValid(session: Session): boolean {
    if (!session || !session.access_token) {
      return false
    }

    // Check expiry
    if (session.expires_at) {
      const expiresAt = new Date(session.expires_at * 1000)
      const now = new Date()
      
      if (expiresAt <= now) {
        return false
      }
    }

    // Check user data
    if (!session.user || !session.user.id) {
      return false
    }

    return true
  }

  /**
   * ✅ UTILITY: Retry operation with exponential backoff
   */
  static async retryWithBackoff<T>(
    operation: () => Promise<T>,
    options: RecoveryOptions = {}
  ): Promise<T> {
    const opts = { ...this.defaultOptions, ...options }
    let lastError: Error | null = null

    for (let attempt = 1; attempt <= (opts.maxRetries || 3); attempt++) {
      try {
        if (opts.logRecovery && attempt > 1) {
          logger.session(`Retry attempt ${attempt}/${opts.maxRetries}`)
        }
        
        return await operation()
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error')
        
        if (attempt < (opts.maxRetries || 3)) {
          const delay = (opts.retryDelay || 1000) * Math.pow(2, attempt - 1) // Exponential backoff
          
          if (opts.logRecovery) {
            logger.session(`Waiting ${delay}ms before retry...`)
          }
          
          await new Promise(resolve => setTimeout(resolve, delay))
        }
      }
    }

    throw lastError || new Error('Max retries exceeded')
  }

  /**
   * ✅ UTILITY: Force session cleanup
   */
  static async forceCleanup(): Promise<void> {
    try {
      logger.session('Performing force cleanup...')
      
      // Clear Supabase session
      await this.supabase.auth.signOut()
      
      // Clear storage
      SessionStorage.clearSession()
      
      logger.session('Force cleanup completed')
    } catch (error) {
      logger.error('Force cleanup failed', error, 'SESSION')
    }
  }

  /**
   * ✅ UTILITY: Get recovery statistics
   */
  static getRecoveryStats(): {
    storageAvailable: boolean
    hasStoredSession: boolean
    supabaseConnected: boolean
  } {
    const storageStats = SessionStorage.getStorageStats()
    
    return {
      storageAvailable: storageStats.localStorage.available || storageStats.sessionStorage.available,
      hasStoredSession: storageStats.localStorage.hasSession || storageStats.sessionStorage.hasSession,
      supabaseConnected: !!this.supabase
    }
  }

  /**
   * ✅ UTILITY: Test all recovery methods (for debugging)
   */
  static async testRecoveryMethods(): Promise<{
    supabase: boolean
    refresh: boolean
    storage: boolean
    overall: boolean
  }> {
    const results = {
      supabase: false,
      refresh: false,
      storage: false,
      overall: false
    }

    try {
      // Test Supabase recovery
      const supabaseResult = await this.recoverFromSupabase({ logRecovery: true })
      results.supabase = supabaseResult.success

      // Test refresh recovery
      const refreshResult = await this.recoverFromRefreshToken({ logRecovery: true })
      results.refresh = refreshResult.success

      // Test storage recovery
      const storageResult = await this.recoverFromStorage({ logRecovery: true })
      results.storage = storageResult.success

      // Overall success if any method works
      results.overall = results.supabase || results.refresh || results.storage

      logger.session('Test results', results)
      return results
    } catch (error) {
      logger.error('Test failed', error, 'SESSION')
      return results
    }
  }
}
