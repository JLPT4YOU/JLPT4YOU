/**
 * Comprehensive tests for routing constants and utilities
 * Testing: generateRoute, parseRoute, routes convenience functions,
 * isValidRoute, generateBreadcrumbs, and route validation
 */

import {
  generateRoute,
  parseRoute,
  routes,
  isValidRoute,
  generateBreadcrumbs,
  ROUTE_PATTERNS,
  type RouteFeature,
  type RouteParams,
  type JLPTType,
  type AuthType
} from '@/shared/constants/routes'
import { Language } from '@/lib/i18n'

describe('ROUTE_PATTERNS', () => {
  test('should have correct route patterns', () => {
    expect(ROUTE_PATTERNS.home).toBe('/{lang}/home')
    expect(ROUTE_PATTERNS.jlpt).toBe('/{lang}/jlpt')
    expect(ROUTE_PATTERNS.jlptType).toBe('/{lang}/jlpt/{type}')
    expect(ROUTE_PATTERNS.jlptLevel).toBe('/{lang}/jlpt/{type}/{level}')
    expect(ROUTE_PATTERNS.jlptTest).toBe('/{lang}/jlpt/{type}/{level}/test')
    expect(ROUTE_PATTERNS.jlptTestSetup).toBe('/{lang}/jlpt/{type}/{level}/test-setup')
    
    expect(ROUTE_PATTERNS.challenge).toBe('/{lang}/challenge')
    expect(ROUTE_PATTERNS.challengeLevel).toBe('/{lang}/challenge/{level}')
    expect(ROUTE_PATTERNS.challengeTest).toBe('/{lang}/challenge/{level}/test')
    expect(ROUTE_PATTERNS.challengeTestSetup).toBe('/{lang}/challenge/{level}/test-setup')
    
    expect(ROUTE_PATTERNS.driving).toBe('/{lang}/driving')
    expect(ROUTE_PATTERNS.drivingType).toBe('/{lang}/driving/{type}')
    expect(ROUTE_PATTERNS.drivingTest).toBe('/{lang}/driving/{type}/test')
    expect(ROUTE_PATTERNS.drivingTestSetup).toBe('/{lang}/driving/{type}/test-setup')
    
    expect(ROUTE_PATTERNS.auth).toBe('/auth/{lang}')
    expect(ROUTE_PATTERNS.authType).toBe('/auth/{lang}/{type}')
  })
})

