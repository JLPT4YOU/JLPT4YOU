/**
 * Unit Tests for Authentication Module
 * Comprehensive test coverage for authentication functionality
 */

import {
  isAuthenticated,
  isProtectedRoute,
  checkAuthentication,
  analyzeRouteProtection,
  shouldBypassAuthForTesting,
  generateAuthRedirectUrl,
  validateAuthToken,
  getAuthenticationStatus,
  createAuthenticationContext
} from '../modules/authentication'
import type { AuthenticationContext } from '../types/middleware'

// ===== MOCK HELPERS =====

const mockRequest = {
  nextUrl: { 
    pathname: '/',
    origin: 'https://example.com'
  },
  cookies: {
    get: jest.fn(),
    set: jest.fn(),
    has: jest.fn()
  },
  headers: {
    get: jest.fn()
  }
} as any

function createMockAuthContext(options: {
  pathname?: string
  isAuthenticated?: boolean
  needsAuth?: boolean
  isTestingExamPage?: boolean
} = {}): AuthenticationContext {
  return {
    request: mockRequest,
    pathname: options.pathname || '/',
    isAuthenticated: options.isAuthenticated || false,
    needsAuth: options.needsAuth || false,
    isTestingExamPage: options.isTestingExamPage || false
  }
}

// ===== AUTHENTICATION TESTS =====

