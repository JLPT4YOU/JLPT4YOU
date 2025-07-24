"use client"

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { STORAGE_KEYS, ANIMATION_DURATIONS } from '@/lib/constants'
import { 
  handleAuthTransitionUrl, 
  DEFAULT_LANGUAGE, 
  Language,
  extractLanguageFromUrl
} from '@/lib/i18n'
import { authService } from '@/lib/auth-service'
import { supabase } from '@/lib/supabase'
import type { User as SupabaseUser } from '@supabase/supabase-js'

export interface User {
  id: string
  email: string
  name: string
  role: 'Free' | 'Premium'
  expiryDate?: string
  avatarIcon?: string | null
  passwordUpdatedAt?: string | null
}

export interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  register: (email: string, password: string, userData?: { name?: string }) => Promise<{ success: boolean; error?: string }>
  logout: () => void
  updateUser: (userData: Partial<User>) => void
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: React.ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  // Helper function to set auth cookie for middleware
  const setAuthCookie = useCallback((session: any) => {
    if (session?.access_token) {
      // Set the auth cookie that middleware expects
      document.cookie = `jlpt4you_auth_token=${session.access_token}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`
    }
  }, [])

  // Helper function to clear auth cookie
  const clearAuthCookie = useCallback(() => {
    document.cookie = 'jlpt4you_auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
  }, [])

  // Initialize auth state from Supabase
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Get current session from Supabase
        const session = await authService.getSession()
        
        if (session?.user) {
          let userData: User;
          
          // First try to get user data from database
          const { data: dbUser, error: dbError } = await supabase
            .from('users')
            .select('id, email, name, avatar_icon, role, password_updated_at')
            .eq('id', session.user.id)
            .single()
          
          if (!dbError && dbUser) {
            // Use data from database
            userData = {
              id: dbUser.id,
              email: dbUser.email,
              name: dbUser.name || session.user.email?.split('@')[0] || 'User',
              role: dbUser.role as 'Free' | 'Premium' || 'Free',
              avatarIcon: dbUser.avatar_icon || null,
              passwordUpdatedAt: dbUser.password_updated_at || null
            }
          } else {
            // Fallback to user_metadata if database query fails
            userData = {
              id: session.user.id,
              email: session.user.email || '',
              name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'User',
              role: session.user.user_metadata?.role || 'Free',
              avatarIcon: session.user.user_metadata?.avatar_icon || null,
              passwordUpdatedAt: session.user.user_metadata?.password_updated_at || null
            }
          }
          
          setUser(userData)
          
          // Set auth cookie for middleware
          setAuthCookie(session)
          
          // Also save to localStorage for faster subsequent loads
          localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(userData))
        } else {
          // Clear any stale data
          clearAuthCookie()
          localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN)
          localStorage.removeItem(STORAGE_KEYS.USER_DATA)
        }
      } catch (error) {
        console.error('Failed to initialize auth state:', error)
        // Clear corrupted data
        clearAuthCookie()
        localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN)
        localStorage.removeItem(STORAGE_KEYS.USER_DATA)
      } finally {
        setIsLoading(false)
      }
    }

    initializeAuth()

    // Listen to auth state changes
    const { data: { subscription } } = authService.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        let userData: User;
        
        // Try to get user data from database first
        const { data: dbUser, error: dbError } = await supabase
          .from('users')
          .select('id, email, name, avatar_icon, role, password_updated_at')
          .eq('id', session.user.id)
          .single()
        
        if (!dbError && dbUser) {
          userData = {
            id: dbUser.id,
            email: dbUser.email,
            name: dbUser.name || session.user.email?.split('@')[0] || 'User',
            role: dbUser.role as 'Free' | 'Premium' || 'Free',
            avatarIcon: dbUser.avatar_icon || null,
            passwordUpdatedAt: dbUser.password_updated_at || null
          }
        } else {
          // Fallback to user_metadata
          userData = {
            id: session.user.id,
            email: session.user.email || '',
            name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'User',
            role: session.user.user_metadata?.role || 'Free',
            avatarIcon: session.user.user_metadata?.avatar_icon || null,
            passwordUpdatedAt: session.user.user_metadata?.password_updated_at || null
          }
        }
        
        setUser(userData)
        
        // Set auth cookie for middleware
        setAuthCookie(session)
        
        localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(userData))
      } else if (event === 'SIGNED_OUT') {
        setUser(null)
        
        // Clear auth cookie
        clearAuthCookie()
        
        localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN)
        localStorage.removeItem(STORAGE_KEYS.USER_DATA)
      }
    })

    // Cleanup subscription
    return () => {
      subscription?.unsubscribe()
    }
  }, [])

  const login = useCallback(async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true)
    
    try {
      const result = await authService.login({ email, password })
      
      if (result.success && result.user) {
        // Convert Supabase user to our User interface
const userData: User = {
          id: result.user.id,
          email: result.user.email || '',
          name: result.user.user_metadata?.name || result.user.email?.split('@')[0] || 'User',
          role: result.user.user_metadata?.role || 'Free',
          avatarIcon: result.user.user_metadata?.avatar_icon || null,
          passwordUpdatedAt: result.user.user_metadata?.password_updated_at || null
        }
        
        setUser(userData)
        
        // Set auth cookie for middleware
        if (result.session) {
          setAuthCookie(result.session)
        }
        
        localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(userData))
        
        // Redirect to home page after successful login
        setTimeout(() => {
          router.push('/home')
        }, 100)
        
        return { success: true }
      } else {
        return { 
          success: false, 
          error: result.error || 'Đã xảy ra lỗi trong quá trình đăng nhập.' 
        }
      }
    } catch (error) {
      console.error('Login error:', error)
      return { 
        success: false, 
        error: 'Đã xảy ra lỗi trong quá trình đăng nhập. Vui lòng thử lại.' 
      }
    } finally {
      setIsLoading(false)
    }
  }, [router])

  const register = useCallback(async (email: string, password: string, userData?: { name?: string }): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true)
    
    try {
      const result = await authService.register({ 
        email, 
        password, 
        metadata: userData 
      })
      
      if (result.success) {
        if (result.error === 'confirmation_required') {
          return { 
            success: true, 
            error: 'Vui lòng kiểm tra email để xác nhận tài khoản trước khi đăng nhập.' 
          }
        }
        
        return { success: true }
      } else {
        return { 
          success: false, 
          error: result.error || 'Đã xảy ra lỗi trong quá trình đăng ký.' 
        }
      }
    } catch (error) {
      console.error('Registration error:', error)
      return { 
        success: false, 
        error: 'Đã xảy ra lỗi trong quá trình đăng ký. Vui lòng thử lại.' 
      }
    } finally {
      setIsLoading(false)
    }
  }, [])

  const logout = useCallback(async () => {
    try {
      await authService.logout()
      
      // Clear localStorage
      localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN)
      localStorage.removeItem(STORAGE_KEYS.USER_DATA)

      // Clear auth cookie
      clearAuthCookie()

      // Clear state
      setUser(null)

      // Redirect to login page
      setTimeout(() => {
        router.push('/auth/vn/login')
      }, 100)
    } catch (error) {
      console.error('Logout error:', error)
      // Even if logout fails on server, clear local state
      clearAuthCookie()
      localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN)
      localStorage.removeItem(STORAGE_KEYS.USER_DATA)
      setUser(null)
      router.push('/auth/vn/login')
    }
  }, [router])

  const updateUser = useCallback((userData: Partial<User>) => {
    if (!user) return

    const updatedUser = { ...user, ...userData }
    setUser(updatedUser)

    // Update localStorage
    localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(updatedUser))
  }, [user])

  const refreshUser = useCallback(async () => {
    if (!user) return

    try {
      console.log('🔄 Refreshing user data from database...')

      // Get fresh user data from database
      const { data: userData, error } = await supabase
        .from('users')
.select('id, email, name, avatar_icon, role, subscription_expires_at, password_updated_at')
        .eq('id', user.id)
        .single()

      if (error) {
        console.error('❌ Failed to refresh user data:', error)
        return
      }

      if (userData) {
        console.log('✅ User data refreshed:', userData)

const refreshedUser: User = {
          id: userData.id,
          email: userData.email,
          name: userData.name || '',
          role: userData.role as 'Free' | 'Premium',
          avatarIcon: userData.avatar_icon,
          passwordUpdatedAt: userData.password_updated_at,
          expiryDate: userData.subscription_expires_at || undefined
        }

        setUser(refreshedUser)
        localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(refreshedUser))
      }
    } catch (error) {
      console.error('💥 Error refreshing user data:', error)
    }
  }, [user])

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    register,
    logout,
    updateUser,
    refreshUser
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
