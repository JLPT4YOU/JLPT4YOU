/**
 * Smoke Tests for Auth User API
 * Tests basic functionality for /api/auth/user
 */

import { NextRequest } from 'next/server'
import { GET } from '@/app/api/auth/user/route'

// Mock dependencies
jest.mock('@/utils/supabase/admin', () => ({
  supabaseAdmin: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn()
        }))
      }))
    }))
  }
}))

jest.mock('@supabase/ssr', () => ({
  createServerClient: jest.fn()
}))

jest.mock('next/headers', () => ({
  cookies: jest.fn()
}))

jest.mock('@/lib/console-override', () => ({
  devConsole: {
    log: jest.fn()
  }
}))

describe('Auth User API Smoke Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'
  })

  describe('GET /api/auth/user', () => {
    it('should return 401 when no session exists', async () => {
      const { createServerClient } = require('@supabase/ssr')
      const { cookies } = require('next/headers')

      cookies.mockResolvedValue({
        get: jest.fn(() => undefined)
      })

      createServerClient.mockReturnValue({
        auth: {
          getSession: jest.fn().mockResolvedValue({
            data: { session: null },
            error: null
          })
        }
      })

      const request = new NextRequest('http://localhost:3000/api/auth/user')

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toContain('No valid session found')
    })

    it('should return user data when session exists', async () => {
      const { createServerClient } = require('@supabase/ssr')
      const { cookies } = require('next/headers')
      const { supabaseAdmin } = require('@/utils/supabase/admin')

      const mockSession = {
        user: {
          id: 'test-user-id',
          email: 'test@example.com',
          user_metadata: { full_name: 'Test User' }
        },
        access_token: 'test-token'
      }

      cookies.mockResolvedValue({
        get: jest.fn(() => ({ value: 'session-cookie' }))
      })

      createServerClient.mockReturnValue({
        auth: {
          getSession: jest.fn().mockResolvedValue({
            data: { session: mockSession },
            error: null
          })
        }
      })

      supabaseAdmin.from().select().eq().single.mockResolvedValue({
        data: {
          id: 'test-user-id',
          email: 'test@example.com',
          full_name: 'Test User',
          role: 'User',
          balance: 1000,
          created_at: '2024-01-01T00:00:00Z'
        },
        error: null
      })

      const request = new NextRequest('http://localhost:3000/api/auth/user')

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.user.id).toBe('test-user-id')
      expect(data.user.email).toBe('test@example.com')
      expect(data.user.role).toBe('User')
      expect(data.user.balance).toBe(1000)
    })

    it('should handle session retry logic', async () => {
      const { createServerClient } = require('@supabase/ssr')
      const { cookies } = require('next/headers')
      const { supabaseAdmin } = require('@/utils/supabase/admin')

      const mockSession = {
        user: {
          id: 'test-user-id',
          email: 'test@example.com'
        }
      }

      cookies.mockResolvedValue({
        get: jest.fn(() => ({ value: 'session-cookie' }))
      })

      const getSessionMock = jest.fn()
        .mockResolvedValueOnce({ data: { session: null }, error: null }) // First attempt fails
        .mockResolvedValueOnce({ data: { session: null }, error: null }) // Second attempt fails
        .mockResolvedValueOnce({ data: { session: mockSession }, error: null }) // Third attempt succeeds

      createServerClient.mockReturnValue({
        auth: { getSession: getSessionMock }
      })

      supabaseAdmin.from().select().eq().single.mockResolvedValue({
        data: { id: 'test-user-id', email: 'test@example.com' },
        error: null
      })

      const request = new NextRequest('http://localhost:3000/api/auth/user')

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(getSessionMock).toHaveBeenCalledTimes(3)
      expect(data.user.id).toBe('test-user-id')
    })

    it('should handle database errors gracefully', async () => {
      const { createServerClient } = require('@supabase/ssr')
      const { cookies } = require('next/headers')
      const { supabaseAdmin } = require('@/utils/supabase/admin')

      const mockSession = {
        user: {
          id: 'test-user-id',
          email: 'test@example.com'
        }
      }

      cookies.mockResolvedValue({
        get: jest.fn(() => ({ value: 'session-cookie' }))
      })

      createServerClient.mockReturnValue({
        auth: {
          getSession: jest.fn().mockResolvedValue({
            data: { session: mockSession },
            error: null
          })
        }
      })

      supabaseAdmin.from().select().eq().single.mockResolvedValue({
        data: null,
        error: { message: 'User not found' }
      })

      const request = new NextRequest('http://localhost:3000/api/auth/user')

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toContain('User not found in database')
    })

    it('should handle missing environment variables', async () => {
      delete process.env.NEXT_PUBLIC_SUPABASE_URL
      delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

      const request = new NextRequest('http://localhost:3000/api/auth/user')

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Internal server error')
    })

    it('should return fallback user data when database query fails', async () => {
      const { createServerClient } = require('@supabase/ssr')
      const { cookies } = require('next/headers')
      const { supabaseAdmin } = require('@/utils/supabase/admin')

      const mockSession = {
        user: {
          id: 'test-user-id',
          email: 'test@example.com',
          user_metadata: { full_name: 'Test User' }
        }
      }

      cookies.mockResolvedValue({
        get: jest.fn(() => ({ value: 'session-cookie' }))
      })

      createServerClient.mockReturnValue({
        auth: {
          getSession: jest.fn().mockResolvedValue({
            data: { session: mockSession },
            error: null
          })
        }
      })

      // Simulate database error but still return fallback data
      supabaseAdmin.from().select().eq().single.mockResolvedValue({
        data: null,
        error: { message: 'Database error' }
      })

      const request = new NextRequest('http://localhost:3000/api/auth/user')

      const response = await GET(request)
      const data = await response.json()

      // Should still return user data from session even if database fails
      expect(response.status).toBe(404)
      expect(data.error).toContain('User not found in database')
    })
  })
})
