/**
 * Middleware Configuration Constants
 * Centralized configuration for all middleware modules
 * Single source of truth for all constants and configurations
 */

import type {
  LanguageConfigMap,
  LanguageCodeMap,
  RoutePaths,
  CookieConfigs,
  SecurityHeaders,
  CacheHeaders,
  MiddlewareConfig
} from '../types/middleware'

// ===== LANGUAGE CONFIGURATION =====

/**
 * Supported languages and their regional configurations
 */
export const LANGUAGE_CONFIG: LanguageConfigMap = {
  vn: {
    code: 'vn' as const,
    locale: 'vi-VN' as const,
    regions: ['VN'] as readonly string[], // Vietnam
    currency: 'VND' as const
  },
  jp: {
    code: 'jp' as const,
    locale: 'ja-JP' as const,
    regions: ['JP'] as readonly string[], // Japan
    currency: 'JPY' as const
  },
  en: {
    code: 'en' as const,
    locale: 'en-US' as const,
    regions: ['US', 'GB', 'AU', 'CA', 'NZ', 'SG'] as readonly string[], // English-speaking countries
    currency: 'USD' as const
  }
} as const

/**
 * Language code mapping for backward compatibility
 */
export const LANGUAGE_CODE_MAP: LanguageCodeMap = {
  '1': 'vn',
  '2': 'jp',
  '3': 'en',
  'vn': 'vn',
  'jp': 'jp',
  'en': 'en'
} as const

// ===== ROUTE CONFIGURATION =====

/**
 * Route path constants for middleware processing
 */
export const ROUTE_PATHS: RoutePaths = {
  AUTH_PATHS: ['/login', '/register', '/forgot-password', '/landing'] as const,
  FEATURE_PATHS: ['/jlpt', '/challenge', '/driving'] as const,
  HOME_PATHS: ['/home'] as const,
  SKIP_PATHS: ['/_next/', '/api/', '/static/', '/favicon'] as const,
  FILE_EXTENSIONS: ['.ico', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.css', '.js', '.json'] as const
} as const

// ===== COOKIE CONFIGURATION =====

/**
 * Cookie configuration for language and authentication
 */
export const COOKIE_CONFIG: CookieConfigs = {
  LANGUAGE_COOKIE: {
    name: 'preferred-language',
    maxAge: 60 * 60 * 24 * 365, // 1 year
    httpOnly: false,
    sameSite: 'lax' as const
  },
  AUTH_COOKIE: {
    name: 'jlpt4you_auth_token'
  }
} as const

// ===== SECURITY CONFIGURATION =====

/**
 * Security headers for enhanced protection
 */
export const SECURITY_HEADERS: SecurityHeaders = {
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'X-Robots-Tag': 'index, follow'
} as const

/**
 * Cache headers configuration
 */
export const CACHE_HEADERS: CacheHeaders = {
  AUTH_PAGES: 'public, max-age=3600, stale-while-revalidate=86400'
} as const

// ===== PERFORMANCE CONFIGURATION =====

/**
 * Performance-related constants
 */
export const PERFORMANCE_CONFIG = {
  MAX_REDIRECT_ATTEMPTS: 3,
  LANGUAGE_DETECTION_TIMEOUT: 100, // ms
  URL_GENERATION_TIMEOUT: 50, // ms
  HEADER_PROCESSING_TIMEOUT: 25, // ms
} as const

// ===== ERROR CONFIGURATION =====

/**
 * Error handling configuration
 */
export const ERROR_CONFIG = {
  ENABLE_ERROR_RECOVERY: true,
  ENABLE_LOGGING: process.env.NODE_ENV === 'development',
  ENABLE_PERFORMANCE_MONITORING: process.env.NODE_ENV === 'development',
  LOG_LEVEL: process.env.NODE_ENV === 'development' ? 'debug' : 'error'
} as const

// ===== TESTING CONFIGURATION =====

/**
 * Testing and development configuration
 */
export const TESTING_CONFIG = {
  SKIP_AUTH_FOR_TESTING: true, // TEMPORARY: Skip auth for testing exam pages
  TESTING_PATHS: ['/test', '/jlpt', '/challenge'], // Paths that skip auth during testing
  ENABLE_DEBUG_HEADERS: process.env.NODE_ENV === 'development'
} as const

// ===== COMPLETE MIDDLEWARE CONFIGURATION =====

/**
 * Complete middleware configuration object
 * Combines all configuration sections into a single exportable object
 */
export const MIDDLEWARE_CONFIG: MiddlewareConfig = {
  languages: LANGUAGE_CONFIG,
  routes: ROUTE_PATHS,
  patterns: {
    LANGUAGE_PREFIX: /^\/(vn|jp|en|1|2|3)\//,
    LANGUAGE_AUTH_PATTERN: /^\/(vn|jp|en|1|2|3)\/(login|register|forgot-password)$/,
    LANGUAGE_LANDING_PATTERN: /^\/(vn|jp|en|1|2|3)\/landing$/,
    LANGUAGE_HOME_PATTERN: /^\/(vn|jp|en|1|2|3)\/home$/,
    EXTRACT_LANGUAGE: /^\/(vn|jp|en|1|2|3)\/(.*)$/
  },
  cookies: COOKIE_CONFIG,
  security: SECURITY_HEADERS,
  cache: CACHE_HEADERS,
  languageCodeMap: LANGUAGE_CODE_MAP
} as const

// ===== VALIDATION HELPERS =====

/**
 * Validate if a language code is supported
 */
export function isValidLanguage(lang: string): lang is keyof typeof LANGUAGE_CONFIG {
  return lang in LANGUAGE_CONFIG
}

/**
 * Validate if a path should be processed by middleware
 */
export function shouldProcessPath(pathname: string): boolean {
  // Skip static files and API routes
  if (ROUTE_PATHS.SKIP_PATHS.some(path => pathname.startsWith(path))) {
    return false
  }
  
  // Skip files with extensions
  if (pathname.includes('.') || ROUTE_PATHS.FILE_EXTENSIONS.some(ext => pathname.endsWith(ext))) {
    return false
  }
  
  return true
}

/**
 * Get environment-specific configuration
 */
export function getEnvironmentConfig() {
  return {
    isProduction: process.env.NODE_ENV === 'production',
    isDevelopment: process.env.NODE_ENV === 'development',
    enableSecureCookies: process.env.NODE_ENV === 'production',
    enableLogging: ERROR_CONFIG.ENABLE_LOGGING,
    enablePerformanceMonitoring: ERROR_CONFIG.ENABLE_PERFORMANCE_MONITORING
  }
}

// ===== EXPORTS =====

// Export the complete configuration as default
export default MIDDLEWARE_CONFIG
