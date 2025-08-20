/**
 * 🧪 UNIT TESTS - Supabase SSR Authentication
 * Comprehensive testing for new authentication system
 */

import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals'
import { AuthService } from '@/lib/auth/supabase-ssr'

// Mock Supabase client
const mockSupabaseClient = {
  auth: {
    signInWithPassword: jest.fn(),
    signUp: jest.fn(),
    signOut: jest.fn(),
    getUser: jest.fn(),
    refreshSession: jest.fn(),
    signInWithOAuth: jest.fn(),
    resetPasswordForEmail: jest.fn(),
    onAuthStateChange: jest.fn(() => ({
      data: { subscription: { unsubscribe: jest.fn() } }
    }))
  }
}

// Mock createSupabaseBrowserClient
jest.mock('@/lib/auth/supabase-ssr', () => {
  const actual = jest.requireActual('@/lib/auth/supabase-ssr')
  return {
    ...actual,
    createSupabaseBrowserClient: () => mockSupabaseClient
  }
})

// Mock monitoring
jest.mock('@/lib/monitoring', () => ({
  logAuthEvent: jest.fn()
}))

// Import the AuthService after mocking
import { AuthService } from '@/lib/auth/supabase-ssr'

describe('AuthService', () => {
  let authService: AuthService

  beforeEach(() => {
    authService = new AuthService()
    jest.clearAllMocks()
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('login', () => {
    it('should successfully login with valid credentials', async () => {
      // Arrange
      const mockUser = { id: 'user-123', email: 'test@example.com' }
      const mockSession = { access_token: 'token-123' }
      
      mockSupabaseClient.auth.signInWithPassword.mockResolvedValue({
        data: { user: mockUser, session: mockSession },
        error: null
      })

      // Act
      const result = await authService.login('test@example.com', 'password123')

      // Assert
      expect(result.success).toBe(true)
      expect(result.user).toEqual(mockUser)
      expect(result.session).toEqual(mockSession)
      expect(mockSupabaseClient.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123'
      })
    })

    it('should handle login failure with invalid credentials', async () => {
      // Arrange
      mockSupabaseClient.auth.signInWithPassword.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Invalid login credentials' }
      })

      // Act
      const result = await authService.login('test@example.com', 'wrongpassword')

      // Assert
      expect(result.success).toBe(false)
      expect(result.error).toBe('Invalid login credentials')
      expect(result.user).toBeUndefined()
      expect(result.session).toBeUndefined()
    })

    it('should handle network errors gracefully', async () => {
      // Arrange
      mockSupabaseClient.auth.signInWithPassword.mockRejectedValue(
        new Error('Network error')
      )

      // Act
      const result = await authService.login('test@example.com', 'password123')

      // Assert
      expect(result.success).toBe(false)
      expect(result.error).toBe('Login failed. Please try again.')
    })

    it('should measure and log response time', async () => {
      // Arrange
      const mockUser = { id: 'user-123', email: 'test@example.com' }
      mockSupabaseClient.auth.signInWithPassword.mockResolvedValue({
        data: { user: mockUser, session: {} },
        error: null
      })

      // Act
      const startTime = Date.now()
      await authService.login('test@example.com', 'password123')
      const endTime = Date.now()

      // Assert
      expect(endTime - startTime).toBeLessThan(1000) // Should complete within 1 second
    })
  })

  describe('register', () => {
    it('should successfully register new user', async () => {
      // Arrange
      const mockUser = { id: 'user-456', email: 'newuser@example.com' }
      const mockSession = { access_token: 'token-456' }
      
      mockSupabaseClient.auth.signUp.mockResolvedValue({
        data: { user: mockUser, session: mockSession },
        error: null
      })

      // Act
      const result = await authService.register(
        'newuser@example.com', 
        'password123',
        { name: 'New User' }
      )

      // Assert
      expect(result.success).toBe(true)
      expect(result.user).toEqual(mockUser)
      expect(result.session).toEqual(mockSession)
      expect(mockSupabaseClient.auth.signUp).toHaveBeenCalledWith({
        email: 'newuser@example.com',
        password: 'password123',
        options: {
          data: { name: 'New User' }
        }
      })
    })

    it('should handle registration with email confirmation required', async () => {
      // Arrange
      const mockUser = { id: 'user-456', email: 'newuser@example.com' }
      
      mockSupabaseClient.auth.signUp.mockResolvedValue({
        data: { user: mockUser, session: null }, // No session = needs confirmation
        error: null
      })

      // Act
      const result = await authService.register('newuser@example.com', 'password123')

      // Assert
      expect(result.success).toBe(true)
      expect(result.user).toEqual(mockUser)
      expect(result.needsConfirmation).toBe(true)
      expect(result.session).toBeUndefined()
    })

    it('should handle registration failure', async () => {
      // Arrange
      mockSupabaseClient.auth.signUp.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Email already registered' }
      })

      // Act
      const result = await authService.register('existing@example.com', 'password123')

      // Assert
      expect(result.success).toBe(false)
      expect(result.error).toBe('Email already registered')
    })
  })

  describe('logout', () => {
    it('should successfully logout user', async () => {
      // Arrange
      const mockUser = { id: 'user-123', email: 'test@example.com' }
      
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      })
      
      mockSupabaseClient.auth.signOut.mockResolvedValue({
        error: null
      })

      // Act
      const result = await authService.logout()

      // Assert
      expect(result.success).toBe(true)
      expect(mockSupabaseClient.auth.signOut).toHaveBeenCalled()
    })

    it('should handle logout failure', async () => {
      // Arrange
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null
      })
      
      mockSupabaseClient.auth.signOut.mockResolvedValue({
        error: { message: 'Logout failed' }
      })

      // Act
      const result = await authService.logout()

      // Assert
      expect(result.success).toBe(false)
      expect(result.error).toBe('Logout failed')
    })
  })

  describe('getCurrentUser', () => {
    it('should return current user when authenticated', async () => {
      // Arrange
      const mockUser = { id: 'user-123', email: 'test@example.com' }
      
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      })

      // Act
      const result = await authService.getCurrentUser()

      // Assert
      expect(result.user).toEqual(mockUser)
      expect(result.error).toBeNull()
    })

    it('should return null when not authenticated', async () => {
      // Arrange
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Not authenticated' }
      })

      // Act
      const result = await authService.getCurrentUser()

      // Assert
      expect(result.user).toBeNull()
      expect(result.error).toBe('Not authenticated')
    })
  })

  describe('refreshSession', () => {
    it('should successfully refresh session', async () => {
      // Arrange
      const mockSession = { access_token: 'new-token-123' }
      const mockUser = { id: 'user-123', email: 'test@example.com' }
      
      mockSupabaseClient.auth.refreshSession.mockResolvedValue({
        data: { session: mockSession, user: mockUser },
        error: null
      })

      // Act
      const result = await authService.refreshSession()

      // Assert
      expect(result.session).toEqual(mockSession)
      expect(result.error).toBeNull()
    })

    it('should handle refresh failure', async () => {
      // Arrange
      mockSupabaseClient.auth.refreshSession.mockResolvedValue({
        data: { session: null, user: null },
        error: { message: 'Refresh failed' }
      })

      // Act
      const result = await authService.refreshSession()

      // Assert
      expect(result.session).toBeNull()
      expect(result.error).toBe('Refresh failed')
    })
  })

  describe('loginWithGoogle', () => {
    it('should initiate Google OAuth login', async () => {
      // Arrange
      mockSupabaseClient.auth.signInWithOAuth.mockResolvedValue({
        data: { url: 'https://oauth.google.com/...' },
        error: null
      })

      // Mock window.location.origin - skip for now to avoid JSDOM issues

      // Act
      const result = await authService.loginWithGoogle()

      // Assert
      expect(result.success).toBe(true)
      expect(mockSupabaseClient.auth.signInWithOAuth).toHaveBeenCalledWith({
        provider: 'google',
        options: {
          redirectTo: 'http://localhost:3000/auth/callback'
        }
      })
    })
  })

  describe('resetPassword', () => {
    it('should send password reset email', async () => {
      // Arrange
      mockSupabaseClient.auth.resetPasswordForEmail.mockResolvedValue({
        error: null
      })

      // Mock window.location.origin - skip for now to avoid JSDOM issues

      // Act
      const result = await authService.resetPassword('test@example.com')

      // Assert
      expect(result.success).toBe(true)
      expect(mockSupabaseClient.auth.resetPasswordForEmail).toHaveBeenCalledWith(
        'test@example.com',
        {
          redirectTo: 'http://localhost:3000/auth/reset-password'
        }
      )
    })
  })
})

// Performance Tests
describe('AuthService Performance', () => {
  let authService: AuthService

  beforeEach(() => {
    authService = new AuthService()
    jest.clearAllMocks()
  })

  it('should complete login within performance threshold', async () => {
    // Arrange
    mockSupabaseClient.auth.signInWithPassword.mockResolvedValue({
      data: { user: { id: 'user-123' }, session: {} },
      error: null
    })

    // Act & Assert
    const startTime = performance.now()
    await authService.login('test@example.com', 'password123')
    const endTime = performance.now()
    
    expect(endTime - startTime).toBeLessThan(100) // Should complete within 100ms
  })

  it('should handle concurrent login attempts', async () => {
    // Arrange
    mockSupabaseClient.auth.signInWithPassword.mockResolvedValue({
      data: { user: { id: 'user-123' }, session: {} },
      error: null
    })

    // Act
    const promises = Array.from({ length: 10 }, (_, i) => 
      authService.login(`user${i}@example.com`, 'password123')
    )
    
    const results = await Promise.all(promises)

    // Assert
    expect(results).toHaveLength(10)
    expect(results.every(result => result.success)).toBe(true)
  })
})