describe('Authentication Module', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })
  
  describe('isAuthenticated', () => {
    test('should return true when auth token exists', () => {
      mockRequest.cookies.get.mockReturnValue({ value: 'valid-token' })
      
      const result = isAuthenticated(mockRequest)
      
      expect(result).toBe(true)
      expect(mockRequest.cookies.get).toHaveBeenCalledWith('jlpt4you_auth_token')
    })
    
    test('should return false when auth token does not exist', () => {
      mockRequest.cookies.get.mockReturnValue(undefined)
      
      const result = isAuthenticated(mockRequest)
      
      expect(result).toBe(false)
    })
    
    test('should return false when auth token is empty', () => {
      mockRequest.cookies.get.mockReturnValue({ value: '' })
      
      const result = isAuthenticated(mockRequest)
      
      expect(result).toBe(false)
    })
  })
  
  describe('isProtectedRoute', () => {
    test('should return false for public routes', () => {
      expect(isProtectedRoute('/auth/vn/login')).toBe(false)
      expect(isProtectedRoute('/auth/jp/register')).toBe(false)
      expect(isProtectedRoute('/vn/landing')).toBe(false)
      expect(isProtectedRoute('/login')).toBe(false)
      expect(isProtectedRoute('/register')).toBe(false)
    })
    
    test('should return true for protected routes', () => {
      expect(isProtectedRoute('/home')).toBe(true)
      expect(isProtectedRoute('/jlpt')).toBe(true)
      expect(isProtectedRoute('/challenge')).toBe(true)
      expect(isProtectedRoute('/driving')).toBe(true)
      expect(isProtectedRoute('/vn/home')).toBe(true)
    })
    
    test('should return true for nested protected routes', () => {
      expect(isProtectedRoute('/jlpt/custom/n3')).toBe(true)
      expect(isProtectedRoute('/challenge/n2/test')).toBe(true)
      expect(isProtectedRoute('/driving/honmen')).toBe(true)
    })
  })
  
  describe('checkAuthentication', () => {
    test('should allow access for public routes', () => {
      const context = createMockAuthContext({
        pathname: '/auth/vn/login',
        isAuthenticated: false,
        needsAuth: false
      })
      
      const result = checkAuthentication(context)
      
      expect(result.shouldRedirect).toBe(false)
      expect(result.needsAuth).toBe(false)
    })
    
    test('should redirect unauthenticated users from protected routes', () => {
      const context = createMockAuthContext({
        pathname: '/home',
        isAuthenticated: false,
        needsAuth: true
      })
      
      const result = checkAuthentication(context)
      
      expect(result.shouldRedirect).toBe(true)
      expect(result.redirectUrl).toContain('/auth/')
      expect(result.redirectUrl).toContain('/login')
    })
    
    test('should allow authenticated users to access protected routes', () => {
      const context = createMockAuthContext({
        pathname: '/home',
        isAuthenticated: true,
        needsAuth: true
      })
      
      const result = checkAuthentication(context)
      
      expect(result.shouldRedirect).toBe(false)
      expect(result.isAuthenticated).toBe(true)
      expect(result.needsAuth).toBe(true)
    })
    
    test('should bypass auth for testing exam pages', () => {
      const context = createMockAuthContext({
        pathname: '/jlpt/test',
        isAuthenticated: false,
        needsAuth: true,
        isTestingExamPage: true
      })
      
      const result = checkAuthentication(context)
      
      expect(result.shouldRedirect).toBe(false)
      expect(result.needsAuth).toBe(false)
    })
  })
  
  describe('analyzeRouteProtection', () => {
    test('should correctly analyze public routes', () => {
      const analysis = analyzeRouteProtection('/auth/vn/login')
      
      expect(analysis.isPublic).toBe(true)
      expect(analysis.isProtected).toBe(false)
      expect(analysis.isAuthRoute).toBe(true)
      expect(analysis.requiresAuth).toBe(false)
    })
    
    test('should correctly analyze protected routes', () => {
      const analysis = analyzeRouteProtection('/home')
      
      expect(analysis.isPublic).toBe(false)
      expect(analysis.isProtected).toBe(true)
      expect(analysis.isAuthRoute).toBe(false)
      expect(analysis.requiresAuth).toBe(true)
    })
    
    test('should correctly analyze language-specific home routes', () => {
      const analysis = analyzeRouteProtection('/vn/home')
      
      expect(analysis.isLanguageHomeRoute).toBe(true)
      expect(analysis.requiresAuth).toBe(true)
    })
    
    test('should correctly analyze language-specific auth routes', () => {
      const analysis = analyzeRouteProtection('/vn/login')
      
      expect(analysis.isLanguageAuthRoute).toBe(true)
      expect(analysis.requiresAuth).toBe(false)
    })
  })
  
  describe('shouldBypassAuthForTesting', () => {
    test('should return true for testing paths', () => {
      expect(shouldBypassAuthForTesting('/jlpt/test')).toBe(true)
      expect(shouldBypassAuthForTesting('/challenge/n3')).toBe(true)
      expect(shouldBypassAuthForTesting('/test/something')).toBe(true)
    })
    
    test('should return false for non-testing paths', () => {
      expect(shouldBypassAuthForTesting('/home')).toBe(false)
      expect(shouldBypassAuthForTesting('/settings')).toBe(false)
      expect(shouldBypassAuthForTesting('/auth/vn/login')).toBe(false)
    })
  })
  
  describe('generateAuthRedirectUrl', () => {
    test('should generate login URL with detected language', () => {
      mockRequest.cookies.get.mockReturnValue({ value: 'vn' })
      
      const result = generateAuthRedirectUrl(mockRequest, '/home')
      
      expect(result).toBe('https://example.com/auth/vn/login')
    })
    
    test('should use default language when no preference found', () => {
      mockRequest.cookies.get.mockReturnValue(undefined)
      mockRequest.headers.get.mockReturnValue(null)
      
      const result = generateAuthRedirectUrl(mockRequest, '/home')
      
      expect(result).toBe('https://example.com/auth/vn/login')
    })
  })
  
  describe('validateAuthToken', () => {
    test('should return true for valid tokens', () => {
      expect(validateAuthToken('valid-token-123')).toBe(true)
      expect(validateAuthToken('another-valid-token')).toBe(true)
    })
    
    test('should return false for invalid tokens', () => {
      expect(validateAuthToken('')).toBe(false)
      expect(validateAuthToken('   ')).toBe(false)
      expect(validateAuthToken(null as any)).toBe(false)
      expect(validateAuthToken(undefined as any)).toBe(false)
    })
  })
  
  describe('getAuthenticationStatus', () => {
    test('should return complete auth status for authenticated user', () => {
      mockRequest.cookies.get.mockReturnValue({ value: 'valid-token' })
      
      const status = getAuthenticationStatus(mockRequest)
      
      expect(status.isAuthenticated).toBe(true)
      expect(status.hasToken).toBe(true)
      expect(status.tokenValid).toBe(true)
      expect(status.tokenExpired).toBe(false)
    })
    
    test('should return complete auth status for unauthenticated user', () => {
      mockRequest.cookies.get.mockReturnValue(undefined)
      
      const status = getAuthenticationStatus(mockRequest)
      
      expect(status.isAuthenticated).toBe(false)
      expect(status.hasToken).toBe(false)
      expect(status.tokenValid).toBe(false)
      expect(status.tokenExpired).toBe(false)
    })
  })
  
  describe('createAuthenticationContext', () => {
    test('should create context from request', () => {
      mockRequest.nextUrl.pathname = '/home'
      mockRequest.cookies.get.mockReturnValue({ value: 'valid-token' })
      
      const context = createAuthenticationContext(mockRequest)
      
      expect(context.pathname).toBe('/home')
      expect(context.isAuthenticated).toBe(true)
      expect(context.needsAuth).toBe(true)
      expect(context.isTestingExamPage).toBe(false)
    })
  })
})

// ===== INTEGRATION TESTS =====

describe('Authentication Integration', () => {
  test('should handle complete authentication flow', () => {
    // Scenario: Unauthenticated user accessing protected route
    mockRequest.nextUrl.pathname = '/home' // Use /home instead of /jlpt/custom to avoid testing bypass
    mockRequest.cookies.get.mockReturnValue(undefined)

    const context = createAuthenticationContext(mockRequest)
    const result = checkAuthentication(context)

    expect(context.isAuthenticated).toBe(false)
    expect(context.needsAuth).toBe(true)
    expect(result.shouldRedirect).toBe(true)
    expect(result.redirectUrl).toContain('/auth/')
  })
  
  test('should handle testing bypass correctly', () => {
    // Scenario: Testing exam page should bypass auth
    mockRequest.nextUrl.pathname = '/jlpt/test'
    mockRequest.cookies.get.mockReturnValue(undefined)
    
    const context = createAuthenticationContext(mockRequest)
    const result = checkAuthentication(context)
    
    expect(result.shouldRedirect).toBe(false)
    expect(result.needsAuth).toBe(false)
  })
})
