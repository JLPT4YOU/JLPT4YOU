"use client"

import React, { Component, ErrorInfo, ReactNode } from 'react'
import { AlertCircle, RefreshCw, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
}

interface State {
  hasError: boolean
  error?: Error
  errorInfo?: ErrorInfo
  retryCount: number
}

export class PDFErrorBoundary extends Component<Props, State> {
  private maxRetries = 3

  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      retryCount: 0
    }
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Only log errors in development
    if (process.env.NODE_ENV === 'development') {
      console.error('PDF Error Boundary caught an error:', error, errorInfo)
    }

    this.setState({
      error,
      errorInfo
    })

    // Call optional error handler
    this.props.onError?.(error, errorInfo)

    // Log to monitoring service if available
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'exception', {
        description: `PDF Error: ${error.message}`,
        fatal: false
      })
    }
  }

  handleRetry = () => {
    if (this.state.retryCount < this.maxRetries) {
      this.setState(prevState => ({
        hasError: false,
        error: undefined,
        errorInfo: undefined,
        retryCount: prevState.retryCount + 1
      }))
    }
  }

  handleGoBack = () => {
    if (typeof window !== 'undefined') {
      window.history.back()
    }
  }

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback
      }

      // Default error UI
      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <div className="max-w-md w-full text-center space-y-6">
            <div className="flex justify-center">
              <AlertCircle className="h-16 w-16 text-destructive" />
            </div>
            
            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-foreground">
                Lỗi tải PDF
              </h1>
              <p className="text-muted-foreground">
                Đã xảy ra lỗi khi tải tài liệu PDF. Vui lòng thử lại hoặc quay lại trang trước.
              </p>
            </div>

            {/* Error details in development */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="text-left bg-muted p-4 rounded-lg">
                <summary className="cursor-pointer font-medium text-sm">
                  Chi tiết lỗi (Development)
                </summary>
                <pre className="mt-2 text-xs overflow-auto">
                  {this.state.error.message}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              {this.state.retryCount < this.maxRetries && (
                <Button 
                  onClick={this.handleRetry}
                  className="flex items-center gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  Thử lại ({this.maxRetries - this.state.retryCount} lần còn lại)
                </Button>
              )}
              
              <Button 
                variant="outline" 
                onClick={this.handleGoBack}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Quay lại
              </Button>
            </div>

            {this.state.retryCount >= this.maxRetries && (
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
                <p className="text-sm text-destructive">
                  Đã thử lại {this.maxRetries} lần nhưng vẫn gặp lỗi. 
                  Vui lòng liên hệ hỗ trợ kỹ thuật.
                </p>
              </div>
            )}
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

// Wrapper component for easier usage
interface PDFErrorWrapperProps {
  children: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
}

export function PDFErrorWrapper({ children, onError }: PDFErrorWrapperProps) {
  return (
    <PDFErrorBoundary onError={onError}>
      {children}
    </PDFErrorBoundary>
  )
}

// Hook for error reporting
export function usePDFErrorReporting() {
  const reportError = (error: Error, context?: string) => {
    // Only log errors in development
    if (process.env.NODE_ENV === 'development') {
      console.error(`PDF Error${context ? ` in ${context}` : ''}:`, error)
    }

    // Report to monitoring service
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'exception', {
        description: `PDF Error${context ? ` in ${context}` : ''}: ${error.message}`,
        fatal: false
      })
    }
  }

  return { reportError }
}
