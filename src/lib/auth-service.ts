/**
 * Supabase Authentication Service
 * Handles real authentication operations with Supabase
 */

import { supabase } from '@/lib/supabase'
import { AuthResponse, AuthError } from '@supabase/supabase-js'

export interface AuthResult {
  success: boolean
  error?: string
  user?: any
  session?: any
}

export interface RegisterData {
  email: string
  password: string
  metadata?: {
    name?: string
  }
}

export interface LoginData {
  email: string
  password: string
}

export class AuthService {
  private supabase = supabase

  /**
   * Register a new user with Supabase
   */
  async register(data: RegisterData): Promise<AuthResult> {
    try {
      const { data: authData, error } = await this.supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: data.metadata || {}
        }
      })

      if (error) {
        return {
          success: false,
          error: this.getErrorMessage(error)
        }
      }

      // If user needs email confirmation
      if (authData.user && !authData.session) {
        return {
          success: true,
          user: authData.user,
          error: 'confirmation_required' // Special flag for email confirmation
        }
      }

      return {
        success: true,
        user: authData.user
      }
    } catch (error) {
      console.error('Registration error:', error)
      return {
        success: false,
        error: 'Đã xảy ra lỗi trong quá trình đăng ký. Vui lòng thử lại.'
      }
    }
  }

  /**
   * Login user with Supabase
   */
  async login(data: LoginData): Promise<AuthResult> {
    try {
      const { data: authData, error } = await this.supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password
      })

      if (error) {
        return {
          success: false,
          error: this.getErrorMessage(error)
        }
      }

      return {
        success: true,
        user: authData.user
      }
    } catch (error) {
      console.error('Login error:', error)
      return {
        success: false,
        error: 'Đã xảy ra lỗi trong quá trình đăng nhập. Vui lòng thử lại.'
      }
    }
  }

  /**
   * Logout user
   */
  async logout(): Promise<AuthResult> {
    try {
      const { error } = await this.supabase.auth.signOut()
      
      if (error) {
        return {
          success: false,
          error: this.getErrorMessage(error)
        }
      }

      return { success: true }
    } catch (error) {
      console.error('Logout error:', error)
      return {
        success: false,
        error: 'Đã xảy ra lỗi trong quá trình đăng xuất.'
      }
    }
  }

  /**
   * Get current session
   */
  async getSession() {
    try {
      const { data: { session }, error } = await this.supabase.auth.getSession()
      
      if (error) {
        console.error('Get session error:', error)
        return null
      }

      return session
    } catch (error) {
      console.error('Get session error:', error)
      return null
    }
  }

  /**
   * Get current user
   */
  async getUser() {
    try {
      const { data: { user }, error } = await this.supabase.auth.getUser()
      
      if (error) {
        console.error('Get user error:', error)
        return null
      }

      return user
    } catch (error) {
      console.error('Get user error:', error)
      return null
    }
  }

  /**
   * Reset password
   */
  async resetPassword(email: string): Promise<AuthResult> {
    try {
      const { error } = await this.supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`
      })

      if (error) {
        return {
          success: false,
          error: this.getErrorMessage(error)
        }
      }

      return { success: true }
    } catch (error) {
      console.error('Reset password error:', error)
      return {
        success: false,
        error: 'Đã xảy ra lỗi khi gửi email reset mật khẩu.'
      }
    }
  }

  /**
   * Sign in with OAuth provider
   */
  async signInWithOAuth(provider: 'google' | 'github') {
    try {
      const { data, error } = await this.supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      })

      if (error) {
        return {
          success: false,
          error: this.getErrorMessage(error)
        }
      }

      return { success: true, data }
    } catch (error) {
      console.error('OAuth sign in error:', error)
      return {
        success: false,
        error: 'Đã xảy ra lỗi trong quá trình đăng nhập với mạng xã hội.'
      }
    }
  }

  /**
   * Listen to auth state changes
   */
  onAuthStateChange(callback: (event: string, session: any) => void) {
    return this.supabase.auth.onAuthStateChange(callback)
  }

  /**
   * Convert Supabase auth errors to user-friendly messages
   */
  private getErrorMessage(error: AuthError): string {
    switch (error.message) {
      case 'Invalid login credentials':
        return 'Email hoặc mật khẩu không đúng. Vui lòng thử lại.'
      case 'User already registered':
        return 'Email này đã được đăng ký. Vui lòng sử dụng email khác hoặc đăng nhập.'
      case 'Password should be at least 6 characters':
        return 'Mật khẩu phải có ít nhất 6 ký tự.'
      case 'Unable to validate email address: invalid format':
        return 'Định dạng email không hợp lệ.'
      case 'User not found':
        return 'Không tìm thấy tài khoản với email này.'
      case 'Email not confirmed':
        return 'Vui lòng xác nhận email trước khi đăng nhập.'
      case 'Signup disabled':
        return 'Tính năng đăng ký hiện tại đã bị tắt.'
      default:
        console.error('Unknown auth error:', error)
        return error.message || 'Đã xảy ra lỗi không xác định. Vui lòng thử lại.'
    }
  }
}

// Singleton instance
export const authService = new AuthService()
