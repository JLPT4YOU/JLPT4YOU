/**
 * Error-related constants and configuration
 * Centralized location for error codes, messages, and error handling configuration
 */

import { TFunction } from 'i18next';

// Error codes
export const ERROR_CODES = {
  // Authentication errors
  AUTH: {
    INVALID_CREDENTIALS: 'AUTH_INVALID_CREDENTIALS',
    TOKEN_EXPIRED: 'AUTH_TOKEN_EXPIRED',
    UNAUTHORIZED: 'AUTH_UNAUTHORIZED',
    FORBIDDEN: 'AUTH_FORBIDDEN',
    USER_NOT_FOUND: 'AUTH_USER_NOT_FOUND',
    EMAIL_ALREADY_EXISTS: 'AUTH_EMAIL_EXISTS',
    WEAK_PASSWORD: 'AUTH_WEAK_PASSWORD',
    INVALID_EMAIL: 'AUTH_INVALID_EMAIL'
  },
  // Exam errors
  EXAM: {
    NOT_FOUND: 'EXAM_NOT_FOUND',
    ALREADY_SUBMITTED: 'EXAM_ALREADY_SUBMITTED',
    TIME_EXPIRED: 'EXAM_TIME_EXPIRED',
    INVALID_ANSWER: 'EXAM_INVALID_ANSWER',
    SAVE_FAILED: 'EXAM_SAVE_FAILED',
    LOAD_FAILED: 'EXAM_LOAD_FAILED',
    VIOLATION_LIMIT_EXCEEDED: 'EXAM_VIOLATION_LIMIT_EXCEEDED',
    FULLSCREEN_REQUIRED: 'EXAM_FULLSCREEN_REQUIRED'
  },
  // Network errors
  NETWORK: {
    CONNECTION_FAILED: 'NETWORK_CONNECTION_FAILED',
    TIMEOUT: 'NETWORK_TIMEOUT',
    SERVER_ERROR: 'NETWORK_SERVER_ERROR',
    BAD_REQUEST: 'NETWORK_BAD_REQUEST',
    NOT_FOUND: 'NETWORK_NOT_FOUND',
    RATE_LIMITED: 'NETWORK_RATE_LIMITED'
  },
  // Validation errors
  VALIDATION: {
    REQUIRED_FIELD: 'VALIDATION_REQUIRED_FIELD',
    INVALID_FORMAT: 'VALIDATION_INVALID_FORMAT',
    MIN_LENGTH: 'VALIDATION_MIN_LENGTH',
    MAX_LENGTH: 'VALIDATION_MAX_LENGTH',
    INVALID_EMAIL: 'VALIDATION_INVALID_EMAIL',
    PASSWORDS_DONT_MATCH: 'VALIDATION_PASSWORDS_DONT_MATCH'
  },
  // Storage errors
  STORAGE: {
    QUOTA_EXCEEDED: 'STORAGE_QUOTA_EXCEEDED',
    ACCESS_DENIED: 'STORAGE_ACCESS_DENIED',
    CORRUPTED_DATA: 'STORAGE_CORRUPTED_DATA',
    SAVE_FAILED: 'STORAGE_SAVE_FAILED',
    LOAD_FAILED: 'STORAGE_LOAD_FAILED'
  },
  // Translation errors
  TRANSLATION: {
    LOAD_FAILED: 'TRANSLATION_LOAD_FAILED',
    MISSING_KEY: 'TRANSLATION_MISSING_KEY',
    INVALID_LANGUAGE: 'TRANSLATION_INVALID_LANGUAGE'
  },
  // Generic errors
  GENERIC: {
    UNKNOWN_ERROR: 'GENERIC_UNKNOWN_ERROR',
    OPERATION_FAILED: 'GENERIC_OPERATION_FAILED',
    INVALID_INPUT: 'GENERIC_INVALID_INPUT',
    PERMISSION_DENIED: 'GENERIC_PERMISSION_DENIED'
  }
} as const







// Error severity levels
export const ERROR_SEVERITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical'
} as const

export type ErrorSeverity = typeof ERROR_SEVERITY[keyof typeof ERROR_SEVERITY]

// Error categories
export const ERROR_CATEGORIES = {
  USER: 'user',
  SYSTEM: 'system',
  NETWORK: 'network',
  VALIDATION: 'validation',
  SECURITY: 'security'
} as const

export type ErrorCategory = typeof ERROR_CATEGORIES[keyof typeof ERROR_CATEGORIES]

// Helper functions
export function getErrorMessage(
  t: TFunction,
  errorCode: string,
): string {
  const key = `errors.${errorCode}`;
  const message = t(key);

  // i18next returns the key if it's not found, so we check for that.
  // If the message is the same as the key, it means the translation is missing.
  if (message === key) {
    // Fallback to a generic unknown error message.
    return t(`errors.${ERROR_CODES.GENERIC.UNKNOWN_ERROR}`);
  }

  return message;
}

export function isAuthError(errorCode: string): boolean {
  return Object.values(ERROR_CODES.AUTH).includes(errorCode as any)
}

export function isExamError(errorCode: string): boolean {
  return Object.values(ERROR_CODES.EXAM).includes(errorCode as any)
}

export function isNetworkError(errorCode: string): boolean {
  return Object.values(ERROR_CODES.NETWORK).includes(errorCode as any)
}

export function isValidationError(errorCode: string): boolean {
  return Object.values(ERROR_CODES.VALIDATION).includes(errorCode as any)
}

export function getErrorSeverity(errorCode: string): ErrorSeverity {
  // Critical errors
  if ([
    ERROR_CODES.AUTH.UNAUTHORIZED,
    ERROR_CODES.EXAM.VIOLATION_LIMIT_EXCEEDED,
    ERROR_CODES.NETWORK.SERVER_ERROR
  ].includes(errorCode as any)) {
    return ERROR_SEVERITY.CRITICAL
  }

  // High severity errors
  if ([
    ERROR_CODES.AUTH.TOKEN_EXPIRED,
    ERROR_CODES.EXAM.TIME_EXPIRED,
    ERROR_CODES.STORAGE.QUOTA_EXCEEDED
  ].includes(errorCode as any)) {
    return ERROR_SEVERITY.HIGH
  }

  // Medium severity errors
  if ([
    ERROR_CODES.AUTH.INVALID_CREDENTIALS,
    ERROR_CODES.EXAM.SAVE_FAILED,
    ERROR_CODES.NETWORK.CONNECTION_FAILED
  ].includes(errorCode as any)) {
    return ERROR_SEVERITY.MEDIUM
  }

  // Default to low severity
  return ERROR_SEVERITY.LOW
}

export function getErrorCategory(errorCode: string): ErrorCategory {
  if (isAuthError(errorCode)) return ERROR_CATEGORIES.SECURITY
  if (isExamError(errorCode)) return ERROR_CATEGORIES.SYSTEM
  if (isNetworkError(errorCode)) return ERROR_CATEGORIES.NETWORK
  if (isValidationError(errorCode)) return ERROR_CATEGORIES.VALIDATION
  return ERROR_CATEGORIES.USER
}