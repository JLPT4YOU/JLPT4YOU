"use client"

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context-simple'
import { isProtectedRoute, setLoginRedirectUrl, getLoginUrl } from '@/lib/auth-utils'
import { Loader2 } from 'lucide-react'

interface ProtectedRouteProps {
  children: React.ReactNode
  fallback?: React.ReactNode
  requireAuth?: boolean
}

/**
 * Protected Route Component
 * Wraps components that require authentication
 * Automatically redirects to login if user is not authenticated
 */
export function ProtectedRoute({
  children,
  fallback,
  requireAuth = true
}: ProtectedRouteProps) {
  const { user, loading } = useAuth() // ✅ FIXED: Use correct property names
  const router = useRouter()
  const pathname = usePathname()
  const [isChecking, setIsChecking] = useState(true)
  const [authTimeout, setAuthTimeout] = useState(false)

  // ✅ FIXED: Derive authentication state from user
  const isAuthenticated = !!user
  const isLoading = loading

  // Only log in development
  if (process.env.NODE_ENV === 'development') {

  }

  useEffect(() => {
    let timeoutId: NodeJS.Timeout

    const checkAuth = async () => {
      // If we don't require auth, just render children
      if (!requireAuth) {
        setIsChecking(false)
        return
      }

      // Set timeout to prevent infinite loading
      timeoutId = setTimeout(() => {
        // Only log in development
        if (process.env.NODE_ENV === 'development') {
          console.warn('Auth check timeout - assuming not authenticated')
        }
        setAuthTimeout(true)
        setIsChecking(false)
      }, 8000) // 8 second timeout

      // If still loading auth state, wait
      if (isLoading && !authTimeout) {
        return
      }

      // Clear timeout if we get here
      if (timeoutId) clearTimeout(timeoutId)

      // Check if current route requires authentication
      const needsAuth = isProtectedRoute(pathname)

      if (needsAuth && (!isAuthenticated || authTimeout)) {
        // Save current URL for redirect after login
        setLoginRedirectUrl(pathname)

        // Get appropriate login URL based on current path
        const loginUrl = getLoginUrl(pathname)

        // Redirect to login
        router.replace(loginUrl)
        return
      }

      setIsChecking(false)
    }

    checkAuth()

    return () => {
      if (timeoutId) clearTimeout(timeoutId)
    }
  }, [isAuthenticated, isLoading, pathname, router, requireAuth, authTimeout])

  // Show loading state while checking authentication
  if ((isLoading && !authTimeout) || isChecking) {
    return fallback || <LoadingFallback />
  }

  // If we require auth but user is not authenticated, don't render anything
  // (redirect will happen in useEffect)
  if (requireAuth && (!isAuthenticated || authTimeout)) {
    return fallback || <LoadingFallback />
  }

  // Render children if authenticated or auth not required
  return <>{children}</>
}

/**
 * Default loading fallback component
 */
function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center app-gap-md">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Đang kiểm tra quyền truy cập...</p>
      </div>
    </div>
  )
}

/**
 * Higher-order component for protecting pages
 */
export function withAuth<P extends object>(
  Component: React.ComponentType<P>,
  options?: {
    fallback?: React.ReactNode
    requireAuth?: boolean
  }
) {
  const WrappedComponent = (props: P) => {
    return (
      <ProtectedRoute 
        fallback={options?.fallback}
        requireAuth={options?.requireAuth}
      >
        <Component {...props} />
      </ProtectedRoute>
    )
  }

  WrappedComponent.displayName = `withAuth(${Component.displayName || Component.name})`
  
  return WrappedComponent
}

/**
 * Hook to check if current route is protected
 */
export function useRouteProtection() {
  const pathname = usePathname()
  const { user, loading } = useAuth() // ✅ FIXED: Use correct property names

  // ✅ FIXED: Derive authentication state from user
  const isAuthenticated = !!user
  const isLoading = loading

  const isProtected = isProtectedRoute(pathname)
  const canAccess = !isProtected || isAuthenticated

  return {
    isProtected,
    canAccess,
    isLoading,
    needsRedirect: isProtected && !isAuthenticated && !isLoading
  }
}
