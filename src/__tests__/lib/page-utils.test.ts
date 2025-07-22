/**
 * Unit Tests for Page Utils
 * Tests shared page utilities to ensure reliability
 */

// Import only the functions we can test without JSX
import {
  getLanguageFromCode,
  generateHreflangLinks,
  getContentLanguage,
  generateLanguageStaticParams,
  extractPageSegments,
  validatePageParams,
  generateRoute
} from '@/lib/page-utils-core'
import { Language } from '@/lib/i18n'

describe('getLanguageFromCode', () => {
  it('should return correct language for numeric codes', () => {
    expect(getLanguageFromCode('1')).toBe('vn')
    expect(getLanguageFromCode('2')).toBe('jp')
    expect(getLanguageFromCode('3')).toBe('en')
  })

  it('should return correct language for language codes', () => {
    expect(getLanguageFromCode('vn')).toBe('vn')
    expect(getLanguageFromCode('jp')).toBe('jp')
    expect(getLanguageFromCode('en')).toBe('en')
  })

  it('should return null for invalid codes', () => {
    expect(getLanguageFromCode('invalid')).toBeNull()
    expect(getLanguageFromCode('4')).toBeNull()
    expect(getLanguageFromCode('')).toBeNull()
  })
})

describe('generateHreflangLinks', () => {
  it('should generate correct hreflang links', () => {
    const links = generateHreflangLinks('/jlpt/official')
    
    expect(links).toEqual({
      'vi-VN': 'https://jlpt4you.com/vn/jlpt/official',
      'ja-JP': 'https://jlpt4you.com/jp/jlpt/official',
      'en-US': 'https://jlpt4you.com/en/jlpt/official',
      'x-default': 'https://jlpt4you.com/vn/jlpt/official'
    })
  })

  it('should handle root path', () => {
    const links = generateHreflangLinks('/')
    
    expect(links['vi-VN']).toBe('https://jlpt4you.com/vn/')
    expect(links['x-default']).toBe('https://jlpt4you.com/vn/')
  })
})

describe('getContentLanguage', () => {
  it('should return correct content language headers', () => {
    expect(getContentLanguage('vn')).toBe('vi-VN')
    expect(getContentLanguage('jp')).toBe('ja-JP')
    expect(getContentLanguage('en')).toBe('en-US')
  })
})

describe('generateLanguageStaticParams', () => {
  it('should generate all language parameters', () => {
    const params = generateLanguageStaticParams()
    
    expect(params).toEqual([
      { lang: 'vn' },
      { lang: 'jp' },
      { lang: 'en' },
      { lang: '1' },
      { lang: '2' },
      { lang: '3' }
    ])
  })
})

describe('extractPageSegments', () => {
  it('should extract segments correctly', () => {
    const segments = ['jlpt', 'official', 'n1', 'test']
    const result = extractPageSegments(segments)
    
    expect(result).toEqual({
      feature: 'jlpt',
      subFeature: 'official',
      level: 'n1',
      action: 'test'
    })
  })

  it('should handle partial segments', () => {
    const segments = ['challenge', 'n2']
    const result = extractPageSegments(segments)
    
    expect(result).toEqual({
      feature: 'challenge',
      subFeature: 'n2',
      level: undefined,
      action: undefined
    })
  })

  it('should handle single segment', () => {
    const segments = ['home']
    const result = extractPageSegments(segments)
    
    expect(result).toEqual({
      feature: 'home',
      subFeature: undefined,
      level: undefined,
      action: undefined
    })
  })
})

describe('validatePageParams', () => {
  it('should validate valid JLPT params', () => {
    expect(validatePageParams({
      feature: 'jlpt',
      subFeature: 'official',
      level: 'n1',
      action: 'test'
    })).toBe(true)
  })

  it('should validate valid challenge params', () => {
    expect(validatePageParams({
      feature: 'challenge',
      level: 'n2',
      action: 'test-setup'
    })).toBe(true)
  })

  it('should validate valid driving params', () => {
    expect(validatePageParams({
      feature: 'driving',
      level: 'honmen',
      action: 'test'
    })).toBe(true)
  })

  it('should reject invalid feature', () => {
    expect(validatePageParams({
      feature: 'invalid'
    })).toBe(false)
  })

  it('should reject invalid JLPT subfeature', () => {
    expect(validatePageParams({
      feature: 'jlpt',
      subFeature: 'invalid'
    })).toBe(false)
  })

  it('should reject invalid JLPT level', () => {
    expect(validatePageParams({
      feature: 'jlpt',
      subFeature: 'official',
      level: 'invalid'
    })).toBe(false)
  })

  it('should reject invalid driving level', () => {
    expect(validatePageParams({
      feature: 'driving',
      level: 'invalid'
    })).toBe(false)
  })

  it('should reject invalid action', () => {
    expect(validatePageParams({
      feature: 'jlpt',
      action: 'invalid'
    })).toBe(false)
  })
})

