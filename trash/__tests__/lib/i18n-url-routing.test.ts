/**
 * Tests for i18n URL routing rules and cleanup
 * Ensures getLocalizedPath follows URL structure policy and backward compatibility
 */

import {
  getLocalizedPath,
  removeLanguageFromPath,
  convertToCleanUrl,
  getLanguageFromPath,
  extractLanguageFromUrl,
  hasLanguagePrefix,
  buildLanguagePrefixRegex,
  getLanguagePrefixRegex,
  generateHreflangLinks,
  Language
} from '@/lib/i18n'

describe('i18n URL Routing Rules', () => {
  describe('getLocalizedPath - URL Structure Policy', () => {
    describe('PUBLIC PAGES - Must have language prefix', () => {
      test('landing page should have language prefix', () => {
        expect(getLocalizedPath('landing', 'vn')).toBe('/vn/landing')
        expect(getLocalizedPath('landing', 'jp')).toBe('/jp/landing')
        expect(getLocalizedPath('landing', 'en')).toBe('/en/landing')
        expect(getLocalizedPath('/landing', 'vn')).toBe('/vn/landing') // with leading slash
      })

      test('auth pages should have language prefix with auth structure', () => {
        expect(getLocalizedPath('login', 'vn')).toBe('/auth/vn/login')
        expect(getLocalizedPath('register', 'jp')).toBe('/auth/jp/register')
        expect(getLocalizedPath('forgot-password', 'en')).toBe('/auth/en/forgot-password')
        expect(getLocalizedPath('', 'vn')).toBe('/auth/vn/login') // empty path defaults to login
      })
    })

    describe('PRIVATE PAGES - Must use clean URLs', () => {
      test('home page should use clean URL', () => {
        expect(getLocalizedPath('home', 'vn')).toBe('/home')
        expect(getLocalizedPath('home', 'jp')).toBe('/home')
        expect(getLocalizedPath('home', 'en')).toBe('/home')
      })

      test('JLPT pages should use clean URLs', () => {
        expect(getLocalizedPath('jlpt', 'vn')).toBe('/jlpt')
        expect(getLocalizedPath('jlpt/official', 'jp')).toBe('/jlpt/official')
        expect(getLocalizedPath('jlpt/official/n3', 'en')).toBe('/jlpt/official/n3')
        expect(getLocalizedPath('jlpt/custom/n2/test', 'vn')).toBe('/jlpt/custom/n2/test')
      })

      test('Challenge pages should use clean URLs', () => {
        expect(getLocalizedPath('challenge', 'vn')).toBe('/challenge')
        expect(getLocalizedPath('challenge/n2', 'jp')).toBe('/challenge/n2')
        expect(getLocalizedPath('challenge/n1/test', 'en')).toBe('/challenge/n1/test')
      })

      test('Driving pages should use clean URLs', () => {
        expect(getLocalizedPath('driving', 'vn')).toBe('/driving')
        expect(getLocalizedPath('driving/honmen', 'jp')).toBe('/driving/honmen')
        expect(getLocalizedPath('driving/karimen', 'en')).toBe('/driving/karimen')
      })

      test('Other authenticated pages should use clean URLs', () => {
        expect(getLocalizedPath('library', 'vn')).toBe('/library')
        expect(getLocalizedPath('settings', 'jp')).toBe('/settings')
        expect(getLocalizedPath('exam-results', 'en')).toBe('/exam-results')
        expect(getLocalizedPath('review-answers', 'vn')).toBe('/review-answers')
      })
    })
  })

  describe('Helper Functions', () => {
    describe('buildLanguagePrefixRegex', () => {
      test('should build regex with language codes', () => {
        const regex = buildLanguagePrefixRegex({ includeNumericLegacy: false })
        expect(regex).toBe('^/(vn|en|jp)/')
      })

      test('should include numeric legacy codes when enabled', () => {
        const regex = buildLanguagePrefixRegex({ includeNumericLegacy: true })
        expect(regex).toBe('^/(vn|en|jp|1|2|3)/')
      })

      test('should include numeric legacy by default', () => {
        const regex = buildLanguagePrefixRegex()
        expect(regex).toBe('^/(vn|en|jp|1|2|3)/')
      })
    })

    describe('getLanguagePrefixRegex', () => {
      test('should return compiled RegExp', () => {
        const regex = getLanguagePrefixRegex()
        expect(regex).toBeInstanceOf(RegExp)
        expect(regex.test('/vn/landing')).toBe(true)
        expect(regex.test('/jp/home')).toBe(true)
        expect(regex.test('/1/auth')).toBe(true)
        expect(regex.test('/home')).toBe(false)
      })
    })

    describe('hasLanguagePrefix', () => {
      test('should detect language prefixes correctly', () => {
        expect(hasLanguagePrefix('/vn/landing')).toBe(true)
        expect(hasLanguagePrefix('/jp/home')).toBe(true)
        expect(hasLanguagePrefix('/en/auth')).toBe(true)
        expect(hasLanguagePrefix('/1/landing')).toBe(true) // legacy
        expect(hasLanguagePrefix('/2/home')).toBe(true) // legacy
        expect(hasLanguagePrefix('/3/auth')).toBe(true) // legacy
        
        expect(hasLanguagePrefix('/home')).toBe(false)
        expect(hasLanguagePrefix('/jlpt/official')).toBe(false)
        expect(hasLanguagePrefix('/auth/vn/login')).toBe(false) // auth structure
      })
    })
  })

  describe('Backward Compatibility - Deprecated Functions', () => {
    describe('convertToCleanUrl (deprecated)', () => {
      test('should delegate to removeLanguageFromPath', () => {
        expect(convertToCleanUrl('/vn/landing')).toBe('/landing')
        expect(convertToCleanUrl('/jp/jlpt/official')).toBe('/jlpt/official')
        expect(convertToCleanUrl('/en/challenge/n2')).toBe('/challenge/n2')
        expect(convertToCleanUrl('/1/home')).toBe('/home') // legacy
        
        // Should handle auth structure correctly via removeLanguageFromPath
        expect(convertToCleanUrl('/auth/vn/login')).toBe('/login') // auth structure processed
      })

      test('should return unchanged URL if no prefix', () => {
        expect(convertToCleanUrl('/home')).toBe('/home')
        expect(convertToCleanUrl('/jlpt/official')).toBe('/jlpt/official')
      })
    })

    describe('extractLanguageFromUrl (deprecated)', () => {
      test('should extract language from URL with prefix', () => {
        expect(extractLanguageFromUrl('/vn/landing')).toBe('vn')
        expect(extractLanguageFromUrl('/jp/home')).toBe('jp')
        expect(extractLanguageFromUrl('/en/jlpt')).toBe('en')
        expect(extractLanguageFromUrl('/1/landing')).toBe('vn') // legacy
        expect(extractLanguageFromUrl('/2/home')).toBe('jp') // legacy
        expect(extractLanguageFromUrl('/3/jlpt')).toBe('en') // legacy
      })

      test('should return null for URLs without prefix', () => {
        expect(extractLanguageFromUrl('/home')).toBe(null)
        expect(extractLanguageFromUrl('/jlpt/official')).toBe(null)
        expect(extractLanguageFromUrl('/auth/vn/login')).toBe(null) // auth structure
      })

      test('should maintain backward compatibility with null return', () => {
        // Unlike getLanguageFromPath which returns DEFAULT_LANGUAGE,
        // extractLanguageFromUrl should return null for consistency
        expect(extractLanguageFromUrl('/unknown')).toBe(null)
        expect(extractLanguageFromUrl('')).toBe(null)
      })
    })
  })

  describe('URL Processing Functions', () => {
    describe('removeLanguageFromPath', () => {
      test('should remove language prefix from standard URLs', () => {
        expect(removeLanguageFromPath('/vn/landing')).toBe('/landing')
        expect(removeLanguageFromPath('/jp/jlpt/official')).toBe('/jlpt/official')
        expect(removeLanguageFromPath('/en/challenge/n2')).toBe('/challenge/n2')
      })

      test('should handle auth structure correctly', () => {
        expect(removeLanguageFromPath('/auth/vn/login')).toBe('/login')
        expect(removeLanguageFromPath('/auth/jp/register')).toBe('/register')
        expect(removeLanguageFromPath('/auth/en/forgot-password')).toBe('/forgot-password')
      })

      test('should handle legacy numeric codes', () => {
        expect(removeLanguageFromPath('/1/landing')).toBe('/landing')
        expect(removeLanguageFromPath('/auth/2/login')).toBe('/login')
        expect(removeLanguageFromPath('/3/jlpt/official')).toBe('/jlpt/official')
      })

      test('should return unchanged path if no language prefix', () => {
        expect(removeLanguageFromPath('/home')).toBe('/home')
        expect(removeLanguageFromPath('/jlpt/official')).toBe('/jlpt/official')
        expect(removeLanguageFromPath('')).toBe('')
      })
    })

    describe('getLanguageFromPath', () => {
      test('should extract language from standard URLs', () => {
        expect(getLanguageFromPath('/vn/landing')).toBe('vn')
        expect(getLanguageFromPath('/jp/home')).toBe('jp')
        expect(getLanguageFromPath('/en/jlpt')).toBe('en')
      })

      test('should extract language from auth structure', () => {
        expect(getLanguageFromPath('/auth/vn/login')).toBe('vn')
        expect(getLanguageFromPath('/auth/jp/register')).toBe('jp')
        expect(getLanguageFromPath('/auth/en/forgot-password')).toBe('en')
      })

      test('should handle legacy numeric codes', () => {
        expect(getLanguageFromPath('/1/landing')).toBe('vn')
        expect(getLanguageFromPath('/auth/2/login')).toBe('jp')
        expect(getLanguageFromPath('/3/jlpt')).toBe('en')
      })

      test('should return default language for URLs without prefix', () => {
        expect(getLanguageFromPath('/home')).toBe('vn') // DEFAULT_LANGUAGE
        expect(getLanguageFromPath('/jlpt/official')).toBe('vn')
        expect(getLanguageFromPath('')).toBe('vn')
      })
    })
  })

  describe('generateHreflangLinks', () => {
    test('should generate hreflang links for public pages', () => {
      const links = generateHreflangLinks('/landing')
      expect(links).toEqual([
        { hreflang: 'vi-VN', href: 'https://jlpt4you.com/vn/landing' },
        { hreflang: 'en-US', href: 'https://jlpt4you.com/en/landing' },
        { hreflang: 'ja-JP', href: 'https://jlpt4you.com/jp/landing' }
      ])
    })

    test('should generate hreflang links for auth pages', () => {
      const links = generateHreflangLinks('/login')
      expect(links).toEqual([
        { hreflang: 'vi-VN', href: 'https://jlpt4you.com/auth/vn/login' },
        { hreflang: 'en-US', href: 'https://jlpt4you.com/auth/en/login' },
        { hreflang: 'ja-JP', href: 'https://jlpt4you.com/auth/jp/login' }
      ])
    })

    test('should generate clean URLs for private pages', () => {
      const links = generateHreflangLinks('/home')
      expect(links).toEqual([
        { hreflang: 'vi-VN', href: 'https://jlpt4you.com/home' },
        { hreflang: 'en-US', href: 'https://jlpt4you.com/home' },
        { hreflang: 'ja-JP', href: 'https://jlpt4you.com/home' }
      ])
    })

    test('should use custom base URL', () => {
      const links = generateHreflangLinks('/landing', 'https://example.com')
      expect(links[0].href).toBe('https://example.com/vn/landing')
    })
  })
})
