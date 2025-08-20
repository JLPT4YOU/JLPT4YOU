/**
 * Shared auth form hook
 * Provides common state management, validation, and form handling logic
 */

import { useState, useCallback, useEffect } from "react"
import { useRouter } from "next/navigation"
import { TranslationData, Language, getLocalizedPath } from "@/lib/i18n"
import { useTranslation } from "@/lib/use-translation"
import { baseValidationRules, defaultErrorMessages, translationKeys } from "@/lib/auth-validation"
import { useAuth } from '@/contexts/auth-context-simple'
import { getLoginRedirectUrl, getLoginUrl, getRegisterUrl, getForgotPasswordUrl } from "@/lib/auth-utils"

export interface AuthFormConfig {
  formType: 'login' | 'register' | 'forgotPassword'
  translations?: TranslationData
  language?: Language
  onSuccess?: (data: AuthFormData) => void
  onError?: (error: string) => void
}

export interface LoginFormData {
  email: string
  password: string
  rememberMe: boolean
}

export interface RegisterFormData {
  email: string
  password: string
  confirmPassword: string
  acceptTerms: boolean
}

export interface ForgotPasswordFormData {
  email: string
}

export type AuthFormData = LoginFormData | RegisterFormData | ForgotPasswordFormData

export interface AuthFormErrors {
  email?: string
  password?: string
  confirmPassword?: string
  acceptTerms?: string
  general?: string
  [key: string]: string | undefined
}

