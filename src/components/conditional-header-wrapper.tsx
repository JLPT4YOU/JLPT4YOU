"use client"

import { usePathname } from "next/navigation"

interface ConditionalHeaderWrapperProps {
  children: React.ReactNode
}

export function ConditionalHeaderWrapper({ children }: ConditionalHeaderWrapperProps) {
  const pathname = usePathname()

  // Check if current route should hide header
  const shouldHideHeader = () => {
    // Hide header for all auth-related routes
    if (pathname.startsWith('/auth/')) {
      return true
    }

    // Hide header for iRIN chat interface (full-screen chat experience)
    if (pathname === '/irin') {
      return true
    }

    // Hide header for redirect routes (backward compatibility)
    const redirectRoutes = [
      '/login',
      '/register',
      '/forgot-password',
      '/landing'
    ]

    if (redirectRoutes.includes(pathname)) {
      return true
    }

    // Hide header for old language-specific routes (if any remain)
    const oldLangRoutes = [
      '/en/landing',
      '/jp/landing',
      '/vn/landing',
      '/en/login',
      '/jp/login',
      '/vn/login',
      '/en/register',
      '/jp/register',
      '/vn/register',
      '/en/forgot-password',
      '/jp/forgot-password',
      '/vn/forgot-password'
    ]

    if (oldLangRoutes.includes(pathname)) {
      return true
    }

    return false
  }

  // Don't render header for auth pages and landing
  if (shouldHideHeader()) {
    return null
  }

  // Render header for all other pages (after successful login)
  return <>{children}</>
}