describe('generateRoute', () => {
  describe('home routes', () => {
    test('should generate home routes for all languages', () => {
      expect(generateRoute('home', 'vn', {})).toBe('/vn/home')
      expect(generateRoute('home', 'jp', {})).toBe('/jp/home')
      expect(generateRoute('home', 'en', {})).toBe('/en/home')
    })
  })

  describe('JLPT routes', () => {
    test('should generate basic JLPT route', () => {
      expect(generateRoute('jlpt', 'vn', {})).toBe('/vn/jlpt')
    })

    test('should generate JLPT type routes', () => {
      expect(generateRoute('jlpt', 'vn', { type: 'official' })).toBe('/vn/jlpt/official')
      expect(generateRoute('jlpt', 'jp', { type: 'custom' })).toBe('/jp/jlpt/custom')
    })

    test('should generate JLPT level routes', () => {
      expect(generateRoute('jlpt', 'vn', { type: 'official', level: 'n1' })).toBe('/vn/jlpt/official/n1')
      expect(generateRoute('jlpt', 'en', { type: 'custom', level: 'n5' })).toBe('/en/jlpt/custom/n5')
    })

    test('should generate JLPT action routes', () => {
      expect(generateRoute('jlpt', 'vn', { type: 'official', level: 'n1', action: 'test' }))
        .toBe('/vn/jlpt/official/n1/test')
      expect(generateRoute('jlpt', 'jp', { type: 'custom', level: 'n2', action: 'test-setup' }))
        .toBe('/jp/jlpt/custom/n2/test-setup')
    })
  })

  describe('Challenge routes', () => {
    test('should generate challenge level routes', () => {
      expect(generateRoute('challenge', 'vn', { level: 'n1' })).toBe('/vn/challenge/n1')
      expect(generateRoute('challenge', 'jp', { level: 'n3' })).toBe('/jp/challenge/n3')
    })

    test('should generate challenge action routes', () => {
      expect(generateRoute('challenge', 'vn', { level: 'n1', action: 'test' }))
        .toBe('/vn/challenge/n1/test')
      expect(generateRoute('challenge', 'en', { level: 'n2', action: 'test-setup' }))
        .toBe('/en/challenge/n2/test-setup')
    })
  })

  describe('Driving routes', () => {
    test('should generate driving type routes', () => {
      expect(generateRoute('driving', 'vn', { type: 'honmen' })).toBe('/vn/driving/honmen')
      expect(generateRoute('driving', 'jp', { type: 'karimen' })).toBe('/jp/driving/karimen')
    })

    test('should generate driving action routes', () => {
      expect(generateRoute('driving', 'vn', { type: 'honmen', action: 'test' }))
        .toBe('/vn/driving/honmen/test')
      expect(generateRoute('driving', 'en', { type: 'karimen', action: 'test-setup' }))
        .toBe('/en/driving/karimen/test-setup')
    })
  })

  describe('Auth routes', () => {
    test('should generate auth routes with different pattern', () => {
      expect(generateRoute('auth', 'vn', { type: 'login' })).toBe('/auth/vn/login')
      expect(generateRoute('auth', 'jp', { type: 'register' })).toBe('/auth/jp/register')
      expect(generateRoute('auth', 'en', { type: 'forgot-password' })).toBe('/auth/en/forgot-password')
    })
  })
})

describe('routes convenience functions', () => {
  const language: Language = 'vn'

  test('should generate home route', () => {
    expect(routes.home(language)).toBe('/vn/home')
  })

  test('should generate JLPT routes', () => {
    expect(routes.jlpt(language)).toBe('/vn/jlpt')
    expect(routes.jlptOfficial(language)).toBe('/vn/jlpt/official')
    expect(routes.jlptCustom(language)).toBe('/vn/jlpt/custom')
    expect(routes.jlptLevel(language, 'official', 'n1')).toBe('/vn/jlpt/official/n1')
    expect(routes.jlptTest(language, 'custom', 'n2')).toBe('/vn/jlpt/custom/n2/test')
    expect(routes.jlptTestSetup(language, 'official', 'n3')).toBe('/vn/jlpt/official/n3/test-setup')
  })

  test('should generate challenge routes', () => {
    expect(routes.challengeLevel(language, 'n1')).toBe('/vn/challenge/n1')
    expect(routes.challengeTest(language, 'n2')).toBe('/vn/challenge/n2/test')
    expect(routes.challengeTestSetup(language, 'n3')).toBe('/vn/challenge/n3/test-setup')
  })

  test('should generate driving routes', () => {
    expect(routes.drivingType(language, 'honmen')).toBe('/vn/driving/honmen')
    expect(routes.drivingType(language, 'karimen')).toBe('/vn/driving/karimen')
    expect(routes.drivingTest(language, 'honmen')).toBe('/vn/driving/honmen/test')
    expect(routes.drivingTestSetup(language, 'karimen')).toBe('/vn/driving/karimen/test-setup')
  })

  test('should generate auth routes', () => {
    expect(routes.login(language)).toBe('/auth/vn/login')
    expect(routes.register(language)).toBe('/auth/vn/register')
    expect(routes.forgotPassword(language)).toBe('/auth/vn/forgot-password')
    expect(routes.landing(language)).toBe('/vn/landing')
  })

  test('should work with all languages', () => {
    expect(routes.home('jp')).toBe('/jp/home')
    expect(routes.jlptOfficial('en')).toBe('/en/jlpt/official')
    expect(routes.challengeLevel('jp', 'n1')).toBe('/jp/challenge/n1')
    expect(routes.drivingType('en', 'honmen')).toBe('/en/driving/honmen')
    expect(routes.login('jp')).toBe('/auth/jp/login')
  })
})

