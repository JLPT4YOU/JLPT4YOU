/**
 * Integration Tests for Middleware System
 * End-to-end testing of the complete middleware system
 */

import { NextRequest } from 'next/server'
import { middleware } from '../main'
import { initializeMiddlewareSystem, getSystemHealth } from '../system'

// Mock Next.js modules for integration testing
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

// ===== MOCK HELPERS =====

function createIntegrationRequest(options: {
  pathname?: string
  origin?: string
  cookies?: Record<string, string>
  headers?: Record<string, string>
  searchParams?: URLSearchParams
} = {}): NextRequest {
  const mockCookies = new Map()
  if (options.cookies) {
    Object.entries(options.cookies).forEach(([name, value]) => {
      mockCookies.set(name, { value })
    })
  }

  const mockHeaders = new Map()
  if (options.headers) {
    Object.entries(options.headers).forEach(([name, value]) => {
      mockHeaders.set(name, value)
    })
  }

  return {
    nextUrl: {
      pathname: options.pathname || '/',
      origin: options.origin || 'https://jlpt4you.com',
      searchParams: options.searchParams || new URLSearchParams()
    },
    cookies: {
      get: (name: string) => mockCookies.get(name),
      set: jest.fn(),
      has: (name: string) => mockCookies.has(name)
    },
    headers: {
      get: (name: string) => mockHeaders.get(name)
    }
  } as any
}

// ===== INTEGRATION TESTS =====

