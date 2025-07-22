/**
 * Comprehensive tests for auth utilities
 * Testing: isAuthenticated, getCurrentUser, getAuthToken, clearAuthData,
 * setRedirectUrl, getLoginRedirectUrl, getLoginUrl, validateSession
 */

import {
  isAuthenticated,
  getCurrentUser,
  getAuthToken,
  clearAuthData,
  setLoginRedirectUrl,
  getLoginRedirectUrl,
  getLoginUrl,
  validateSession
} from '@/lib/auth-utils'
import { STORAGE_KEYS } from '@/lib/constants'
import { User } from '@/contexts/auth-context'

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  
  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key]
    }),
    clear: jest.fn(() => {
      store = {}
    })
  }
})()

// Mock sessionStorage
const sessionStorageMock = (() => {
  let store: Record<string, string> = {}
  
  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key]
    }),
    clear: jest.fn(() => {
      store = {}
    })
  }
})()

// Mock user data
const mockUser: User = {
  id: 'test-user-123',
  email: 'test@jlpt4you.com',
  name: 'Test User',
  role: 'Premium',
  expiryDate: '31/12/2024',
  avatar: null
}

const mockToken = 'test-auth-token-123'

// Setup mocks
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
})

Object.defineProperty(window, 'sessionStorage', {
  value: sessionStorageMock
})

// Simple approach - just test the functions that don't depend on window.location
// For location-dependent functions, we'll test them with explicit parameters

// Mock console methods to avoid noise in tests
const consoleSpy = {
  error: jest.spyOn(console, 'error').mockImplementation(() => {}),
  warn: jest.spyOn(console, 'warn').mockImplementation(() => {})
}

