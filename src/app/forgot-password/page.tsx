import { redirect } from 'next/navigation'

// Redirect /forgot-password to /auth/vn/forgot-password (Vietnamese default)
export default function ForgotPasswordRedirect() {
  redirect('/auth/vn/forgot-password')
}

export const dynamic = 'force-static'
