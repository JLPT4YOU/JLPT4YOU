import { notFound } from "next/navigation"
import { LandingPage as LandingPageComponent } from '@/components/landing'
import { loadTranslation, Language } from '@/lib/i18n'
import { getLanguageFromCode } from '@/lib/page-utils-core'
import { generateLanguageStaticParams } from '@/lib/shared/static-params-utils'
import { createMetadataGenerator } from '@/lib/protected-page-utils'

interface LandingPageProps {
  params: Promise<{
    lang: string
  }>
}

// Generate metadata with localized titles and SEO
export const generateMetadata = createMetadataGenerator(
  'landing.page.title',
  'landing.page.subtitle',
  '/landing'
)



export default async function LandingPage({ params }: LandingPageProps) {
  const { lang } = await params
  const language = getLanguageFromCode(lang)
  
  if (!language) {
    notFound()
  }

  const translations = await loadTranslation(language)

  return <LandingPageComponent translations={translations} language={language} />
}

// Generate static params for all language codes (SEO-friendly)
export async function generateStaticParams() {
  return generateLanguageStaticParams()
}

// Enable static generation
export const dynamic = 'force-static'
