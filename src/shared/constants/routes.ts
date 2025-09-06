/**
 * Shared Route Constants for JLPT4You
 * Centralizes route patterns and URL generation to eliminate duplication
 */

import { Language } from '@/lib/i18n'

// Route feature types
export type RouteFeature = 'home' | 'jlpt' | 'challenge' | 'driving' | 'dict' | 'study' | 'library' | 'auth' | 'landing' | 'settings' | 'exam-results' | 'review-answers'
export type JLPTType = 'official' | 'custom'
export type StudyType = 'theory' | 'practice'
export type AuthType = 'login' | 'register' | 'forgot-password' | 'landing'

// Route parameter interfaces
export interface RouteParams {
  home: Record<string, never>
  jlpt: {
    type?: JLPTType
    level?: string
    action?: 'test' | 'test-setup'
  }
  challenge: {
    level: string
    action?: 'test' | 'test-setup'
  }
  driving: {
    type: 'honmen' | 'karimen'
    action?: 'test' | 'test-setup'
  }
  dict: Record<string, never>
  study: {
    type?: StudyType
  }
  library: {
    category?: 'jlpt' | 'other'
    level?: string
  }
  auth: {
    type: AuthType
  }
  landing: Record<string, never>
  settings: Record<string, never>
  'exam-results': Record<string, never>
  'review-answers': Record<string, never>
}

// Base route patterns
export const ROUTE_PATTERNS = {
  // Protected routes (clean URLs for authenticated users)
  home: '/home',
  jlpt: '/jlpt',
  jlptType: '/jlpt/{type}',
  jlptLevel: '/jlpt/{type}/{level}',
  jlptTest: '/jlpt/{type}/{level}/test',
  jlptTestSetup: '/jlpt/{type}/{level}/test-setup',

  challenge: '/challenge',
  challengeLevel: '/challenge/{level}',
  challengeTest: '/challenge/{level}/test',
  challengeTestSetup: '/challenge/{level}/test-setup',

  driving: '/driving',
  drivingType: '/driving/{type}',
  drivingTest: '/driving/{type}/test',
  drivingTestSetup: '/driving/{type}/test-setup',

  dict: '/dict',

  study: '/study',
  studyType: '/study/{type}',

  // Public routes (language-prefixed)
  auth: '/{lang}',
  landing: '/{lang}/landing',
  authType: '/auth/{lang}/{type}',

  // Legacy routes (for redirects)
  legacyJlpt: '/jlpt/{type}/{level}',
  legacyChallenge: '/challenge/{level}',
  legacyDriving: '/driving/{type}',
  legacyAuth: '/{lang}/{type}' // Old auth pattern
} as const

// Route generation functions
export function generateRoute<T extends RouteFeature>(
  feature: T,
  language: Language,
  params: RouteParams[T]
): string {
  switch (feature) {
    case 'home':
      return '/home'

    case 'jlpt': {
      const jlptParams = params as RouteParams['jlpt']
      let path = '/jlpt'

      if (jlptParams.type) {
        path += `/${jlptParams.type}`

        if (jlptParams.level) {
          path += `/${jlptParams.level}`

          if (jlptParams.action) {
            path += `/${jlptParams.action}`
          }
        }
      }

      return path
    }

    case 'challenge': {
      const challengeParams = params as RouteParams['challenge']
      let path = '/challenge'

      if (challengeParams.level) {
        path += `/${challengeParams.level}`

        if (challengeParams.action) {
          path += `/${challengeParams.action}`
        }
      }

      return path
    }

    case 'driving': {
      const drivingParams = params as RouteParams['driving']
      let path = '/driving'

      if (drivingParams.type) {
        path += `/${drivingParams.type}`

        if (drivingParams.action) {
          path += `/${drivingParams.action}`
        }
      }

      return path
    }

    case 'study': {
      const studyParams = params as RouteParams['study']
      let path = '/study'

      if (studyParams.type) {
        path += `/${studyParams.type}`
      }

      return path
    }

    case 'auth': {
      const authParams = params as RouteParams['auth']
      return `/auth/${language}/${authParams.type}`
    }

    case 'landing': {
      return `/${language}/landing`
    }

    default:
      return `/${language}`
  }
}

