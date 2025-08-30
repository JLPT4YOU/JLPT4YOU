/**
 * Shared validation utilities for auth forms
 * Supports both translation and non-translation modes
 */

import { createTranslationFunction, loadTranslation, DEFAULT_LANGUAGE, TranslationData } from './i18n'

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

// Validator factory function (deprecated - use hook-based validation instead)
export function createAuthValidator() {
  // Note: This function is deprecated in favor of hook-based validation
  // It's kept for backward compatibility but should not be used in new code

  const getMessage = (category: keyof typeof translationKeys, key: string) => {
    // Use the function-based error messages that support i18n
    const messageFunc = (defaultErrorMessages as any)[category]?.[key]
    return typeof messageFunc === 'function' ? messageFunc() : ""
  }

  return {
    validateEmail: (value: string): string => {
      if (baseValidationRules.email.required(value)) {
        return getMessage('email', 'required')
      }
      if (baseValidationRules.email.invalid(value)) {
        return getMessage('email', 'invalid')
      }
      return ""
    },

    validatePassword: (value: string): string => {
      if (baseValidationRules.password.required(value)) {
        return getMessage('password', 'required')
      }
      if (baseValidationRules.password.tooShort(value)) {
        return getMessage('password', 'tooShort')
      }
      return ""
    },

    validateConfirmPassword: (value: string, password: string): string => {
      if (baseValidationRules.confirmPassword.required(value)) {
        return getMessage('confirmPassword', 'required')
      }
      if (baseValidationRules.confirmPassword.mismatch(value, password)) {
        return getMessage('confirmPassword', 'mismatch')
      }
      return ""
    },

    validateAcceptTerms: (value: boolean): string => {
      if (baseValidationRules.acceptTerms.required(value)) {
        return getMessage('acceptTerms', 'required')
      }
      return ""
    },

    // General error messages
    getGeneralError: () => getMessage('general', 'error'),
    getLoginFailedError: () => getMessage('general', 'loginFailed'),
    getEmailExistsError: () => getMessage('general', 'emailExists'),
    getResendFailedError: () => getMessage('general', 'resendFailed')
  }
}

// Form field validation function
export function validateField(
  name: string,
  value: string | boolean,
  formData?: Record<string, string | boolean>,
  validator?: ReturnType<typeof createAuthValidator>
): string {
  if (!validator) {
    validator = createAuthValidator()
  }

  switch (name) {
    case 'email':
      return validator.validateEmail(value as string)
    case 'password':
      return validator.validatePassword(value as string)
    case 'confirmPassword':
      return validator.validateConfirmPassword(value as string, (formData?.password as string) || '')
    case 'acceptTerms':
      return validator.validateAcceptTerms(value as boolean)
    default:
      return ""
  }
}

// Form validation helper
export function validateForm(
  formData: Record<string, string | boolean>,
  fields: string[],
  validator?: ReturnType<typeof createAuthValidator>
): Record<string, string> {
  const errors: Record<string, string> = {}
  
  for (const field of fields) {
    const error = validateField(field, formData[field], formData, validator)
    if (error) {
      errors[field] = error
    }
  }
  
  return errors
}
