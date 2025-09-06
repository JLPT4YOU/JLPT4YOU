/**
 * Shared validation utilities for auth forms
 * Supports both translation and non-translation modes
 */

import { createTranslationFunction, loadTranslation, DEFAULT_LANGUAGE, TranslationData } from './i18n/'

// Translation helper for validation messages
let cachedTranslations: TranslationData | null = null
let cachedT: ((key: string) => string) | null = null

async function initializeValidationTranslations() {
  if (!cachedTranslations) {
    try {
      cachedTranslations = await loadTranslation(DEFAULT_LANGUAGE)
      cachedT = createTranslationFunction(cachedTranslations)
    } catch (error) {
      console.warn('Failed to load translations for validation:', error)
    }
  }
}

// Initialize translations
initializeValidationTranslations()

function getValidationText(key: string, fallback: string): string {
  return cachedT ? cachedT(key) : fallback
}

// Base validation rules without translations
export const baseValidationRules = {
  email: {
    required: (value: string) => !value,
    invalid: (value: string) => !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
  },
  password: {
    required: (value: string) => !value,
    tooShort: (value: string) => value.length < 8
  },
  confirmPassword: {
    required: (value: string) => !value,
    mismatch: (value: string, password: string) => value !== password
  },
  acceptTerms: {
    required: (value: boolean) => !value
  }
} as const

// Default Vietnamese error messages with i18n support
export const defaultErrorMessages = {
  email: {
    required: () => getValidationText('auth.validation.emailRequired', "Email là bắt buộc"),
    invalid: () => getValidationText('auth.validation.emailInvalid', "Email không hợp lệ")
  },
  password: {
    required: () => getValidationText('auth.validation.passwordRequired', "Mật khẩu là bắt buộc"),
    tooShort: () => getValidationText('auth.validation.passwordTooShort', "Mật khẩu phải có ít nhất 8 ký tự")
  },
  confirmPassword: {
    required: () => getValidationText('auth.validation.confirmPasswordRequired', "Xác nhận mật khẩu là bắt buộc"),
    mismatch: () => getValidationText('auth.validation.passwordMismatch', "Mật khẩu xác nhận không khớp")
  },
  acceptTerms: {
    required: () => getValidationText('auth.validation.termsRequired', "Bạn phải đồng ý với điều khoản sử dụng")
  },
  general: {
    error: () => getValidationText('auth.errors.general', "Đã xảy ra lỗi. Vui lòng thử lại."),
    loginFailed: () => getValidationText('auth.errors.loginFailed', "Sai tên đăng nhập hoặc mật khẩu"),
    emailExists: () => getValidationText('auth.errors.emailExists', "Email này đã được sử dụng"),
    resendFailed: () => getValidationText('auth.errors.resendFailed', "Không thể gửi lại email. Vui lòng thử lại.")
  }
} as const

// Translation keys for error messages
export const translationKeys = {
  email: {
    required: 'auth.validation.emailRequired',
    invalid: 'auth.validation.emailInvalid'
  },
  password: {
    required: 'auth.validation.passwordRequired',
    tooShort: 'auth.validation.passwordTooShort'
  },
  confirmPassword: {
    required: 'auth.validation.confirmPasswordRequired',
    mismatch: 'auth.validation.passwordMismatch'
  },
  acceptTerms: {
    required: 'auth.validation.acceptTermsRequired'
  },
  general: {
    error: 'common.error',
    loginFailed: 'auth.validation.emailInvalid', // Reuse translation
    emailExists: 'auth.validation.emailInvalid', // Reuse translation
    resendFailed: 'auth.validation.resendFailed'
  }
} as const


// Form field validation function (uses hook-based validation)
export function validateField(
  name: string,
  value: string | boolean,
  formData?: Record<string, string | boolean>
): string {
  switch (name) {
    case 'email':
      if (baseValidationRules.email.required(value as string)) {
        return defaultErrorMessages.email.required()
      }
      if (baseValidationRules.email.invalid(value as string)) {
        return defaultErrorMessages.email.invalid()
      }
      return ""
    case 'password':
      if (baseValidationRules.password.required(value as string)) {
        return defaultErrorMessages.password.required()
      }
      if (baseValidationRules.password.tooShort(value as string)) {
        return defaultErrorMessages.password.tooShort()
      }
      return ""
    case 'confirmPassword':
      if (baseValidationRules.confirmPassword.required(value as string)) {
        return defaultErrorMessages.confirmPassword.required()
      }
      if (baseValidationRules.confirmPassword.mismatch(value as string, (formData?.password as string) || '')) {
        return defaultErrorMessages.confirmPassword.mismatch()
      }
      return ""
    case 'acceptTerms':
      if (baseValidationRules.acceptTerms.required(value as boolean)) {
        return defaultErrorMessages.acceptTerms.required()
      }
      return ""
    default:
      return ""
  }
}

// Form validation helper
export function validateForm(
  formData: Record<string, string | boolean>,
  fields: string[]
): Record<string, string> {
  const errors: Record<string, string> = {}
  
  for (const field of fields) {
    const error = validateField(field, formData[field], formData)
    if (error) {
      errors[field] = error
    }
  }
  
  return errors
}