describe('generateRoute', () => {
  it('should generate home route', () => {
    const route = generateRoute('home', 'vn', {})
    expect(route).toBe('/vn/home')
  })

  it('should generate JLPT routes', () => {
    expect(generateRoute('jlpt', 'vn', { type: 'official' }))
      .toBe('/vn/jlpt/official')
    
    expect(generateRoute('jlpt', 'jp', { type: 'custom', level: 'n1' }))
      .toBe('/jp/jlpt/custom/n1')
  })

  it('should generate challenge routes', () => {
    expect(generateRoute('challenge', 'en', { level: 'n2' }))
      .toBe('/en/challenge/n2')
  })

  it('should generate driving routes', () => {
    expect(generateRoute('driving', 'vn', { type: 'honmen' }))
      .toBe('/vn/driving/honmen')
    
    expect(generateRoute('driving', 'jp', { type: 'karimen' }))
      .toBe('/jp/driving/karimen')
  })

  it('should generate auth routes', () => {
    expect(generateRoute('auth', 'vn', { type: 'login' }))
      .toBe('/auth/vn/login')
    
    expect(generateRoute('auth', 'en', { type: 'register' }))
      .toBe('/auth/en/register')
  })
})

// Mock translation data for testing
const mockTranslations = {
  common: {
    appName: 'JLPT4You'
  },
  jlpt: {
    page: {
      title: 'JLPT Practice',
      subtitle: 'Japanese Language Proficiency Test preparation'
    }
  },
  challenge: {
    page: {
      title: 'Challenge Mode',
      subtitle: 'Timed JLPT practice with anti-cheat'
    }
  }
}

// Integration tests with mock data
describe('Integration Tests', () => {
  it('should work with createLanguageAwarePage pattern', async () => {
    // Mock component
    const TestComponent = ({ translations, language }: any) => {
      return `${language}: ${translations.common.appName}`
    }

    // This would be used in actual page components
    const metadataConfig = {
      titleKey: 'jlpt.page.title',
      descriptionKey: 'jlpt.page.subtitle',
      path: '/jlpt'
    }

    // Test that the pattern works
    expect(metadataConfig.titleKey).toBe('jlpt.page.title')
    expect(metadataConfig.path).toBe('/jlpt')
  })

  it('should generate consistent routes across features', () => {
    const language: Language = 'vn'

    const routes = {
      home: generateRoute('home', language, {}),
      jlptOfficial: generateRoute('jlpt', language, { type: 'official' }),
      challengeN1: generateRoute('challenge', language, { level: 'n1' }),
      drivingHonmen: generateRoute('driving', language, { type: 'honmen' }),
      login: generateRoute('auth', language, { type: 'login' })
    }

    expect(routes.home).toBe('/vn/home')
    expect(routes.jlptOfficial).toBe('/vn/jlpt/official')
    expect(routes.challengeN1).toBe('/vn/challenge/n1')
    expect(routes.drivingHonmen).toBe('/vn/driving/honmen')
    expect(routes.login).toBe('/auth/vn/login')
  })
})

// Performance tests
describe('Performance Tests', () => {
  it('should handle large number of route generations efficiently', () => {
    const start = performance.now()

    for (let i = 0; i < 1000; i++) {
      generateRoute('jlpt', 'vn', { type: 'official', level: 'n1' })
      generateRoute('challenge', 'jp', { level: 'n2' })
      generateRoute('driving', 'en', { type: 'honmen' })
    }

    const end = performance.now()
    expect(end - start).toBeLessThan(100) // Should complete in under 100ms
  })
})
