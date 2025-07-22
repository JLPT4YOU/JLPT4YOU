/**
 * Shared Route Constants for JLPT4You
 * Centralizes route patterns and URL generation to eliminate duplication
 */

import { Language } from '@/lib/i18n'

// Route feature types
export type RouteFeature = 'home' | 'jlpt' | 'challenge' | 'driving' | 'auth'
export type JLPTType = 'official' | 'custom'
export type AuthType = 'login' | 'register' | 'forgot-password' | 'landing'

// Route parameter interfaces
export interface RouteParams {
  home: {}
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
  auth: { 
    type: AuthType
  }
}

// Base route patterns
export const ROUTE_PATTERNS = {
  // Language-aware routes
  home: '/{lang}/home',
  jlpt: '/{lang}/jlpt',
  jlptType: '/{lang}/jlpt/{type}',
  jlptLevel: '/{lang}/jlpt/{type}/{level}',
  jlptTest: '/{lang}/jlpt/{type}/{level}/test',
  jlptTestSetup: '/{lang}/jlpt/{type}/{level}/test-setup',
  
  challenge: '/{lang}/challenge',
  challengeLevel: '/{lang}/challenge/{level}',
  challengeTest: '/{lang}/challenge/{level}/test',
  challengeTestSetup: '/{lang}/challenge/{level}/test-setup',
  
  driving: '/{lang}/driving',
  drivingType: '/{lang}/driving/{type}',
  drivingTest: '/{lang}/driving/{type}/test',
  drivingTestSetup: '/{lang}/driving/{type}/test-setup',
  
  // Auth routes (different pattern)
  auth: '/auth/{lang}',
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
      return `/${language}/home`
    
    case 'jlpt': {
      const jlptParams = params as RouteParams['jlpt']
      let path = `/${language}/jlpt`
      
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
      let path = `/${language}/challenge`
      
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
      let path = `/${language}/driving`
      
      if (drivingParams.type) {
        path += `/${drivingParams.type}`
        
        if (drivingParams.action) {
          path += `/${drivingParams.action}`
        }
      }
      
      return path
    }
    
    case 'auth': {
      const authParams = params as RouteParams['auth']
      return `/auth/${language}/${authParams.type}`
    }
    
    default:
      return `/${language}`
  }
}