describe('parseRoute', () => {
  test('should parse empty route', () => {
    const result = parseRoute('/')
    expect(result).toEqual({
      language: null,
      feature: null,
      params: {}
    })
  })

  test('should parse home routes', () => {
    const result = parseRoute('/vn/home')
    expect(result).toEqual({
      language: 'vn',
      feature: 'home',
      params: {}
    })
  })

  test('should parse JLPT routes', () => {
    expect(parseRoute('/vn/jlpt')).toEqual({
      language: 'vn',
      feature: 'jlpt',
      params: {}
    })

    expect(parseRoute('/jp/jlpt/official')).toEqual({
      language: 'jp',
      feature: 'jlpt',
      params: { type: 'official' }
    })

    expect(parseRoute('/en/jlpt/custom/n1')).toEqual({
      language: 'en',
      feature: 'jlpt',
      params: { type: 'custom', level: 'n1' }
    })

    expect(parseRoute('/vn/jlpt/official/n2/test')).toEqual({
      language: 'vn',
      feature: 'jlpt',
      params: { type: 'official', level: 'n2', action: 'test' }
    })
  })

  test('should parse challenge routes', () => {
    expect(parseRoute('/vn/challenge')).toEqual({
      language: 'vn',
      feature: 'challenge',
      params: {}
    })

    expect(parseRoute('/jp/challenge/n1')).toEqual({
      language: 'jp',
      feature: 'challenge',
      params: { level: 'n1' }
    })

    expect(parseRoute('/en/challenge/n2/test-setup')).toEqual({
      language: 'en',
      feature: 'challenge',
      params: { level: 'n2', action: 'test-setup' }
    })
  })

  test('should parse driving routes', () => {
    expect(parseRoute('/vn/driving')).toEqual({
      language: 'vn',
      feature: 'driving',
      params: {}
    })

    expect(parseRoute('/jp/driving/honmen')).toEqual({
      language: 'jp',
      feature: 'driving',
      params: { type: 'honmen' }
    })

    expect(parseRoute('/en/driving/karimen/test')).toEqual({
      language: 'en',
      feature: 'driving',
      params: { type: 'karimen', action: 'test' }
    })
  })

  test('should parse auth routes', () => {
    expect(parseRoute('/auth/vn/login')).toEqual({
      language: 'vn',
      feature: 'auth',
      params: { type: 'login' }
    })

    expect(parseRoute('/auth/jp/register')).toEqual({
      language: 'jp',
      feature: 'auth',
      params: { type: 'register' }
    })

    expect(parseRoute('/auth/en/forgot-password')).toEqual({
      language: 'en',
      feature: 'auth',
      params: { type: 'forgot-password' }
    })
  })

  test('should handle invalid routes', () => {
    expect(parseRoute('/invalid/path')).toEqual({
      language: null,
      feature: null,
      params: {}
    })

    expect(parseRoute('/auth/invalid')).toEqual({
      language: null,
      feature: 'auth',
      params: { type: undefined }
    })
  })
})

describe('isValidRoute', () => {
  test('should validate correct routes', () => {
    expect(isValidRoute('/vn/home')).toBe(true)
    expect(isValidRoute('/jp/jlpt/official')).toBe(true)
    expect(isValidRoute('/en/jlpt/custom/n1')).toBe(true)
    expect(isValidRoute('/vn/challenge/n2')).toBe(true)
    expect(isValidRoute('/jp/driving/honmen')).toBe(true)
    expect(isValidRoute('/auth/en/login')).toBe(true)
  })

  test('should reject invalid routes', () => {
    expect(isValidRoute('/invalid/path')).toBe(false)
    expect(isValidRoute('/vn/invalid')).toBe(false)
    expect(isValidRoute('/invalid')).toBe(false)
  })

  test('should validate root language routes', () => {
    expect(isValidRoute('/vn')).toBe(true)
    expect(isValidRoute('/jp')).toBe(true)
    expect(isValidRoute('/en')).toBe(true)
  })
})
