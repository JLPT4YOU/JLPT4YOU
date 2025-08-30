"use client"

import React from 'react'
import { Button } from '@/components/ui/button'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface AuthErrorBoundaryState {
  hasError: boolean
  error?: Error
  errorInfo?: React.ErrorInfo
}

interface AuthErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ComponentType<{ error?: Error; retry: () => void; goHome: () => void }>
}

export class AuthErrorBoundary extends React.Component<
  AuthErrorBoundaryProps,
  AuthErrorBoundaryState
> {
  constructor(props: AuthErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): AuthErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Auth Error Boundary caught an error:', error, errorInfo)
    this.setState({ errorInfo })
  }

  retry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined })
  }

  goHome = () => {
    // ✅ FIXED: Clear any corrupted auth state - removed old custom cookie logic
    if (typeof window !== 'undefined') {
      localStorage.removeItem('jlpt4you_user_data')
      // Note: Supabase session cookies are now handled automatically by Supabase
    }
    window.location.href = '/'
  }

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback || DefaultAuthErrorFallback
      return <FallbackComponent error={this.state.error} retry={this.retry} goHome={this.goHome} />
    }

    return this.props.children
  }
}

// Default fallback component
function DefaultAuthErrorFallback({ 
  error, 
  retry, 
  goHome 
}: { 
  error?: Error
  retry: () => void
  goHome: () => void 
}) {
  const router = useRouter()

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="max-w-md w-full mx-4 text-center">
        <div className="bg-card border border-border rounded-lg p-6 shadow-sm">
          <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
          
          <h1 className="text-xl font-semibold text-foreground mb-2">
            Authentication Error
          </h1>
          
          <p className="text-muted-foreground mb-4">
            We encountered an issue with the authentication system. This might be a temporary problem.
          </p>
          
          {error && (
            <details className="text-left mb-4">
              <summary className="text-sm text-muted-foreground cursor-pointer hover:text-foreground">
                Technical Details
              </summary>
              <pre className="text-xs text-muted-foreground mt-2 p-2 bg-muted rounded overflow-auto max-h-32">
                {error.message}
                {error.stack && `\n\nStack trace:\n${error.stack.slice(0, 500)}...`}
              </pre>
            </details>
          )}
          
          <div className="space-y-2">
            <Button onClick={retry} className="w-full">
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
            
            <Button 
              variant="outline" 
              onClick={goHome} 
              className="w-full"
            >
              <Home className="h-4 w-4 mr-2" />
              Go to Home
            </Button>
            
            <Button 
              variant="ghost" 
              onClick={() => window.location.reload()} 
              className="w-full"
            >
              Reload Page
            </Button>
          </div>
          
          <p className="text-xs text-muted-foreground mt-4">
            If this problem persists, please contact support or try clearing your browser data.
          </p>
        </div>
      </div>
    </div>
  )
}

// HOC to wrap components with auth error boundary
export function withAuthErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: React.ComponentType<{ error?: Error; retry: () => void; goHome: () => void }>
) {
  return function WrappedComponent(props: P) {
    return (
      <AuthErrorBoundary fallback={fallback}>
        <Component {...props} />
      </AuthErrorBoundary>
    )
  }
}
