import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { detectUserLanguage, generateLanguageRedirectUrl } from '@/lib/language-detection'

// Handle /lang/landing route - redirect to appropriate language
export default async function LangLandingRedirect() {
  const headersList = await headers()
  const acceptLanguage = headersList.get('accept-language')
  
  // Detect user's preferred language
  const preferredLanguage = detectUserLanguage({
    acceptLanguageHeader: acceptLanguage || undefined
  })
  
  // Generate redirect URL with detected language
  const redirectUrl = generateLanguageRedirectUrl('landing', preferredLanguage)
  
  redirect(redirectUrl)
}

// Enable dynamic rendering for language detection
export const dynamic = 'force-dynamic'
