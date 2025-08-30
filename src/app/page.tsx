import { headers } from 'next/headers'
import { detectUserLanguage } from '@/lib/language-detection'
import { LandingPageContent } from '@/components/landing/landing-page-content'

// Root page - serve landing content directly to avoid redirects
export default async function RootPage() {
  const headersList = await headers()
  const acceptLanguage = headersList.get('accept-language')

  // Detect user's preferred language
  const preferredLanguage = detectUserLanguage({
    acceptLanguageHeader: acceptLanguage || undefined
  })

  // Serve landing content directly instead of redirecting
  return <LandingPageContent language={preferredLanguage} />
}

// Enable static generation for better performance
export const dynamic = 'force-static'


