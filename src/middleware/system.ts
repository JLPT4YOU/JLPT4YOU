/**
 * Middleware System Index
 * Main entry point for the refactored middleware system
 * Exports all modules, types, and utilities
 */

// ===== MODULE IMPORTS =====

// Import modules first
import { languageDetectionModule } from './modules/language-detection'
import { authenticationModule } from './modules/authentication'
import { urlGenerationModule } from './modules/url-generation'
import { securityHeadersModule } from './modules/security-headers'

// Import configuration functions
import {
  validateMiddlewareConfig,
  isProductionReady,
  MIDDLEWARE_CONFIG
} from './config'

// Import utility modules
import { cookieHelpers } from './utils/cookie-helpers'
import { pathHelpers } from './utils/path-helpers'

// ===== MODULE EXPORTS =====

// Language Detection Module
export {
  detectPreferredLanguage,
  extractLanguageFromPath,
  hasLanguagePrefix,
  getCleanUrl,
  normalizeLanguageCode,
  isValidLanguage,
  getLanguagePreference,
  getLanguageConfig,
  getSupportedLanguages,
  getDefaultLanguage,
  createLanguageDetectionContext,
  analyzeLanguageDetection,
  languageDetectionModule
} from './modules/language-detection'

// Authentication Module
export {
  isAuthenticated,
  isProtectedRoute,
  checkAuthentication,
  analyzeRouteProtection,
  shouldBypassAuthForTesting,
  generateAuthRedirectUrl,
  validateAuthToken,
  isAuthTokenExpired,
  getAuthenticationStatus,
  hasRequiredRole,
  getRequiredRole,
  createAuthenticationContext,
  debugAuthentication,
  authenticationModule
} from './modules/authentication'

// URL Generation Module
export {
  generateRedirectUrl,
  needsLanguageRedirect,
  shouldRedirectToCleanUrl,
  generateLanguageRedirectUrl,
  getCleanUrl as getCleanUrlFromGeneration,
  buildUrlWithQuery,
  buildAbsoluteUrl,
  extractQueryParams,
  generateAuthUrl,
  generateFeatureUrl,
  generateHomeUrl,
  generateLandingUrl,
  generateLoginUrl,
  analyzeUrl,
  isValidUrl,
  isValidPathname,
  createUrlGenerationContext,
  debugUrlGeneration,
  urlGenerationModule
} from './modules/url-generation'

// Security Headers Module
export {
  generateSecurityHeaders,
  applyCacheHeaders,
  generateCSPHeader,
  validateSecurityHeaders,
  applyHeadersToResponse,
  setLanguageHeaders,
  setCacheHeaders,
  setSecurityHeaders,
  analyzeCurrentLanguage,
  getSecurityLevel,
  getCachedHeaders,
  clearHeaderCache,
  debugHeaders,
  analyzeHeaderSecurity,
  securityHeadersModule
} from './modules/security-headers'

// ===== CONFIGURATION EXPORTS =====

export {
  // Core configurations
  LANGUAGE_CONFIG,
  LANGUAGE_CODE_MAP,
  ROUTE_PATHS,
  COOKIE_CONFIG,
  SECURITY_HEADERS,
  CACHE_HEADERS,
  PERFORMANCE_CONFIG,
  ERROR_CONFIG,
  TESTING_CONFIG,
  MIDDLEWARE_CONFIG,
  
  // Patterns
  LANGUAGE_PATTERNS,
  AUTH_PATTERNS,
  FEATURE_PATTERNS,
  STATIC_PATTERNS,
  VALIDATION_PATTERNS,
  
  // Routes
  PUBLIC_ROUTES,
  PROTECTED_ROUTES,
  ALWAYS_PREFIXED_ROUTES,
  CLEAN_URL_SUPPORTED_ROUTES,
  SKIP_ROUTES,
  
  // Utilities
  validateMiddlewareConfig,
  getConfigurationSummary,
  isProductionReady,
  migrateConfiguration,
  exportConfiguration
} from './config'

// ===== UTILITY EXPORTS =====

// Cookie Helpers
export {
  setLanguageCookie,
  getLanguageCookie,
  setSecureCookie,
  getAuthCookie,
  getCookieValue,
  deleteCookie,
  clearAuthCookies,
  clearLanguageCookie,
  isValidCookieName,
  isValidCookieValue,
  getSecureCookieOptions,
  shouldUseSecureCookies,
  parseCookieHeader,
  extractCookieFromHeader,
  hasCookie,
  getAllCookies,
  getCookieCount,
  debugCookies,
  analyzeCookieSecurity,
  cookieHelpers
} from './utils/cookie-helpers'

// Path Helpers
export {
  isStaticFile,
  isAPIRoute,
  shouldSkipMiddleware,
  normalizePath,
  cleanPath,
  decodePath,
  extractLanguageFromPath as extractLangFromPath,
  hasLanguagePrefix as hasLangPrefix,
  removeLanguagePrefix,
  addLanguagePrefix,
  getPathSegments,
  getPathDepth,
  isNestedPath,
  getParentPath,
  getLastSegment,
  getFirstSegment,
  matchesPattern,
  startsWithAny,
  endsWithAny,
  findMatchingPattern,
  joinPaths,
  buildPathWithQuery,
  buildAbsoluteUrl as buildAbsUrl,
  isValidPath,
  hasValidLanguageInPath,
  analyzePath as analyzePathUtil,
  debugPath,
  pathHelpers
} from './utils/path-helpers'

