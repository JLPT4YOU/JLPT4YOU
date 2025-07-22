"use client"

import { ArrowLeft, Mail, CheckCircle } from "lucide-react"
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

  // Translation helper - always call hook, but conditionally use result
  const translationHook = useTranslation(translations || {} as TranslationData)
  const t = translations ? translationHook.t : null
  const getText = (key: string, fallback: string) => t ? t(key) : fallback



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
            {getText('auth.forgotPassword.emailSent', 'Email sent!')}
          </h3>
          <p className="text-muted-foreground">
            {getText('auth.forgotPassword.instructionsSent', 'We have sent password reset instructions to your email:')}
          </p>
          <p className="font-medium text-foreground">{formData.email}</p>
        </div>

        {/* Instructions */}
        <div className="p-4 bg-muted/30 rounded-lg text-left">
          <div className="flex items-start app-gap-sm">
            <Mail className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
            <div className="space-y-2 text-sm">
              <p className="font-medium text-foreground">{getText('auth.forgotPassword.checkEmail', 'Kiểm tra email của bạn:')}</p>
              <ul className="space-y-1 text-muted-foreground">
                <li>• {getText('auth.forgotPassword.clickLink', 'Nhấn vào liên kết trong email để đặt lại mật khẩu')}</li>
                <li>• {getText('auth.forgotPassword.linkExpiry', 'Liên kết có hiệu lực trong 15 phút')}</li>
                <li>• {getText('auth.forgotPassword.checkSpam', 'Kiểm tra cả thư mục spam nếu không thấy email')}</li>
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
            {isLoading ? getText('auth.loading.resending', 'Đang gửi lại...') : getText('auth.buttons.resendEmail', 'Gửi lại email')}
          </Button>
          
          <Button
            onClick={navigateToLogin}
            variant="ghost"
            className="w-full"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {getText('auth.buttons.backToLogin', 'Quay lại đăng nhập')}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className={cn("space-y-6 md:space-y-8", className)}>
      {/* Back Button */}
      <Button
        onClick={navigateToLogin}
        variant="ghost"
        className="p-0 h-auto font-normal text-sm md:text-base"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        {getText('auth.buttons.backToLogin', 'Quay lại đăng nhập')}
      </Button>

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
            {getText('auth.forgotPassword.instructions', 'Nhập email của bạn và chúng tôi sẽ gửi hướng dẫn đặt lại mật khẩu.')}
          </p>
        </div>

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
            placeholder={getText('auth.placeholders.email', 'Nhập email của bạn')}
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
          {isLoading ? getText('auth.loading.sending', 'Đang gửi...') : getText('auth.buttons.sendResetInstructions', 'Gửi hướng dẫn đặt lại mật khẩu')}
        </Button>
      </form>
    </div>
  )
}
