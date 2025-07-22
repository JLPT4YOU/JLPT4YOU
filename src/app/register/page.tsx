import { redirect } from 'next/navigation'

// Redirect /register to /auth/vn/register (Vietnamese default)
export default function RegisterRedirect() {
  redirect('/auth/vn/register')
}

export const dynamic = 'force-static'
