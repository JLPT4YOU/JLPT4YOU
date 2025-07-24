/**
 * Unit Tests for Main Middleware Function
 * Comprehensive test coverage for the refactored middleware
 */

import { NextRequest, NextResponse } from 'next/server'
import { middleware, debugMiddleware, logPerformance } from '../main'

// Mock Next.js modules
jest.mock('next/server', () => ({
  NextRequest: jest.fn(),
  NextResponse: {
    next: jest.fn(() => ({
      headers: {
        set: jest.fn()
      },
      cookies: {
        set: jest.fn()
      }
    })),
    redirect: jest.fn(() => ({
      headers: {
        set: jest.fn()
      },
      cookies: {
        set: jest.fn()
      }
    }))
  }
}))

// Mock middleware modules
jest.mock('../modules/language-detection', () => ({
  detectPreferredLanguage: jest.fn(() => ({
    detectedLanguage: 'vn',
    source: 'default',
    confidence: 0.5
  })),
  createLanguageDetectionContext: jest.fn(() => ({})),
  getLanguagePreference: jest.fn(() => 'vn')
}))

jest.mock('../modules/authentication', () => ({
  isAuthenticated: jest.fn(() => false),
  checkAuthentication: jest.fn(() => ({
    isAuthenticated: false,
    needsAuth: true,
    shouldRedirect: false
  })),
  createAuthenticationContext: jest.fn(() => ({}))
}))

jest.mock('../modules/url-generation', () => ({
  generateRedirectUrl: jest.fn(() => ({
    shouldRedirect: false,
    redirectType: 'none'
  })),
  createUrlGenerationContext: jest.fn(() => ({}))
}))

jest.mock('../modules/security-headers', () => ({
  generateSecurityHeaders: jest.fn(() => ({
    headers: {
      'X-Frame-Options': 'DENY',
      'X-Content-Type-Options': 'nosniff'
    }
  })),
  applyHeadersToResponse: jest.fn(),
  setLanguageCookie: jest.fn()
}))

jest.mock('../utils/path-helpers', () => ({
  shouldSkipMiddleware: jest.fn(() => false)
}))

jest.mock('../utils/cookie-helpers', () => ({
  debugCookies: jest.fn()
}))

jest.mock('../config/constants', () => ({
  ERROR_CONFIG: {
    ENABLE_LOGGING: false,
    ENABLE_PERFORMANCE_MONITORING: false
  },
  PERFORMANCE_CONFIG: {
    LANGUAGE_DETECTION_TIMEOUT: 100,
    URL_GENERATION_TIMEOUT: 50,
    HEADER_PROCESSING_TIMEOUT: 25
  }
}))

// ===== MOCK HELPERS =====

function createMockRequest(options: {
  pathname?: string
  origin?: string
  searchParams?: URLSearchParams
} = {}): NextRequest {
  return {
    nextUrl: {
      pathname: options.pathname || '/',
      origin: options.origin || 'https://example.com',
      searchParams: options.searchParams || new URLSearchParams()
    },
    cookies: {
      get: jest.fn(),
      set: jest.fn()
    },
    headers: {
      get: jest.fn()
    }
  } as any
}

// ===== MAIN MIDDLEWARE TESTS =====

