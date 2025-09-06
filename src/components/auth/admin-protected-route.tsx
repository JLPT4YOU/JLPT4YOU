"use client"

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { useUserData } from '@/hooks/use-user-data' // ✅ ADDED: Import user data hook
import { getLoginUrl } from '@/lib/auth-utils'
import { Loader2 } from 'lucide-react' // ✅ ADDED: Import Loader2

interface AdminProtectedRouteProps {
  children: React.ReactNode
}

export function AdminProtectedRoute({ children }: AdminProtectedRouteProps) {
  const { user, loading } = useAuth() // ✅ FIXED: Use correct property names
  const { userData, loading: userDataLoading } = useUserData() // ✅ ADDED: Get user data with role
  const router = useRouter()

  // ✅ FIXED: Derive authentication state from user
  const isAuthenticated = !!user
  const isLoading = loading || userDataLoading

  useEffect(() => {
    // Wait for auth to load
    if (isLoading) return

    // If not authenticated, redirect to login
    if (!isAuthenticated) {
      router.push(getLoginUrl()) // Use dynamic language-aware auth URL
      return
    }

    // If authenticated but not Admin, redirect to home
    if (userData && userData.role !== 'Admin') { // ✅ FIXED: Use userData.role instead of user.role
      router.push('/home')
      return
    }
  }, [isAuthenticated, isLoading, userData, router]) // ✅ FIXED: Updated dependencies

  // Show loading while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Đang kiểm tra quyền truy cập...</p>
        </div>
      </div>
    )
  }

  // Don't render anything if not authenticated or not admin
  if (!isAuthenticated || !user || userData?.role !== 'Admin') { // Only Admin users have admin access
    return null
  }

  // Render children if user is Admin
  return <>{children}</>
}
