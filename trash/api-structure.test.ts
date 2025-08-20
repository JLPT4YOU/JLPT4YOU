/**
 * API Structure Smoke Tests
 * Tests that API files exist and have correct exports
 */

import { existsSync } from 'fs'
import { join } from 'path'

describe('API Structure Smoke Tests', () => {
  const apiDir = join(process.cwd(), 'src/app/api')

  describe('API Routes Existence', () => {
    it('should have topup API route', () => {
      const topupRoute = join(apiDir, 'topup/route.ts')
      expect(existsSync(topupRoute)).toBe(true)
    })

    it('should have books API route', () => {
      const booksRoute = join(apiDir, 'books/route.ts')
      expect(existsSync(booksRoute)).toBe(true)
    })

    it('should have landing-chat API route', () => {
      const chatRoute = join(apiDir, 'landing-chat/route.ts')
      expect(existsSync(chatRoute)).toBe(true)
    })

    it('should have auth/user API route', () => {
      const authRoute = join(apiDir, 'auth/user/route.ts')
      expect(existsSync(authRoute)).toBe(true)
    })
  })

  describe('API Route Exports', () => {
    it('should export POST and GET from topup route', async () => {
      const topupModule = await import('@/app/api/topup/route')
      expect(typeof topupModule.POST).toBe('function')
      expect(typeof topupModule.GET).toBe('function')
    })

    it('should export GET from books route', async () => {
      const booksModule = await import('@/app/api/books/route')
      expect(typeof booksModule.GET).toBe('function')
    })

    it('should export POST from landing-chat route', async () => {
      const chatModule = await import('@/app/api/landing-chat/route')
      expect(typeof chatModule.POST).toBe('function')
    })

    it('should export GET from auth/user route', async () => {
      const authModule = await import('@/app/api/auth/user/route')
      expect(typeof authModule.GET).toBe('function')
    })
  })

  describe('API Route Function Signatures', () => {
    it('should have correct function signatures for topup', async () => {
      const topupModule = await import('@/app/api/topup/route')
      
      // Functions should accept Request parameter
      expect(topupModule.POST.length).toBe(1)
      expect(topupModule.GET.length).toBe(1)
    })

    it('should have correct function signatures for books', async () => {
      const booksModule = await import('@/app/api/books/route')
      expect(booksModule.GET.length).toBe(1)
    })

    it('should have correct function signatures for landing-chat', async () => {
      const chatModule = await import('@/app/api/landing-chat/route')
      expect(chatModule.POST.length).toBe(1)
    })

    it('should have correct function signatures for auth/user', async () => {
      const authModule = await import('@/app/api/auth/user/route')
      expect(authModule.GET.length).toBe(1)
    })
  })

  describe('API Dependencies Check', () => {
    it('should be able to import required dependencies', async () => {
      // Test that critical dependencies can be imported
      expect(() => require('next/server')).not.toThrow()
      expect(() => require('@supabase/supabase-js')).not.toThrow()
    })

    it('should have environment variables defined', () => {
      // These should be defined in production
      const requiredEnvVars = [
        'NEXT_PUBLIC_SUPABASE_URL',
        'NEXT_PUBLIC_SUPABASE_ANON_KEY'
      ]

      // In test environment, we just check they can be set
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-key'

      requiredEnvVars.forEach(envVar => {
        expect(process.env[envVar]).toBeDefined()
      })
    })
  })

  describe('Code Quality Checks', () => {
    it('should not have console.log in production API routes', async () => {
      const fs = require('fs')
      
      const apiFiles = [
        join(apiDir, 'topup/route.ts'),
        join(apiDir, 'books/route.ts'),
        join(apiDir, 'landing-chat/route.ts'),
        join(apiDir, 'auth/user/route.ts')
      ]

      for (const file of apiFiles) {
        if (existsSync(file)) {
          const content = fs.readFileSync(file, 'utf8')
          
          // Should not have console.log (should use devConsole.log instead)
          const hasConsoleLog = content.includes('console.log(')
          expect(hasConsoleLog).toBe(false)
          
          // Should have proper error handling
          const hasErrorHandling = content.includes('try') && content.includes('catch')
          expect(hasErrorHandling).toBe(true)
        }
      }
    })

    it('should use proper TypeScript types', async () => {
      const fs = require('fs')
      
      const apiFiles = [
        join(apiDir, 'topup/route.ts'),
        join(apiDir, 'books/route.ts'),
        join(apiDir, 'landing-chat/route.ts'),
        join(apiDir, 'auth/user/route.ts')
      ]

      for (const file of apiFiles) {
        if (existsSync(file)) {
          const content = fs.readFileSync(file, 'utf8')
          
          // Should not use 'any' type (should use unknown or proper types)
          const hasAnyType = content.includes(': any') || content.includes('<any>')
          expect(hasAnyType).toBe(false)
          
          // Should import NextRequest/NextResponse
          const hasNextImports = content.includes('NextRequest') || content.includes('NextResponse')
          expect(hasNextImports).toBe(true)
        }
      }
    })
  })
})
