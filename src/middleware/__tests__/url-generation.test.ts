/**
 * Unit Tests for URL Generation Module
 * Comprehensive test coverage for URL generation functionality
 */

import {
  generateRedirectUrl,
  needsLanguageRedirect,
  shouldRedirectToCleanUrl,
  generateLanguageRedirectUrl,
  getCleanUrl,
  buildUrlWithQuery,
  buildAbsoluteUrl,
  generateAuthUrl,
  generateFeatureUrl,
  generateHomeUrl,
  generateLandingUrl,
  generateLoginUrl,
  analyzeUrl,
  isValidUrl,
  isValidPathname,
  createUrlGenerationContext
} from '../modules/url-generation'
import type { URLGenerationContext } from '../types/middleware'

// ===== MOCK HELPERS =====

const mockRequest = {
  nextUrl: {
    pathname: '/',
    origin: 'https://example.com',
    searchParams: new URLSearchParams()
  }
} as any

function createMockUrlContext(options: {
  pathname?: string
  language?: 'vn' | 'jp' | 'en'
  isAuthenticated?: boolean
  queryParams?: Record<string, string>
} = {}): URLGenerationContext {
  const request = { ...mockRequest }
  request.nextUrl.pathname = options.pathname || '/'
  
  if (options.queryParams) {
    request.nextUrl.searchParams = new URLSearchParams(options.queryParams)
  }
  
  return {
    pathname: options.pathname || '/',
    language: options.language || 'vn',
    request,
    isAuthenticated: options.isAuthenticated || false
  }
}

// ===== URL GENERATION TESTS =====

