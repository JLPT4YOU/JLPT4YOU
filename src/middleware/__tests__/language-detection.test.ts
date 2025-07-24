/**
 * Unit Tests for Language Detection Module
 * Comprehensive test coverage for language detection functionality
 */

import {
  extractLanguageFromPath,
  hasLanguagePrefix,
  getCleanUrl,
  normalizeLanguageCode,
  isValidLanguage
} from '../modules/language-detection'

// Mock NextRequest for testing
const mockRequest = {
  nextUrl: { pathname: '/' },
  cookies: {
    get: jest.fn(),
    set: jest.fn(),
    has: jest.fn()
  },
  headers: {
    get: jest.fn()
  }
} as any

// ===== BASIC TESTS FOR CORE FUNCTIONS =====

describe('Language Detection Module', () => {
  describe('extractLanguageFromPath', () => {
    test('should extract language from language-prefixed paths', () => {
      expect(extractLanguageFromPath('/vn/home')).toBe('vn')
      expect(extractLanguageFromPath('/jp/jlpt')).toBe('jp')
      expect(extractLanguageFromPath('/en/challenge')).toBe('en')
    })

    test('should extract language from numeric codes', () => {
      expect(extractLanguageFromPath('/1/home')).toBe('vn')
      expect(extractLanguageFromPath('/2/jlpt')).toBe('jp')
      expect(extractLanguageFromPath('/3/challenge')).toBe('en')
    })

    test('should return null for paths without language prefix', () => {
      expect(extractLanguageFromPath('/home')).toBeNull()
      expect(extractLanguageFromPath('/jlpt')).toBeNull()
      expect(extractLanguageFromPath('/')).toBeNull()
    })
  })

  describe('hasLanguagePrefix', () => {
    test('should return true for language-prefixed paths', () => {
      expect(hasLanguagePrefix('/vn/home')).toBe(true)
      expect(hasLanguagePrefix('/jp/jlpt')).toBe(true)
      expect(hasLanguagePrefix('/en/challenge')).toBe(true)
      expect(hasLanguagePrefix('/1/home')).toBe(true)
      expect(hasLanguagePrefix('/2/jlpt')).toBe(true)
      expect(hasLanguagePrefix('/3/challenge')).toBe(true)
    })

    test('should return false for paths without language prefix', () => {
      expect(hasLanguagePrefix('/home')).toBe(false)
      expect(hasLanguagePrefix('/jlpt')).toBe(false)
      expect(hasLanguagePrefix('/')).toBe(false)
      expect(hasLanguagePrefix('/api/test')).toBe(false)
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

  describe('normalizeLanguageCode', () => {
    test('should convert numeric codes to language codes', () => {
      expect(normalizeLanguageCode('1')).toBe('vn')
      expect(normalizeLanguageCode('2')).toBe('jp')
      expect(normalizeLanguageCode('3')).toBe('en')
    })

    test('should keep language codes unchanged', () => {
      expect(normalizeLanguageCode('vn')).toBe('vn')
      expect(normalizeLanguageCode('jp')).toBe('jp')
      expect(normalizeLanguageCode('en')).toBe('en')
    })

    test('should return original code for unknown codes', () => {
      expect(normalizeLanguageCode('fr')).toBe('fr')
      expect(normalizeLanguageCode('de')).toBe('de')
    })
  })

  describe('isValidLanguage', () => {
    test('should return true for valid languages', () => {
      expect(isValidLanguage('vn')).toBe(true)
      expect(isValidLanguage('jp')).toBe(true)
      expect(isValidLanguage('en')).toBe(true)
    })

    test('should return false for invalid languages', () => {
      expect(isValidLanguage('fr')).toBe(false)
      expect(isValidLanguage('de')).toBe(false)
      expect(isValidLanguage('1')).toBe(false)
      expect(isValidLanguage('')).toBe(false)
    })
  })
})
