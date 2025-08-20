import { Suspense } from "react"
import { notFound } from "next/navigation"
import { loadTranslation, Language } from '@/lib/i18n'
import { AuthPageContent } from "@/components/auth/auth-page-content"
import { getLanguageFromCode } from '@/lib/page-utils-core'

interface RegisterPageProps {
  params: Promise<{
    lang: string
  }>
}



export default async function RegisterPage({ params }: RegisterPageProps) {
  const { lang } = await params
  const language = getLanguageFromCode(lang)
  
  if (!language) {
    notFound()
  }

  const translations = await loadTranslation(language)

  return (
    <Suspense fallback={<div>{translations.common.loading}</div>}>
      <AuthPageContent
        translations={translations}
        initialMode="register"
        language={language}
      />
    </Suspense>
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
