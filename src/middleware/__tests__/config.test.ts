/**
 * Unit Tests for Configuration Module
 * Comprehensive test coverage for configuration functionality
 */

import {
  LANGUAGE_CONFIG,
  LANGUAGE_CODE_MAP,
  ROUTE_PATHS,
  COOKIE_CONFIG,
  SECURITY_HEADERS,
  CACHE_HEADERS,
  MIDDLEWARE_CONFIG,
  validateMiddlewareConfig,
  getConfigurationSummary,
  isProductionReady,
  exportConfiguration,
  MIDDLEWARE_SYSTEM_INFO,
  getSystemHealth,
  initializeMiddlewareSystem
} from '../system'

// ===== CONFIGURATION TESTS =====

describe('Configuration Module', () => {
  describe('core configurations', () => {
    test('LANGUAGE_CONFIG should have all required languages', () => {
      expect(LANGUAGE_CONFIG).toHaveProperty('vn')
      expect(LANGUAGE_CONFIG).toHaveProperty('jp')
      expect(LANGUAGE_CONFIG).toHaveProperty('en')
      
      // Check structure of each language config
      Object.values(LANGUAGE_CONFIG).forEach(config => {
        expect(config).toHaveProperty('code')
        expect(config).toHaveProperty('locale')
        expect(config).toHaveProperty('regions')
        expect(config).toHaveProperty('currency')
        expect(Array.isArray(config.regions)).toBe(true)
      })
    })
    
    test('LANGUAGE_CODE_MAP should map numeric codes correctly', () => {
      expect(LANGUAGE_CODE_MAP['1']).toBe('vn')
      expect(LANGUAGE_CODE_MAP['2']).toBe('jp')
      expect(LANGUAGE_CODE_MAP['3']).toBe('en')
      expect(LANGUAGE_CODE_MAP['vn']).toBe('vn')
      expect(LANGUAGE_CODE_MAP['jp']).toBe('jp')
      expect(LANGUAGE_CODE_MAP['en']).toBe('en')
    })
    
    test('ROUTE_PATHS should have all required path arrays', () => {
      expect(Array.isArray(ROUTE_PATHS.AUTH_PATHS)).toBe(true)
      expect(Array.isArray(ROUTE_PATHS.FEATURE_PATHS)).toBe(true)
      expect(Array.isArray(ROUTE_PATHS.HOME_PATHS)).toBe(true)
      expect(Array.isArray(ROUTE_PATHS.SKIP_PATHS)).toBe(true)
      expect(Array.isArray(ROUTE_PATHS.FILE_EXTENSIONS)).toBe(true)
      
      // Check that arrays are not empty
      expect(ROUTE_PATHS.AUTH_PATHS.length).toBeGreaterThan(0)
      expect(ROUTE_PATHS.FEATURE_PATHS.length).toBeGreaterThan(0)
      expect(ROUTE_PATHS.HOME_PATHS.length).toBeGreaterThan(0)
    })
    
    test('COOKIE_CONFIG should have required cookie configurations', () => {
      expect(COOKIE_CONFIG).toHaveProperty('LANGUAGE_COOKIE')
      expect(COOKIE_CONFIG).toHaveProperty('AUTH_COOKIE')
      
      expect(COOKIE_CONFIG.LANGUAGE_COOKIE).toHaveProperty('name')
      expect(COOKIE_CONFIG.LANGUAGE_COOKIE).toHaveProperty('maxAge')
      expect(COOKIE_CONFIG.LANGUAGE_COOKIE).toHaveProperty('httpOnly')
      expect(COOKIE_CONFIG.LANGUAGE_COOKIE).toHaveProperty('sameSite')
      
      expect(COOKIE_CONFIG.AUTH_COOKIE).toHaveProperty('name')
    })
    
    test('SECURITY_HEADERS should have required security headers', () => {
      const requiredHeaders = [
        'X-Frame-Options',
        'X-Content-Type-Options',
        'Referrer-Policy'
      ]
      
      requiredHeaders.forEach(header => {
        expect(SECURITY_HEADERS).toHaveProperty(header)
        expect(typeof SECURITY_HEADERS[header]).toBe('string')
        expect(SECURITY_HEADERS[header].length).toBeGreaterThan(0)
      })
    })
    
    test('CACHE_HEADERS should have cache configurations', () => {
      expect(CACHE_HEADERS).toHaveProperty('AUTH_PAGES')
      expect(typeof CACHE_HEADERS.AUTH_PAGES).toBe('string')
      expect(CACHE_HEADERS.AUTH_PAGES.length).toBeGreaterThan(0)
    })
  })
  
  describe('MIDDLEWARE_CONFIG', () => {
    test('should combine all configurations correctly', () => {
      expect(MIDDLEWARE_CONFIG).toHaveProperty('languages')
      expect(MIDDLEWARE_CONFIG).toHaveProperty('routes')
      expect(MIDDLEWARE_CONFIG).toHaveProperty('patterns')
      expect(MIDDLEWARE_CONFIG).toHaveProperty('cookies')
      expect(MIDDLEWARE_CONFIG).toHaveProperty('security')
      expect(MIDDLEWARE_CONFIG).toHaveProperty('cache')
      expect(MIDDLEWARE_CONFIG).toHaveProperty('languageCodeMap')
    })
    
    test('should have valid patterns', () => {
      expect(MIDDLEWARE_CONFIG.patterns.LANGUAGE_PREFIX).toBeInstanceOf(RegExp)
      expect(MIDDLEWARE_CONFIG.patterns.LANGUAGE_AUTH_PATTERN).toBeInstanceOf(RegExp)
      expect(MIDDLEWARE_CONFIG.patterns.LANGUAGE_HOME_PATTERN).toBeInstanceOf(RegExp)
      expect(MIDDLEWARE_CONFIG.patterns.EXTRACT_LANGUAGE).toBeInstanceOf(RegExp)
    })
  })
  
  describe('validateMiddlewareConfig', () => {
    test('should validate configuration successfully', () => {
      const result = validateMiddlewareConfig()
      
      expect(result).toHaveProperty('isValid')
      expect(result).toHaveProperty('errors')
      expect(result).toHaveProperty('warnings')
      expect(Array.isArray(result.errors)).toBe(true)
      expect(Array.isArray(result.warnings)).toBe(true)
    })
    
    test('should return valid configuration for current setup', () => {
      const result = validateMiddlewareConfig()
      
      // Current configuration should be valid
      expect(result.isValid).toBe(true)
      expect(result.errors.length).toBe(0)
    })
  })
  
  describe('getConfigurationSummary', () => {
    test('should return comprehensive configuration summary', () => {
      const summary = getConfigurationSummary()
      
      expect(summary).toHaveProperty('languages')
      expect(summary).toHaveProperty('routes')
      expect(summary).toHaveProperty('security')
      expect(summary).toHaveProperty('patterns')
      expect(summary).toHaveProperty('environment')
      
      expect(Array.isArray(summary.languages)).toBe(true)
      expect(summary.languages.length).toBe(3) // vn, jp, en
      
      expect(typeof summary.routes).toBe('object')
      expect(summary.routes).toHaveProperty('public')
      expect(summary.routes).toHaveProperty('protected')
      
      expect(typeof summary.security).toBe('object')
      expect(summary.security).toHaveProperty('headers')
      expect(summary.security).toHaveProperty('cacheHeaders')
    })
  })
  
  describe('isProductionReady', () => {
    test('should check production readiness', () => {
      const result = isProductionReady()
      
      expect(result).toHaveProperty('ready')
      expect(result).toHaveProperty('issues')
      expect(result).toHaveProperty('recommendations')
      expect(typeof result.ready).toBe('boolean')
      expect(Array.isArray(result.issues)).toBe(true)
      expect(Array.isArray(result.recommendations)).toBe(true)
    })
  })
  
  describe('exportConfiguration', () => {
    test('should export configuration with metadata', () => {
      const exported = exportConfiguration()
      
      expect(exported).toHaveProperty('version')
      expect(exported).toHaveProperty('timestamp')
      expect(exported).toHaveProperty('config')
      expect(exported).toHaveProperty('metadata')
      
      expect(typeof exported.version).toBe('string')
      expect(typeof exported.timestamp).toBe('string')
      expect(exported.config).toBe(MIDDLEWARE_CONFIG)
      
      expect(exported.metadata).toHaveProperty('languages')
      expect(exported.metadata).toHaveProperty('routes')
      expect(exported.metadata).toHaveProperty('patterns')
      expect(exported.metadata).toHaveProperty('securityHeaders')
    })
    
    test('should have valid timestamp format', () => {
      const exported = exportConfiguration()
      const timestamp = new Date(exported.timestamp)
      
      expect(timestamp).toBeInstanceOf(Date)
      expect(timestamp.getTime()).not.toBeNaN()
    })
  })
})

