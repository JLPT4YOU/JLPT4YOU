import { redirect } from 'next/navigation'

// Redirect /auth to /auth/vn (Vietnamese default)
export default function AuthPage() {
  redirect('/auth/vn/login')
}

export const dynamic = 'force-static'
