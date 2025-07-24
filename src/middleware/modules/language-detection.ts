/**
 * Language Detection & Management Module
 * Handles language detection, mapping, and language-related utilities
 */

import { NextRequest } from 'next/server'
import type {
  Language,
  LanguageDetectionContext,
  LanguageDetectionResult,
  LanguageDetectionModule
} from '../types/middleware'
import { LANGUAGE_CONFIG, LANGUAGE_CODE_MAP } from '../config/constants'
import { extractLanguageFromPath as extractLangFromPath, hasLanguagePrefix as hasLangPrefix, removeLanguagePrefix } from '../utils/path-helpers'
import { getLanguageCookie } from '../utils/cookie-helpers'

// ===== LANGUAGE DETECTION CORE =====

/**
 * Detect user's preferred language based on various signals
 * Priority: URL > Cookie > Accept-Language > Geolocation > Default
 */
export function detectPreferredLanguage(context: LanguageDetectionContext): LanguageDetectionResult {
  const { request, pathname } = context
  
  // 1. Check URL path for explicit language (highest priority)
  const urlLanguage = detectLanguageFromUrl(pathname)
  if (urlLanguage) {
    return {
      detectedLanguage: urlLanguage,
      source: 'url',
      confidence: 1.0
    }
  }
  
  // 2. Check cookie preference
  const cookieLanguage = getLanguageCookie(request)
  if (cookieLanguage) {
    return {
      detectedLanguage: cookieLanguage,
      source: 'cookie',
      confidence: 0.9
    }
  }
  
  // 3. Check Accept-Language header
  const headerLanguage = detectLanguageFromHeader(request)
  if (headerLanguage) {
    return {
      detectedLanguage: headerLanguage.language,
      source: 'header',
      confidence: headerLanguage.confidence
    }
  }
  
  // 4. Check geolocation (Cloudflare CF-IPCountry header)
  const geoLanguage = detectLanguageFromGeolocation(request)
  if (geoLanguage) {
    return {
      detectedLanguage: geoLanguage,
      source: 'geo',
      confidence: 0.6
    }
  }
  
  // 5. Default to Vietnamese (primary market)
  return {
    detectedLanguage: 'vn',
    source: 'default',
    confidence: 0.5
  }
}

// ===== URL-BASED LANGUAGE DETECTION =====

/**
 * Detect language from URL path
 */
function detectLanguageFromUrl(pathname: string): Language | null {
  // Check for auth routes with language: /auth/vn/login
  if (pathname.startsWith('/auth/vn') || pathname.startsWith('/vn')) return 'vn'
  if (pathname.startsWith('/auth/jp') || pathname.startsWith('/jp')) return 'jp'
  if (pathname.startsWith('/auth/en') || pathname.startsWith('/en')) return 'en'
  
  // Check for numeric language codes
  if (pathname.startsWith('/auth/1') || pathname.startsWith('/1')) return 'vn'
  if (pathname.startsWith('/auth/2') || pathname.startsWith('/2')) return 'jp'
  if (pathname.startsWith('/auth/3') || pathname.startsWith('/3')) return 'en'
  
  return null
}

// ===== HEADER-BASED LANGUAGE DETECTION =====

/**
 * Detect language from Accept-Language header
 */
function detectLanguageFromHeader(request: NextRequest): { language: Language; confidence: number } | null {
  const acceptLanguage = request.headers.get('accept-language')
  if (!acceptLanguage) return null
  
  try {
    // Parse Accept-Language header
    const languages = parseAcceptLanguageHeader(acceptLanguage)
    
    // Find best matching language
    for (const { language, quality } of languages) {
      const detectedLang = mapLanguageCode(language)
      if (detectedLang) {
        return {
          language: detectedLang,
          confidence: Math.min(quality * 0.8, 0.8) // Max 0.8 confidence for header detection
        }
      }
    }
  } catch (error) {
    console.warn('Failed to parse Accept-Language header:', error)
  }
  
  return null
}

/**
 * Parse Accept-Language header into language-quality pairs
 */
function parseAcceptLanguageHeader(acceptLanguage: string): Array<{ language: string; quality: number }> {
  return acceptLanguage
    .split(',')
    .map(lang => {
      const [language, qualityStr] = lang.trim().split(';q=')
      const quality = qualityStr ? parseFloat(qualityStr) : 1.0
      return { language: language.toLowerCase(), quality }
    })
    .sort((a, b) => b.quality - a.quality) // Sort by quality descending
}

/**
 * Map language code from Accept-Language to our supported languages
 */
