/**
 * Supabase Authentication Service
 * Handles real authentication operations with Supabase
 */

import { createClient } from '@/utils/supabase/client'
import { AuthError } from '@supabase/supabase-js'
import { createTranslationFunction, loadTranslation, DEFAULT_LANGUAGE, TranslationData } from './i18n/'

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
  private get supabase() {
    return createClient()
  }
  private translations: TranslationData | null = null
  private t: ((key: string) => string) | null = null

  constructor() {
    this.initializeTranslations()
  }

  private async initializeTranslations() {
    try {
      this.translations = await loadTranslation(DEFAULT_LANGUAGE)
      this.t = createTranslationFunction(this.translations)
    } catch (error) {
      console.warn('Failed to load translations for AuthService:', error)
    }
  }

  private getText(key: string, fallback: string): string {
    return this.t ? this.t(key) : fallback
  }

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

      // Enhanced error logging for debugging
      if (error instanceof Error) {
        console.error('Registration error details:', {
          name: error.name,
          message: error.message,
          stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        })
      }

      // Check if it's a database/RLS related error
      const errorMessage = error instanceof Error ? error.message : String(error)
      if (errorMessage.includes('Database error') || errorMessage.includes('RLS') || errorMessage.includes('policy')) {
        console.error('🚨 Database/RLS error detected during registration')
        return {
          success: false,
          error: 'Có lỗi cấu hình hệ thống. Vui lòng thử lại sau hoặc liên hệ hỗ trợ.'
        }
      }

      // Check for network/timeout errors
      if (errorMessage.includes('fetch') || errorMessage.includes('network') || errorMessage.includes('timeout')) {
        return {
          success: false,
          error: 'Lỗi kết nối mạng. Vui lòng kiểm tra internet và thử lại.'
        }
      }

      return {
        success: false,
        error: this.getText('auth.errors.registrationError', 'Đã xảy ra lỗi trong quá trình đăng ký. Vui lòng thử lại.')
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
        user: authData.user,
        session: authData.session
      }
    } catch (error) {
      console.error('Login error:', error)
      return {
        success: false,
        error: this.getText('auth.errors.loginError', 'Đã xảy ra lỗi trong quá trình đăng nhập. Vui lòng thử lại.')
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
        error: this.getText('auth.errors.logoutError', 'Đã xảy ra lỗi trong quá trình đăng xuất.')
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
        error: this.getText('auth.errors.resetPasswordError', 'Đã xảy ra lỗi khi gửi email reset mật khẩu.')
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
        error: this.getText('auth.errors.socialLoginError', 'Đã xảy ra lỗi trong quá trình đăng nhập với mạng xã hội.')
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
    // Log error for debugging
    console.error('Auth error:', {
      message: error.message,
      status: error.status,
      name: error.name
    })

    switch (error.message) {
      case 'Invalid login credentials':
        return this.getText('auth.errors.invalidCredentials', 'Sai tên đăng nhập hoặc mật khẩu')
      case 'User already registered':
        return this.getText('auth.errors.emailAlreadyRegistered', 'Email này đã được đăng ký. Vui lòng sử dụng email khác hoặc đăng nhập.')
      case 'Password should be at least 6 characters':
        return this.getText('auth.errors.passwordTooShort', 'Mật khẩu phải có ít nhất 6 ký tự.')
      case 'Unable to validate email address: invalid format':
        return this.getText('auth.errors.invalidEmailFormat', 'Định dạng email không hợp lệ.')
      case 'User not found':
        return this.getText('auth.errors.accountNotFound', 'Không tìm thấy tài khoản với email này.')
      case 'Email not confirmed':
        return this.getText('auth.errors.emailNotConfirmed', 'Vui lòng xác nhận email trước khi đăng nhập.')
      case 'Signup disabled':
        return this.getText('auth.errors.registrationDisabled', 'Tính năng đăng ký hiện tại đã bị tắt.')
      case 'Too many requests':
        return 'Quá nhiều yêu cầu. Vui lòng đợi một chút rồi thử lại.'
      case 'Network request failed':
        return 'Lỗi kết nối mạng. Vui lòng kiểm tra internet và thử lại.'
      default:
        // Check for specific error patterns
        if (error.message.includes('rate limit')) {
          return 'Quá nhiều yêu cầu. Vui lòng đợi một chút rồi thử lại.'
        }
        if (error.message.includes('network') || error.message.includes('fetch')) {
          return 'Lỗi kết nối mạng. Vui lòng kiểm tra internet và thử lại.'
        }
        if (error.message.includes('timeout')) {
          return 'Kết nối bị timeout. Vui lòng thử lại.'
        }

        console.error('Unknown auth error:', error)
        return error.message || this.getText('auth.errors.unknownError', 'Đã xảy ra lỗi không xác định. Vui lòng thử lại.')
    }
  }
}

// Singleton instance
export const authService = new AuthService()
