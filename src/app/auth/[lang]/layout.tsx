import { AuthRedirect } from '@/components/auth/auth-redirect'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <AuthRedirect>{children}</AuthRedirect>
}
