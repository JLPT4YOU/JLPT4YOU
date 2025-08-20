import { LandingPage as LandingPageComponent } from '@/components/landing'
import { loadTranslation, Language } from '@/lib/i18n'

interface LandingPageContentProps {
  language: Language
}

export async function LandingPageContent({ language }: LandingPageContentProps) {
  const translations = await loadTranslation(language)

  // Use original landing page with optimizations
  return <LandingPageComponent translations={translations} language={language} />
}
