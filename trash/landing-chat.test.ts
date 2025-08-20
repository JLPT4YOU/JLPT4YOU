/**
 * Smoke Tests for Landing Chat API
 * Tests basic functionality for /api/landing-chat
 */

import { NextRequest } from 'next/server'
import { POST } from '@/app/api/landing-chat/route'

// Mock dependencies
jest.mock('@/lib/mistral-service', () => ({
  MistralService: {
    generateResponse: jest.fn()
  }
}))

jest.mock('@/lib/rate-limiter', () => ({
  rateLimiter: jest.fn(),
  getClientIP: jest.fn(() => '127.0.0.1'),
  sanitizeInput: jest.fn((input) => input)
}))

jest.mock('@/lib/console-override', () => ({
  devConsole: {
    log: jest.fn()
  }
}))

describe('Landing Chat API Smoke Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('POST /api/landing-chat', () => {
    it('should reject requests without message', async () => {
      const request = new NextRequest('http://localhost:3000/api/landing-chat', {
        method: 'POST',
        body: JSON.stringify({})
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('Message is required')
    })

    it('should reject empty messages', async () => {
      const request = new NextRequest('http://localhost:3000/api/landing-chat', {
        method: 'POST',
        body: JSON.stringify({ message: '' })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('Message cannot be empty')
    })

    it('should reject messages that are too long', async () => {
      const longMessage = 'a'.repeat(5001) // Assuming 5000 char limit

      const request = new NextRequest('http://localhost:3000/api/landing-chat', {
        method: 'POST',
        body: JSON.stringify({ message: longMessage })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('Message too long')
    })

    it('should handle rate limiting', async () => {
      const { rateLimiter } = require('@/lib/rate-limiter')
      rateLimiter.mockResolvedValue({
        success: false,
        error: 'Rate limit exceeded'
      })

      const request = new NextRequest('http://localhost:3000/api/landing-chat', {
        method: 'POST',
        body: JSON.stringify({ message: 'Hello' })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(429)
      expect(data.error).toContain('Rate limit exceeded')
    })

    it('should process valid chat request', async () => {
      const { rateLimiter } = require('@/lib/rate-limiter')
      const { MistralService } = require('@/lib/mistral-service')

      rateLimiter.mockResolvedValue({ success: true })
      MistralService.generateResponse.mockResolvedValue('Hello! How can I help you with JLPT preparation?')

      const request = new NextRequest('http://localhost:3000/api/landing-chat', {
        method: 'POST',
        body: JSON.stringify({ 
          message: 'Hello, can you help me with JLPT N3?',
          conversationHistory: []
        })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.response).toBe('Hello! How can I help you with JLPT preparation?')
      expect(MistralService.generateResponse).toHaveBeenCalled()
    })

    it('should handle conversation history', async () => {
      const { rateLimiter } = require('@/lib/rate-limiter')
      const { MistralService } = require('@/lib/mistral-service')

      rateLimiter.mockResolvedValue({ success: true })
      MistralService.generateResponse.mockResolvedValue('Based on our previous conversation...')

      const conversationHistory = [
        { role: 'user', content: 'What is JLPT?' },
        { role: 'assistant', content: 'JLPT is the Japanese Language Proficiency Test...' }
      ]

      const request = new NextRequest('http://localhost:3000/api/landing-chat', {
        method: 'POST',
        body: JSON.stringify({ 
          message: 'Tell me more about N3 level',
          conversationHistory
        })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.response).toBe('Based on our previous conversation...')
      expect(MistralService.generateResponse).toHaveBeenCalledWith(
        expect.any(String), // system prompt
        expect.arrayContaining([
          ...conversationHistory,
          { role: 'user', content: 'Tell me more about N3 level' }
        ])
      )
    })

    it('should handle AI service errors gracefully', async () => {
      const { rateLimiter } = require('@/lib/rate-limiter')
      const { MistralService } = require('@/lib/mistral-service')

      rateLimiter.mockResolvedValue({ success: true })
      MistralService.generateResponse.mockRejectedValue(new Error('AI service unavailable'))

      const request = new NextRequest('http://localhost:3000/api/landing-chat', {
        method: 'POST',
        body: JSON.stringify({ message: 'Hello' })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toContain('Failed to generate response')
    })

    it('should sanitize user input', async () => {
      const { rateLimiter, sanitizeInput } = require('@/lib/rate-limiter')
      const { MistralService } = require('@/lib/mistral-service')

      rateLimiter.mockResolvedValue({ success: true })
      sanitizeInput.mockReturnValue('Clean message')
      MistralService.generateResponse.mockResolvedValue('Response to clean message')

      const request = new NextRequest('http://localhost:3000/api/landing-chat', {
        method: 'POST',
        body: JSON.stringify({ message: '<script>alert("xss")</script>Hello' })
      })

      const response = await POST(request)

      expect(response.status).toBe(200)
      expect(sanitizeInput).toHaveBeenCalledWith('<script>alert("xss")</script>Hello')
    })
  })
})
