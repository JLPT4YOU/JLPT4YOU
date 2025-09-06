/**
 * Core Page Utilities (Pure Functions Only - No JSX)
 * For testing purposes and shared logic
 */

import { Language, getLanguageFromCode as getLanguageFromCodeUnified } from '@/lib/i18n/'
import { generateHreflangLinks as generateHreflangLinksUnified } from '@/lib/i18n/utils'

// Language code mapping utility (delegates to unified i18n)
// NOTE: Keeps legacy numeric codes for backward compatibility
export function getLanguageFromCode(code: string): Language | null {
  return getLanguageFromCodeUnified(code)
}

// Generate hreflang links for SEO (wrapper for unified implementation)
// Returns a Record mapping (keeps x-default for backward compatibility)
export function generateHreflangLinks(path: string): Record<string, string> {
  const baseUrl = 'https://jlpt4you.com'
  const entries = generateHreflangLinksUnified(path, baseUrl)
  const record: Record<string, string> = {}
  for (const { hreflang, href } of entries) {
    record[hreflang] = href
  }
  // Backward compatibility: include x-default -> Vietnamese
  if (!record['x-default']) {
    // Prefer vi-VN if available; fallback constructs VN URL
    record['x-default'] = record['vi-VN'] ?? `${baseUrl}/vn${path}`
  }
  return record
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
