/**
 * Auth Redirect Component
 * Redirects authenticated users away from auth pages
 */

"use client"

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { Loader2 } from 'lucide-react'

interface AuthRedirectProps {
  children: React.ReactNode
}

export function AuthRedirect({ children }: AuthRedirectProps) {
  const { user, loading } = useAuth() // ✅ FIXED: Use correct property names
  const router = useRouter()
  const pathname = usePathname()
  const [redirectTimeout, setRedirectTimeout] = useState(false)

  // ✅ FIXED: Derive authentication state from user
  const isAuthenticated = !!user
  const isLoading = loading

  // Check if current page is landing page
  const isLandingPage = pathname.includes('/landing')

  useEffect(() => {
    // Set timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      console.warn('Auth redirect timeout')
      setRedirectTimeout(true)
    }, 5000) // 5 second timeout

    // If user is authenticated and NOT on landing page, redirect to home
    if (!isLoading && isAuthenticated && !isLandingPage) {
      clearTimeout(timeoutId)
      router.replace('/home')
    } else if (redirectTimeout && !isLoading) {
      clearTimeout(timeoutId)
    }

    return () => {
      if (timeoutId) clearTimeout(timeoutId)
    }
  }, [isAuthenticated, isLoading, router, isLandingPage, redirectTimeout])

  // Show loading while checking auth (with timeout)
  if (isLoading && !redirectTimeout) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Đang kiểm tra trạng thái...</p>
        </div>
      </div>
    )
  }

  // If on landing page, always render children regardless of auth status
  if (isLandingPage) {
    return <>{children}</>
  }

  // If authenticated and not on landing page, show redirect message
  if (isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Đang chuyển hướng...</p>
        </div>
      </div>
    )
  }

  // Not authenticated, render children
  return <>{children}</>
}
