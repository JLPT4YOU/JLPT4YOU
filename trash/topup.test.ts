/**
 * Smoke Tests for Top-up API
 * Tests basic functionality and error handling for /api/topup
 */

import { POST, GET } from '@/app/api/topup/route'

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

jest.mock('@/lib/balance-utils-server', () => ({
  addBalanceServer: jest.fn()
}))

jest.mock('@/lib/admin-auth', () => ({
  requireAdminAuth: jest.fn()
}))

jest.mock('@/lib/session-validator', () => ({
  SessionValidator: {
    validateSession: jest.fn()
  }
}))

jest.mock('@/lib/notifications-server', () => ({
  sendTopUpSuccessAdmin: jest.fn()
}))

jest.mock('@/lib/console-override', () => ({
  devConsole: {
    log: jest.fn()
  }
}))

describe('Top-up API Smoke Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('POST /api/topup', () => {
    it('should reject unauthenticated requests', async () => {
      const { SessionValidator } = require('@/lib/session-validator')
      SessionValidator.validateSession.mockResolvedValue({
        valid: false,
        error: 'No session found'
      })

      const request = new NextRequest('http://localhost:3000/api/topup', {
        method: 'POST',
        body: JSON.stringify({
          userId: 'test-user-id',
          amount: 100,
          paymentMethod: 'credit_card'
        })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.success).toBe(false)
      expect(data.error).toContain('Authentication')
    })

    it('should reject invalid request body', async () => {
      const { SessionValidator } = require('@/lib/session-validator')
      SessionValidator.validateSession.mockResolvedValue({
        valid: true,
        user: { id: 'test-user-id', email: 'test@example.com' }
      })

      const request = new NextRequest('http://localhost:3000/api/topup', {
        method: 'POST',
        body: JSON.stringify({
          userId: 'test-user-id',
          // Missing amount and paymentMethod
        })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toContain('Missing required fields')
    })

    it('should reject negative amounts', async () => {
      const { SessionValidator } = require('@/lib/session-validator')
      SessionValidator.validateSession.mockResolvedValue({
        valid: true,
        user: { id: 'test-user-id', email: 'test@example.com' }
      })

      const request = new NextRequest('http://localhost:3000/api/topup', {
        method: 'POST',
        body: JSON.stringify({
          userId: 'test-user-id',
          amount: -100,
          paymentMethod: 'credit_card'
        })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toContain('Amount must be positive')
    })

    it('should process valid top-up request', async () => {
      const { SessionValidator } = require('@/lib/session-validator')
      const { addBalanceServer } = require('@/lib/balance-utils-server')
      const { sendTopUpSuccessAdmin } = require('@/lib/notifications-server')

      SessionValidator.validateSession.mockResolvedValue({
        valid: true,
        user: { id: 'test-user-id', email: 'test@example.com' }
      })

      addBalanceServer.mockResolvedValue({
        success: true,
        newBalance: 1100
      })

      const request = new NextRequest('http://localhost:3000/api/topup', {
        method: 'POST',
        body: JSON.stringify({
          userId: 'test-user-id',
          amount: 100,
          paymentMethod: 'credit_card'
        })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.newBalance).toBe(1100)
      expect(data.message).toBe('Top-up successful')
      expect(data.transactionId).toMatch(/^txn_\d+_test-user-id$/)
      expect(addBalanceServer).toHaveBeenCalledWith('test-user-id', 100)
      expect(sendTopUpSuccessAdmin).toHaveBeenCalledWith('test-user-id', 100)
    })
  })

  describe('GET /api/topup', () => {
    it('should reject unauthenticated requests', async () => {
      const { requireAdminAuth } = require('@/lib/admin-auth')
      const { SessionValidator } = require('@/lib/session-validator')

      requireAdminAuth.mockResolvedValue({ error: 'Not admin' })
      SessionValidator.validateSession.mockResolvedValue({
        valid: false,
        error: 'No session found'
      })

      const request = new NextRequest('http://localhost:3000/api/topup')

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Authentication required')
    })

    it('should return user balance for authenticated user', async () => {
      const { requireAdminAuth } = require('@/lib/admin-auth')
      const { SessionValidator } = require('@/lib/session-validator')
      const { supabaseAdmin } = require('@/utils/supabase/admin')

      requireAdminAuth.mockResolvedValue({ error: 'Not admin' })
      SessionValidator.validateSession.mockResolvedValue({
        valid: true,
        user: { id: 'test-user-id', email: 'test@example.com' }
      })

      supabaseAdmin.from().select().eq().single.mockResolvedValue({
        data: { balance: 1000 },
        error: null
      })

      const request = new NextRequest('http://localhost:3000/api/topup')

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.balance).toBe(1000)
    })
  })
})