function mapLanguageCode(languageCode: string): Language | null {
  const code = languageCode.toLowerCase()
  
  // Exact matches
  if (code === 'vi' || code === 'vi-vn') return 'vn'
  if (code === 'ja' || code === 'ja-jp') return 'jp'
  if (code === 'en' || code.startsWith('en-')) return 'en'
  
  // Partial matches
  if (code.startsWith('vi')) return 'vn'
  if (code.startsWith('ja')) return 'jp'
  if (code.startsWith('en')) return 'en'
  
  return null
}

// ===== GEOLOCATION-BASED LANGUAGE DETECTION =====

/**
 * Detect language from geolocation headers
 */
function detectLanguageFromGeolocation(request: NextRequest): Language | null {
  // Check Cloudflare country header
  const country = request.headers.get('cf-ipcountry') ||
                  request.headers.get('x-vercel-ip-country') ||
                  request.headers.get('x-country-code')
  
  if (!country) return null
  
  // Find language by country
  for (const [lang, config] of Object.entries(LANGUAGE_CONFIG)) {
    if (config.regions.includes(country)) {
      return lang as Language
    }
  }
  
  return null
}

// ===== LANGUAGE MAPPING FUNCTIONS =====

/**
 * Extract language from URL path using patterns
 */
export function extractLanguageFromPath(pathname: string): Language | null {
  return extractLangFromPath(pathname)
}

/**
 * Check if URL has language prefix
 */
export function hasLanguagePrefix(pathname: string): boolean {
  return hasLangPrefix(pathname)
}

/**
 * Convert language-prefixed URL to clean URL
 */
export function getCleanUrl(pathname: string): string {
  return removeLanguagePrefix(pathname)
}

/**
 * Normalize language code (convert numeric to string)
 */
export function normalizeLanguageCode(code: string): Language {
  return LANGUAGE_CODE_MAP[code] || code as Language
}

/**
 * Validate if language code is supported
 */
export function isValidLanguage(code: string): code is Language {
  return code in LANGUAGE_CONFIG
}

// ===== LANGUAGE PREFERENCE MANAGEMENT =====

/**
 * Get language preference with fallback chain
 */
export function getLanguagePreference(request: NextRequest, pathname: string): Language {
  const context: LanguageDetectionContext = {
    request,
    pathname,
    cookieLanguage: getLanguageCookie(request),
    acceptLanguage: request.headers.get('accept-language') || undefined,
    country: request.headers.get('cf-ipcountry') || undefined
  }
  
  const result = detectPreferredLanguage(context)
  return result.detectedLanguage
}

/**
 * Get language configuration for a specific language
 */
export function getLanguageConfig(language: Language) {
  return LANGUAGE_CONFIG[language]
}

/**
 * Get all supported languages
 */
export function getSupportedLanguages(): Language[] {
  return Object.keys(LANGUAGE_CONFIG) as Language[]
}

/**
 * Get default language
 */
export function getDefaultLanguage(): Language {
  return 'vn'
}

// ===== LANGUAGE DETECTION UTILITIES =====

/**
 * Create language detection context from request
 */
export function createLanguageDetectionContext(request: NextRequest): LanguageDetectionContext {
  const pathname = request.nextUrl.pathname
  
  return {
    request,
    pathname,
    cookieLanguage: getLanguageCookie(request),
    acceptLanguage: request.headers.get('accept-language') || undefined,
    country: request.headers.get('cf-ipcountry') || 
             request.headers.get('x-vercel-ip-country') || 
             undefined
  }
}

/**
 * Analyze language detection for debugging
 */
export function analyzeLanguageDetection(context: LanguageDetectionContext) {
  const urlLang = detectLanguageFromUrl(context.pathname)
  const headerLang = detectLanguageFromHeader(context.request)
  const geoLang = detectLanguageFromGeolocation(context.request)
  const finalResult = detectPreferredLanguage(context)
  
  return {
    url: urlLang,
    cookie: context.cookieLanguage,
    header: headerLang,
    geo: geoLang,
    final: finalResult,
    context: {
      pathname: context.pathname,
      acceptLanguage: context.acceptLanguage,
      country: context.country
    }
  }
}

// ===== MODULE IMPLEMENTATION =====

/**
 * Language Detection Module implementation
 */
export const languageDetectionModule: LanguageDetectionModule = {
  detectPreferredLanguage,
  extractLanguageFromPath,
  hasLanguagePrefix,
  getCleanUrl
}

export default languageDetectionModule