// ===== TYPE EXPORTS =====

export type {
  // Core types
  Language,
  LanguageConfig,
  LanguageConfigMap,
  LanguageCodeMap,
  
  // Route types
  RoutePaths,
  LanguagePatterns,
  
  // Cookie types
  CookieConfig,
  CookieConfigs,
  
  // Security types
  SecurityHeaders,
  CacheHeaders,
  
  // Context types
  LanguageDetectionContext,
  AuthenticationContext,
  URLGenerationContext,
  SecurityHeadersContext,
  
  // Result types
  LanguageDetectionResult,
  AuthenticationResult,
  URLGenerationResult,
  SecurityHeadersResult,
  
  // Module interface types
  LanguageDetectionModule,
  AuthenticationModule,
  URLGenerationModule,
  SecurityHeadersModule,
  
  // Middleware flow types
  MiddlewareContext,
  MiddlewareResult,
  
  // Utility types
  PathHelpers,
  CookieHelpers,
  
  // Error types
  MiddlewareErrorType,
  MiddlewareError,
  
  // Configuration types
  MiddlewareConfig,
  ModuleConfig
} from './types/middleware'

// ===== SYSTEM INFORMATION =====

/**
 * Middleware system information
 */
export const MIDDLEWARE_SYSTEM_INFO = {
  version: '2.0.0',
  name: 'JLPT4You Middleware System',
  description: 'Modular middleware system for dual-mode language routing',
  modules: [
    'language-detection',
    'authentication',
    'url-generation',
    'security-headers'
  ],
  features: [
    'Language detection and routing',
    'Authentication and route protection',
    'URL generation and redirection',
    'Security headers and CSP',
    'Dual-mode routing (clean URLs for authenticated users)',
    'Comprehensive testing coverage',
    'Performance optimization',
    'Type safety with TypeScript'
  ],
  compatibility: {
    nextjs: '>=13.0.0',
    typescript: '>=4.5.0',
    node: '>=16.0.0'
  }
} as const

/**
 * Get system health status
 */
export function getSystemHealth(): {
  status: 'healthy' | 'warning' | 'error'
  checks: Array<{
    name: string
    status: 'pass' | 'fail' | 'warning'
    message: string
  }>
  summary: {
    total: number
    passed: number
    failed: number
    warnings: number
  }
} {
  const checks = []
  
  // Configuration validation
  const configValidation = validateMiddlewareConfig()
  checks.push({
    name: 'Configuration Validation',
    status: configValidation.isValid ? 'pass' : 'fail',
    message: configValidation.isValid ? 'All configurations valid' : `Errors: ${configValidation.errors.join(', ')}`
  })
  
  // Production readiness
  const prodReadiness = isProductionReady()
  checks.push({
    name: 'Production Readiness',
    status: prodReadiness.ready ? 'pass' : (prodReadiness.issues.length > 0 ? 'fail' : 'warning'),
    message: prodReadiness.ready ? 'Ready for production' : `Issues: ${prodReadiness.issues.join(', ')}`
  })
  
  // Module availability
  const modules = ['language-detection', 'authentication', 'url-generation', 'security-headers']
  modules.forEach(module => {
    checks.push({
      name: `Module: ${module}`,
      status: 'pass' as const, // All modules are available if this code runs
      message: 'Module loaded successfully'
    })
  })
  
  const summary = {
    total: checks.length,
    passed: checks.filter(c => c.status === 'pass').length,
    failed: checks.filter(c => c.status === 'fail').length,
    warnings: checks.filter(c => c.status === 'warning').length
  }
  
  let status: 'healthy' | 'warning' | 'error' = 'healthy'
  if (summary.failed > 0) status = 'error'
  else if (summary.warnings > 0) status = 'warning'
  
  return { status, checks, summary }
}

/**
 * Initialize middleware system
 */
export function initializeMiddlewareSystem(): {
  success: boolean
  message: string
  systemInfo: typeof MIDDLEWARE_SYSTEM_INFO
  health: ReturnType<typeof getSystemHealth>
} {
  try {
    const health = getSystemHealth()
    
    return {
      success: health.status !== 'error',
      message: health.status === 'healthy' 
        ? 'Middleware system initialized successfully'
        : `Middleware system initialized with ${health.status}s`,
      systemInfo: MIDDLEWARE_SYSTEM_INFO,
      health
    }
  } catch (error) {
    return {
      success: false,
      message: `Failed to initialize middleware system: ${error}`,
      systemInfo: MIDDLEWARE_SYSTEM_INFO,
      health: {
        status: 'error',
        checks: [],
        summary: { total: 0, passed: 0, failed: 1, warnings: 0 }
      }
    }
  }
}

// ===== DEFAULT EXPORT =====

export default {
  // System info
  ...MIDDLEWARE_SYSTEM_INFO,
  
  // System functions
  getSystemHealth,
  initializeMiddlewareSystem,
  
  // All modules
  modules: {
    languageDetection: languageDetectionModule,
    authentication: authenticationModule,
    urlGeneration: urlGenerationModule,
    securityHeaders: securityHeadersModule
  },
  
  // All configurations
  config: MIDDLEWARE_CONFIG,
  
  // All utilities
  utils: {
    cookieHelpers,
    pathHelpers
  }
}
