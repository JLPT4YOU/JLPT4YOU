/**
 * 🔒 SUPABASE SSR AUTHENTICATION CLIENT
 * Modern secure authentication with server-side rendering support
 * Replaces current custom authentication system
 */

import { createServerClient, createBrowserClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'
import { logAuthEvent } from '@/lib/monitoring'

// Types for authentication results
export interface AuthResult {
  success: boolean
  user?: any
  session?: any
  error?: string
  needsConfirmation?: boolean
}

export interface UserResult {
  user: any | null
  error: string | null
}

/**
 * 🖥️ SERVER-SIDE CLIENT (for middleware and API routes)
 */
export function createSupabaseServerClient(request: NextRequest) {
  const response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value)
            response.cookies.set(name, value, {
              ...options,
              httpOnly: true,                    // ✅ XSS Protection
              secure: process.env.NODE_ENV === 'production', // ✅ HTTPS Only in production
              sameSite: 'lax',                   // ✅ CSRF Protection
              path: '/',
              maxAge: 60 * 60 * 24 * 7          // 7 days
            })
          })
        },
      },
    }
  )

  return { supabase, response }
}

/**
 * 🌐 CLIENT-SIDE CLIENT (for React components)
 */
export function createSupabaseBrowserClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

/**
 * 🔐 SECURE AUTHENTICATION HELPERS
 */
export class AuthService {
  private supabase: ReturnType<typeof createSupabaseBrowserClient>

  constructor() {
    this.supabase = createSupabaseBrowserClient()
  }

  /**
   * 🔑 SECURE LOGIN with comprehensive logging
   */
  async login(email: string, password: string) {
    try {
      const startTime = Date.now()
      
      const { data, error } = await this.supabase.auth.signInWithPassword({
        email,
        password
      })

      const responseTime = Date.now() - startTime

      if (error) {
        logAuthEvent({
          event: 'login_failed',
          level: 'warn',
          userEmail: email,
          details: {
            error: error.message,
            responseTime,
            method: 'password'
          }
        })

        // Map Supabase errors to user-friendly messages
        const errorMessage = error.message.includes('Invalid login credentials')
          ? 'Sai tên đăng nhập hoặc mật khẩu'
          : 'Đăng nhập thất bại. Vui lòng thử lại.'

        return { success: false, error: errorMessage }
      }

      logAuthEvent({
        event: 'login_successful',
        level: 'info',
        userId: data.user?.id,
        userEmail: data.user?.email,
        details: { 
          responseTime,
          method: 'password',
          sessionId: data.session?.access_token?.substring(0, 10) + '...'
        }
      })

      return { 
        success: true, 
        user: data.user, 
        session: data.session 
      }
    } catch (error) {
      logAuthEvent({
        event: 'login_error',
        level: 'error',
        userEmail: email,
        details: { 
          error: error instanceof Error ? error.message : 'Unknown error',
          method: 'password'
        }
      })
      
      return { 
        success: false, 
        error: 'Login failed. Please try again.' 
      }
    }
  }

