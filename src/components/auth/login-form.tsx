"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { PasswordInput } from "./password-input"
import { SocialLogin } from "./social-login"
import { useAuthForm, LoginFormData } from "@/hooks/use-auth-form"
import { TranslationData, Language } from "@/lib/i18n"
import { useTranslation } from "@/lib/use-translation"
import { cn } from "@/lib/utils"
import { useSearchParams } from "next/navigation"
import { useState, useEffect, Suspense } from "react"

interface LoginFormProps {
  className?: string
  onSwitchToRegister?: () => void
  translations?: TranslationData
  language?: Language
}

// Component that uses useSearchParams - must be wrapped in Suspense
function LoginFormWithSearchParams(props: LoginFormProps) {
  const searchParams = useSearchParams()
  return <LoginFormContent {...props} searchParams={searchParams} />
}

function LoginFormContent({
  className,
  onSwitchToRegister,
  translations,
  language,
  searchParams
}: LoginFormProps & { searchParams: URLSearchParams }) {
  const initialData: LoginFormData = {
    email: "",
    password: "",
    rememberMe: false
  }

  const {
    formData,
    errors,
    isLoading,
    handleInputChange,
    handleBlur,
    handleCheckboxChange,
    handleSubmit,
    handleSocialLogin,
    navigateToForgotPassword
  } = useAuthForm(initialData, {
    formType: 'login',
    translations,
    language
  })

  // Translation helper - always call hook, but conditionally use result
  const translationHook = useTranslation(translations || {} as TranslationData)
  const t = translations ? translationHook.t : null
  const getText = (key: string, fallback: string) => t ? t(key) : fallback
  
  const [showRegistrationSuccess, setShowRegistrationSuccess] = useState(false)

  // Check if user just registered
  useEffect(() => {
    const registered = searchParams.get('registered')
    const confirm = searchParams.get('confirm')
    if (registered === 'true') {
      setShowRegistrationSuccess(true)
      // Auto-hide after 8 seconds
      const timer = setTimeout(() => setShowRegistrationSuccess(false), 8000)
      return () => clearTimeout(timer)
    }
  }, [searchParams])


  return (
    <div className={cn("space-y-6 md:space-y-8", className)}>
      <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
        {/* Registration Success Message */}
        {showRegistrationSuccess && (
          <div className="p-3 text-sm text-green-700 bg-green-50 border border-green-200 rounded-md dark:text-green-400 dark:bg-green-950 dark:border-green-800">
            {getText('auth.messages.registrationSuccess', 'Đăng ký thành công! Vui lòng kiểm tra email để xác nhận tài khoản.')}
          </div>
        )}
        
        {/* General Error */}
        {errors.general && (
          <div className="p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md">
            {errors.general}
          </div>
        )}

        {/* Email Field */}
        <div className="space-y-2 md:space-y-3">
          <Label htmlFor="email" className="text-sm md:text-base">
            {getText('auth.labels.email', 'Email')}
          </Label>
          <Input
            id="email"
            name="email"
            type="email"
            value={formData.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
            onBlur={() => handleBlur('email')}
            placeholder={getText('auth.placeholders.email', 'Enter your email')}
            className={cn(errors.email && "border-destructive focus-visible:ring-destructive")}
            disabled={isLoading}
          />
          {errors.email && (
            <p className="text-sm text-destructive">{errors.email}</p>
          )}
        </div>

        {/* Password Field */}
        <div className="space-y-2 md:space-y-3">
          <Label htmlFor="password" className="text-sm md:text-base">
            {getText('auth.labels.password', 'Password')}
          </Label>
          <PasswordInput
            id="password"
            name="password"
            value={formData.password}
            onChange={(value) => handleInputChange('password', value)}
            error={errors.password}
            placeholder={getText('auth.placeholders.password', 'Enter password')}
            showCapsLockWarning={true}
          />
        </div>

        {/* Remember Me & Forgot Password */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="remember"
              checked={formData.rememberMe}
              onCheckedChange={(checked) => handleCheckboxChange('rememberMe', checked as boolean)}
              disabled={isLoading}
            />
            <Label 
              htmlFor="remember" 
              className="text-sm font-normal cursor-pointer"
            >
              {getText('auth.labels.rememberMe', 'Nhớ đăng nhập')}
            </Label>
          </div>
          
          <Button
            type="button"
            variant="link"
            className="px-0 font-normal text-sm"
            onClick={navigateToForgotPassword}
            disabled={isLoading}
          >
            {getText('auth.links.forgotPassword', 'Forgot password?')}
          </Button>
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          className="w-full bg-primary hover:bg-primary/90 h-10 md:h-12 text-sm md:text-base"
          disabled={isLoading}
        >
          {isLoading ? getText('auth.loading.login', 'Đang đăng nhập...') : getText('auth.buttons.login', 'Đăng nhập')}
        </Button>
      </form>

      {/* Social Login */}
      <SocialLogin
        onGoogleLogin={() => handleSocialLogin('Google')}
        isLoading={isLoading}
        translations={translations || {} as TranslationData}
      />

      {/* Switch to Register */}
      <div className="text-center">
        <p className="text-sm text-muted-foreground">
          {getText('auth.messages.noAccount', 'Chưa có tài khoản?')}{" "}
          <Button
            type="button"
            variant="link"
            className="px-0 font-medium"
            onClick={onSwitchToRegister}
            disabled={isLoading}
          >
            {getText('auth.messages.signUpNow', 'Đăng ký ngay')}
          </Button>
        </p>
      </div>
    </div>
  )
}

// Main export with Suspense wrapper
export function LoginForm(props: LoginFormProps) {
  return (
    <Suspense fallback={<div className="min-h-[400px] animate-pulse bg-muted/20 rounded-lg" />}>
      <LoginFormWithSearchParams {...props} />
    </Suspense>
  )
}