describe('Auth Utils', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    localStorageMock.clear()
    sessionStorageMock.clear()
    jest.clearAllMocks()
    
    // Clear all mocks
  })

  afterAll(() => {
    // Restore console methods
    consoleSpy.error.mockRestore()
    consoleSpy.warn.mockRestore()
  })

  describe('isAuthenticated', () => {
    test('should return true when both token and user data exist', () => {
      localStorageMock.setItem(STORAGE_KEYS.AUTH_TOKEN, mockToken)
      localStorageMock.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(mockUser))
      
      expect(isAuthenticated()).toBe(true)
    })

    test('should return false when token is missing', () => {
      localStorageMock.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(mockUser))
      
      expect(isAuthenticated()).toBe(false)
    })

    test('should return false when user data is missing', () => {
      localStorageMock.setItem(STORAGE_KEYS.AUTH_TOKEN, mockToken)
      
      expect(isAuthenticated()).toBe(false)
    })

    test('should return false when both token and user data are missing', () => {
      expect(isAuthenticated()).toBe(false)
    })

    test('should return false when localStorage throws error', () => {
      localStorageMock.getItem.mockImplementationOnce(() => {
        throw new Error('localStorage error')
      })
      
      expect(isAuthenticated()).toBe(false)
      expect(consoleSpy.error).toHaveBeenCalledWith('Error checking authentication status:', expect.any(Error))
    })

    test('should return false in server environment (window undefined)', () => {
      // Mock server environment
      const originalWindow = global.window
      // @ts-ignore
      delete global.window
      
      expect(isAuthenticated()).toBe(false)
      
      // Restore window
      global.window = originalWindow
    })
  })

  describe('getCurrentUser', () => {
    test('should return user data when valid JSON exists in localStorage', () => {
      localStorageMock.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(mockUser))
      
      const result = getCurrentUser()
      expect(result).toEqual(mockUser)
    })

    test('should return null when no user data exists', () => {
      expect(getCurrentUser()).toBeNull()
    })

    test('should return null when user data is invalid JSON', () => {
      localStorageMock.setItem(STORAGE_KEYS.USER_DATA, 'invalid-json')
      
      expect(getCurrentUser()).toBeNull()
      expect(consoleSpy.error).toHaveBeenCalledWith('Error getting current user:', expect.any(Error))
    })

    test('should return null when localStorage throws error', () => {
      localStorageMock.getItem.mockImplementationOnce(() => {
        throw new Error('localStorage error')
      })
      
      expect(getCurrentUser()).toBeNull()
      expect(consoleSpy.error).toHaveBeenCalledWith('Error getting current user:', expect.any(Error))
    })

    test('should return null in server environment', () => {
      const originalWindow = global.window
      // @ts-ignore
      delete global.window
      
      expect(getCurrentUser()).toBeNull()
      
      global.window = originalWindow
    })
  })

  describe('getAuthToken', () => {
    test('should return token when it exists in localStorage', () => {
      localStorageMock.setItem(STORAGE_KEYS.AUTH_TOKEN, mockToken)
      
      expect(getAuthToken()).toBe(mockToken)
    })

    test('should return null when no token exists', () => {
      expect(getAuthToken()).toBeNull()
    })

    test('should return null when localStorage throws error', () => {
      localStorageMock.getItem.mockImplementationOnce(() => {
        throw new Error('localStorage error')
      })
      
      expect(getAuthToken()).toBeNull()
      expect(consoleSpy.error).toHaveBeenCalledWith('Error getting auth token:', expect.any(Error))
    })

    test('should return null in server environment', () => {
      const originalWindow = global.window
      // @ts-ignore
      delete global.window
      
      expect(getAuthToken()).toBeNull()
      
      global.window = originalWindow
    })
  })

  describe('clearAuthData', () => {
    test('should remove both token and user data from localStorage', () => {
      localStorageMock.setItem(STORAGE_KEYS.AUTH_TOKEN, mockToken)
      localStorageMock.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(mockUser))
      
      clearAuthData()
      
      expect(localStorageMock.removeItem).toHaveBeenCalledWith(STORAGE_KEYS.AUTH_TOKEN)
      expect(localStorageMock.removeItem).toHaveBeenCalledWith(STORAGE_KEYS.USER_DATA)
    })

    test('should handle localStorage errors gracefully', () => {
      localStorageMock.removeItem.mockImplementationOnce(() => {
        throw new Error('localStorage error')
      })
      
      expect(() => clearAuthData()).not.toThrow()
      expect(consoleSpy.error).toHaveBeenCalledWith('Error clearing auth data:', expect.any(Error))
    })

    test('should do nothing in server environment', () => {
      const originalWindow = global.window
      // @ts-ignore
      delete global.window
      
      expect(() => clearAuthData()).not.toThrow()
      
      global.window = originalWindow
    })
  })

  describe('setLoginRedirectUrl', () => {
    test('should store redirect URL in sessionStorage', () => {
      const redirectUrl = '/vn/jlpt/custom'

      setLoginRedirectUrl(redirectUrl)

      expect(sessionStorageMock.setItem).toHaveBeenCalledWith('auth_redirect_url', redirectUrl)
    })

    test('should handle sessionStorage errors gracefully', () => {
      sessionStorageMock.setItem.mockImplementationOnce(() => {
        throw new Error('sessionStorage error')
      })

      expect(() => setLoginRedirectUrl('/test')).not.toThrow()
      expect(consoleSpy.error).toHaveBeenCalledWith('Error setting login redirect URL:', expect.any(Error))
    })

    test('should do nothing in server environment', () => {
      const originalWindow = global.window
      // @ts-ignore
      delete global.window

      expect(() => setLoginRedirectUrl('/test')).not.toThrow()

      global.window = originalWindow
    })
  })

  describe('getLoginRedirectUrl', () => {
    test('should return stored redirect URL from sessionStorage', () => {
      const redirectUrl = '/vn/jlpt/custom'
      sessionStorageMock.setItem('auth_redirect_url', redirectUrl)

      expect(getLoginRedirectUrl()).toBe(redirectUrl)
      expect(sessionStorageMock.removeItem).toHaveBeenCalledWith('auth_redirect_url')
    })

    test('should handle sessionStorage errors gracefully', () => {
      sessionStorageMock.getItem.mockImplementationOnce(() => {
        throw new Error('sessionStorage error')
      })

      expect(getLoginRedirectUrl()).toBe('/vn/home')
      expect(consoleSpy.error).toHaveBeenCalledWith('Error getting login redirect URL:', expect.any(Error))
    })

    test('should return default in server environment', () => {
      const originalWindow = global.window
      // @ts-ignore
      delete global.window

      expect(getLoginRedirectUrl()).toBe('/vn/home')

      global.window = originalWindow
    })
  })

  describe('getLoginUrl', () => {
    test('should detect Vietnamese language from auth path', () => {
      expect(getLoginUrl('/auth/vn/register')).toBe('/auth/vn/login')
    })

    test('should detect Vietnamese language from regular path', () => {
      expect(getLoginUrl('/vn/jlpt')).toBe('/auth/vn/login')
    })

    test('should detect Japanese language from auth path', () => {
      expect(getLoginUrl('/auth/jp/forgot-password')).toBe('/auth/jp/login')
    })

    test('should detect Japanese language from regular path', () => {
      expect(getLoginUrl('/jp/challenge')).toBe('/auth/jp/login')
    })

    test('should detect English language from auth path', () => {
      expect(getLoginUrl('/auth/en/register')).toBe('/auth/en/login')
    })

    test('should detect English language from regular path', () => {
      expect(getLoginUrl('/en/driving')).toBe('/auth/en/login')
    })

    test('should default to Vietnamese when no language detected', () => {
      expect(getLoginUrl('/unknown/path')).toBe('/auth/vn/login')
    })

    test('should return default in server environment', () => {
      const originalWindow = global.window
      // @ts-ignore
      delete global.window

      expect(getLoginUrl()).toBe('/auth/vn/login')

      global.window = originalWindow
    })
  })

  describe('validateSession', () => {
    test('should return valid session when user is authenticated', () => {
      localStorageMock.setItem(STORAGE_KEYS.AUTH_TOKEN, mockToken)
      localStorageMock.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(mockUser))

      const result = validateSession()

      expect(result.isValid).toBe(true)
      expect(result.user).toEqual(mockUser)
    })

    test('should return invalid session when not authenticated', () => {
      const result = validateSession()

      expect(result.isValid).toBe(false)
      expect(result.user).toBeNull()
    })

    test('should clear auth data and return invalid when user data is corrupted', () => {
      localStorageMock.setItem(STORAGE_KEYS.AUTH_TOKEN, mockToken)
      localStorageMock.setItem(STORAGE_KEYS.USER_DATA, 'invalid-json')

      const result = validateSession()

      expect(result.isValid).toBe(false)
      expect(result.user).toBeNull()
      expect(localStorageMock.removeItem).toHaveBeenCalledWith(STORAGE_KEYS.AUTH_TOKEN)
      expect(localStorageMock.removeItem).toHaveBeenCalledWith(STORAGE_KEYS.USER_DATA)
    })

    test('should clear auth data when user data is corrupted but token exists', () => {
      localStorageMock.setItem(STORAGE_KEYS.AUTH_TOKEN, mockToken)
      localStorageMock.setItem(STORAGE_KEYS.USER_DATA, 'invalid-json') // This will make getCurrentUser() return null

      const result = validateSession()

      expect(result.isValid).toBe(false)
      expect(result.user).toBeNull()
      expect(localStorageMock.removeItem).toHaveBeenCalledWith(STORAGE_KEYS.AUTH_TOKEN)
      expect(localStorageMock.removeItem).toHaveBeenCalledWith(STORAGE_KEYS.USER_DATA)
    })
  })
})