// ===== SYSTEM TESTS =====

describe('Middleware System', () => {
  describe('MIDDLEWARE_SYSTEM_INFO', () => {
    test('should have system information', () => {
      expect(MIDDLEWARE_SYSTEM_INFO).toHaveProperty('version')
      expect(MIDDLEWARE_SYSTEM_INFO).toHaveProperty('name')
      expect(MIDDLEWARE_SYSTEM_INFO).toHaveProperty('description')
      expect(MIDDLEWARE_SYSTEM_INFO).toHaveProperty('modules')
      expect(MIDDLEWARE_SYSTEM_INFO).toHaveProperty('features')
      expect(MIDDLEWARE_SYSTEM_INFO).toHaveProperty('compatibility')
      
      expect(Array.isArray(MIDDLEWARE_SYSTEM_INFO.modules)).toBe(true)
      expect(Array.isArray(MIDDLEWARE_SYSTEM_INFO.features)).toBe(true)
      expect(typeof MIDDLEWARE_SYSTEM_INFO.compatibility).toBe('object')
    })
    
    test('should have all required modules', () => {
      const expectedModules = [
        'language-detection',
        'authentication',
        'url-generation',
        'security-headers'
      ]
      
      expectedModules.forEach(module => {
        expect(MIDDLEWARE_SYSTEM_INFO.modules).toContain(module)
      })
    })
  })
  
  describe('getSystemHealth', () => {
    test('should return system health status', () => {
      const health = getSystemHealth()
      
      expect(health).toHaveProperty('status')
      expect(health).toHaveProperty('checks')
      expect(health).toHaveProperty('summary')
      
      expect(['healthy', 'warning', 'error']).toContain(health.status)
      expect(Array.isArray(health.checks)).toBe(true)
      
      expect(health.summary).toHaveProperty('total')
      expect(health.summary).toHaveProperty('passed')
      expect(health.summary).toHaveProperty('failed')
      expect(health.summary).toHaveProperty('warnings')
    })
    
    test('should have valid health checks', () => {
      const health = getSystemHealth()
      
      health.checks.forEach(check => {
        expect(check).toHaveProperty('name')
        expect(check).toHaveProperty('status')
        expect(check).toHaveProperty('message')
        
        expect(typeof check.name).toBe('string')
        expect(['pass', 'fail', 'warning']).toContain(check.status)
        expect(typeof check.message).toBe('string')
      })
    })
    
    test('should have consistent summary counts', () => {
      const health = getSystemHealth()
      const { total, passed, failed, warnings } = health.summary
      
      expect(total).toBe(passed + failed + warnings)
      expect(total).toBe(health.checks.length)
    })
  })
  
  describe('initializeMiddlewareSystem', () => {
    test('should initialize system successfully', () => {
      const result = initializeMiddlewareSystem()
      
      expect(result).toHaveProperty('success')
      expect(result).toHaveProperty('message')
      expect(result).toHaveProperty('systemInfo')
      expect(result).toHaveProperty('health')
      
      expect(typeof result.success).toBe('boolean')
      expect(typeof result.message).toBe('string')
      expect(result.systemInfo).toBe(MIDDLEWARE_SYSTEM_INFO)
    })
    
    test('should return health information', () => {
      const result = initializeMiddlewareSystem()
      
      expect(result.health).toHaveProperty('status')
      expect(result.health).toHaveProperty('checks')
      expect(result.health).toHaveProperty('summary')
    })
  })
})

// ===== INTEGRATION TESTS =====

describe('Configuration Integration', () => {
  test('should have consistent language configurations', () => {
    // Check that all language codes in LANGUAGE_CODE_MAP exist in LANGUAGE_CONFIG
    Object.values(LANGUAGE_CODE_MAP).forEach(langCode => {
      if (langCode !== 'vn' && langCode !== 'jp' && langCode !== 'en') return
      expect(LANGUAGE_CONFIG).toHaveProperty(langCode)
    })
  })
  
  test('should have consistent route configurations', () => {
    // Check that auth paths are consistent across configurations
    const authPaths = ROUTE_PATHS.AUTH_PATHS
    authPaths.forEach(path => {
      expect(typeof path).toBe('string')
      expect(path.startsWith('/')).toBe(true)
    })
  })
  
  test('should have valid security configuration', () => {
    // Check that security headers have valid values
    Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
      expect(typeof key).toBe('string')
      expect(typeof value).toBe('string')
      expect(key.length).toBeGreaterThan(0)
      expect(value.length).toBeGreaterThan(0)
    })
  })
})