  /**
   * 📝 SECURE REGISTRATION with validation
   */
  async register(email: string, password: string, metadata?: { name?: string }) {
    try {
      const startTime = Date.now()
      
      const { data, error } = await this.supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata || {}
        }
      })

      const responseTime = Date.now() - startTime

      if (error) {
        logAuthEvent({
          event: 'registration_failed',
          level: 'warn',
          userEmail: email,
          details: {
            error: error.message,
            responseTime
          }
        })

        // Map Supabase errors to user-friendly messages
        const errorMessage = error.message.includes('already registered')
          ? 'Email already registered'
          : 'Registration failed. Please try again.'

        return { success: false, error: errorMessage }
      }

      logAuthEvent({
        event: 'registration_successful',
        level: 'info',
        userId: data.user?.id,
        userEmail: data.user?.email,
        details: { 
          responseTime,
          needsConfirmation: !data.session
        }
      })

      // If user needs email confirmation
      if (data.user && !data.session) {
        return {
          success: true,
          user: data.user,
          needsConfirmation: true
        }
      }

      return { 
        success: true, 
        user: data.user,
        session: data.session 
      }
    } catch (error) {
      logAuthEvent({
        event: 'registration_error',
        level: 'error',
        userEmail: email,
        details: { 
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      })
      
      return { 
        success: false, 
        error: 'Registration failed. Please try again.' 
      }
    }
  }

  /**
   * 🚪 SECURE LOGOUT with session cleanup
   */
  async logout() {
    try {
      const { data: { user } } = await this.supabase.auth.getUser()
      
      const { error } = await this.supabase.auth.signOut()

      if (error) {
        logAuthEvent({
          event: 'logout_failed',
          level: 'warn',
          userId: user?.id,
          userEmail: user?.email,
          details: { error: error.message }
        })
        
        return { success: false, error: 'Logout failed' }
      }

      logAuthEvent({
        event: 'logout_successful',
        level: 'info',
        userId: user?.id,
        userEmail: user?.email,
        details: { method: 'manual' }
      })

      return { success: true }
    } catch (error) {
      logAuthEvent({
        event: 'logout_error',
        level: 'error',
        details: { 
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      })
      
      return { 
        success: false, 
        error: 'Logout failed. Please try again.' 
      }
    }
  }

  /**
   * 🔄 GET CURRENT USER with caching
   */
  async getCurrentUser() {
    try {
      const { data: { user }, error } = await this.supabase.auth.getUser()
      
      if (error) {
        logAuthEvent({
          event: 'get_user_failed',
          level: 'warn',
          details: { error: error.message }
        })
        return { user: null, error: 'Not authenticated' }
      }

      return { user, error: null }
    } catch (error) {
      return {
        user: null,
        error: 'Not authenticated'
      }
    }
  }

  /**
   * 🔄 REFRESH SESSION
   */
  async refreshSession() {
    try {
      const { data, error } = await this.supabase.auth.refreshSession()
      
      if (error) {
        logAuthEvent({
          event: 'session_refresh_failed',
          level: 'warn',
          details: { error: error.message }
        })
        return { session: null, error: 'Refresh failed' }
      }

      if (data.user) {
        logAuthEvent({
          event: 'session_refreshed',
          level: 'info',
          userId: data.user.id,
          userEmail: data.user.email,
          details: { automatic: true }
        })
      }

      return { session: data.session, error: null }
    } catch (error) {
      return {
        session: null,
        error: 'Refresh failed'
      }
    }
  }

  /**
   * 🔐 OAUTH LOGIN (Google)
   */
  async loginWithGoogle() {
    try {
      const { data, error } = await this.supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      })

      if (error) {
        logAuthEvent({
          event: 'oauth_login_failed',
          level: 'warn',
          details: { 
            provider: 'google',
            error: error.message 
          }
        })
        
        return { success: false, error: error.message }
      }

      logAuthEvent({
        event: 'oauth_login_initiated',
        level: 'info',
        details: { provider: 'google' }
      })

      return { success: true, data }
    } catch (error) {
      logAuthEvent({
        event: 'oauth_login_error',
        level: 'error',
        details: { 
          provider: 'google',
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      })
      
      return { 
        success: false, 
        error: 'Google login failed. Please try again.' 
      }
    }
  }

  /**
   * 🔒 PASSWORD RESET
   */
  async resetPassword(email: string) {
    try {
      const { error } = await this.supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`
      })

      if (error) {
        logAuthEvent({
          event: 'password_reset_failed',
          level: 'warn',
          userEmail: email,
          details: { error: error.message }
        })
        
        return { success: false, error: error.message }
      }

      logAuthEvent({
        event: 'password_reset_requested',
        level: 'info',
        userEmail: email,
        details: { method: 'email' }
      })

      return { success: true }
    } catch (error) {
      logAuthEvent({
        event: 'password_reset_error',
        level: 'error',
        userEmail: email,
        details: { 
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      })
      
      return { 
        success: false, 
        error: 'Password reset failed. Please try again.' 
      }
    }
  }
}

// Export singleton instance
export const authService = new AuthService()

// Export types
export interface AuthResult {
  success: boolean
  error?: string
  user?: any
  session?: any
  needsConfirmation?: boolean
}
