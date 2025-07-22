/**
 * Comprehensive tests for auth validation utilities
 * Testing: baseValidationRules, createAuthValidator, validateField, validateForm
 */

import {
  baseValidationRules,
  createAuthValidator,
  validateField,
  validateForm,
  defaultErrorMessages
} from '@/lib/auth-validation'

describe('baseValidationRules', () => {
  describe('email validation', () => {
    test('should validate required email', () => {
      expect(baseValidationRules.email.required('')).toBe(true)
      expect(baseValidationRules.email.required('test@example.com')).toBe(false)
    })

    test('should validate email format', () => {
      // Valid emails
      expect(baseValidationRules.email.invalid('test@example.com')).toBe(false)
      expect(baseValidationRules.email.invalid('user.name@domain.co.uk')).toBe(false)
      expect(baseValidationRules.email.invalid('test+tag@example.org')).toBe(false)
      
      // Invalid emails
      expect(baseValidationRules.email.invalid('invalid-email')).toBe(true)
      expect(baseValidationRules.email.invalid('test@')).toBe(true)
      expect(baseValidationRules.email.invalid('@example.com')).toBe(true)
      expect(baseValidationRules.email.invalid('test.example.com')).toBe(true)
      expect(baseValidationRules.email.invalid('test @example.com')).toBe(true)
    })
  })

  describe('password validation', () => {
    test('should validate required password', () => {
      expect(baseValidationRules.password.required('')).toBe(true)
      expect(baseValidationRules.password.required('password123')).toBe(false)
    })

    test('should validate password length', () => {
      expect(baseValidationRules.password.tooShort('1234567')).toBe(true) // 7 chars
      expect(baseValidationRules.password.tooShort('12345678')).toBe(false) // 8 chars
      expect(baseValidationRules.password.tooShort('123456789')).toBe(false) // 9 chars
    })
  })

  describe('confirmPassword validation', () => {
    test('should validate required confirm password', () => {
      expect(baseValidationRules.confirmPassword.required('')).toBe(true)
      expect(baseValidationRules.confirmPassword.required('password123')).toBe(false)
    })

    test('should validate password match', () => {
      expect(baseValidationRules.confirmPassword.mismatch('password123', 'password123')).toBe(false)
      expect(baseValidationRules.confirmPassword.mismatch('password123', 'different')).toBe(true)
      expect(baseValidationRules.confirmPassword.mismatch('', '')).toBe(false)
    })
  })

  describe('acceptTerms validation', () => {
    test('should validate required terms acceptance', () => {
      expect(baseValidationRules.acceptTerms.required(false)).toBe(true)
      expect(baseValidationRules.acceptTerms.required(true)).toBe(false)
    })
  })
})

describe('defaultErrorMessages', () => {
  test('should have all required error message categories', () => {
    expect(defaultErrorMessages).toHaveProperty('email')
    expect(defaultErrorMessages).toHaveProperty('password')
    expect(defaultErrorMessages).toHaveProperty('confirmPassword')
    expect(defaultErrorMessages).toHaveProperty('acceptTerms')
    expect(defaultErrorMessages).toHaveProperty('general')
  })

  test('should have correct email error messages', () => {
    expect(defaultErrorMessages.email.required).toBe('Email là bắt buộc')
    expect(defaultErrorMessages.email.invalid).toBe('Email không hợp lệ')
  })

  test('should have correct password error messages', () => {
    expect(defaultErrorMessages.password.required).toBe('Mật khẩu là bắt buộc')
    expect(defaultErrorMessages.password.tooShort).toBe('Mật khẩu phải có ít nhất 8 ký tự')
  })

  test('should have correct confirm password error messages', () => {
    expect(defaultErrorMessages.confirmPassword.required).toBe('Xác nhận mật khẩu là bắt buộc')
    expect(defaultErrorMessages.confirmPassword.mismatch).toBe('Mật khẩu xác nhận không khớp')
  })

  test('should have correct terms error messages', () => {
    expect(defaultErrorMessages.acceptTerms.required).toBe('Bạn phải đồng ý với điều khoản sử dụng')
  })

  test('should have correct general error messages', () => {
    expect(defaultErrorMessages.general.error).toBe('Đã xảy ra lỗi. Vui lòng thử lại.')
    expect(defaultErrorMessages.general.loginFailed).toBe('Email hoặc mật khẩu không chính xác')
    expect(defaultErrorMessages.general.emailExists).toBe('Email này đã được sử dụng')
    expect(defaultErrorMessages.general.resendFailed).toBe('Không thể gửi lại email. Vui lòng thử lại.')
  })
})

