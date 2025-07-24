/**
 * Unit Tests for Security Headers Module
 * Comprehensive test coverage for security headers functionality
 */

import {
  generateSecurityHeaders,
  applyCacheHeaders,
  generateCSPHeader,
  validateSecurityHeaders,
  applyHeadersToResponse,
  setLanguageHeaders,
  setCacheHeaders,
  setSecurityHeaders,
  analyzeCurrentLanguage,
  getSecurityLevel,
  getCachedHeaders,
  clearHeaderCache,
  analyzeHeaderSecurity
} from '../modules/security-headers'
import type { SecurityHeadersContext } from '../types/middleware'

// ===== MOCK HELPERS =====

const mockResponse = {
  headers: {
    set: jest.fn(),
    get: jest.fn(),
    delete: jest.fn()
  }
} as any

function createMockSecurityContext(options: {
  pathname?: string
  language?: 'vn' | 'jp' | 'en'
  isAuthenticated?: boolean
} = {}): SecurityHeadersContext {
  return {
    pathname: options.pathname || '/',
    language: options.language || 'vn',
    isAuthenticated: options.isAuthenticated || false
  }
}

// ===== SECURITY HEADERS TESTS =====

describe('Security Headers Module', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    clearHeaderCache()
  })
  
  describe('generateSecurityHeaders', () => {
    test('should generate basic security headers', () => {
      const context = createMockSecurityContext({
        pathname: '/home',
        language: 'vn',
        isAuthenticated: false
      })
      
      const result = generateSecurityHeaders(context)
      
      expect(result.headers).toHaveProperty('X-Frame-Options', 'DENY')
      expect(result.headers).toHaveProperty('X-Content-Type-Options', 'nosniff')
      expect(result.headers).toHaveProperty('Referrer-Policy', 'strict-origin-when-cross-origin')
      expect(result.headers).toHaveProperty('Content-Language', 'vi-VN')
    })
    
    test('should add authentication header for authenticated users', () => {
      const context = createMockSecurityContext({
        pathname: '/home',
        language: 'vn',
        isAuthenticated: true
      })
      
      const result = generateSecurityHeaders(context)
      
      expect(result.headers).toHaveProperty('X-Authenticated', 'true')
    })
    
    test('should set correct language headers', () => {
      const contexts = [
        { language: 'vn' as const, expectedLocale: 'vi-VN' },
        { language: 'jp' as const, expectedLocale: 'ja-JP' },
        { language: 'en' as const, expectedLocale: 'en-US' }
      ]
      
      contexts.forEach(({ language, expectedLocale }) => {
        const context = createMockSecurityContext({ language })
        const result = generateSecurityHeaders(context)
        
        expect(result.headers['Content-Language']).toBe(expectedLocale)
      })
    })
    
    test('should include CSP header', () => {
      const context = createMockSecurityContext({
        pathname: '/home',
        language: 'vn'
      })
      
      const result = generateSecurityHeaders(context)
      
      expect(result.headers).toHaveProperty('Content-Security-Policy')
      expect(result.headers['Content-Security-Policy']).toContain("default-src 'self'")
    })
  })
  
  describe('applyCacheHeaders', () => {
    test('should return auth cache headers for auth pages', () => {
      const result = applyCacheHeaders('/auth/vn/login')
      expect(result).toBe('public, max-age=3600, stale-while-revalidate=86400')
    })
    
    test('should return long cache for static assets', () => {
      const staticPaths = ['/static/image.png', '/favicon.ico', '/styles.css', '/script.js']
      
      staticPaths.forEach(path => {
        const result = applyCacheHeaders(path)
        expect(result).toBe('public, max-age=31536000, immutable')
      })
    })
    
    test('should return no cache for API routes', () => {
      const result = applyCacheHeaders('/api/users')
      expect(result).toBe('no-cache, no-store, must-revalidate')
    })
    
    test('should return short cache for dynamic pages', () => {
      const dynamicPaths = ['/home', '/jlpt/custom', '/challenge/n3']
      
      dynamicPaths.forEach(path => {
        const result = applyCacheHeaders(path)
        expect(result).toBe('public, max-age=300, stale-while-revalidate=3600')
      })
    })
    
    test('should return undefined for other paths', () => {
      const result = applyCacheHeaders('/some/other/path')
      expect(result).toBeUndefined()
    })
  })
  
  describe('generateCSPHeader', () => {
    test('should generate basic CSP header', () => {
      const result = generateCSPHeader('/home', false)

      expect(result).toContain("default-src 'self'")
      expect(result).toContain("script-src 'self' 'unsafe-inline' 'unsafe-eval'")
      expect(result).toContain("style-src 'self' 'unsafe-inline' https://fonts.googleapis.com")
      expect(result).toContain("frame-ancestors 'none'")
    })

    test('should include all required service endpoints in CSP', () => {
      const result = generateCSPHeader('/chat', false)

      // Verify all actually used service endpoints are included
      expect(result).toContain('https://generativelanguage.googleapis.com') // Gemini API
      expect(result).toContain('https://api.groq.com')                       // Groq API
      expect(result).toContain('https://prrizpzrdepnjjkyrimh.supabase.co')   // Supabase API

      // Verify unused services are NOT included (security best practice)
      expect(result).not.toContain('https://api.openai.com')        // Not used
      expect(result).not.toContain('https://api.anthropic.com')     // Not used
    })
    
    test('should add Google auth for auth pages', () => {
      const result = generateCSPHeader('/auth/vn/login', false)
      
      expect(result).toContain('https://accounts.google.com')
    })
    
    test('should add strict-dynamic for exam pages', () => {
      const examPaths = ['/jlpt/test', '/challenge/exam', '/driving/test']
      
      examPaths.forEach(path => {
        const result = generateCSPHeader(path, false)
        expect(result).toContain("'strict-dynamic'")
      })
    })
  })
  
  describe('validateSecurityHeaders', () => {
    test('should validate complete security headers', () => {
      const headers = {
        'X-Frame-Options': 'DENY',
        'X-Content-Type-Options': 'nosniff',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
        'Content-Security-Policy': "default-src 'self'"
      }
      
      const result = validateSecurityHeaders(headers)
      
      expect(result.isValid).toBe(true)
      expect(result.issues).toHaveLength(0)
    })
    
    test('should identify missing security headers', () => {
      const headers = {
        'X-Frame-Options': 'DENY'
        // Missing other required headers
      }
      
      const result = validateSecurityHeaders(headers)
      
      expect(result.isValid).toBe(false)
      expect(result.issues).toContain('Missing required security header: X-Content-Type-Options')
      expect(result.issues).toContain('Missing required security header: Referrer-Policy')
    })
    
    test('should provide recommendations', () => {
      const headers = {
        'X-Frame-Options': 'DENY',
        'X-Content-Type-Options': 'nosniff',
        'Referrer-Policy': 'strict-origin-when-cross-origin'
        // Missing CSP
      }
      
      const result = validateSecurityHeaders(headers)
      
      expect(result.recommendations).toContain('Consider adding Content-Security-Policy header')
    })
  })
  
  describe('response header utilities', () => {
    test('applyHeadersToResponse should set all headers', () => {
      const headers = {
        'X-Test-Header': 'test-value',
        'Another-Header': 'another-value'
      }
      
      applyHeadersToResponse(mockResponse, headers)
      
      expect(mockResponse.headers.set).toHaveBeenCalledWith('X-Test-Header', 'test-value')
      expect(mockResponse.headers.set).toHaveBeenCalledWith('Another-Header', 'another-value')
    })
    
    test('setLanguageHeaders should set language-specific headers', () => {
      setLanguageHeaders(mockResponse, 'vn')
      
      expect(mockResponse.headers.set).toHaveBeenCalledWith('Content-Language', 'vi-VN')
      expect(mockResponse.headers.set).toHaveBeenCalledWith('X-Language', 'vn')
    })
    
    test('setCacheHeaders should set cache control headers', () => {
      setCacheHeaders(mockResponse, 'public, max-age=3600')
      
      expect(mockResponse.headers.set).toHaveBeenCalledWith('Cache-Control', 'public, max-age=3600')
      expect(mockResponse.headers.set).toHaveBeenCalledWith('Vary', 'Accept-Language, Cookie')
    })
    
    test('setSecurityHeaders should set all security headers', () => {
      setSecurityHeaders(mockResponse)
      
      expect(mockResponse.headers.set).toHaveBeenCalledWith('X-Frame-Options', 'DENY')
      expect(mockResponse.headers.set).toHaveBeenCalledWith('X-Content-Type-Options', 'nosniff')
      expect(mockResponse.headers.set).toHaveBeenCalledWith('Referrer-Policy', 'strict-origin-when-cross-origin')
    })
  })
  
  describe('analyzeCurrentLanguage', () => {
    test('should detect language from auth routes', () => {
      expect(analyzeCurrentLanguage('/auth/vn/login', false)).toBe('vn')
      expect(analyzeCurrentLanguage('/auth/jp/register', false)).toBe('jp')
      expect(analyzeCurrentLanguage('/auth/en/landing', false)).toBe('en')
    })
    
    test('should detect language from path prefix', () => {
      expect(analyzeCurrentLanguage('/vn/home', false)).toBe('vn')
      expect(analyzeCurrentLanguage('/jp/jlpt', false)).toBe('jp')
      expect(analyzeCurrentLanguage('/en/challenge', false)).toBe('en')
    })
    
    test('should use cookie language for authenticated users', () => {
      const result = analyzeCurrentLanguage('/home', true, 'jp', 'en')
      expect(result).toBe('jp')
    })
    
    test('should use preferred language as fallback', () => {
      const result = analyzeCurrentLanguage('/home', false, undefined, 'en')
      expect(result).toBe('en')
    })
    
    test('should default to Vietnamese', () => {
      const result = analyzeCurrentLanguage('/home', false)
      expect(result).toBe('vn')
    })
  })
  
  describe('getSecurityLevel', () => {
    test('should return high security for auth and admin pages', () => {
      expect(getSecurityLevel('/auth/vn/login')).toBe('high')
      expect(getSecurityLevel('/admin/dashboard')).toBe('high')
    })
    
    test('should return medium security for user pages', () => {
      expect(getSecurityLevel('/home')).toBe('medium')
      expect(getSecurityLevel('/settings')).toBe('medium')
    })
    
    test('should return low security for public pages', () => {
      expect(getSecurityLevel('/jlpt')).toBe('low')
      expect(getSecurityLevel('/challenge')).toBe('low')
    })
  })
  
  describe('header caching', () => {
    test('should cache and retrieve headers', () => {
      const generator = jest.fn(() => ({ 'X-Test': 'value' }))
      
      // First call should generate
      const result1 = getCachedHeaders('test-key', generator)
      expect(generator).toHaveBeenCalledTimes(1)
      expect(result1).toEqual({ 'X-Test': 'value' })
      
      // Second call should use cache
      const result2 = getCachedHeaders('test-key', generator)
      expect(generator).toHaveBeenCalledTimes(1) // Not called again
      expect(result2).toEqual({ 'X-Test': 'value' })
    })
    
    test('should clear cache', () => {
      const generator = jest.fn(() => ({ 'X-Test': 'value' }))
      
      getCachedHeaders('test-key', generator)
      clearHeaderCache()
      getCachedHeaders('test-key', generator)
      
      expect(generator).toHaveBeenCalledTimes(2) // Called twice after cache clear
    })
  })
  
  describe('analyzeHeaderSecurity', () => {
    test('should analyze complete security headers', () => {
      const headers = {
        'X-Frame-Options': 'DENY',
        'Content-Security-Policy': "default-src 'self'",
        'X-Content-Type-Options': 'nosniff',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
        'Strict-Transport-Security': 'max-age=31536000'
      }
      
      const result = analyzeHeaderSecurity(headers)
      
      expect(result.score).toBe(100) // All headers present
      expect(result.strengths).toHaveLength(5)
      expect(result.weaknesses).toHaveLength(0)
    })
    
    test('should identify missing headers', () => {
      const headers = {
        'X-Frame-Options': 'DENY'
        // Missing other headers
      }
      
      const result = analyzeHeaderSecurity(headers)
      
      expect(result.score).toBe(20) // Only one header
      expect(result.strengths).toHaveLength(1)
      expect(result.weaknesses.length).toBeGreaterThan(0)
    })
  })
})
