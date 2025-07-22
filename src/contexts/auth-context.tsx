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

// Demo user data
export const DEMO_USER = {
  id: 'demo-user-001',
  email: 'demo@jlpt4you.com',
  name: 'Nguyễn Văn A',
  role: 'Premium' as const,
  expiryDate: '31/12/2024',
  avatar: null
}

// Demo credentials
export const DEMO_CREDENTIALS = {
  email: 'demo@jlpt4you.com',
  password: 'demo1234'
}

export interface User {
  id: string
  email: string
  name: string
  role: 'Free' | 'Premium'
  expiryDate?: string
  avatar?: string | null
}

export interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  logout: () => void
  updateUser: (userData: Partial<User>) => void
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

  // Initialize auth state from localStorage
  useEffect(() => {
    const initializeAuth = () => {
      try {
        const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN)
        const userData = localStorage.getItem(STORAGE_KEYS.USER_DATA)
        
        if (token && userData) {
          const parsedUser = JSON.parse(userData)
          setUser(parsedUser)
        }
      } catch (error) {
        console.error('Failed to initialize auth state:', error)
        // Clear corrupted data
        localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN)
        localStorage.removeItem(STORAGE_KEYS.USER_DATA)
      } finally {
        setIsLoading(false)
      }
    }

    initializeAuth()
  }, [])

  const login = useCallback(async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true)
    
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, ANIMATION_DURATIONS.LOADING.SPINNER))
      
      // Check demo credentials
      if (email === DEMO_CREDENTIALS.email && password === DEMO_CREDENTIALS.password) {
        // Generate demo token
        const token = `demo-token-${Date.now()}`
        
        // Save to localStorage
        localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token)
        localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(DEMO_USER))

        // Save token to cookies for middleware access
        document.cookie = `jlpt4you_auth_token=${token}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`
        
        // Update state
        setUser(DEMO_USER)
        
        // Language routing transition is now handled by middleware
        // Just redirect to home page after successful login
        setTimeout(() => {
          router.push('/home')
        }, 100)
        
        return { success: true }
      } else {
        return { 
          success: false, 
          error: 'Email hoặc mật khẩu không đúng. Vui lòng thử lại.' 
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
  }, [])

  const logout = useCallback(() => {
    // Clear localStorage
    localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN)
    localStorage.removeItem(STORAGE_KEYS.USER_DATA)

    // Clear cookies
    document.cookie = 'jlpt4you_auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'

    // Clear state
    setUser(null)

    // Let middleware handle the redirect after logout
    // Just refresh the page to trigger middleware logic
    setTimeout(() => {
      window.location.reload()
    }, 100)
  }, [])

  const updateUser = useCallback((userData: Partial<User>) => {
    if (!user) return
    
    const updatedUser = { ...user, ...userData }
    setUser(updatedUser)
    
    // Update localStorage
    localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(updatedUser))
  }, [user])

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
    updateUser
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
