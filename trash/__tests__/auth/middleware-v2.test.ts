/**
 * 🧪 UNIT TESTS - Secure Authentication Middleware V2
 * Comprehensive security and performance testing
 */

import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals'
import { NextRequest, NextResponse } from 'next/server'
import { 
  authMiddleware, 
  clearRateLimitCache, 
  getRateLimitStats,
  addSecurityHeaders 
} from '@/lib/auth/middleware-v2'

// Mock dependencies
const mockCreateSupabaseServerClient = jest.fn()
const mockGetRouteProtection = jest.fn()
const mockCheckUserRole = jest.fn()

jest.mock('@/lib/auth/supabase-ssr', () => ({
  createSupabaseServerClient: mockCreateSupabaseServerClient
}))

jest.mock('@/lib/auth/rbac', () => ({
  getRouteProtection: mockGetRouteProtection,
  checkUserRole: mockCheckUserRole
}))

jest.mock('@/lib/monitoring', () => ({
  logAuthEvent: jest.fn(),
  logSecurityEvent: jest.fn()
}))

// Import mocked modules
import { logAuthEvent, logSecurityEvent } from '@/lib/monitoring'

const mockLogAuthEvent = logAuthEvent as jest.MockedFunction<typeof logAuthEvent>
const mockLogSecurityEvent = logSecurityEvent as jest.MockedFunction<typeof logSecurityEvent>

