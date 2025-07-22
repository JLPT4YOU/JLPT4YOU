import { redirect } from 'next/navigation'

// Redirect /login to /auth/vn/login (Vietnamese default)
export default function LoginRedirect() {
  redirect('/auth/vn/login')
}

export const dynamic = 'force-static'
