"use client"

import { AuthLayout } from "@/components/auth/auth-layout"
import { LanguageSwitcher } from "@/components/language-switcher"
import { TranslationData, Language } from "@/lib/i18n/"

interface AuthLayoutWithLanguageProps {
  children: React.ReactNode
  translations: TranslationData
  language: Language
  title: string
  subtitle: string
}

export function AuthLayoutWithLanguage({
  children,
  translations,
  language, // eslint-disable-line @typescript-eslint/no-unused-vars
  title,
  subtitle
}: AuthLayoutWithLanguageProps) {
  const languageSwitcher = (
    <LanguageSwitcher 
      variant="compact"
      className="bg-background/80 backdrop-blur-sm rounded-lg border border-border/50 shadow-sm"
    />
  )

  return (
    <AuthLayout 
      title={title} 
      subtitle={subtitle} 
      translations={translations}
      languageSwitcher={languageSwitcher}
    >
      {children}
    </AuthLayout>
  )
}
