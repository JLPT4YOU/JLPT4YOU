/**
 * Test suite for routing consistency
 * Verifies that protected routes use clean URLs and public/auth routes use lang-prefixed URLs
 */

import { 
  routes, 
  generateRoute, 
  parseRoute, 
  generateBreadcrumbs, 
  isValidRoute,
  ROUTE_PATTERNS 
} from '@/shared/constants/routes'
import { Language } from '@/lib/i18n'

describe('Routing Consistency Tests', () => {
  describe('Protected Routes (Clean URLs)', () => {
    test('home route should return clean URL', () => {
      expect(routes.home()).toBe('/home')
      expect(routes.home('vn')).toBe('/home')
      expect(routes.home('jp')).toBe('/home')
      expect(routes.home('en')).toBe('/home')
    })

    test('jlpt routes should return clean URLs', () => {
      expect(routes.jlpt()).toBe('/jlpt')
      expect(routes.jlptOfficial()).toBe('/jlpt/official')
      expect(routes.jlptCustom()).toBe('/jlpt/custom')
      expect(routes.jlptLevel('vn', 'official', 'n3')).toBe('/jlpt/official/n3')
      expect(routes.jlptTest('jp', 'custom', 'n1')).toBe('/jlpt/custom/n1/test')
      expect(routes.jlptTestSetup('en', 'official', 'n5')).toBe('/jlpt/official/n5/test-setup')
    })

    test('challenge routes should return clean URLs', () => {
      expect(routes.challenge()).toBe('/challenge')
      expect(routes.challengeLevel('vn', 'n3')).toBe('/challenge/n3')
      expect(routes.challengeTest('jp', 'n1')).toBe('/challenge/n1/test')
      expect(routes.challengeTestSetup('en', 'n5')).toBe('/challenge/n5/test-setup')
    })

    test('driving routes should return clean URLs', () => {
      expect(routes.driving()).toBe('/driving')
      expect(routes.drivingType('vn', 'honmen')).toBe('/driving/honmen')
      expect(routes.drivingType('jp', 'karimen')).toBe('/driving/karimen')
      expect(routes.drivingTest('en', 'honmen')).toBe('/driving/honmen/test')
      expect(routes.drivingTestSetup('vn', 'karimen')).toBe('/driving/karimen/test-setup')
    })

    test('study routes should return clean URLs', () => {
      expect(routes.study()).toBe('/study')
      expect(routes.studyTheory()).toBe('/study/theory')
      expect(routes.studyPractice()).toBe('/study/practice')
    })

    test('dict route should return clean URL', () => {
      expect(routes.dict()).toBe('/dict')
    })
  })

  describe('Public/Auth Routes (Lang-Prefixed URLs)', () => {
    test('auth routes should return lang-prefixed URLs', () => {
      expect(routes.login('vn')).toBe('/auth/vn/login')
      expect(routes.login('jp')).toBe('/auth/jp/login')
      expect(routes.login('en')).toBe('/auth/en/login')
      
      expect(routes.register('vn')).toBe('/auth/vn/register')
      expect(routes.register('jp')).toBe('/auth/jp/register')
      expect(routes.register('en')).toBe('/auth/en/register')
      
      expect(routes.forgotPassword('vn')).toBe('/auth/vn/forgot-password')
      expect(routes.forgotPassword('jp')).toBe('/auth/jp/forgot-password')
      expect(routes.forgotPassword('en')).toBe('/auth/en/forgot-password')
    })

    test('landing routes should return lang-prefixed URLs', () => {
      expect(routes.landing('vn')).toBe('/vn/landing')
      expect(routes.landing('jp')).toBe('/jp/landing')
      expect(routes.landing('en')).toBe('/en/landing')
    })
  })

  describe('generateRoute Function', () => {
    test('should generate clean URLs for protected features', () => {
      expect(generateRoute('home', 'vn', {})).toBe('/home')
      expect(generateRoute('jlpt', 'jp', {})).toBe('/jlpt')
      expect(generateRoute('jlpt', 'en', { type: 'official' })).toBe('/jlpt/official')
      expect(generateRoute('jlpt', 'vn', { type: 'custom', level: 'n3' })).toBe('/jlpt/custom/n3')
      expect(generateRoute('challenge', 'jp', { level: 'n1' })).toBe('/challenge/n1')
      expect(generateRoute('driving', 'en', { type: 'honmen' })).toBe('/driving/honmen')
      expect(generateRoute('study', 'vn', { type: 'theory' })).toBe('/study/theory')
    })

    test('should generate lang-prefixed URLs for auth features', () => {
      expect(generateRoute('auth', 'vn', { type: 'login' })).toBe('/auth/vn/login')
      expect(generateRoute('auth', 'jp', { type: 'register' })).toBe('/auth/jp/register')
      expect(generateRoute('auth', 'en', { type: 'forgot-password' })).toBe('/auth/en/forgot-password')
    })
  })

  describe('parseRoute Function', () => {
    test('should parse clean URLs for protected routes', () => {
      expect(parseRoute('/home')).toEqual({
        language: null,
        feature: 'home',
        params: {}
      })

      expect(parseRoute('/jlpt/official/n3')).toEqual({
        language: null,
        feature: 'jlpt',
        params: { type: 'official', level: 'n3' }
      })

      expect(parseRoute('/challenge/n1/test')).toEqual({
        language: null,
        feature: 'challenge',
        params: { level: 'n1', action: 'test' }
      })

      expect(parseRoute('/driving/honmen')).toEqual({
        language: null,
        feature: 'driving',
        params: { type: 'honmen' }
      })

      expect(parseRoute('/study/theory')).toEqual({
        language: null,
        feature: 'study',
        params: { type: 'theory' }
      })
    })

    test('should parse lang-prefixed URLs for auth routes', () => {
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
    })

    test('should parse lang-prefixed URLs for landing routes', () => {
      expect(parseRoute('/vn/landing')).toEqual({
        language: 'vn',
        feature: 'landing',
        params: {}
      })

      expect(parseRoute('/jp/landing')).toEqual({
        language: 'jp',
        feature: 'landing',
        params: {}
      })
    })
  })

  describe('generateBreadcrumbs Function', () => {
    const mockTranslations = {
      common: { home: 'Home' },
      jlpt: { page: { title: 'JLPT' }, official: { page: { title: 'Official' } } },
      challenge: { page: { title: 'Challenge' } },
      driving: { page: { title: 'Driving' } },
      study: { page: { title: 'Study' } }
    }

    test('should generate breadcrumbs with clean URLs', () => {
      const breadcrumbs = generateBreadcrumbs('/jlpt/official/n3', mockTranslations)
      
      expect(breadcrumbs).toHaveLength(4)
      expect(breadcrumbs[0]).toEqual({
        label: 'Home',
        href: '/home',
        isActive: false
      })
      expect(breadcrumbs[1]).toEqual({
        label: 'JLPT',
        href: '/jlpt',
        isActive: false
      })
      expect(breadcrumbs[2]).toEqual({
        label: 'Official',
        href: '/jlpt/official',
        isActive: false
      })
      expect(breadcrumbs[3]).toEqual({
        label: 'N3',
        href: '/jlpt/official/n3',
        isActive: true
      })
    })
  })

  describe('isValidRoute Function', () => {
    test('should validate clean URLs for protected routes', () => {
      expect(isValidRoute('/home')).toBe(true)
      expect(isValidRoute('/jlpt')).toBe(true)
      expect(isValidRoute('/jlpt/official')).toBe(true)
      expect(isValidRoute('/jlpt/official/n3')).toBe(true)
      expect(isValidRoute('/challenge/n1')).toBe(true)
      expect(isValidRoute('/driving/honmen')).toBe(true)
      expect(isValidRoute('/study/theory')).toBe(true)
      expect(isValidRoute('/dict')).toBe(true)
    })

    test('should validate lang-prefixed URLs for auth/public routes', () => {
      expect(isValidRoute('/auth/vn/login')).toBe(true)
      expect(isValidRoute('/auth/jp/register')).toBe(true)
      expect(isValidRoute('/vn/landing')).toBe(true)
      expect(isValidRoute('/jp/landing')).toBe(true)
    })

    test('should reject invalid routes', () => {
      expect(isValidRoute('/invalid')).toBe(false)
      expect(isValidRoute('/jlpt/invalid')).toBe(false)
      expect(isValidRoute('/auth/login')).toBe(false) // Missing language
      expect(isValidRoute('/landing')).toBe(false) // Missing language
    })
  })
})
