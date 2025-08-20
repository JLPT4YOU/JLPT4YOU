import { redirect } from 'next/navigation'
import { headers, cookies } from 'next/headers'
import { detectUserLanguage, generateLanguageRedirectUrl } from '@/lib/language-detection'

// i18n-friendly redirect for /login using existing language detection utils
export default async function LoginRedirect() {
  const hdrs = await headers()
  const cookieStore = await cookies()

  const detectedLanguage = detectUserLanguage({
    acceptLanguageHeader: hdrs.get('accept-language') || undefined,
    cookieValue: cookieStore.get('preferred-language')?.value,
    pathname: '/login',
  })

  const target = generateLanguageRedirectUrl('login', detectedLanguage)
  redirect(target)
}

export const dynamic = 'force-dynamic'