describe('Middleware System Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('System Initialization', () => {
    test('should initialize middleware system successfully', () => {
      const result = initializeMiddlewareSystem()
      
      expect(result.success).toBe(true)
      expect(result.systemInfo).toHaveProperty('version')
      expect(result.systemInfo).toHaveProperty('name')
      expect(result.health).toHaveProperty('status')
      expect(result.health).toHaveProperty('checks')
    })

    test('should report system health', () => {
      const health = getSystemHealth()
      
      expect(health.status).toMatch(/healthy|warning|error/)
      expect(Array.isArray(health.checks)).toBe(true)
      expect(health.summary).toHaveProperty('total')
      expect(health.summary).toHaveProperty('passed')
      expect(health.summary).toHaveProperty('failed')
      expect(health.summary).toHaveProperty('warnings')
    })
  })

  describe('End-to-End Middleware Flow', () => {
    test('should handle unauthenticated user accessing root path', async () => {
      const { NextResponse } = require('next/server')
      
      const request = createIntegrationRequest({
        pathname: '/',
        headers: {
          'accept-language': 'vi-VN,vi;q=0.9'
        }
      })

      await middleware(request)

      // Should redirect to Vietnamese landing page
      expect(NextResponse.redirect).toHaveBeenCalledWith(
        expect.stringContaining('/auth/vn/landing')
      )
    })

    test('should handle authenticated user with language-prefixed URL', async () => {
      const { NextResponse } = require('next/server')
      
      const request = createIntegrationRequest({
        pathname: '/vn/home',
        cookies: {
          'jlpt4you_auth_token': 'valid-token',
          'preferred-language': 'vn'
        }
      })

      await middleware(request)

      // Should redirect to clean URL for authenticated users
      expect(NextResponse.redirect).toHaveBeenCalledWith(
        expect.stringContaining('/home')
      )
    })

    test('should handle language detection from multiple sources', async () => {
      const { NextResponse } = require('next/server')
      
      const request = createIntegrationRequest({
        pathname: '/login',
        headers: {
          'accept-language': 'ja-JP,ja;q=0.9,en;q=0.8',
          'cf-ipcountry': 'JP'
        }
      })

      await middleware(request)

      // Should redirect to Japanese auth page
      expect(NextResponse.redirect).toHaveBeenCalledWith(
        expect.stringContaining('/auth/jp/login')
      )
    })

    test('should handle protected route access without authentication', async () => {
      const { NextResponse } = require('next/server')
      
      const request = createIntegrationRequest({
        pathname: '/home',
        headers: {
          'accept-language': 'en-US,en;q=0.9'
        }
      })

      await middleware(request)

      // Should redirect to English login page
      expect(NextResponse.redirect).toHaveBeenCalledWith(
        expect.stringContaining('/auth/en/login')
      )
    })

    test('should skip middleware for static files', async () => {
      const { NextResponse } = require('next/server')
      
      const request = createIntegrationRequest({
        pathname: '/_next/static/css/app.css'
      })

      await middleware(request)

      // Should continue without redirect
      expect(NextResponse.next).toHaveBeenCalled()
      expect(NextResponse.redirect).not.toHaveBeenCalled()
    })

    test('should handle API routes correctly', async () => {
      const { NextResponse } = require('next/server')
      
      const request = createIntegrationRequest({
        pathname: '/api/users'
      })

      await middleware(request)

      // Should continue without processing
      expect(NextResponse.next).toHaveBeenCalled()
      expect(NextResponse.redirect).not.toHaveBeenCalled()
    })

    test('should preserve query parameters in redirects', async () => {
      const { NextResponse } = require('next/server')
      
      const searchParams = new URLSearchParams('test=value&foo=bar')
      const request = createIntegrationRequest({
        pathname: '/jlpt',
        searchParams,
        headers: {
          'accept-language': 'vi-VN'
        }
      })

      await middleware(request)

      // Should redirect with preserved query parameters
      expect(NextResponse.redirect).toHaveBeenCalledWith(
        expect.stringContaining('test=value&foo=bar')
      )
    })

    test('should handle testing bypass for exam pages', async () => {
      const { NextResponse } = require('next/server')
      
      const request = createIntegrationRequest({
        pathname: '/jlpt/test/n3'
      })

      await middleware(request)

      // Should allow access without authentication (testing mode)
      // The exact behavior depends on TESTING_CONFIG.SKIP_AUTH_FOR_TESTING
      expect(NextResponse.next).toHaveBeenCalled()
    })
  })

  describe('Error Handling Integration', () => {
    test('should handle malformed requests gracefully', async () => {
      const { NextResponse } = require('next/server')
      
      // Create a request with missing properties
      const request = {
        nextUrl: {
          pathname: '/test'
          // Missing origin and searchParams
        },
        cookies: {
          get: () => undefined
        },
        headers: {
          get: () => null
        }
      } as any

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()

      await middleware(request)

      // Should handle error and return basic response
      expect(NextResponse.next).toHaveBeenCalled()
      
      consoleSpy.mockRestore()
    })

    test('should apply security headers even on errors', async () => {
      const { NextResponse } = require('next/server')
      
      const request = createIntegrationRequest({
        pathname: '/test'
      })

      // Mock an error in language detection
      const originalConsoleError = console.error
      console.error = jest.fn()

      const mockResponse = {
        headers: {
          set: jest.fn()
        }
      }
      NextResponse.next.mockReturnValue(mockResponse)

      await middleware(request)

      // Should still apply basic security headers
      expect(mockResponse.headers.set).toHaveBeenCalledWith('X-Frame-Options', 'DENY')
      expect(mockResponse.headers.set).toHaveBeenCalledWith('X-Content-Type-Options', 'nosniff')

      console.error = originalConsoleError
    })
  })

  describe('Performance Integration', () => {
    test('should complete middleware processing within reasonable time', async () => {
      const startTime = performance.now()
      
      const request = createIntegrationRequest({
        pathname: '/home',
        cookies: {
          'preferred-language': 'vn'
        }
      })

      await middleware(request)

      const duration = performance.now() - startTime
      
      // Should complete within 100ms (reasonable for middleware)
      expect(duration).toBeLessThan(100)
    })

    test('should handle concurrent requests efficiently', async () => {
      const requests = Array.from({ length: 10 }, (_, i) => 
        createIntegrationRequest({
          pathname: `/test-${i}`,
          headers: {
            'accept-language': i % 2 === 0 ? 'vi-VN' : 'ja-JP'
          }
        })
      )

      const startTime = performance.now()
      
      // Process all requests concurrently
      await Promise.all(requests.map(request => middleware(request)))

      const duration = performance.now() - startTime
      
      // Should handle 10 concurrent requests within 500ms
      expect(duration).toBeLessThan(500)
    })
  })

  describe('Configuration Integration', () => {
    test('should use consistent configuration across all modules', () => {
      const health = getSystemHealth()
      
      // All modules should be loaded successfully
      const moduleChecks = health.checks.filter(check => 
        check.name.startsWith('Module:')
      )
      
      expect(moduleChecks).toHaveLength(4) // 4 modules
      moduleChecks.forEach(check => {
        expect(check.status).toBe('pass')
      })
    })

    test('should validate configuration consistency', () => {
      const result = initializeMiddlewareSystem()
      
      // System should initialize successfully with valid configuration
      expect(result.success).toBe(true)
      expect(result.health.status).not.toBe('error')
    })
  })

  describe('Backward Compatibility', () => {
    test('should maintain compatibility with existing routing patterns', async () => {
      const { NextResponse } = require('next/server')
      
      // Test legacy numeric language codes
      const request = createIntegrationRequest({
        pathname: '/1/home', // Legacy: 1 = vn
        cookies: {
          'jlpt4you_auth_token': 'valid-token'
        }
      })

      await middleware(request)

      // Should handle legacy codes and redirect to clean URL
      expect(NextResponse.redirect).toHaveBeenCalledWith(
        expect.stringContaining('/home')
      )
    })

    test('should support existing cookie names and formats', async () => {
      const request = createIntegrationRequest({
        pathname: '/test',
        cookies: {
          'preferred-language': 'jp', // Existing cookie format
          'jlpt4you_auth_token': 'existing-token' // Existing auth cookie
        }
      })

      // Should process without errors
      await expect(middleware(request)).resolves.not.toThrow()
    })
  })
})

// ===== PERFORMANCE BENCHMARKS =====

describe('Middleware Performance Benchmarks', () => {
  test('should meet performance requirements', async () => {
    const scenarios = [
      { name: 'Root path redirect', pathname: '/' },
      { name: 'Auth page access', pathname: '/login' },
      { name: 'Protected route', pathname: '/home' },
      { name: 'Feature route', pathname: '/jlpt/custom' },
      { name: 'Language-prefixed route', pathname: '/vn/challenge' }
    ]

    for (const scenario of scenarios) {
      const request = createIntegrationRequest({
        pathname: scenario.pathname,
        headers: { 'accept-language': 'vi-VN' }
      })

      const startTime = performance.now()
      await middleware(request)
      const duration = performance.now() - startTime

      // Each scenario should complete within 50ms
      expect(duration).toBeLessThan(50)
    }
  })
})
