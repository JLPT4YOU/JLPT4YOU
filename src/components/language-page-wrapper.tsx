"use client"

import React from 'react'
import { useLanguageContext } from '@/contexts/language-context'
import { Language, TranslationData } from '@/lib/i18n'

// Props for the render function
interface LanguagePageProps {
  language: Language
  translations: TranslationData
  t: (key: string) => any
  isLoading: boolean
  isAuthenticated: boolean
}

// Props for the wrapper component
interface LanguagePageWrapperProps {
  children: (props: LanguagePageProps) => React.ReactNode
  fallback?: React.ReactNode
  errorFallback?: (error: Error, retry: () => Promise<void>) => React.ReactNode
  loadingFallback?: React.ReactNode
}

// Default loading component
function DefaultLoadingFallback() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">Loading...</p>
      </div>
    </div>
  )
}

// Default error component
function DefaultErrorFallback({ 
  error, 
  retry 
}: { 
  error: Error
  retry: () => Promise<void> 
}) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center max-w-md mx-auto p-6">
        <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg 
            className="w-8 h-8 text-destructive" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" 
            />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-foreground mb-2">
          Translation Loading Error
        </h2>
        <p className="text-muted-foreground mb-4">
          Failed to load language translations. Please try again.
        </p>
        <p className="text-sm text-muted-foreground mb-6">
          Error: {error.message}
        </p>
        <button
          onClick={retry}
          className="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
        >
          <svg 
            className="w-4 h-4 mr-2" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" 
            />
          </svg>
          Retry
        </button>
      </div>
    </div>
  )
}

// Main wrapper component
export function LanguagePageWrapper({
  children,
  fallback,
  errorFallback,
  loadingFallback
}: LanguagePageWrapperProps) {
  const {
    language,
    translations,
    isLoading,
    isAuthenticated,
    t,
    error,
    retryLoadTranslations
  } = useLanguageContext()

  // Handle error state
  if (error) {
    if (errorFallback) {
      return <>{errorFallback(error, retryLoadTranslations)}</>
    }
    return <DefaultErrorFallback error={error} retry={retryLoadTranslations} />
  }

  // Handle loading state
  if (isLoading || !translations) {
    if (loadingFallback) {
      return <>{loadingFallback}</>
    }
    if (fallback) {
      return <>{fallback}</>
    }
    return <DefaultLoadingFallback />
  }

  // Render children with language props
  return (
    <>
      {children({
        language,
        translations,
        t,
        isLoading,
        isAuthenticated
      })}
    </>
  )
}

// Higher-order component version for class components or advanced usage
export function withLanguagePage<P extends object>(
  Component: React.ComponentType<P & LanguagePageProps>
) {
  return function LanguagePageComponent(props: P) {
    return (
      <LanguagePageWrapper>
        {(languageProps) => <Component {...props} {...languageProps} />}
      </LanguagePageWrapper>
    )
  }
}

// Hook version for functional components that need language context
export function useLanguagePage() {
  const context = useLanguageContext()
  
  return {
    language: context.language,
    translations: context.translations,
    t: context.t,
    isLoading: context.isLoading,
    isAuthenticated: context.isAuthenticated,
    error: context.error,
    retryLoadTranslations: context.retryLoadTranslations
  }
}