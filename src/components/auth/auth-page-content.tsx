"use client"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { AuthLayoutWithLanguage } from "@/components/auth/auth-layout-with-language"
import { LoginForm } from "@/components/auth/login-form"
import { RegisterForm } from "@/components/auth/register-form"
import { TranslationData, Language, getLocalizedPath } from "@/lib/i18n"
import { useTranslation } from "@/lib/use-translation"
import { setLanguagePreferenceFromPath } from "@/lib/auth-utils"

interface AuthPageContentProps {
  translations: TranslationData
  initialMode: 'login' | 'register'
  language: Language
}

function AuthPageContentInner({ translations, initialMode, language }: AuthPageContentProps) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { t } = useTranslation(translations)
  const [mode, setMode] = useState<'login' | 'register'>(initialMode)
  const [showRegistrationSuccess, setShowRegistrationSuccess] = useState(false)

  // Set language preference when component mounts
  useEffect(() => {
    setLanguagePreferenceFromPath(window.location.pathname)
  }, [language])

  // Check if user just registered
  useEffect(() => {
    const registered = searchParams.get('registered')
    const confirm = searchParams.get('confirm')
    if (registered === 'true') {
      setMode('login')
      setShowRegistrationSuccess(true)
      // Auto-hide after 5 seconds
      const timer = setTimeout(() => setShowRegistrationSuccess(false), 5000)
      return () => clearTimeout(timer)
    }
  }, [searchParams])

  // Registration success message
  const registrationSuccessMessage = showRegistrationSuccess ? (
    <div className="p-3 text-sm text-success-foreground bg-success/10 border border-success/20 rounded-md">
      {t('auth.messages.registrationSuccess') || 'Registration successful! Please check your email to confirm.'}
    </div>
  ) : null;

  const handleSwitchToRegister = () => {
    const registerPath = getLocalizedPath('register', language)
    router.push(registerPath)
  }

  const handleSwitchToLogin = () => {
    const loginPath = getLocalizedPath('login', language)
    router.push(loginPath)
  }

  const getTitle = () => {
    return mode === 'login' ? t('auth.titles.login') : t('auth.titles.register')
  }

  const getSubtitle = () => {
    return mode === 'login' ? t('auth.subtitles.login') : t('auth.subtitles.register')
  }

  return (
    <AuthLayoutWithLanguage
      translations={translations}
      language={language}
      title={getTitle()}
      subtitle={getSubtitle()}
    >
      {mode === 'login' ? (
        <LoginForm
          translations={translations}
          language={language}
          onSwitchToRegister={handleSwitchToRegister}
        />
      ) : (
        <RegisterForm
          translations={translations}
          language={language}
          onSwitchToLogin={handleSwitchToLogin}
        />
      )}
    </AuthLayoutWithLanguage>
  )
}

export function AuthPageContent(props: AuthPageContentProps) {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
      <AuthPageContentInner {...props} />
    </Suspense>
  )
}