describe('Secure Authentication Middleware V2', () => {
  beforeEach(() => {
    clearRateLimitCache()
    jest.clearAllMocks()
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('Rate Limiting', () => {
    it('should allow requests within rate limit', async () => {
      // Arrange
      const request = new NextRequest('http://localhost:3000/home')
      
      mockCreateSupabaseServerClient.mockReturnValue({
        supabase: {
          auth: {
            getUser: jest.fn().mockResolvedValue({
              data: { user: { id: 'user-123', email: 'test@example.com' } },
              error: null
            })
          }
        } as any,
        response: NextResponse.next()
      })

      mockGetRouteProtection.mockReturnValue({
        requiresAuth: true,
        requiredRole: undefined,
        description: 'Protected route'
      })

      // Act
      const response = await authMiddleware(request)

      // Assert
      expect(response.status).not.toBe(429)
    })

    it('should block requests exceeding rate limit', async () => {
      // Arrange
      const request = new NextRequest('http://localhost:3000/home')
      
      // Simulate many requests from same IP
      const promises = Array.from({ length: 150 }, () => authMiddleware(request))
      
      // Act
      const responses = await Promise.all(promises)
      
      // Assert
      const rateLimitedResponses = responses.filter(r => r.status === 429)
      expect(rateLimitedResponses.length).toBeGreaterThan(0)
    })

    it('should track rate limit statistics', async () => {
      // Arrange
      const request = new NextRequest('http://localhost:3000/home')
      
      mockCreateSupabaseServerClient.mockReturnValue({
        supabase: {
          auth: {
            getUser: jest.fn().mockResolvedValue({
              data: { user: null },
              error: null
            })
          }
        } as any,
        response: NextResponse.next()
      })

      // Act
      await authMiddleware(request)
      const stats = getRateLimitStats()

      // Assert
      expect(stats.totalEntries).toBeGreaterThan(0)
    })
  })

  describe('Authentication Verification', () => {
    it('should allow access to public routes without authentication', async () => {
      // Arrange
      const request = new NextRequest('http://localhost:3000/')
      
      mockGetRouteProtection.mockReturnValue({
        requiresAuth: false,
        description: 'Public route'
      })

      mockCreateSupabaseServerClient.mockReturnValue({
        supabase: {
          auth: {
            getUser: jest.fn().mockResolvedValue({
              data: { user: null },
              error: null
            })
          }
        } as any,
        response: NextResponse.next()
      })

      // Act
      const response = await authMiddleware(request)

      // Assert
      expect(response.status).not.toBe(302) // Not redirected
    })

    it('should redirect unauthenticated users from protected routes', async () => {
      // Arrange
      const request = new NextRequest('http://localhost:3000/home')
      
      mockGetRouteProtection.mockReturnValue({
        requiresAuth: true,
        description: 'Protected route'
      })

      mockCreateSupabaseServerClient.mockReturnValue({
        supabase: {
          auth: {
            getUser: jest.fn().mockResolvedValue({
              data: { user: null },
              error: { message: 'Not authenticated' }
            })
          }
        } as any,
        response: NextResponse.next()
      })

      // Act
      const response = await authMiddleware(request)

      // Assert
      expect(response.status).toBe(302) // Redirected
      expect(response.headers.get('location')).toContain('/auth/login')
    })

    it('should allow authenticated users to access protected routes', async () => {
      // Arrange
      const request = new NextRequest('http://localhost:3000/home')
      // Add auth token to cookies
      request.cookies.set('jlpt4you_auth_token', 'valid-token')
      
      mockGetRouteProtection.mockReturnValue({
        requiresAuth: true,
        description: 'Protected route'
      })

      mockCreateSupabaseServerClient.mockReturnValue({
        supabase: {
          auth: {
            getUser: jest.fn().mockResolvedValue({
              data: { user: { id: 'user-123', email: 'test@example.com' } },
              error: null
            })
          },
          from: jest.fn(() => ({
            select: jest.fn(() => ({
              eq: jest.fn(() => ({
                single: jest.fn().mockResolvedValue({
                  data: { role: 'Free' },
                  error: null
                })
              }))
            }))
          }))
        } as any,
        response: NextResponse.next()
      })

      // Act
      const response = await authMiddleware(request)

      // Assert
      expect(response.status).not.toBe(302) // Not redirected
    })
  })

  describe('Role-Based Access Control', () => {
    it('should allow users with sufficient role to access routes', async () => {
      // Arrange
      const request = new NextRequest('http://localhost:3000/home')
      // Add auth token to cookies
      request.cookies.set('jlpt4you_auth_token', 'valid-token')
      
      mockGetRouteProtection.mockReturnValue({
        requiresAuth: true,
        requiredRole: 'Free' as any,
        description: 'Free user route'
      })

      mockCreateSupabaseServerClient.mockReturnValue({
        supabase: {
          auth: {
            getUser: jest.fn().mockResolvedValue({
              data: { user: { id: 'user-123', email: 'test@example.com' } },
              error: null
            })
          }
        } as any,
        response: NextResponse.next()
      })

      mockCheckUserRole.mockResolvedValue(true)

      // Act
      const response = await authMiddleware(request)

      // Assert
      expect(response.status).not.toBe(302) // Not redirected
    })

    it('should redirect users with insufficient role', async () => {
      // Arrange
      const request = new NextRequest('http://localhost:3000/admin')
      
      mockGetRouteProtection.mockReturnValue({
        requiresAuth: true,
        requiredRole: 'Admin' as any,
        description: 'Admin route'
      })

      mockCreateSupabaseServerClient.mockReturnValue({
        supabase: {
          auth: {
            getUser: jest.fn().mockResolvedValue({
              data: { user: { id: 'user-123', email: 'test@example.com' } },
              error: null
            })
          }
        } as any,
        response: NextResponse.next()
      })

      mockCheckUserRole.mockResolvedValue(false)

      // Act
      const response = await authMiddleware(request)

      // Assert
      expect(response.status).toBe(302) // Redirected
      expect(response.headers.get('location')).toContain('/auth/login')
    })
  })

  describe('Security Headers', () => {
    it('should add security headers to responses', () => {
      // Arrange
      const response = new NextResponse()

      // Act
      const secureResponse = addSecurityHeaders(response)

      // Assert
      expect(secureResponse.headers.get('X-Content-Type-Options')).toBe('nosniff')
      expect(secureResponse.headers.get('X-Frame-Options')).toBe('DENY')
      expect(secureResponse.headers.get('X-XSS-Protection')).toBe('1; mode=block')
      expect(secureResponse.headers.get('Referrer-Policy')).toBe('strict-origin-when-cross-origin')
      expect(secureResponse.headers.get('Content-Security-Policy')).toContain('default-src')
    })
  })

  describe('Error Handling', () => {
    it('should handle middleware errors gracefully', async () => {
      // Arrange
      const request = new NextRequest('http://localhost:3000/home')
      
      mockCreateSupabaseServerClient.mockImplementation(() => {
        throw new Error('Supabase connection failed')
      })

      // Act
      const response = await authMiddleware(request)

      // Assert
      expect(response).toBeDefined()
      expect(mockLogSecurityEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          event: 'middleware_error',
          level: 'error'
        })
      )
    })

    it('should log security events for unauthorized access', async () => {
      // Arrange
      const request = new NextRequest('http://localhost:3000/admin')
      
      mockGetRouteProtection.mockReturnValue({
        requiresAuth: true,
        requiredRole: 'Admin' as any,
        description: 'Admin route'
      })

      mockCreateSupabaseServerClient.mockReturnValue({
        supabase: {
          auth: {
            getUser: jest.fn().mockResolvedValue({
              data: { user: { id: 'user-123', email: 'test@example.com' } },
              error: null
            })
          }
        } as any,
        response: NextResponse.next()
      })

      mockCheckUserRole.mockResolvedValue(false)

      // Act
      await authMiddleware(request)

      // Assert
      expect(mockLogSecurityEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          event: 'insufficient_permissions',
          level: 'error'
        })
      )
    })
  })

  describe('Performance', () => {
    it('should complete middleware processing within performance threshold', async () => {
      // Arrange
      const request = new NextRequest('http://localhost:3000/home')
      
      mockGetRouteProtection.mockReturnValue({
        requiresAuth: true,
        description: 'Protected route'
      })

      mockCreateSupabaseServerClient.mockReturnValue({
        supabase: {
          auth: {
            getUser: jest.fn().mockResolvedValue({
              data: { user: { id: 'user-123', email: 'test@example.com' } },
              error: null
            })
          }
        } as any,
        response: NextResponse.next()
      })

      // Act
      const startTime = performance.now()
      await authMiddleware(request)
      const endTime = performance.now()

      // Assert
      expect(endTime - startTime).toBeLessThan(100) // Should complete within 100ms
    })

    it('should handle concurrent requests efficiently', async () => {
      // Arrange
      const requests = Array.from({ length: 50 }, (_, i) => 
        new NextRequest(`http://localhost:3000/home?id=${i}`)
      )
      
      mockGetRouteProtection.mockReturnValue({
        requiresAuth: false,
        description: 'Public route'
      })

      mockCreateSupabaseServerClient.mockReturnValue({
        supabase: {
          auth: {
            getUser: jest.fn().mockResolvedValue({
              data: { user: null },
              error: null
            })
          }
        } as any,
        response: NextResponse.next()
      })

      // Act
      const startTime = performance.now()
      const promises = requests.map(request => authMiddleware(request))
      await Promise.all(promises)
      const endTime = performance.now()

      // Assert
      expect(endTime - startTime).toBeLessThan(1000) // Should complete within 1 second
    })
  })

  describe('Logging and Monitoring', () => {
    it('should log successful route access', async () => {
      // Arrange
      const request = new NextRequest('http://localhost:3000/home')
      
      mockGetRouteProtection.mockReturnValue({
        requiresAuth: true,
        description: 'Protected route'
      })

      mockCreateSupabaseServerClient.mockReturnValue({
        supabase: {
          auth: {
            getUser: jest.fn().mockResolvedValue({
              data: { user: { id: 'user-123', email: 'test@example.com' } },
              error: null
            })
          }
        } as any,
        response: NextResponse.next()
      })

      // Act
      await authMiddleware(request)

      // Assert
      expect(mockLogAuthEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          event: 'route_access_attempt',
          level: 'info'
        })
      )
    })

    it('should include user context in response headers', async () => {
      // Arrange
      const request = new NextRequest('http://localhost:3000/home')
      
      mockGetRouteProtection.mockReturnValue({
        requiresAuth: true,
        description: 'Protected route'
      })

      const mockUser = { id: 'user-123', email: 'test@example.com' }
      
      mockCreateSupabaseServerClient.mockReturnValue({
        supabase: {
          auth: {
            getUser: jest.fn().mockResolvedValue({
              data: { user: mockUser },
              error: null
            })
          },
          from: jest.fn(() => ({
            select: jest.fn(() => ({
              eq: jest.fn(() => ({
                single: jest.fn().mockResolvedValue({
                  data: { role: 'Premium' },
                  error: null
                })
              }))
            }))
          }))
        } as any,
        response: NextResponse.next()
      })

      // Act
      const response = await authMiddleware(request)

      // Assert
      expect(response.headers.get('x-user-id')).toBe(mockUser.id)
      expect(response.headers.get('x-user-email')).toBe(mockUser.email)
    })
  })
})
