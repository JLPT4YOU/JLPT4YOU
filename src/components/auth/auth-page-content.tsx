"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { AuthLayoutWithLanguage } from "@/components/auth/auth-layout-with-language"
import { LoginForm } from "@/components/auth/login-form"
import { RegisterForm } from "@/components/auth/register-form"
import { TranslationData, Language, getLocalizedPath } from "@/lib/i18n"
import { useTranslation } from "@/lib/use-translation"

interface AuthPageContentProps {
  translations: TranslationData
  initialMode: 'login' | 'register'
  language: Language
}

export function AuthPageContent({ translations, initialMode, language }: AuthPageContentProps) {
  const searchParams = useSearchParams()
  const { t } = useTranslation(translations)
  const [mode, setMode] = useState<'login' | 'register'>(initialMode)

  // Check if user just registered
  useEffect(() => {
    const registered = searchParams.get('registered')
    if (registered === 'true') {
      setMode('login')
    }
  }, [searchParams])

  const handleSwitchToRegister = () => {
    setMode('register')
    const registerPath = getLocalizedPath('register', language)
    window.history.pushState({}, '', registerPath)
  }

  const handleSwitchToLogin = () => {
    setMode('login')
    const loginPath = getLocalizedPath('login', language)
    window.history.pushState({}, '', loginPath)
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