// Convenience functions for common routes
export const routes = {
  // Protected routes (clean URLs - language parameter ignored for consistency)
  home: () => '/home',

  jlpt: () => '/jlpt',

  jlptOfficial: () => '/jlpt/official',

  jlptCustom: () => '/jlpt/custom',

  jlptLevel: (type: JLPTType, level: string) =>
    `/jlpt/${type}/${level}`,

  jlptTest: (type: JLPTType, level: string) =>
    `/jlpt/${type}/${level}/test`,

  jlptTestSetup: (type: JLPTType, level: string) =>
    `/jlpt/${type}/${level}/test-setup`,

  challenge: () => '/challenge',

  challengeLevel: (level: string) =>
    `/challenge/${level}`,

  challengeTest: (level: string) =>
    `/challenge/${level}/test`,

  challengeTestSetup: (level: string) =>
    `/challenge/${level}/test-setup`,

  driving: () => '/driving',

  drivingType: (type: 'honmen' | 'karimen') =>
    `/driving/${type}`,

  drivingTest: (type: 'honmen' | 'karimen') =>
    `/driving/${type}/test`,

  drivingTestSetup: (type: 'honmen' | 'karimen') =>
    `/driving/${type}/test-setup`,

  dict: () => '/dict',

  study: () => '/study',

  studyTheory: () => '/study/theory',

  studyPractice: () => '/study/practice',

  // Public routes (language-prefixed)
  login: (language: Language) =>
    generateRoute('auth', language, { type: 'login' }),

  register: (language: Language) =>
    generateRoute('auth', language, { type: 'register' }),

  forgotPassword: (language: Language) =>
    generateRoute('auth', language, { type: 'forgot-password' }),

  landing: (language: Language) =>
    `/${language}/landing`
}

// Route parsing utilities
export function parseRoute(pathname: string): {
  language: Language | null
  feature: RouteFeature | null
  params: Record<string, string>
} {
  const segments = pathname.split('/').filter(Boolean)

  if (segments.length === 0) {
    return { language: null, feature: null, params: {} }
  }

  // Check for auth routes first (/auth/{lang}/{type})
  if (segments[0] === 'auth' && segments.length >= 2) {
    const language = getLanguageFromSegment(segments[1])
    const authType = segments[2] as AuthType

    return {
      language,
      feature: 'auth',
      params: { type: authType }
    }
  }

  // Check for language-prefixed public routes (/{lang}/landing)
  const firstSegmentLanguage = getLanguageFromSegment(segments[0])
  if (firstSegmentLanguage && segments.length >= 2) {
    const feature = segments[1] as RouteFeature
    const params: Record<string, string> = {}

    // Parse feature-specific parameters for lang-prefixed routes
    switch (feature) {
      case 'landing':
        return { language: firstSegmentLanguage, feature: 'landing' as RouteFeature, params: {} }
    }

    return { language: firstSegmentLanguage, feature, params }
  }

  // Handle clean URLs for protected routes (no language prefix)
  const feature = segments[0] as RouteFeature
  const params: Record<string, string> = {}

  // Parse feature-specific parameters for clean URLs
  switch (feature) {
    case 'home':
      return { language: null, feature, params: {} }

    case 'jlpt':
      if (segments[1]) params.type = segments[1]
      if (segments[2]) params.level = segments[2]
      if (segments[3]) params.action = segments[3]
      return { language: null, feature, params }

    case 'challenge':
      if (segments[1]) params.level = segments[1]
      if (segments[2]) params.action = segments[2]
      return { language: null, feature, params }

    case 'driving':
      if (segments[1]) params.type = segments[1]
      if (segments[2]) params.action = segments[2]
      return { language: null, feature, params }

    case 'study':
      if (segments[1]) params.type = segments[1]
      return { language: null, feature, params }

    case 'dict':
    case 'library':
    case 'settings':
    case 'exam-results':
    case 'review-answers':
      return { language: null, feature, params: {} }
  }

  // If no match found, return null
  return { language: null, feature: null, params: {} }
}

// Helper function to get language from URL segment
function getLanguageFromSegment(segment: string): Language | null {
  switch (segment) {
    case '1':
    case 'vn':
      return 'vn'
    case '2':
    case 'jp':
      return 'jp'
    case '3':
    case 'en':
      return 'en'
    default:
      return null
  }
}

// Generate breadcrumb data from route
export interface Breadcrumb {
  label: string
  href: string
  isActive: boolean
}