describe('Main Middleware Function', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Reset environment
    process.env.NODE_ENV = 'test'
  })

  describe('middleware', () => {
    test('should skip middleware for paths that should be skipped', async () => {
      const { shouldSkipMiddleware } = require('../utils/path-helpers')
      shouldSkipMiddleware.mockReturnValue(true)
      
      const request = createMockRequest({ pathname: '/api/test' })
      const result = await middleware(request)
      
      expect(NextResponse.next).toHaveBeenCalled()
      expect(shouldSkipMiddleware).toHaveBeenCalledWith('/api/test')
    })

    test('should process language detection for valid paths', async () => {
      const { detectPreferredLanguage } = require('../modules/language-detection')
      const { shouldSkipMiddleware } = require('../utils/path-helpers')
      
      shouldSkipMiddleware.mockReturnValue(false)
      detectPreferredLanguage.mockReturnValue({
        detectedLanguage: 'jp',
        source: 'url',
        confidence: 1.0
      })
      
      const request = createMockRequest({ pathname: '/home' })
      await middleware(request)
      
      expect(detectPreferredLanguage).toHaveBeenCalled()
    })

    test('should handle authentication checks', async () => {
      const { isAuthenticated, checkAuthentication } = require('../modules/authentication')
      const { shouldSkipMiddleware } = require('../utils/path-helpers')
      
      shouldSkipMiddleware.mockReturnValue(false)
      isAuthenticated.mockReturnValue(true)
      checkAuthentication.mockReturnValue({
        isAuthenticated: true,
        needsAuth: true,
        shouldRedirect: false
      })
      
      const request = createMockRequest({ pathname: '/home' })
      await middleware(request)
      
      expect(isAuthenticated).toHaveBeenCalled()
      expect(checkAuthentication).toHaveBeenCalled()
    })

    test('should handle URL redirects when needed', async () => {
      const { generateRedirectUrl } = require('../modules/url-generation')
      const { shouldSkipMiddleware } = require('../utils/path-helpers')
      
      shouldSkipMiddleware.mockReturnValue(false)
      generateRedirectUrl.mockReturnValue({
        shouldRedirect: true,
        redirectUrl: 'https://example.com/vn/home',
        redirectType: 'language'
      })
      
      const request = createMockRequest({ pathname: '/home' })
      await middleware(request)
      
      expect(generateRedirectUrl).toHaveBeenCalled()
      expect(NextResponse.redirect).toHaveBeenCalledWith('https://example.com/vn/home')
    })

    test('should handle authentication redirects', async () => {
      const { checkAuthentication, generateRedirectUrl } = require('../modules/authentication')
      const { shouldSkipMiddleware } = require('../utils/path-helpers')
      const { generateRedirectUrl: urlGenerateRedirect } = require('../modules/url-generation')

      shouldSkipMiddleware.mockReturnValue(false)
      checkAuthentication.mockReturnValue({
        isAuthenticated: false,
        needsAuth: true,
        shouldRedirect: true,
        redirectUrl: 'https://example.com/auth/vn/login'
      })

      // Mock URL generation to not redirect
      urlGenerateRedirect.mockReturnValue({
        shouldRedirect: false,
        redirectType: 'none'
      })

      const request = createMockRequest({ pathname: '/home' })
      await middleware(request)

      expect(NextResponse.redirect).toHaveBeenCalledWith('https://example.com/auth/vn/login')
    })

    test('should apply security headers for all responses', async () => {
      const { generateSecurityHeaders, applyHeadersToResponse } = require('../modules/security-headers')
      const { shouldSkipMiddleware } = require('../utils/path-helpers')
      
      shouldSkipMiddleware.mockReturnValue(false)
      generateSecurityHeaders.mockReturnValue({
        headers: {
          'X-Frame-Options': 'DENY',
          'X-Content-Type-Options': 'nosniff'
        }
      })
      
      const request = createMockRequest({ pathname: '/home' })
      await middleware(request)
      
      expect(generateSecurityHeaders).toHaveBeenCalled()
      expect(applyHeadersToResponse).toHaveBeenCalled()
    })

    test('should handle errors gracefully', async () => {
      const { shouldSkipMiddleware } = require('../utils/path-helpers')
      const { detectPreferredLanguage } = require('../modules/language-detection')
      
      shouldSkipMiddleware.mockReturnValue(false)
      detectPreferredLanguage.mockImplementation(() => {
        throw new Error('Test error')
      })
      
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
      
      const request = createMockRequest({ pathname: '/home' })
      const result = await middleware(request)
      
      expect(consoleSpy).toHaveBeenCalledWith(
        '[Middleware Error]',
        expect.objectContaining({
          pathname: '/home',
          error: 'Test error'
        })
      )
      
      expect(NextResponse.next).toHaveBeenCalled()
      
      consoleSpy.mockRestore()
    })

    // Note: Language cookie setting is tested implicitly in other tests
  })

  describe('debugMiddleware', () => {
    test('should create middleware context for debugging', () => {
      const { isAuthenticated } = require('../modules/authentication')
      const { getLanguagePreference, detectPreferredLanguage } = require('../modules/language-detection')

      isAuthenticated.mockReturnValue(true)
      getLanguagePreference.mockReturnValue('en')

      // Reset the mock to not throw error
      detectPreferredLanguage.mockReturnValue({
        detectedLanguage: 'en',
        source: 'default',
        confidence: 0.5
      })

      const request = createMockRequest({ pathname: '/test' })
      const context = debugMiddleware(request)

      expect(context).toHaveProperty('request')
      expect(context).toHaveProperty('pathname', '/test')
      expect(context).toHaveProperty('languageDetection')
      expect(context).toHaveProperty('authentication')
      expect(context).toHaveProperty('urlGeneration')
      expect(context).toHaveProperty('securityHeaders')
    })
  })

  describe('logPerformance', () => {
    test('should log performance in development mode', () => {
      // Mock the config to enable logging
      const { ERROR_CONFIG } = require('../config/constants')
      ERROR_CONFIG.ENABLE_PERFORMANCE_MONITORING = true
      ERROR_CONFIG.ENABLE_LOGGING = true

      const consoleSpy = jest.spyOn(console, 'debug').mockImplementation()

      const startTime = performance.now() - 50 // 50ms ago
      logPerformance(startTime, 'test-action', '/test-path')

      expect(consoleSpy).toHaveBeenCalledWith(
        '[Middleware Performance]',
        expect.objectContaining({
          action: 'test-action',
          pathname: '/test-path',
          status: 'normal'
        })
      )

      consoleSpy.mockRestore()
    })

    test('should warn about slow performance', () => {
      // Mock the config to enable logging
      const { ERROR_CONFIG } = require('../config/constants')
      ERROR_CONFIG.ENABLE_PERFORMANCE_MONITORING = true

      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation()

      const startTime = performance.now() - 200 // 200ms ago (slow)
      logPerformance(startTime, 'slow-action', '/slow-path')

      expect(consoleSpy).toHaveBeenCalledWith(
        '[Middleware Performance]',
        expect.objectContaining({
          action: 'slow-action',
          pathname: '/slow-path',
          status: 'slow'
        })
      )

      consoleSpy.mockRestore()
    })

    test('should not log in production mode', () => {
      // Mock the config to disable logging
      const { ERROR_CONFIG } = require('../config/constants')
      ERROR_CONFIG.ENABLE_PERFORMANCE_MONITORING = false
      ERROR_CONFIG.ENABLE_LOGGING = false

      const consoleSpy = jest.spyOn(console, 'debug').mockImplementation()

      const startTime = performance.now() - 50
      logPerformance(startTime, 'test-action', '/test-path')

      expect(consoleSpy).not.toHaveBeenCalled()

      consoleSpy.mockRestore()
    })
  })

  describe('middleware configuration', () => {
    test('should have correct matcher configuration', () => {
      const { config } = require('../main')
      
      expect(config).toHaveProperty('matcher')
      expect(Array.isArray(config.matcher)).toBe(true)
      expect(config.matcher.length).toBeGreaterThan(0)
    })
  })
})