// Convenience functions for common routes
export const routes = {
  home: (language: Language) => 
    generateRoute('home', language, {}),
  
  jlpt: (language: Language) => 
    generateRoute('jlpt', language, {}),
  
  jlptOfficial: (language: Language) => 
    generateRoute('jlpt', language, { type: 'official' }),
  
  jlptCustom: (language: Language) => 
    generateRoute('jlpt', language, { type: 'custom' }),
  
  jlptLevel: (language: Language, type: JLPTType, level: string) => 
    generateRoute('jlpt', language, { type, level }),
  
  jlptTest: (language: Language, type: JLPTType, level: string) => 
    generateRoute('jlpt', language, { type, level, action: 'test' }),
  
  jlptTestSetup: (language: Language, type: JLPTType, level: string) => 
    generateRoute('jlpt', language, { type, level, action: 'test-setup' }),
  
  challenge: (language: Language) => 
    generateRoute('challenge', language, { level: '' }).replace('//', '/'),
  
  challengeLevel: (language: Language, level: string) => 
    generateRoute('challenge', language, { level }),
  
  challengeTest: (language: Language, level: string) => 
    generateRoute('challenge', language, { level, action: 'test' }),
  
  challengeTestSetup: (language: Language, level: string) => 
    generateRoute('challenge', language, { level, action: 'test-setup' }),
  
  driving: (language: Language) => 
    generateRoute('driving', language, { type: 'honmen' }).replace('/honmen', ''),
  
  drivingType: (language: Language, type: 'honmen' | 'karimen') => 
    generateRoute('driving', language, { type }),
  
  drivingTest: (language: Language, type: 'honmen' | 'karimen') => 
    generateRoute('driving', language, { type, action: 'test' }),
  
  drivingTestSetup: (language: Language, type: 'honmen' | 'karimen') => 
    generateRoute('driving', language, { type, action: 'test-setup' }),
  
  login: (language: Language) => 
    generateRoute('auth', language, { type: 'login' }),
  
  register: (language: Language) => 
    generateRoute('auth', language, { type: 'register' }),
  
  forgotPassword: (language: Language) => 
    generateRoute('auth', language, { type: 'forgot-password' }),
  
  landing: (language: Language) => 
    generateRoute('auth', language, { type: 'landing' })
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
  
  // Check for auth routes first (different pattern)
  if (segments[0] === 'auth' && segments.length >= 2) {
    const language = getLanguageFromSegment(segments[1])
    const authType = segments[2] as AuthType
    
    return {
      language,
      feature: 'auth',
      params: { type: authType }
    }
  }
  
  // Standard language-aware routes
  const language = getLanguageFromSegment(segments[0])
  if (!language) {
    return { language: null, feature: null, params: {} }
  }
  
  if (segments.length === 1) {
    return { language, feature: null, params: {} }
  }
  
  const feature = segments[1] as RouteFeature
  const params: Record<string, string> = {}
  
  // Parse feature-specific parameters
  switch (feature) {
    case 'home':
      break
    
    case 'jlpt':
      if (segments[2]) params.type = segments[2]
      if (segments[3]) params.level = segments[3]
      if (segments[4]) params.action = segments[4]
      break
    
    case 'challenge':
      if (segments[2]) params.level = segments[2]
      if (segments[3]) params.action = segments[3]
      break
    
    case 'driving':
      if (segments[2]) params.type = segments[2]
      if (segments[3]) params.action = segments[3]
      break
  }
  
  return { language, feature, params }
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

export function generateBreadcrumbs(
  pathname: string,
  translations: any
): Breadcrumb[] {
  const { language, feature, params } = parseRoute(pathname)
  
  if (!language || !feature) {
    return []
  }
  
  const breadcrumbs: Breadcrumb[] = [
    {
      label: translations.common.home || 'Home',
      href: routes.home(language),
      isActive: false
    }
  ]
  
  switch (feature) {
    case 'jlpt':
      breadcrumbs.push({
        label: translations.jlpt?.page?.title || 'JLPT',
        href: routes.jlpt(language),
        isActive: !params.type
      })
      
      if (params.type) {
        breadcrumbs.push({
          label: translations.jlpt?.[params.type]?.page?.title || params.type,
          href: generateRoute('jlpt', language, { type: params.type as JLPTType }),
          isActive: !params.level
        })
        
        if (params.level) {
          breadcrumbs.push({
            label: params.level.toUpperCase(),
            href: generateRoute('jlpt', language, { 
              type: params.type as JLPTType, 
              level: params.level 
            }),
            isActive: !params.action
          })
        }
      }
      break
    
    case 'challenge':
      breadcrumbs.push({
        label: translations.challenge?.page?.title || 'Challenge',
        href: routes.challenge(language),
        isActive: !params.level
      })
      
      if (params.level) {
        breadcrumbs.push({
          label: `Challenge ${params.level.toUpperCase()}`,
          href: routes.challengeLevel(language, params.level),
          isActive: !params.action
        })
      }
      break
    
    case 'driving':
      breadcrumbs.push({
        label: translations.driving?.page?.title || 'Driving',
        href: routes.driving(language),
        isActive: !params.type
      })
      
      if (params.type) {
        breadcrumbs.push({
          label: params.type === 'honmen' ? 'Honmen' : 'Karimen',
          href: routes.drivingType(language, params.type as 'honmen' | 'karimen'),
          isActive: !params.action
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
  
  if (!language) return false
  if (!feature) return true // Root language route is valid
  
  const validFeatures: RouteFeature[] = ['home', 'jlpt', 'challenge', 'driving', 'auth']
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
    
    case 'auth':
      if (params.type && !['login', 'register', 'forgot-password', 'landing'].includes(params.type)) return false
      break
  }
  
  return true
}

// Helper function for level validation (imported from levels.ts)
function isValidJLPTLevel(level: string): boolean {
  return ['n1', 'n2', 'n3', 'n4', 'n5'].includes(level.toLowerCase())
}
