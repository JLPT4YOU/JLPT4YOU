import { notFound } from "next/navigation"
import { loadTranslation, Language } from '@/lib/i18n'
import { AuthLayoutWithLanguage } from "@/components/auth/auth-layout-with-language"
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form"
import { getLanguageFromCode } from '@/lib/page-utils-core'

interface ForgotPasswordPageProps {
  params: Promise<{
    lang: string
  }>
}



export default async function ForgotPasswordPage({ params }: ForgotPasswordPageProps) {
  const { lang } = await params
  const language = getLanguageFromCode(lang)
  
  if (!language) {
    notFound()
  }

  const translations = await loadTranslation(language)

  return (
    <AuthLayoutWithLanguage
      translations={translations}
      language={language}
      title={translations.auth.titles.forgotPassword}
      subtitle={translations.auth.subtitles.forgotPassword}
    >
      <ForgotPasswordForm translations={translations} language={language} />
    </AuthLayoutWithLanguage>
  )
}

// Generate static params for all language codes (SEO-friendly)
export async function generateStaticParams() {
  return [
    { lang: 'vn' }, // Vietnamese (primary)
    { lang: 'jp' }, // Japanese (primary)
    { lang: 'en' }, // English (primary)
    { lang: '1' },  // Vietnamese (backward compatibility)
    { lang: '2' },  // Japanese (backward compatibility)
    { lang: '3' }   // English (backward compatibility)
  ]
}

// Enable static generation
export const dynamic = 'force-static'
