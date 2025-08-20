import { redirect } from 'next/navigation'
import { headers } from 'next/headers'

// Redirect /register to appropriate /auth/[lang]/register based on user language
export default async function RegisterRedirect() {
  // Detect language from request headers
  const headersList = await headers()
  const acceptLanguage = headersList.get('accept-language') || ''
  
  let lang = 'vn' // default
  if (acceptLanguage.includes('ja')) {
    lang = 'jp'
  } else if (acceptLanguage.includes('en')) {
    lang = 'en'
  }
  
  redirect(`/auth/${lang}/register`)
}

export const dynamic = 'force-static'
