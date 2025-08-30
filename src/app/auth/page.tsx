import { redirect } from 'next/navigation'
import { headers } from 'next/headers'

// Redirect /auth to appropriate language login page
export default async function AuthPage() {
  // Get the request headers to check for language preference
  const headersList = await headers()
  const acceptLanguage = headersList.get('accept-language') || ''
  
  // Determine language based on Accept-Language header
  let language = 'vn' // Default to Vietnamese
  if (acceptLanguage.includes('ja')) {
    language = 'jp'
  } else if (acceptLanguage.includes('en')) {
    language = 'en'
  }
  
  // Redirect to the appropriate language login page
  redirect(`/auth/${language}/login`)
}

export const dynamic = 'force-dynamic'