describe('createAuthValidator', () => {
  let validator: ReturnType<typeof createAuthValidator>

  beforeEach(() => {
    validator = createAuthValidator()
  })

  describe('validateEmail', () => {
    test('should return error for empty email', () => {
      expect(validator.validateEmail('')).toBe('Email là bắt buộc')
    })

    test('should return error for invalid email format', () => {
      expect(validator.validateEmail('invalid-email')).toBe('Email không hợp lệ')
      expect(validator.validateEmail('test@')).toBe('Email không hợp lệ')
      expect(validator.validateEmail('@example.com')).toBe('Email không hợp lệ')
    })

    test('should return empty string for valid email', () => {
      expect(validator.validateEmail('test@example.com')).toBe('')
      expect(validator.validateEmail('user.name@domain.co.uk')).toBe('')
    })
  })

  describe('validatePassword', () => {
    test('should return error for empty password', () => {
      expect(validator.validatePassword('')).toBe('Mật khẩu là bắt buộc')
    })

    test('should return error for short password', () => {
      expect(validator.validatePassword('1234567')).toBe('Mật khẩu phải có ít nhất 8 ký tự')
    })

    test('should return empty string for valid password', () => {
      expect(validator.validatePassword('12345678')).toBe('')
      expect(validator.validatePassword('validpassword')).toBe('')
    })
  })

  describe('validateConfirmPassword', () => {
    test('should return error for empty confirm password', () => {
      expect(validator.validateConfirmPassword('', 'password123')).toBe('Xác nhận mật khẩu là bắt buộc')
    })

    test('should return error for mismatched passwords', () => {
      expect(validator.validateConfirmPassword('different', 'password123')).toBe('Mật khẩu xác nhận không khớp')
    })

    test('should return empty string for matching passwords', () => {
      expect(validator.validateConfirmPassword('password123', 'password123')).toBe('')
    })
  })

  describe('validateAcceptTerms', () => {
    test('should return error when terms not accepted', () => {
      expect(validator.validateAcceptTerms(false)).toBe('Bạn phải đồng ý với điều khoản sử dụng')
    })

    test('should return empty string when terms accepted', () => {
      expect(validator.validateAcceptTerms(true)).toBe('')
    })
  })

  describe('general error methods', () => {
    test('should return correct general error messages', () => {
      expect(validator.getGeneralError()).toBe('Đã xảy ra lỗi. Vui lòng thử lại.')
      expect(validator.getLoginFailedError()).toBe('Email hoặc mật khẩu không chính xác')
      expect(validator.getEmailExistsError()).toBe('Email này đã được sử dụng')
      expect(validator.getResendFailedError()).toBe('Không thể gửi lại email. Vui lòng thử lại.')
    })
  })
})

describe('validateField', () => {
  test('should validate email field', () => {
    expect(validateField('email', '')).toBe('Email là bắt buộc')
    expect(validateField('email', 'invalid')).toBe('Email không hợp lệ')
    expect(validateField('email', 'test@example.com')).toBe('')
  })

  test('should validate password field', () => {
    expect(validateField('password', '')).toBe('Mật khẩu là bắt buộc')
    expect(validateField('password', '1234567')).toBe('Mật khẩu phải có ít nhất 8 ký tự')
    expect(validateField('password', '12345678')).toBe('')
  })

  test('should validate confirmPassword field', () => {
    const formData = { password: 'password123' }

    expect(validateField('confirmPassword', '', formData)).toBe('Xác nhận mật khẩu là bắt buộc')
    expect(validateField('confirmPassword', 'different', formData)).toBe('Mật khẩu xác nhận không khớp')
    expect(validateField('confirmPassword', 'password123', formData)).toBe('')
  })

  test('should validate acceptTerms field', () => {
    expect(validateField('acceptTerms', false)).toBe('Bạn phải đồng ý với điều khoản sử dụng')
    expect(validateField('acceptTerms', true)).toBe('')
  })

  test('should return empty string for unknown field', () => {
    expect(validateField('unknownField', 'value')).toBe('')
  })

  test('should use custom validator when provided', () => {
    const customValidator = createAuthValidator()
    const result = validateField('email', 'test@example.com', {}, customValidator)
    expect(result).toBe('')
  })
})

describe('validateForm', () => {
  test('should validate login form', () => {
    const formData = {
      email: '',
      password: '1234567'
    }
    const fields = ['email', 'password']

    const errors = validateForm(formData, fields)

    expect(errors).toEqual({
      email: 'Email là bắt buộc',
      password: 'Mật khẩu phải có ít nhất 8 ký tự'
    })
  })

  test('should validate register form', () => {
    const formData = {
      email: 'test@example.com',
      password: 'password123',
      confirmPassword: 'different',
      acceptTerms: false
    }
    const fields = ['email', 'password', 'confirmPassword', 'acceptTerms']

    const errors = validateForm(formData, fields)

    expect(errors).toEqual({
      confirmPassword: 'Mật khẩu xác nhận không khớp',
      acceptTerms: 'Bạn phải đồng ý với điều khoản sử dụng'
    })
  })

  test('should return empty errors object for valid form', () => {
    const formData = {
      email: 'test@example.com',
      password: 'password123',
      confirmPassword: 'password123',
      acceptTerms: true
    }
    const fields = ['email', 'password', 'confirmPassword', 'acceptTerms']
    
    const errors = validateForm(formData, fields)
    
    expect(errors).toEqual({})
  })

  test('should use custom validator when provided', () => {
    const formData = { email: 'test@example.com' }
    const fields = ['email']
    const customValidator = createAuthValidator()
    
    const errors = validateForm(formData, fields, customValidator)
    
    expect(errors).toEqual({})
  })

  test('should handle empty fields array', () => {
    const formData = { email: 'test@example.com' }
    const fields: string[] = []
    
    const errors = validateForm(formData, fields)
    
    expect(errors).toEqual({})
  })
})
