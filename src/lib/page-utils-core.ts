/**
 * Core Page Utilities (Pure Functions Only - No JSX)
 * For testing purposes and shared logic
 */

import { Language } from '@/lib/i18n'

// Language code mapping utility (consolidates duplicate functions)
export function getLanguageFromCode(code: string): Language | null {
  switch (code) {
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

// Generate hreflang links for SEO
export function generateHreflangLinks(path: string): Record<string, string> {
  const baseUrl = 'https://jlpt4you.com'
  
  return {
    'vi-VN': `${baseUrl}/vn${path}`,
    'ja-JP': `${baseUrl}/jp${path}`,
    'en-US': `${baseUrl}/en${path}`,
    'x-default': `${baseUrl}/vn${path}`
  }
}

// Generate content language header
export function getContentLanguage(language: Language): string {
  const languageMap = {
    vn: 'vi-VN',
    jp: 'ja-JP',
    en: 'en-US'
  }
  
  return languageMap[language]
}

// Standard static params generation for all language-aware pages
export function generateLanguageStaticParams() {
  return [
    { lang: 'vn' }, // Vietnamese (primary)
    { lang: 'jp' }, // Japanese (primary)
    { lang: 'en' }, // English (primary)
    { lang: '1' },  // Vietnamese (backward compatibility)
    { lang: '2' },  // Japanese (backward compatibility)
    { lang: '3' }   // English (backward compatibility)
  ]
}

// Utility for extracting page segments from params
export function extractPageSegments(segments: string[]): {
  feature: string
  subFeature?: string
  level?: string
  action?: string
} {
  const [feature, subFeature, level, action] = segments

  return {
    feature,
    subFeature,
    level,
    action
  }
}

// Validate page parameters
export function validatePageParams(params: {
  feature?: string
  subFeature?: string
  level?: string
  action?: string
}): boolean {
  const validFeatures = ['jlpt', 'challenge', 'driving', 'home', 'auth']
  const validJLPTSubFeatures = ['official', 'custom']
  const validJLPTLevels = ['n1', 'n2', 'n3', 'n4', 'n5']
  const validDrivingLevels = ['honmen', 'karimen']
  const validActions = ['test', 'test-setup']

  if (params.feature && !validFeatures.includes(params.feature)) {
    return false
  }

  if (params.feature === 'jlpt' && params.subFeature && !validJLPTSubFeatures.includes(params.subFeature)) {
    return false
  }

  if (params.level) {
    if (params.feature === 'jlpt' || params.feature === 'challenge') {
      if (!validJLPTLevels.includes(params.level.toLowerCase())) {
        return false
      }
    } else if (params.feature === 'driving') {
      if (!validDrivingLevels.includes(params.level.toLowerCase())) {
        return false
      }
    }
  }

  if (params.action && !validActions.includes(params.action)) {
    return false
  }

  return true
}

// Type-safe route generation
export type RouteFeature = 'jlpt' | 'challenge' | 'driving' | 'home' | 'auth'

export interface RouteParams {
  jlpt: { type: 'official' | 'custom'; level?: string }
  challenge: { level: string }
  driving: { type: 'honmen' | 'karimen' }
  home: {}
  landing: {}
  auth: { type: 'login' | 'register' | 'forgot-password' }
}

export function generateRoute<T extends RouteFeature>(
  feature: T,
  language: Language,
  params: RouteParams[T]
): string {
  const basePath = `/${language}`

  switch (feature) {
    case 'jlpt':
      const jlptParams = params as RouteParams['jlpt']
      if (jlptParams.level) {
        return `${basePath}/jlpt/${jlptParams.type}/${jlptParams.level}`
      }
      return `${basePath}/jlpt/${jlptParams.type}`
    
    case 'challenge':
      const challengeParams = params as RouteParams['challenge']
      return `${basePath}/challenge/${challengeParams.level}`
    
    case 'driving':
      const drivingParams = params as RouteParams['driving']
      return `${basePath}/driving/${drivingParams.type}`
    
    case 'home':
      return `${basePath}/home`
    
    case 'auth':
      const authParams = params as RouteParams['auth']
      return `/auth/${language}/${authParams.type}`
    
    default:
      return basePath
  }
}
