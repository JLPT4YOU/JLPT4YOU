/**
 * TypeScript Type Definitions for Middleware System
 * Provides comprehensive type safety for all middleware modules
 */

import { NextRequest, NextResponse } from 'next/server'

// ===== CORE TYPES =====

/**
 * Supported languages in the application
 */
export type Language = 'vn' | 'jp' | 'en'

/**
 * Language configuration with regional and currency information
 */
export interface LanguageConfig {
  readonly code: Language
  readonly locale: string
  readonly regions: readonly string[]
  readonly currency: string
}

/**
 * Complete language configuration mapping
 */
export type LanguageConfigMap = Record<Language, LanguageConfig>

/**
 * Language code mapping for backward compatibility
 */
export type LanguageCodeMap = Record<string, Language>

// ===== ROUTE TYPES =====

/**
 * Route path categories for middleware processing
 */
export interface RoutePaths {
  readonly AUTH_PATHS: readonly string[]
  readonly FEATURE_PATHS: readonly string[]
  readonly HOME_PATHS: readonly string[]
  readonly SKIP_PATHS: readonly string[]
  readonly FILE_EXTENSIONS: readonly string[]
}

/**
 * Language detection patterns for URL parsing
 */
export interface LanguagePatterns {
  readonly LANGUAGE_PREFIX: RegExp
  readonly LANGUAGE_AUTH_PATTERN: RegExp
  readonly LANGUAGE_HOME_PATTERN: RegExp
  readonly EXTRACT_LANGUAGE: RegExp
}

// ===== COOKIE TYPES =====

/**
 * Cookie configuration for language and authentication
 */
export interface CookieConfig {
  readonly name: string
  readonly maxAge: number
  readonly httpOnly: boolean
  readonly sameSite: 'lax' | 'strict' | 'none'
}

/**
 * Complete cookie configuration mapping
 */
export interface CookieConfigs {
  readonly LANGUAGE_COOKIE: CookieConfig
  readonly AUTH_COOKIE: {
    readonly name: string
  }
}

// ===== SECURITY TYPES =====

/**
 * Security headers configuration
 */
export type SecurityHeaders = Record<string, string>

/**
 * Cache headers configuration
 */
export interface CacheHeaders {
  readonly AUTH_PAGES: string
}

// ===== MIDDLEWARE CONTEXT TYPES =====

/**
 * Language detection context
 */
export interface LanguageDetectionContext {
  readonly request: NextRequest
  readonly pathname: string
  readonly cookieLanguage?: Language
  readonly acceptLanguage?: string
  readonly country?: string
}

/**
 * Authentication context
 */
export interface AuthenticationContext {
  readonly request: NextRequest
  readonly pathname: string
  readonly isAuthenticated: boolean
  readonly needsAuth: boolean
  readonly isTestingExamPage: boolean
}

/**
 * URL generation context
 */
export interface URLGenerationContext {
  readonly pathname: string
  readonly language: Language
  readonly request: NextRequest
  readonly isAuthenticated: boolean
}

/**
 * Security headers context
 */
export interface SecurityHeadersContext {
  readonly pathname: string
  readonly language: Language
  readonly isAuthenticated: boolean
}

// ===== MIDDLEWARE RESULT TYPES =====

/**
 * Language detection result
 */
export interface LanguageDetectionResult {
  readonly detectedLanguage: Language
  readonly source: 'url' | 'cookie' | 'header' | 'geo' | 'default'
  readonly confidence: number
}

/**
 * Authentication check result
 */
export interface AuthenticationResult {
  readonly isAuthenticated: boolean
  readonly needsAuth: boolean
  readonly shouldRedirect: boolean
  readonly redirectUrl?: string
}

/**
 * URL generation result
 */
export interface URLGenerationResult {
  readonly shouldRedirect: boolean
  readonly redirectUrl?: string
  readonly redirectType: 'language' | 'auth' | 'clean-url' | 'none'
}

/**
 * Security headers result
 */
export interface SecurityHeadersResult {
  readonly headers: Record<string, string>
  readonly cacheControl?: string
}

// ===== MODULE INTERFACE TYPES =====

/**
 * Language Detection Module Interface
 */
export interface LanguageDetectionModule {
  detectPreferredLanguage(context: LanguageDetectionContext): LanguageDetectionResult
  extractLanguageFromPath(pathname: string): Language | null
  hasLanguagePrefix(pathname: string): boolean
  getCleanUrl(pathname: string): string
}

/**
 * Authentication Module Interface
 */
export interface AuthenticationModule {
  isAuthenticated(request: NextRequest): boolean
  isProtectedRoute(pathname: string): boolean
  checkAuthentication(context: AuthenticationContext): AuthenticationResult
}

/**
 * URL Generation Module Interface
 */
export interface URLGenerationModule {
  generateRedirectUrl(context: URLGenerationContext): URLGenerationResult
  needsLanguageRedirect(pathname: string, isAuthenticated: boolean): boolean
  shouldRedirectToCleanUrl(pathname: string, isAuthenticated: boolean): boolean
}

/**
 * Security Headers Module Interface
 */
export interface SecurityHeadersModule {
  generateSecurityHeaders(context: SecurityHeadersContext): SecurityHeadersResult
  applyCacheHeaders(pathname: string): string | undefined
}

// ===== MIDDLEWARE FLOW TYPES =====

/**
 * Middleware processing context
 */
export interface MiddlewareContext {
  readonly request: NextRequest
  readonly pathname: string
  readonly languageDetection: LanguageDetectionResult
  readonly authentication: AuthenticationResult
  readonly urlGeneration: URLGenerationResult
  readonly securityHeaders: SecurityHeadersResult
}

/**
 * Middleware processing result
 */
export interface MiddlewareResult {
  readonly response: NextResponse
  readonly processed: boolean
  readonly redirected: boolean
  readonly error?: Error
}

// ===== UTILITY TYPES =====

/**
 * Path helper utilities type
 */
export interface PathHelpers {
  isStaticFile(pathname: string): boolean
  isAPIRoute(pathname: string): boolean
  shouldSkipMiddleware(pathname: string): boolean
}

/**
 * Cookie helper utilities type
 */
export interface CookieHelpers {
  setLanguageCookie(response: NextResponse, language: Language): void
  getLanguageCookie(request: NextRequest): Language | undefined
  setSecureCookieOptions(cookieConfig: CookieConfig): Record<string, any>
}

// ===== ERROR TYPES =====

/**
 * Middleware error types
 */
export type MiddlewareErrorType = 
  | 'LANGUAGE_DETECTION_ERROR'
  | 'AUTHENTICATION_ERROR'
  | 'URL_GENERATION_ERROR'
  | 'SECURITY_HEADERS_ERROR'
  | 'GENERAL_MIDDLEWARE_ERROR'

/**
 * Middleware error interface
 */
export interface MiddlewareError extends Error {
  readonly type: MiddlewareErrorType
  readonly context?: Record<string, any>
  readonly recoverable: boolean
}

// ===== CONFIGURATION TYPES =====

/**
 * Complete middleware configuration
 */
export interface MiddlewareConfig {
  readonly languages: LanguageConfigMap
  readonly routes: RoutePaths
  readonly patterns: LanguagePatterns
  readonly cookies: CookieConfigs
  readonly security: SecurityHeaders
  readonly cache: CacheHeaders
  readonly languageCodeMap: LanguageCodeMap
}

/**
 * Middleware module configuration
 */
export interface ModuleConfig {
  readonly enableLogging: boolean
  readonly enablePerformanceMonitoring: boolean
  readonly enableErrorRecovery: boolean
  readonly maxRedirectAttempts: number
}
