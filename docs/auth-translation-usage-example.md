# 🌐 Auth Translation Usage Examples

## Overview
This document shows how to use the new authentication translation keys in your components.

## Example Usage in Login Form

```tsx
// src/components/auth/login-form.tsx
import { useTranslation } from '@/lib/use-translation'
import { TranslationData } from '@/lib/i18n'

interface LoginFormProps {
  translations: TranslationData
  onSwitchToRegister: () => void
}

export function LoginForm({ translations, onSwitchToRegister }: LoginFormProps) {
  const { t } = useTranslation(translations)
  
  // Validation function using translations
  const validateField = (name: string, value: string) => {
    switch (name) {
      case 'email':
        if (!value) return t('auth.validation.emailRequired')
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          return t('auth.validation.emailInvalid')
        }
        return ""
      case 'password':
        if (!value) return t('auth.validation.passwordRequired')
        if (value.length < 8) return t('auth.validation.passwordTooShort')
        return ""
      default:
        return ""
    }
  }

  return (
    <div className="space-y-6">
      {/* Email Field */}
      <div className="space-y-2">
        <Label htmlFor="email">{t('auth.labels.email')}</Label>
        <Input
          id="email"
          type="email"
          placeholder={t('auth.placeholders.email')}
          // ... other props
        />
      </div>

      {/* Password Field */}
      <div className="space-y-2">
        <Label htmlFor="password">{t('auth.labels.password')}</Label>
        <PasswordInput
          id="password"
          placeholder={t('auth.placeholders.password')}
          // ... other props
        />
      </div>

      {/* Submit Button */}
      <Button type="submit" disabled={isLoading}>
        {isLoading ? t('auth.loading.login') : t('auth.buttons.login')}
      </Button>

      {/* Switch to Register */}
      <div className="text-center">
        <p className="text-sm text-muted-foreground">
          {t('auth.messages.noAccount')}{" "}
          <Button
            type="button"
            variant="link"
            onClick={onSwitchToRegister}
          >
            {t('auth.messages.signUpNow')}
          </Button>
        </p>
      </div>
    </div>
  )
}
```

## Example Usage in Register Form

```tsx
// src/components/auth/register-form.tsx
export function RegisterForm({ translations, onSwitchToLogin }: RegisterFormProps) {
  const { t } = useTranslation(translations)
  
  // Validation with translations
  const validateField = useCallback((name: string, value: string | boolean) => {
    switch (name) {
      case 'email':
        if (!value) return t('auth.validation.emailRequired')
        if (typeof value === 'string' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          return t('auth.validation.emailInvalid')
        }
        return ""
      case 'password':
        if (!value) return t('auth.validation.passwordRequired')
        if (typeof value === 'string' && value.length < 8) {
          return t('auth.validation.passwordTooShort')
        }
        return ""
      case 'confirmPassword':
        if (!value) return t('auth.validation.confirmPasswordRequired')
        if (typeof value === 'string' && value !== formData.password) {
          return t('auth.validation.passwordMismatch')
        }
        return ""
      case 'acceptTerms':
        if (!value) return t('auth.validation.termsRequired')
        return ""
      default:
        return ""
    }
  }, [formData.password, t])

  return (
    <div className="space-y-6">
      {/* Confirm Password Field */}
      <div className="space-y-2">
        <Label htmlFor="confirmPassword">{t('auth.labels.confirmPassword')}</Label>
        <PasswordInput
          id="confirmPassword"
          placeholder={t('auth.placeholders.confirmPassword')}
          // ... other props
        />
      </div>

      {/* Terms Checkbox */}
      <div className="flex items-start space-x-2">
        <Checkbox
          id="acceptTerms"
          checked={formData.acceptTerms}
          // ... other props
        />
        <Label htmlFor="acceptTerms" className="text-sm">
          {t('auth.labels.acceptTerms')}
        </Label>
      </div>

      {/* Submit Button */}
      <Button type="submit" disabled={isLoading}>
        {isLoading ? t('auth.loading.register') : t('auth.buttons.register')}
      </Button>

      {/* Switch to Login */}
      <div className="text-center">
        <p className="text-sm text-muted-foreground">
          {t('auth.messages.hasAccount')}{" "}
          <Button
            type="button"
            variant="link"
            onClick={onSwitchToLogin}
          >
            {t('auth.messages.loginNow')}
          </Button>
        </p>
      </div>
    </div>
  )
}
```

## Example Usage in Auth Pages

```tsx
// src/app/(auth)/login/page.tsx
export default async function LoginPage() {
  const translations = await loadTranslation('vn') // or get from URL
  const { t } = useTranslation(translations)

  return (
    <AuthLayout 
      title={t('auth.titles.login')} 
      subtitle={t('auth.subtitles.login')}
    >
      <LoginForm 
        translations={translations}
        onSwitchToRegister={() => router.push('/register')} 
      />
    </AuthLayout>
  )
}
```

## Available Translation Keys

### Titles & Subtitles
- `auth.titles.login` - "Đăng nhập" / "Login" / "ログイン"
- `auth.titles.register` - "Tạo tài khoản" / "Create Account" / "アカウント作成"
- `auth.subtitles.login` - Welcome messages
- `auth.subtitles.register` - Journey start messages

### Form Labels & Placeholders
- `auth.labels.email` - "Email" / "Email" / "メールアドレス"
- `auth.labels.password` - "Mật khẩu" / "Password" / "パスワード"
- `auth.placeholders.email` - Input placeholder texts

### Validation Messages
- `auth.validation.emailRequired` - "Email là bắt buộc" / "Email is required" / "メールアドレスは必須です"
- `auth.validation.emailInvalid` - Invalid email messages
- `auth.validation.passwordTooShort` - Password length requirements

### Loading States
- `auth.loading.login` - "Đang đăng nhập..." / "Logging in..." / "ログイン中..."
- `auth.loading.register` - "Đang tạo tài khoản..." / "Creating account..." / "アカウント作成中..."

### Messages & Links
- `auth.messages.noAccount` - "Chưa có tài khoản?" / "Don't have an account?" / "アカウントをお持ちでない場合"
- `auth.messages.signUpNow` - "Đăng ký ngay" / "Sign up now" / "今すぐ登録"
