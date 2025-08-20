import { redirect } from 'next/navigation'

// Consolidated: redirect /login to Vietnamese login by default for consistency
// Note: language switcher on auth page allows changing language immediately
export default function LoginRedirect() {
  redirect('/auth/vn/login')
}

export const dynamic = 'force-static'
