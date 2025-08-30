"use client"

import React from 'react'
import { Button } from '@/components/ui/button'
import { AlertTriangle, RefreshCw } from 'lucide-react'

interface TranslationErrorBoundaryState {
  hasError: boolean
  error?: Error
}

interface TranslationErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ComponentType<{ error?: Error; retry: () => void }>
}

export class TranslationErrorBoundary extends React.Component<
  TranslationErrorBoundaryProps,
  TranslationErrorBoundaryState
> {
  constructor(props: TranslationErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): TranslationErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Translation Error Boundary caught an error:', error, errorInfo)
  }

  retry = () => {
    this.setState({ hasError: false, error: undefined })
  }

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback || DefaultTranslationErrorFallback
      return <FallbackComponent error={this.state.error} retry={this.retry} />
    }

    return this.props.children
  }
}

// Default fallback component
function DefaultTranslationErrorFallback({ error, retry }: { error?: Error; retry: () => void }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="max-w-md w-full mx-4 text-center">
        <div className="bg-card border border-border rounded-lg p-6 shadow-sm">
          <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
          
          <h1 className="text-xl font-semibold text-foreground mb-2">
            Translation Error
          </h1>
          
          <p className="text-muted-foreground mb-4">
            We&apos;re having trouble loading the language content. This might be a temporary issue.
          </p>
          
          {error && (
            <details className="text-left mb-4">
              <summary className="text-sm text-muted-foreground cursor-pointer hover:text-foreground">
                Technical Details
              </summary>
              <pre className="text-xs text-muted-foreground mt-2 p-2 bg-muted rounded overflow-auto">
                {error.message}
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
              onClick={() => window.location.reload()} 
              className="w-full"
            >
              Reload Page
            </Button>
          </div>
          
          <p className="text-xs text-muted-foreground mt-4">
            If this problem persists, please contact support.
          </p>
        </div>
      </div>
    </div>
  )
}

// Hook for using translation error boundary
export function useTranslationErrorHandler() {
  const [error, setError] = React.useState<Error | null>(null)
  
  const handleError = React.useCallback((error: Error) => {
    console.error('Translation error:', error)
    setError(error)
  }, [])
  
  const clearError = React.useCallback(() => {
    setError(null)
  }, [])
  
  return { error, handleError, clearError }
}