interface TranslationsStructure {
  common?: { home?: string };
  jlpt?: Record<string, { page?: { title?: string }; title?: string }>;
  challenge?: { page?: { title?: string } };
  driving?: { page?: { title?: string } };
  study?: { page?: { title?: string } };
  [key: string]: unknown;
}

export function generateBreadcrumbs(
  pathname: string,
  translations: TranslationsStructure
): Breadcrumb[] {
  const { language, feature, params } = parseRoute(pathname)

  if (!feature) {
    return []
  }

  const breadcrumbs: Breadcrumb[] = [
    {
      label: translations.common?.home || 'Home',
      href: routes.home(),
      isActive: false
    }
  ]

  switch (feature) {
    case 'jlpt':
      breadcrumbs.push({
        label: translations.jlpt?.page?.title || 'JLPT',
        href: routes.jlpt(),
        isActive: !params.type
      })

      if (params.type) {
        breadcrumbs.push({
          label: translations.jlpt?.[params.type]?.page?.title || params.type,
          href: `/jlpt/${params.type}`,
          isActive: !params.level
        })

        if (params.level) {
          breadcrumbs.push({
            label: params.level.toUpperCase(),
            href: `/jlpt/${params.type}/${params.level}`,
            isActive: !params.action
          })
        }
      }
      break

    case 'challenge':
      breadcrumbs.push({
        label: translations.challenge?.page?.title || 'Challenge',
        href: routes.challenge(),
        isActive: !params.level
      })

      if (params.level) {
        breadcrumbs.push({
          label: `Challenge ${params.level.toUpperCase()}`,
          href: `/challenge/${params.level}`,
          isActive: !params.action
        })
      }
      break

    case 'driving':
      breadcrumbs.push({
        label: translations.driving?.page?.title || 'Driving',
        href: routes.driving(),
        isActive: !params.type
      })

      if (params.type) {
        breadcrumbs.push({
          label: params.type === 'honmen' ? 'Honmen' : 'Karimen',
          href: `/driving/${params.type}`,
          isActive: !params.action
        })
      }
      break

    case 'study':
      breadcrumbs.push({
        label: translations.study?.page?.title || 'Study',
        href: routes.study(),
        isActive: !params.type
      })

      if (params.type) {
        breadcrumbs.push({
          label: params.type === 'theory' ? 'Theory' : 'Practice',
          href: `/study/${params.type}`,
          isActive: true
        })
      }
      break
  }

  // Mark the last item as active
  if (breadcrumbs.length > 0) {
    breadcrumbs[breadcrumbs.length - 1].isActive = true
  }

  return breadcrumbs
}

// URL validation
export function isValidRoute(pathname: string): boolean {
  const { language, feature, params } = parseRoute(pathname)

  if (!feature) return false

  const validFeatures: RouteFeature[] = ['home', 'jlpt', 'challenge', 'driving', 'dict', 'study', 'library', 'settings', 'exam-results', 'review-answers', 'auth', 'landing']
  if (!validFeatures.includes(feature)) return false

  // Feature-specific validation
  switch (feature) {
    case 'jlpt':
      if (params.type && !['official', 'custom'].includes(params.type)) return false
      if (params.level && !isValidJLPTLevel(params.level)) return false
      if (params.action && !['test', 'test-setup'].includes(params.action)) return false
      break

    case 'challenge':
      if (params.level && !isValidJLPTLevel(params.level)) return false
      if (params.action && !['test', 'test-setup'].includes(params.action)) return false
      break

    case 'driving':
      if (params.type && !['honmen', 'karimen'].includes(params.type)) return false
      if (params.action && !['test', 'test-setup'].includes(params.action)) return false
      break

    case 'study':
      if (params.type && !['theory', 'practice'].includes(params.type)) return false
      break

    case 'auth':
      // Auth routes require language
      if (!language) return false
      if (params.type && !['login', 'register', 'forgot-password'].includes(params.type)) return false
      break

    case 'landing':
      // Landing routes require language
      if (!language) return false
      break
  }

  return true
}

// Helper function for level validation (imported from levels.ts)
function isValidJLPTLevel(level: string): boolean {
  return ['n1', 'n2', 'n3', 'n4', 'n5'].includes(level.toLowerCase())
}
