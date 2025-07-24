/**
 * Middleware Configuration Index
 * Centralized export of all configuration modules
 * Single source of truth for all middleware constants and configurations
 */

// ===== CORE CONFIGURATION EXPORTS =====

// Import all configurations first
import {
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
  isValidLanguage,
  shouldProcessPath,
  getEnvironmentConfig
} from './constants'

// Re-export for external use
export {
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
  isValidLanguage,
  shouldProcessPath,
  getEnvironmentConfig
}

// Import patterns
import {
  LANGUAGE_PATTERNS,
  AUTH_PATTERNS,
  FEATURE_PATTERNS,
  STATIC_PATTERNS,
  VALIDATION_PATTERNS,
  extractLanguageFromPath,
  hasLanguagePrefix,
  isAuthRoute,
  isFeatureRoute,
  isStaticFile,
  getCleanPath,
  isValidLanguageCode,
  normalizeLanguageCode,
  testPatterns,
  getMatchingPatterns,
  analyzePath
} from './patterns'

// Import routes
import {
  PUBLIC_ROUTES,
  PROTECTED_ROUTES,
  ALWAYS_PREFIXED_ROUTES,
  CLEAN_URL_SUPPORTED_ROUTES,
  SKIP_ROUTES,
  isPublicRoute,
  isProtectedRoute,
  shouldAlwaysHavePrefix,
  supportsCleanUrl,
  shouldSkipRoute,
  generateAuthUrl,
  generateFeatureUrl,
  generateHomeUrl,
  generateLandingUrl,
  generateLoginUrl,
  addLanguagePrefix,
  removeLanguagePrefix,
  normalizeRoutePath,
  analyzeRoute,
  getRouteCategory,
  isValidRoutePath,
  validateRouteConfig
} from './routes'

// Re-export patterns
export {
  LANGUAGE_PATTERNS,
  AUTH_PATTERNS,
  FEATURE_PATTERNS,
  STATIC_PATTERNS,
  VALIDATION_PATTERNS,
  extractLanguageFromPath,
  hasLanguagePrefix,
  isAuthRoute,
  isFeatureRoute,
  isStaticFile,
  getCleanPath,
  isValidLanguageCode,
  normalizeLanguageCode,
  testPatterns,
  getMatchingPatterns,
  analyzePath
}

// Re-export routes
export {
  PUBLIC_ROUTES,
  PROTECTED_ROUTES,
  ALWAYS_PREFIXED_ROUTES,
  CLEAN_URL_SUPPORTED_ROUTES,
  SKIP_ROUTES,
  isPublicRoute,
  isProtectedRoute,
  shouldAlwaysHavePrefix,
  supportsCleanUrl,
  shouldSkipRoute,
  generateAuthUrl,
  generateFeatureUrl,
  generateHomeUrl,
  generateLandingUrl,
  generateLoginUrl,
  addLanguagePrefix,
  removeLanguagePrefix,
  normalizeRoutePath,
  analyzeRoute,
  getRouteCategory,
  isValidRoutePath,
  validateRouteConfig
}

// ===== TYPE EXPORTS =====

export type {
  Language,
  LanguageConfig,
  LanguageConfigMap,
  LanguageCodeMap,
  RoutePaths,
  LanguagePatterns,
  CookieConfig,
  CookieConfigs,
  SecurityHeaders,
  CacheHeaders,
  MiddlewareConfig
} from '../types/middleware'

// ===== CONFIGURATION VALIDATION =====

/**
 * Validate all middleware configurations
 */
export function validateMiddlewareConfig(): {
  isValid: boolean
  errors: string[]
  warnings: string[]
} {
  const errors: string[] = []
  const warnings: string[] = []
  
  try {
    // Validate route configuration
    const routeValidation = validateRouteConfig()
    if (!routeValidation) {
      errors.push('Route configuration validation failed')
    }
    
    // Validate language configuration
    const languages = Object.keys(LANGUAGE_CONFIG)
    if (languages.length === 0) {
      errors.push('No languages configured')
    }
    
    // Validate environment configuration
    const envConfig = getEnvironmentConfig()
    if (!envConfig.isProduction && !envConfig.isDevelopment) {
      warnings.push('Environment not properly detected')
    }
    
    // Validate security headers
    const securityHeaderKeys = Object.keys(SECURITY_HEADERS)
    if (securityHeaderKeys.length === 0) {
      errors.push('No security headers configured')
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings
    }
  } catch (error) {
    errors.push(`Configuration validation error: ${error}`)
    return {
      isValid: false,
      errors,
      warnings
    }
  }
}

