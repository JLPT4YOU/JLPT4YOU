"use client"

import { Mail, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuthForm, ForgotPasswordFormData } from "@/hooks/use-auth-form"
import { TranslationData, Language } from "@/lib/i18n"
import { useTranslation } from "@/lib/use-translation"
import { cn } from "@/lib/utils"

interface ForgotPasswordFormProps {
  className?: string
  translations?: TranslationData
  language?: Language
}

export function ForgotPasswordForm({
  className,
  translations,
  language
}: ForgotPasswordFormProps) {
  const initialData: ForgotPasswordFormData = {
    email: ""
  }

  const {
    formData,
    errors,
    isLoading,
    isSuccess,
    handleInputChange,
    handleBlur,
    handleSubmit,
    handleResendEmail,
    navigateToLogin
  } = useAuthForm(initialData, {
    formType: 'forgotPassword',
    translations,
    language
  })

  const { t } = useTranslation(translations)



  if (isSuccess) {
    return (
      <div className={cn("space-y-6 md:space-y-8 text-center", className)}>
        {/* Success Icon */}
        <div className="flex justify-center">
          <div className="flex items-center justify-center w-16 h-16 rounded-full bg-success/10">
            <CheckCircle className="h-8 w-8 text-success" />
          </div>
        </div>

        {/* Success Message */}
        <div className="space-y-2">
          <h3 className="text-xl font-semibold text-foreground">
            {t('auth.forgotPassword.emailSent')}
          </h3>
          <p className="text-muted-foreground">
            {t('auth.forgotPassword.instructionsSent')}
          </p>
          <p className="font-medium text-foreground">{formData.email}</p>
        </div>

        {/* Instructions */}
        <div className="p-4 bg-muted/30 rounded-lg text-left">
          <div className="flex items-start app-gap-sm">
            <Mail className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
            <div className="space-y-2 text-sm">
              <p className="font-medium text-foreground">{t('auth.forgotPassword.checkEmail')}</p>
              <ul className="space-y-1 text-muted-foreground">
                <li>• {t('auth.forgotPassword.clickLink')}</li>
                <li>• {t('auth.forgotPassword.linkExpiry')}</li>
                <li>• {t('auth.forgotPassword.checkSpam')}</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <Button
            onClick={handleResendEmail}
            variant="outline"
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? t('auth.loading.resending') : t('auth.buttons.resendEmail')}
          </Button>


        </div>
      </div>
    )
  }

  return (
    <div className={cn("space-y-6 md:space-y-8", className)}>

      <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
        {/* General Error */}
        {errors.general && (
          <div className="p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md">
            {errors.general}
          </div>
        )}

        {/* Instructions */}
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            {t('auth.forgotPassword.instructions')}
          </p>
        </div>

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

        {/* Submit Button */}
        <Button
          type="submit"
          className="w-full bg-primary hover:bg-primary/90 h-10 md:h-12 text-sm md:text-base"
          disabled={isLoading}
        >
          {isLoading ? t('auth.loading.sending') : t('auth.buttons.sendResetInstructions')}
        </Button>
      </form>
    </div>
  )
}
