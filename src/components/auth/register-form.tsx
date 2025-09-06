"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { PasswordInput } from "./password-input"
import { SocialLogin } from "./social-login"
import { useAuthForm, RegisterFormData } from "@/hooks/use-auth-form"
import { TranslationData, Language } from "@/lib/i18n/"
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

  const { t } = useTranslation(translations || ({} as TranslationData))



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
            {t('auth.labels.email')}
          </Label>
          <Input
            id="email"
            name="email"
            type="email"
            value={formData.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
            onBlur={() => handleBlur('email')}
            placeholder={t('auth.placeholders.email')}
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
            {t('auth.labels.password')}
          </Label>
          <PasswordInput
            id="password"
            name="password"
            value={formData.password}
            onChange={(value) => handleInputChange('password', value)}
            onBlur={() => handleBlur('password')}
            error={errors.password}
            placeholder={t('auth.placeholders.password')}
            showStrengthMeter={true}
            showCapsLockWarning={true}
          />
        </div>

        {/* Confirm Password Field */}
        <div className="space-y-2 md:space-y-3">
          <Label htmlFor="confirmPassword" className="text-sm md:text-base">
            {t('auth.labels.confirmPassword')}
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
            placeholder={t('auth.placeholders.confirmPassword')}
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
                {t('auth.labels.agreeWith')}{" "}
                <Button
                  type="button"
                  variant="link"
                  className="px-0 h-auto font-normal text-xs md:text-sm underline inline"
                  onClick={() => window.open("/terms", "_blank")}
                >
                  {t('auth.links.terms')}
                </Button>
                {" "}{t('auth.labels.and')}{" "}
                <Button
                  type="button"
                  variant="link"
                  className="px-0 h-auto font-normal text-xs md:text-sm underline inline"
                  onClick={() => window.open("/privacy", "_blank")}
                >
                  {t('auth.links.privacy')}
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
          {isLoading ? t('auth.loading.register') : t('auth.buttons.register')}
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
          {t('auth.messages.hasAccount')}{" "}
          <Button
            type="button"
            variant="link"
            className="px-0 font-medium"
            onClick={onSwitchToLogin}
            disabled={isLoading}
          >
            {t('auth.messages.loginNow')}
          </Button>
        </p>
      </div>
    </div>
  )
}
