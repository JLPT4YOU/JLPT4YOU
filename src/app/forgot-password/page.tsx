import { redirect } from 'next/navigation'
import { headers } from 'next/headers'

// Redirect /forgot-password to appropriate /auth/[lang]/forgot-password based on user language
export default async function ForgotPasswordRedirect() {
  // Detect language from request headers
  const headersList = await headers()
  const acceptLanguage = headersList.get('accept-language') || ''
  
  let lang = 'vn' // default
  if (acceptLanguage.includes('ja')) {
    lang = 'jp'
  } else if (acceptLanguage.includes('en')) {
    lang = 'en'
  }
  
  redirect(`/auth/${lang}/forgot-password`)
}

export const dynamic = 'force-static'
