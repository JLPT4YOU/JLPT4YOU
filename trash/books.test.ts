/**
 * Smoke Tests for Books API
 * Tests basic functionality for /api/books
 */

import { NextRequest } from 'next/server'
import { GET } from '@/app/api/books/route'

// Mock Supabase
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        order: jest.fn(() => ({
          range: jest.fn(() => ({
            eq: jest.fn(() => ({
              ilike: jest.fn()
            })),
            ilike: jest.fn()
          }))
        }))
      }))
    }))
  }))
}))

jest.mock('next/headers', () => ({
  cookies: jest.fn()
}))

jest.mock('@/lib/console-override', () => ({
  devConsole: {
    log: jest.fn()
  }
}))

describe('Books API Smoke Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key'
  })

  describe('GET /api/books', () => {
    it('should return books list with default parameters', async () => {
      const { createClient } = require('@supabase/supabase-js')
      const mockQuery = {
        eq: jest.fn().mockReturnThis(),
        ilike: jest.fn().mockResolvedValue({
          data: [
            {
              id: '1',
              title: 'Test Book',
              category: 'JLPT',
              status: 'published',
              created_at: '2024-01-01T00:00:00Z'
            }
          ],
          count: 1,
          error: null
        })
      }

      createClient.mockReturnValue({
        from: jest.fn(() => ({
          select: jest.fn(() => ({
            order: jest.fn(() => ({
              range: jest.fn(() => mockQuery)
            }))
          }))
        }))
      })

      const request = new NextRequest('http://localhost:3000/api/books')

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.books).toHaveLength(1)
      expect(data.books[0].title).toBe('Test Book')
      expect(data.total).toBe(1)
    })

    it('should handle search parameter', async () => {
      const { createClient } = require('@supabase/supabase-js')
      const mockQuery = {
        eq: jest.fn().mockReturnThis(),
        ilike: jest.fn().mockResolvedValue({
          data: [],
          count: 0,
          error: null
        })
      }

      createClient.mockReturnValue({
        from: jest.fn(() => ({
          select: jest.fn(() => ({
            order: jest.fn(() => ({
              range: jest.fn(() => mockQuery)
            }))
          }))
        }))
      })

      const request = new NextRequest('http://localhost:3000/api/books?search=test&category=JLPT&status=published')

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(mockQuery.ilike).toHaveBeenCalledWith('title', '%test%')
      expect(mockQuery.eq).toHaveBeenCalledWith('status', 'published')
    })

    it('should handle pagination parameters', async () => {
      const { createClient } = require('@supabase/supabase-js')
      const mockRange = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnThis(),
        ilike: jest.fn().mockResolvedValue({
          data: [],
          count: 0,
          error: null
        })
      })

      createClient.mockReturnValue({
        from: jest.fn(() => ({
          select: jest.fn(() => ({
            order: jest.fn(() => ({
              range: mockRange
            }))
          }))
        }))
      })

      const request = new NextRequest('http://localhost:3000/api/books?limit=10&offset=20')

      const response = await GET(request)

      expect(response.status).toBe(200)
      expect(mockRange).toHaveBeenCalledWith(20, 29) // offset to offset + limit - 1
    })

    it('should handle database errors gracefully', async () => {
      const { createClient } = require('@supabase/supabase-js')
      const mockQuery = {
        eq: jest.fn().mockReturnThis(),
        ilike: jest.fn().mockResolvedValue({
          data: null,
          count: null,
          error: { message: 'Database connection failed' }
        })
      }

      createClient.mockReturnValue({
        from: jest.fn(() => ({
          select: jest.fn(() => ({
            order: jest.fn(() => ({
              range: jest.fn(() => mockQuery)
            }))
          }))
        }))
      })

      const request = new NextRequest('http://localhost:3000/api/books')

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Failed to fetch books')
    })

    it('should handle missing environment variables', async () => {
      delete process.env.NEXT_PUBLIC_SUPABASE_URL
      delete process.env.SUPABASE_SERVICE_ROLE_KEY

      const request = new NextRequest('http://localhost:3000/api/books')

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Internal server error')
    })
  })
})