export function useAuthForm<T extends AuthFormData>(
  initialData: T,
  config: AuthFormConfig
) {
  const router = useRouter()
  const [formData, setFormData] = useState<T>(initialData)
  const [errors, setErrors] = useState<AuthFormErrors>({})
  const [isLoading, setIsLoading] = useState(false)
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [isSuccess, setIsSuccess] = useState(false)

  // Create validator with proper hook usage
  const translationHook = useTranslation(config.translations || {} as TranslationData)
  const t = config.translations ? translationHook.t : null

  const getMessage = useCallback((category: keyof typeof translationKeys, key: string) => {
    if (t && translationKeys[category] && translationKeys[category][key as keyof typeof translationKeys[typeof category]]) {
      return t(translationKeys[category][key as keyof typeof translationKeys[typeof category]])
    }
    return defaultErrorMessages[category]?.[key as keyof typeof defaultErrorMessages[typeof category]] || ""
  }, [t])

  const validateField = useCallback((name: string, value: string | boolean, password?: string): string => {
    switch (name) {
      case 'email':
        if (baseValidationRules.email.required(value as string)) {
          return getMessage('email', 'required')
        }
        if (baseValidationRules.email.invalid(value as string)) {
          return getMessage('email', 'invalid')
        }
        return ""
      case 'password':
        if (baseValidationRules.password.required(value as string)) {
          return getMessage('password', 'required')
        }
        if (baseValidationRules.password.tooShort(value as string)) {
          return getMessage('password', 'tooShort')
        }
        return ""
      case 'confirmPassword':
        if (baseValidationRules.confirmPassword.required(value as string)) {
          return getMessage('confirmPassword', 'required')
        }
        if (baseValidationRules.confirmPassword.mismatch(value as string, password || '')) {
          return getMessage('confirmPassword', 'mismatch')
        }
        return ""
      case 'acceptTerms':
        if (baseValidationRules.acceptTerms.required(value as boolean)) {
          return getMessage('acceptTerms', 'required')
        }
        return ""
      default:
        return ""
    }
  }, [getMessage])

  // Get form fields based on form type
  const getFormFields = useCallback(() => {
    switch (config.formType) {
      case 'login':
        return ['email', 'password']
      case 'register':
        return ['email', 'password', 'confirmPassword', 'acceptTerms']
      case 'forgotPassword':
        return ['email']
      default:
        return []
    }
  }, [config.formType])

  // Real-time validation effect
  useEffect(() => {
    const newErrors: AuthFormErrors = {}
    const fields = getFormFields()

    for (const field of fields) {
      if (touched[field]) {
        if (field === 'confirmPassword') {
          const registerData = formData as RegisterFormData
          const error = validateField(field, registerData[field], registerData.password)
          if (error) newErrors[field] = error
        } else {
          const error = validateField(field, (formData as unknown as Record<string, string | boolean>)[field])
          if (error) newErrors[field] = error
        }
      }
    }

    setErrors(newErrors)
  }, [formData, touched, validateField, getFormFields])

  // Handle input change
  const handleInputChange = useCallback((name: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [name]: value }))
    
    // Clear general error when user starts typing
    if (errors.general) {
      setErrors(prev => ({ ...prev, general: undefined }))
    }
  }, [errors.general])

  // Handle field blur
  const handleBlur = useCallback((name: string) => {
    setTouched(prev => ({ ...prev, [name]: true }))
  }, [])

  // Handle checkbox change (for rememberMe, acceptTerms)
  const handleCheckboxChange = useCallback((name: string, checked: boolean) => {
    handleInputChange(name, checked)
  }, [handleInputChange])

  // Get auth context
  const { signIn } = useAuth()

  // Auth actions based on form type
  const performAuthAction = useCallback(async (data: T): Promise<void> => {
    const { formType, language } = config

    switch (formType) {
      case 'login':
        const loginData = data as LoginFormData
        const result = await signIn(loginData.email, loginData.password)

        if (!result.error) {
          // Get redirect URL or default to homepage
          const redirectUrl = getLoginRedirectUrl()

          // Use window.location for hard refresh to ensure session cookies are properly set
          window.location.href = redirectUrl
        } else {
          // Convert Supabase error messages to Vietnamese
          let errorMessage = result.error
          if (typeof result.error === 'string') {
            if (result.error.includes('Invalid login credentials') ||
                result.error.includes('invalid login credentials') ||
                result.error.includes('Invalid credentials') ||
                result.error.includes('AuthApiError: Invalid login credentials')) {
              errorMessage = 'Sai tên đăng nhập hoặc mật khẩu'
            }
          }
          throw new Error(errorMessage || getMessage('general', 'loginFailed'))
        }
        break

      case 'register':
        const registerData = data as RegisterFormData
        const { authService } = await import('@/lib/auth-service')
        const registerResult = await authService.register({
          email: registerData.email,
          password: registerData.password
        })

        if (!registerResult.success) {
          throw new Error(registerResult.error || getMessage('general', 'registerFailed'))
        }

        // If registration successful but needs email confirmation
        if (registerResult.error === 'confirmation_required') {
          // Redirect to login page with success message
          const loginPath = language ? getLocalizedPath('login', language) : getLoginUrl()
          router.push(`${loginPath}?registered=true`)
        } else {
          // Auto login after successful registration
          const loginResult = await signIn(registerData.email, registerData.password)
          if (!loginResult.error) {
            const redirectUrl = getLoginRedirectUrl()
            window.location.href = redirectUrl
          } else {
            // Registration successful but auto-login failed, redirect to login
            const loginPath = language ? getLocalizedPath('login', language) : getLoginUrl()
            router.push(`${loginPath}?registered=true`)
          }
        }
        break

      case 'forgotPassword':
        // Always succeed for demo
        setIsSuccess(true)
        break

      default:
        throw new Error(getMessage('general', 'error'))
    }
  }, [config, router, signIn, getMessage])

  // Handle form submission
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    
    const fields = getFormFields()
    
    // Mark all fields as touched
    const touchedFields = fields.reduce((acc, field) => {
      acc[field] = true
      return acc
    }, {} as Record<string, boolean>)
    setTouched(touchedFields)

    // Validate all fields
    const validationErrors: AuthFormErrors = {}
    for (const field of fields) {
      if (field === 'confirmPassword') {
        const registerData = formData as RegisterFormData
        const error = validateField(field, registerData[field], registerData.password)
        if (error) validationErrors[field] = error
      } else {
        const error = validateField(field, (formData as unknown as Record<string, string | boolean>)[field])
        if (error) validationErrors[field] = error
      }
    }

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }

    setIsLoading(true)
    setErrors({})

    try {
      // Only simulate delay for registration to show form validation
      if (config.formType === 'register') {
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
      
      await performAuthAction(formData)
      
      if (config.onSuccess) {
        config.onSuccess(formData)
      }
    } catch (error) {
      let errorMessage = error instanceof Error ? error.message : getMessage('general', 'error')

      // Convert Supabase error messages to Vietnamese
      if (typeof errorMessage === 'string') {
        if (errorMessage.includes('Invalid login credentials') ||
            errorMessage.includes('invalid login credentials') ||
            errorMessage.includes('Invalid credentials') ||
            errorMessage.includes('AuthApiError: Invalid login credentials')) {
          errorMessage = 'Sai tên đăng nhập hoặc mật khẩu'
        }
      }

      setErrors({ general: errorMessage })

      if (config.onError) {
        config.onError(errorMessage)
      }
    } finally {
      setIsLoading(false)
    }
  }, [formData, getFormFields, validateField, performAuthAction, config, getMessage])

  // Navigation helpers
  const navigateToLogin = useCallback(() => {
    const loginPath = config.language ? getLocalizedPath('login', config.language) : getLoginUrl()
    router.push(loginPath)
  }, [router, config.language])

  const navigateToRegister = useCallback(() => {
    const registerPath = config.language ? getLocalizedPath('register', config.language) : getRegisterUrl()
    router.push(registerPath)
  }, [router, config.language])

  const navigateToForgotPassword = useCallback(() => {
    const forgotPath = config.language ? getLocalizedPath('forgot-password', config.language) : getForgotPasswordUrl()
    router.push(forgotPath)
  }, [router, config.language])

  // Social login handler
  const handleSocialLogin = useCallback(async (provider: string) => {
    if (provider.toLowerCase() !== 'google') {
      console.warn(`${provider} login not implemented yet`)
      return
    }

    setIsLoading(true)
    setErrors({})

    try {
      const { authService } = await import('@/lib/auth-service')
      const result = await authService.signInWithOAuth('google')
      
      if (!result.success) {
        setErrors({ general: result.error || 'Đã xảy ra lỗi khi đăng nhập với Google.' })
      }
      // If successful, the auth state change will be handled by the auth context
      // and user will be redirected automatically
    } catch (error) {
      console.error('Social login error:', error)
      setErrors({ general: 'Đã xảy ra lỗi khi đăng nhập với Google. Vui lòng thử lại.' })
    } finally {
      setIsLoading(false)
    }
  }, [config.formType])

  // Resend email handler (for forgot password)
  const handleResendEmail = useCallback(async () => {
    if (config.formType !== 'forgotPassword') return

    setIsLoading(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 1000))
      // Show success message or update UI
    } catch {
      setErrors({ general: getMessage('general', 'resendFailed') })
    } finally {
      setIsLoading(false)
    }
  }, [config.formType, getMessage])

  return {
    // State
    formData,
    errors,
    isLoading,
    touched,
    isSuccess,
    
    // Handlers
    handleInputChange,
    handleBlur,
    handleCheckboxChange,
    handleSubmit,
    handleSocialLogin,
    handleResendEmail,
    
    // Navigation
    navigateToLogin,
    navigateToRegister,
    navigateToForgotPassword
  }
}