// ===== CONFIGURATION UTILITIES =====

/**
 * Get configuration summary for debugging
 */
export function getConfigurationSummary() {
  return {
    languages: Object.keys(LANGUAGE_CONFIG),
    routes: {
      public: PUBLIC_ROUTES.length,
      protected: PROTECTED_ROUTES.length,
      alwaysPrefixed: ALWAYS_PREFIXED_ROUTES.length,
      cleanUrlSupported: CLEAN_URL_SUPPORTED_ROUTES.length,
      skip: SKIP_ROUTES.length
    },
    security: {
      headers: Object.keys(SECURITY_HEADERS).length,
      cacheHeaders: Object.keys(CACHE_HEADERS).length
    },
    patterns: {
      language: Object.keys(LANGUAGE_PATTERNS).length,
      auth: Object.keys(AUTH_PATTERNS).length,
      feature: Object.keys(FEATURE_PATTERNS).length,
      static: Object.keys(STATIC_PATTERNS).length,
      validation: Object.keys(VALIDATION_PATTERNS).length
    },
    environment: getEnvironmentConfig()
  }
}

/**
 * Check if configuration is ready for production
 */
export function isProductionReady(): {
  ready: boolean
  issues: string[]
  recommendations: string[]
} {
  const issues: string[] = []
  const recommendations: string[] = []
  
  // Check security headers
  const requiredSecurityHeaders = [
    'X-Frame-Options',
    'X-Content-Type-Options',
    'Referrer-Policy'
  ]
  
  requiredSecurityHeaders.forEach(header => {
    if (!SECURITY_HEADERS[header]) {
      issues.push(`Missing required security header: ${header}`)
    }
  })
  
  // Check environment configuration
  const envConfig = getEnvironmentConfig()
  if (!envConfig.enableSecureCookies && envConfig.isProduction) {
    issues.push('Secure cookies should be enabled in production')
  }
  
  // Check testing configuration
  if (TESTING_CONFIG.SKIP_AUTH_FOR_TESTING && envConfig.isProduction) {
    issues.push('Auth bypass for testing should be disabled in production')
  }
  
  // Recommendations
  if (!SECURITY_HEADERS['Content-Security-Policy']) {
    recommendations.push('Consider adding Content-Security-Policy header')
  }
  
  if (!SECURITY_HEADERS['Strict-Transport-Security'] && envConfig.isProduction) {
    recommendations.push('Consider adding HSTS header for production')
  }
  
  return {
    ready: issues.length === 0,
    issues,
    recommendations
  }
}

// ===== CONFIGURATION MIGRATION HELPERS =====

/**
 * Migrate from old configuration format (if needed)
 */
export function migrateConfiguration(oldConfig: any): {
  success: boolean
  migratedConfig?: any
  errors: string[]
} {
  const errors: string[] = []
  
  try {
    // This would handle migration from old middleware configuration
    // For now, we assume the current configuration is the target format
    
    return {
      success: true,
      migratedConfig: MIDDLEWARE_CONFIG,
      errors: []
    }
  } catch (error) {
    errors.push(`Migration failed: ${error}`)
    return {
      success: false,
      errors
    }
  }
}

/**
 * Export configuration for external use
 */
export function exportConfiguration(): {
  version: string
  timestamp: string
  config: typeof MIDDLEWARE_CONFIG
  metadata: {
    languages: number
    routes: number
    patterns: number
    securityHeaders: number
  }
} {
  return {
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    config: MIDDLEWARE_CONFIG,
    metadata: {
      languages: Object.keys(LANGUAGE_CONFIG).length,
      routes: PUBLIC_ROUTES.length + PROTECTED_ROUTES.length,
      patterns: Object.keys(LANGUAGE_PATTERNS).length,
      securityHeaders: Object.keys(SECURITY_HEADERS).length
    }
  }
}

// ===== DEFAULT EXPORT =====

/**
 * Default export with all configurations
 */
export default {
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
}