describe('URL Generation Module', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })
  
  describe('needsLanguageRedirect', () => {
    test('should return false for paths with language prefix', () => {
      expect(needsLanguageRedirect('/vn/home', false)).toBe(false)
      expect(needsLanguageRedirect('/jp/jlpt', false)).toBe(false)
      expect(needsLanguageRedirect('/en/challenge', false)).toBe(false)
      expect(needsLanguageRedirect('/1/home', false)).toBe(false)
    })
    
    test('should return false for auth paths', () => {
      expect(needsLanguageRedirect('/auth/vn/login', false)).toBe(false)
      expect(needsLanguageRedirect('/auth/jp/register', false)).toBe(false)
    })
    
    test('should return true for root path', () => {
      expect(needsLanguageRedirect('/', false)).toBe(true)
      expect(needsLanguageRedirect('/', true)).toBe(true)
    })
    
    test('should return true for auth paths without language', () => {
      expect(needsLanguageRedirect('/login', false)).toBe(true)
      expect(needsLanguageRedirect('/register', false)).toBe(true)
      expect(needsLanguageRedirect('/landing', false)).toBe(true)
    })
    
    test('should handle authenticated vs unauthenticated users differently', () => {
      // Unauthenticated users should redirect feature paths
      expect(needsLanguageRedirect('/jlpt', false)).toBe(true)
      expect(needsLanguageRedirect('/challenge', false)).toBe(true)
      
      // Authenticated users should not redirect feature paths
      expect(needsLanguageRedirect('/jlpt', true)).toBe(false)
      expect(needsLanguageRedirect('/challenge', true)).toBe(false)
    })
  })
  
  describe('shouldRedirectToCleanUrl', () => {
    test('should return false for unauthenticated users', () => {
      expect(shouldRedirectToCleanUrl('/vn/home', false)).toBe(false)
      expect(shouldRedirectToCleanUrl('/jp/jlpt', false)).toBe(false)
    })
    
    test('should return false for paths without language prefix', () => {
      expect(shouldRedirectToCleanUrl('/home', true)).toBe(false)
      expect(shouldRedirectToCleanUrl('/jlpt', true)).toBe(false)
    })
    
    test('should return false for auth routes', () => {
      expect(shouldRedirectToCleanUrl('/vn/login', true)).toBe(false)
      expect(shouldRedirectToCleanUrl('/jp/register', true)).toBe(false)
    })
    
    test('should return true for authenticated users with language-prefixed non-auth routes', () => {
      expect(shouldRedirectToCleanUrl('/vn/home', true)).toBe(true)
      expect(shouldRedirectToCleanUrl('/jp/jlpt', true)).toBe(true)
      expect(shouldRedirectToCleanUrl('/en/challenge', true)).toBe(true)
    })
  })
  
  describe('generateLanguageRedirectUrl', () => {
    test('should generate landing URL for root path', () => {
      const result = generateLanguageRedirectUrl('/', 'vn', mockRequest)
      expect(result).toBe('https://example.com/vn/landing')
    })
    
    test('should generate auth URLs for auth paths', () => {
      expect(generateLanguageRedirectUrl('/login', 'vn', mockRequest))
        .toBe('https://example.com/auth/vn/login')
      expect(generateLanguageRedirectUrl('/register', 'jp', mockRequest))
        .toBe('https://example.com/auth/jp/register')
    })
    
    test('should generate language-prefixed URLs for home path', () => {
      const result = generateLanguageRedirectUrl('/home', 'en', mockRequest)
      expect(result).toBe('https://example.com/en/home')
    })
    
    test('should generate language-prefixed URLs for feature paths', () => {
      expect(generateLanguageRedirectUrl('/jlpt', 'vn', mockRequest))
        .toBe('https://example.com/vn/jlpt')
      expect(generateLanguageRedirectUrl('/challenge', 'jp', mockRequest))
        .toBe('https://example.com/jp/challenge')
    })
    
    test('should handle nested feature paths', () => {
      const result = generateLanguageRedirectUrl('/jlpt/custom/n3', 'en', mockRequest)
      expect(result).toBe('https://example.com/en/jlpt/custom/n3')
    })
    
    test('should preserve query parameters', () => {
      const requestWithQuery = {
        ...mockRequest,
        nextUrl: {
          ...mockRequest.nextUrl,
          searchParams: new URLSearchParams('test=value&foo=bar')
        }
      }
      
      const result = generateLanguageRedirectUrl('/home', 'vn', requestWithQuery)
      expect(result).toBe('https://example.com/vn/home?test=value&foo=bar')
    })
  })
  
  describe('getCleanUrl', () => {
    test('should remove language prefix from URLs', () => {
      expect(getCleanUrl('/vn/home')).toBe('/home')
      expect(getCleanUrl('/jp/jlpt/custom')).toBe('/jlpt/custom')
      expect(getCleanUrl('/en/challenge/n3')).toBe('/challenge/n3')
    })
    
    test('should handle numeric language codes', () => {
      expect(getCleanUrl('/1/home')).toBe('/home')
      expect(getCleanUrl('/2/jlpt')).toBe('/jlpt')
      expect(getCleanUrl('/3/challenge')).toBe('/challenge')
    })
    
    test('should return original URL if no language prefix', () => {
      expect(getCleanUrl('/home')).toBe('/home')
      expect(getCleanUrl('/jlpt')).toBe('/jlpt')
      expect(getCleanUrl('/')).toBe('/')
    })
  })
  
  describe('buildUrlWithQuery', () => {
    test('should build URL without query parameters', () => {
      const result = buildUrlWithQuery(mockRequest, '/home')
      expect(result).toBe('https://example.com/home')
    })
    
    test('should build URL with query parameters', () => {
      const requestWithQuery = {
        ...mockRequest,
        nextUrl: {
          ...mockRequest.nextUrl,
          searchParams: new URLSearchParams('test=value')
        }
      }
      
      const result = buildUrlWithQuery(requestWithQuery, '/home')
      expect(result).toBe('https://example.com/home?test=value')
    })
  })
  
  describe('buildAbsoluteUrl', () => {
    test('should build URL without query parameters', () => {
      const result = buildAbsoluteUrl('https://example.com', '/home')
      expect(result).toBe('https://example.com/home')
    })
    
    test('should build URL with query parameters', () => {
      const result = buildAbsoluteUrl('https://example.com', '/home', { test: 'value', foo: 'bar' })
      expect(result).toBe('https://example.com/home?test=value&foo=bar')
    })
  })
  
  describe('specialized URL generators', () => {
    const origin = 'https://example.com'
    
    test('generateAuthUrl should create auth URLs', () => {
      expect(generateAuthUrl('login', 'vn', origin)).toBe('https://example.com/auth/vn/login')
      expect(generateAuthUrl('register', 'jp', origin)).toBe('https://example.com/auth/jp/register')
    })
    
    test('generateFeatureUrl should create feature URLs', () => {
      expect(generateFeatureUrl('jlpt', 'vn', origin)).toBe('https://example.com/vn/jlpt')
      expect(generateFeatureUrl('challenge', 'en', origin)).toBe('https://example.com/en/challenge')
    })
    
    test('generateHomeUrl should create home URLs', () => {
      expect(generateHomeUrl('vn', origin)).toBe('https://example.com/vn/home')
      expect(generateHomeUrl('jp', origin)).toBe('https://example.com/jp/home')
    })
    
    test('generateLandingUrl should create landing URLs', () => {
      expect(generateLandingUrl('vn', origin)).toBe('https://example.com/vn/landing')
      expect(generateLandingUrl('en', origin)).toBe('https://example.com/en/landing')
    })
    
    test('generateLoginUrl should create login URLs', () => {
      expect(generateLoginUrl('vn', origin)).toBe('https://example.com/auth/vn/login')
      expect(generateLoginUrl('jp', origin)).toBe('https://example.com/auth/jp/login')
    })
  })
  
  describe('analyzeUrl', () => {
    test('should analyze URL with language prefix', () => {
      const analysis = analyzeUrl('/vn/home', true)
      
      expect(analysis.original).toBe('/vn/home')
      expect(analysis.hasLanguagePrefix).toBe(true)
      expect(analysis.extractedLanguage).toBe('vn')
      expect(analysis.cleanUrl).toBe('/home')
      expect(analysis.shouldRedirectToClean).toBe(true)
      expect(analysis.urlType).toBe('home')
    })
    
    test('should analyze URL without language prefix', () => {
      const analysis = analyzeUrl('/home', false)
      
      expect(analysis.original).toBe('/home')
      expect(analysis.hasLanguagePrefix).toBe(false)
      expect(analysis.extractedLanguage).toBeNull()
      expect(analysis.cleanUrl).toBe('/home')
      expect(analysis.needsLanguageRedirect).toBe(true)
      expect(analysis.urlType).toBe('home')
    })
  })
  
  describe('validation functions', () => {
    test('isValidUrl should validate URLs', () => {
      expect(isValidUrl('https://example.com')).toBe(true)
      expect(isValidUrl('http://localhost:3000')).toBe(true)
      expect(isValidUrl('invalid-url')).toBe(false)
      expect(isValidUrl('')).toBe(false)
    })
    
    test('isValidPathname should validate pathnames', () => {
      expect(isValidPathname('/home')).toBe(true)
      expect(isValidPathname('/jlpt/custom')).toBe(true)
      expect(isValidPathname('home')).toBe(false) // Missing leading slash
      expect(isValidPathname('/path<with>invalid')).toBe(false)
      expect(isValidPathname('')).toBe(false)
    })
  })
  
  describe('generateRedirectUrl', () => {
    test('should generate clean URL redirect for authenticated users', () => {
      const context = createMockUrlContext({
        pathname: '/vn/home',
        language: 'vn',
        isAuthenticated: true
      })
      
      const result = generateRedirectUrl(context)
      
      expect(result.shouldRedirect).toBe(true)
      expect(result.redirectType).toBe('clean-url')
      expect(result.redirectUrl).toBe('https://example.com/home')
    })
    
    test('should generate language redirect for unauthenticated users', () => {
      const context = createMockUrlContext({
        pathname: '/home',
        language: 'vn',
        isAuthenticated: false
      })
      
      const result = generateRedirectUrl(context)
      
      expect(result.shouldRedirect).toBe(true)
      expect(result.redirectType).toBe('language')
      expect(result.redirectUrl).toBe('https://example.com/vn/home')
    })
    
    test('should return no redirect when not needed', () => {
      const context = createMockUrlContext({
        pathname: '/vn/home',
        language: 'vn',
        isAuthenticated: false
      })
      
      const result = generateRedirectUrl(context)
      
      expect(result.shouldRedirect).toBe(false)
      expect(result.redirectType).toBe('none')
    })
  })
})
