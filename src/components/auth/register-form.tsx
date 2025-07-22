"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { PasswordInput } from "./password-input"
import { SocialLogin } from "./social-login"
import { useAuthForm, RegisterFormData } from "@/hooks/use-auth-form"
import { TranslationData, Language } from "@/lib/i18n"
import { useTranslation } from "@/lib/use-translation"
import { cn } from "@/lib/utils"

interface RegisterFormProps {
  className?: string
  onSwitchToLogin?: () => void
  translations?: TranslationData
  language?: Language
}

export function RegisterForm({
  className,
  onSwitchToLogin,
  translations,
  language
}: RegisterFormProps) {
  const initialData: RegisterFormData = {
    email: "",
    password: "",
    confirmPassword: "",
    acceptTerms: false
  }

  const {
    formData,
    errors,
    isLoading,
    handleInputChange,
    handleBlur,
    handleCheckboxChange,
    handleSubmit,
    handleSocialLogin
  } = useAuthForm(initialData, {
    formType: 'register',
    translations,
    language
  })

  // Translation helper - always call hook, but conditionally use result
  const translationHook = useTranslation(translations || {} as TranslationData)
  const t = translations ? translationHook.t : null
  const getText = (key: string, fallback: string) => t ? t(key) : fallback



  return (
    <div className={cn("space-y-6 md:space-y-8", className)}>
      <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
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
            onBlur={() => handleBlur('password')}
            error={errors.password}
            placeholder={getText('auth.placeholders.password', 'Enter password')}
            showStrengthMeter={true}
            showCapsLockWarning={true}
          />
        </div>

        {/* Confirm Password Field */}
        <div className="space-y-2 md:space-y-3">
          <Label htmlFor="confirmPassword" className="text-sm md:text-base">
            {getText('auth.labels.confirmPassword', 'Confirm Password')}
          </Label>
          <PasswordInput
            id="confirmPassword"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={(value) => handleInputChange('confirmPassword', value)}
            onBlur={() => handleBlur('confirmPassword')}
            error={errors.confirmPassword}
            showStrengthMeter={false}
            showCapsLockWarning={false}
            placeholder={getText('auth.placeholders.confirmPassword', 'Confirm password')}
          />
        </div>

        {/* Terms and Conditions */}
        <div className="space-y-2">
          <div className="flex items-center space-x-3">
            <Checkbox
              id="acceptTerms"
              checked={formData.acceptTerms}
              onCheckedChange={(checked) => handleCheckboxChange('acceptTerms', checked as boolean)}
              disabled={isLoading}
              className="flex-shrink-0"
            />
            <Label
              htmlFor="acceptTerms"
              className="text-xs md:text-sm font-normal cursor-pointer leading-tight flex-1"
            >
              <span className="block">
                {getText('auth.labels.agreeWith', 'Tôi đồng ý với')}{" "}
                <Button
                  type="button"
                  variant="link"
                  className="px-0 h-auto font-normal text-xs md:text-sm underline inline"
                  onClick={() => window.open("/terms", "_blank")}
                >
                  {getText('auth.links.terms', 'Điều khoản')}
                </Button>
                {" "}{getText('auth.labels.and', 'và')}{" "}
                <Button
                  type="button"
                  variant="link"
                  className="px-0 h-auto font-normal text-xs md:text-sm underline inline"
                  onClick={() => window.open("/privacy", "_blank")}
                >
                  {getText('auth.links.privacy', 'Chính sách bảo mật')}
                </Button>
              </span>
            </Label>
          </div>
          {errors.acceptTerms && (
            <p className="text-sm text-destructive ml-7">{errors.acceptTerms}</p>
          )}
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          className="w-full bg-primary h-10 md:h-12 text-sm md:text-base"
          disabled={isLoading}
        >
          {isLoading ? getText('auth.loading.register', 'Đang tạo tài khoản...') : getText('auth.buttons.register', 'Tạo tài khoản')}
        </Button>
      </form>

      {/* Social Login */}
      <SocialLogin
        onGoogleLogin={() => handleSocialLogin('Google')}
        isLoading={isLoading}
        translations={translations || {} as TranslationData}
      />

      {/* Switch to Login */}
      <div className="text-center">
        <p className="text-sm text-muted-foreground">
          {getText('auth.messages.hasAccount', 'Đã có tài khoản?')}{" "}
          <Button
            type="button"
            variant="link"
            className="px-0 font-medium"
            onClick={onSwitchToLogin}
            disabled={isLoading}
          >
            {getText('auth.messages.loginNow', 'Đăng nhập ngay')}
          </Button>
        </p>
      </div>
    </div>
  )
}
