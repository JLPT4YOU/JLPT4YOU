'use client'

/**
 * ✅ ENHANCED SESSION ERROR BOUNDARY
 * Provides comprehensive error handling for session-related issues
 * Features: Automatic recovery, retry logic, graceful fallbacks, user-friendly UI
 */

import { Component, ReactNode, ErrorInfo } from 'react'
import { SessionRecovery } from '@/lib/session-recovery'
import { SessionStorage } from '@/lib/session-storage'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  maxRecoveryAttempts?: number
  enableAutoRecovery?: boolean
  onError?: (error: Error, errorInfo: ErrorInfo) => void
  onRecoverySuccess?: (method: string) => void
  onRecoveryFailure?: (error: string) => void
}

interface State {
  hasError: boolean
  isRecovering: boolean
  recoveryAttempts: number
  lastError: Error | null
  recoveryMethod: string | null
  showDetails: boolean
}

export class SessionErrorBoundary extends Component<Props, State> {
  private recoveryTimer: NodeJS.Timeout | null = null

  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      isRecovering: false,
      recoveryAttempts: 0,
      lastError: null,
      recoveryMethod: null,
      showDetails: false
    }
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Check if this is a session-related error
    const isSessionError = SessionErrorBoundary.isSessionRelatedError(error)
    
    if (isSessionError) {
      console.error('🚨 [SessionErrorBoundary] Session error detected:', error.message)
      return { 
        hasError: true, 
        lastError: error,
        isRecovering: false 
      }
    }
    
    // Not a session error, don't handle it
    return {}
  }

  async componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const isSessionError = SessionErrorBoundary.isSessionRelatedError(error)
    
    if (!isSessionError) {
      // Re-throw non-session errors
      throw error
    }

    console.error('🚨 [SessionErrorBoundary] Session error caught:', error, errorInfo)
    
    // Call error callback if provided
    this.props.onError?.(error, errorInfo)
    
    // Start automatic recovery if enabled and within retry limits
    if (
      this.props.enableAutoRecovery !== false && 
      this.state.recoveryAttempts < (this.props.maxRecoveryAttempts || 3)
    ) {
      this.startRecovery()
    }
  }

  /**
   * ✅ UTILITY: Check if error is session-related
   */
  private static isSessionRelatedError(error: Error): boolean {
    const sessionErrorPatterns = [
      /session/i,
      /auth/i,
      /token/i,
      /unauthorized/i,
      /forbidden/i,
      /expired/i,
      /invalid.*credentials/i,
      /supabase.*auth/i,
      /jwt/i
    ]

    const errorMessage = error.message.toLowerCase()
    const errorStack = error.stack?.toLowerCase() || ''
    
    return sessionErrorPatterns.some(pattern => 
      pattern.test(errorMessage) || pattern.test(errorStack)
    )
  }

  /**
   * ✅ RECOVERY: Start automatic session recovery
   */
  private async startRecovery() {
    if (this.state.isRecovering) {
      return // Already recovering
    }


    
    this.setState({ 
      isRecovering: true,
      recoveryAttempts: this.state.recoveryAttempts + 1
    })

    try {
      const recoveryResult = await SessionRecovery.recoverSession({
        maxRetries: 2,
        retryDelay: 1000,
        logRecovery: true
      })

      if (recoveryResult.success) {

        
        this.props.onRecoverySuccess?.(recoveryResult.method || 'unknown')
        
        this.setState({
          hasError: false,
          isRecovering: false,
          recoveryMethod: recoveryResult.method || null,
          lastError: null
        })

        // Reload the page to apply recovered session
        this.schedulePageReload(1000)
      } else {

        
        this.props.onRecoveryFailure?.(recoveryResult.error || 'Unknown error')
        
        this.setState({
          isRecovering: false,
          recoveryMethod: null
        })

        // Try again after delay if within retry limits
        if (this.state.recoveryAttempts < (this.props.maxRecoveryAttempts || 3)) {
          this.scheduleRetry(3000) // 3 second delay
        }
      }
    } catch (error) {
      console.error('❌ [SessionErrorBoundary] Recovery exception:', error)
      
      this.props.onRecoveryFailure?.(error instanceof Error ? error.message : 'Recovery failed')
      
      this.setState({
        isRecovering: false,
        recoveryMethod: null
      })
    }
  }

  /**
   * ✅ UTILITY: Schedule page reload after successful recovery
   */
  private schedulePageReload(delay: number) {
    this.recoveryTimer = setTimeout(() => {

      window.location.reload()
    }, delay)
  }

  /**
   * ✅ UTILITY: Schedule retry attempt
   */
  private scheduleRetry(delay: number) {
    this.recoveryTimer = setTimeout(() => {
      this.startRecovery()
    }, delay)
  }

  /**
   * ✅ MANUAL: Manual recovery trigger
   */
  private handleManualRecovery = async () => {
    await this.startRecovery()
  }

  /**
   * ✅ MANUAL: Force cleanup and redirect to login
   */
  private handleForceLogin = async () => {

    
    try {
      await SessionRecovery.forceCleanup()
      
      // Redirect to login page
      window.location.href = '/auth/login'
    } catch (error) {
      console.error('❌ [SessionErrorBoundary] Force cleanup failed:', error)
      // Still redirect to login
      window.location.href = '/auth/login'
    }
  }

  /**
   * ✅ MANUAL: Toggle error details
   */
  private toggleDetails = () => {
    this.setState({ showDetails: !this.state.showDetails })
  }

  /**
   * ✅ CLEANUP: Component cleanup
   */
  componentWillUnmount() {
    if (this.recoveryTimer) {
      clearTimeout(this.recoveryTimer)
    }
  }

  render() {
    if (!this.state.hasError) {
      return this.props.children
    }

    // Show custom fallback if provided
    if (this.props.fallback) {
      return this.props.fallback
    }

    // Show recovery UI
    if (this.state.isRecovering) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-card rounded-lg border p-6 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold mb-2">Đang khôi phục phiên đăng nhập...</h2>
            <p className="text-muted-foreground mb-4">
              Lần thử {this.state.recoveryAttempts}/{this.props.maxRecoveryAttempts || 3}
            </p>
            <div className="text-sm text-muted-foreground">
              Vui lòng đợi trong giây lát...
            </div>
          </div>
        </div>
      )
    }

    // Show error UI with recovery options
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-card rounded-lg border p-6">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-destructive" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold mb-2">Phiên đăng nhập gặp sự cố</h2>
            <p className="text-muted-foreground mb-4">
              Đã xảy ra lỗi với phiên đăng nhập của bạn. Chúng tôi có thể thử khôi phục tự động hoặc bạn có thể đăng nhập lại.
            </p>
          </div>

          <div className="space-y-3">
            <button
              onClick={this.handleManualRecovery}
              disabled={this.state.isRecovering}
              className="w-full px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              🔄 Thử khôi phục lại
            </button>
            
            <button
              onClick={this.handleForceLogin}
              className="w-full px-4 py-2 bg-secondary text-secondary-foreground rounded hover:bg-secondary/90"
            >
              🔑 Đăng nhập lại
            </button>
          </div>

          {/* Recovery attempts info */}
          {this.state.recoveryAttempts > 0 && (
            <div className="mt-4 p-3 bg-muted rounded text-sm">
              <div className="flex items-center justify-between">
                <span>Số lần thử khôi phục:</span>
                <span className="font-medium">{this.state.recoveryAttempts}/{this.props.maxRecoveryAttempts || 3}</span>
              </div>
              {this.state.recoveryMethod && (
                <div className="flex items-center justify-between mt-1">
                  <span>Phương thức cuối:</span>
                  <span className="font-medium capitalize">{this.state.recoveryMethod}</span>
                </div>
              )}
            </div>
          )}

          {/* Error details toggle */}
          <div className="mt-4">
            <button
              onClick={this.toggleDetails}
              className="text-sm text-muted-foreground hover:text-foreground underline"
            >
              {this.state.showDetails ? 'Ẩn chi tiết' : 'Xem chi tiết lỗi'}
            </button>
            
            {this.state.showDetails && this.state.lastError && (
              <div className="mt-2 p-3 bg-muted rounded text-xs font-mono">
                <div className="font-semibold mb-1">Error:</div>
                <div className="text-destructive mb-2">{this.state.lastError.message}</div>
                {this.state.lastError.stack && (
                  <>
                    <div className="font-semibold mb-1">Stack:</div>
                    <div className="text-muted-foreground whitespace-pre-wrap overflow-x-auto">
                      {this.state.lastError.stack.split('\n').slice(0, 5).join('\n')}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Recovery stats */}
          <div className="mt-4 text-xs text-muted-foreground text-center">
            Session Error Boundary v1.0 - Automatic Recovery Enabled
          </div>
        </div>
      </div>
    )
  }
}
