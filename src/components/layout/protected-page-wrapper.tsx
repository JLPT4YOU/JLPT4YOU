"use client"

import { useEffect } from 'react'
import { Language, TranslationData } from '@/lib/i18n'
import { useTranslations } from '@/hooks/use-translations'
import { useScrollPreservation } from '@/lib/use-scroll-preservation'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { Header } from '@/components/header'
import { TranslationErrorBoundary } from '@/components/translation-error-boundary'

interface ProtectedPageWrapperProps {
  language: Language
  translations: TranslationData
  children: React.ReactNode
  className?: string
  showHeader?: boolean
  preserveScroll?: boolean
}

export function ProtectedPageWrapper({
  language,
  translations,
  children,
  className = '',
  showHeader = true,
  preserveScroll = true
}: ProtectedPageWrapperProps) {
  const { t, switchLanguage, isLoading, error } = useTranslations(translations, language)
  const { preserveScroll: handleScrollPreservation } = useScrollPreservation()
  
  // Handle language switching with scroll preservation
  const handleLanguageSwitch = async (newLanguage: Language) => {
    if (preserveScroll) {
      handleScrollPreservation()
    }
    await switchLanguage(newLanguage)
  }
  
  // Handle translation errors
  useEffect(() => {
    if (error) {
      console.error('Translation error in ProtectedPageWrapper:', error)
    }
  }, [error])
  
  if (isLoading) {
    return <ProtectedPageSkeleton showHeader={showHeader} />
  }
  
  return (
    <TranslationErrorBoundary>
      <ProtectedRoute>
        <div className={`min-h-screen bg-background ${className}`}>
          {showHeader && (
            <Header />
          )}
          
          <main className="app-container">
            {children}
          </main>
        </div>
      </ProtectedRoute>
    </TranslationErrorBoundary>
  )
}

// Loading skeleton component
function ProtectedPageSkeleton({ showHeader = true }: { showHeader?: boolean }) {
  return (
    <div className="min-h-screen bg-background animate-pulse">
      {showHeader && (
        <div className="h-16 bg-muted border-b border-border mb-6" />
      )}
      
      <div className="app-container">
        <div className="space-y-6">
          {/* Page title skeleton */}
          <div className="h-8 bg-muted rounded w-1/3" />
          
          {/* Content skeleton */}
          <div className="space-y-4">
            <div className="h-4 bg-muted rounded w-full" />
            <div className="h-4 bg-muted rounded w-3/4" />
            <div className="h-4 bg-muted rounded w-1/2" />
          </div>
          
          {/* Cards skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-32 bg-muted rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// Hook for easier usage
export function useProtectedPage(language: Language, translations: TranslationData) {
  const { t, switchLanguage, isLoading, error } = useTranslations(translations, language)
  const { preserveScroll } = useScrollPreservation()
  
  const handleLanguageSwitch = async (newLanguage: Language) => {
    preserveScroll()
    await switchLanguage(newLanguage)
  }
  
  return {
    t,
    language,
    isLoading,
    error,
    handleLanguageSwitch
  }
}