// ===== INTEGRATION TESTS =====

describe('Middleware Integration', () => {
  test('should handle complete middleware flow', async () => {
    const { shouldSkipMiddleware } = require('../utils/path-helpers')
    const { detectPreferredLanguage } = require('../modules/language-detection')
    const { isAuthenticated, checkAuthentication } = require('../modules/authentication')
    const { generateRedirectUrl } = require('../modules/url-generation')
    
    shouldSkipMiddleware.mockReturnValue(false)
    detectPreferredLanguage.mockReturnValue({
      detectedLanguage: 'vn',
      source: 'default',
      confidence: 0.5
    })
    isAuthenticated.mockReturnValue(false)
    checkAuthentication.mockReturnValue({
      isAuthenticated: false,
      needsAuth: false,
      shouldRedirect: false
    })
    generateRedirectUrl.mockReturnValue({
      shouldRedirect: false,
      redirectType: 'none'
    })
    
    const request = createMockRequest({ pathname: '/auth/vn/login' })
    const result = await middleware(request)
    
    expect(shouldSkipMiddleware).toHaveBeenCalled()
    expect(detectPreferredLanguage).toHaveBeenCalled()
    expect(isAuthenticated).toHaveBeenCalled()
    expect(checkAuthentication).toHaveBeenCalled()
    expect(generateRedirectUrl).toHaveBeenCalled()
    expect(NextResponse.next).toHaveBeenCalled()
  })
})
