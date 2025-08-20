/**
 * Shared Component Utilities
 * Consolidates common patterns across components
 */

import React from 'react'
import type { Language, TranslationData } from '@/lib/i18n'
import { useTranslations } from '@/hooks/use-translations'

// ===== SHARED TYPES =====

export interface BasePageContentProps {
  translations: TranslationData
  language: Language
  isAuthenticated?: boolean
}

export interface WithTranslationsProps {
  children: (props: {
    translations: TranslationData
    t: (key: string) => string
    language: Language
    isLoading: boolean
  }) => React.ReactNode
}

export interface LevelTemplateProps {
  level: string
  type?: string
  examType: 'jlpt' | 'driving'
}

// ===== TRANSLATION UTILITIES =====

/**
 * Higher-order component for components that need translations
 */
export function withTranslations<P extends object>(
  Component: React.ComponentType<P & { translations: TranslationData; language: Language }>
) {
  return function WithTranslationsWrapper(props: P) {
    const { translations, language, isLoading } = useTranslations()

    if (isLoading || !translations) {
      return <TranslationLoadingState />
    }

    return (
      <Component
        {...props}
        translations={translations}
        language={language}
      />
    )
  }
}

/**
 * Hook wrapper component for translation logic
 */
export function WithTranslations({ children }: WithTranslationsProps) {
  const { translations, t, language, isLoading } = useTranslations()

  if (isLoading || !translations) {
    return <TranslationLoadingState />
  }

  return <>{children({ translations, t, language, isLoading })}</>
}

/**
 * Standard loading state for translation-dependent components
 */
export function TranslationLoadingState() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">Loading translations...</p>
      </div>
    </div>
  )
}

/**
 * Standard error state for translation-dependent components
 */
export function TranslationErrorState({ error }: { error?: string }) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <div className="text-destructive mb-4">⚠️</div>
        <p className="text-muted-foreground">
          {error || 'Failed to load translations'}
        </p>
      </div>
    </div>
  )
}

// ===== PAGE CONTENT UTILITIES =====

/**
 * Create page content component with standard props
 */
export function createPageContent<T extends object = {}>(
  InnerComponent: React.ComponentType<BasePageContentProps & T>
) {
  return function PageContentWrapper(props: BasePageContentProps & T) {
    return <InnerComponent {...props} />
  }
}

/**
 * Validate page content props
 */
export function validatePageContentProps(props: BasePageContentProps): boolean {
  return !!(
    props.translations &&
    props.language &&
    typeof props.translations === 'object' &&
    typeof props.language === 'string'
  )
}

// ===== LEVEL TEMPLATE UTILITIES =====

/**
 * Get level display information
 */
export function getLevelDisplayInfo(level: string, examType: 'jlpt' | 'driving'): {
  title: string
  difficulty: string
  color: string
} {
  const levelMaps = {
    jlpt: {
      N1: { title: 'N1', difficulty: 'Advanced', color: 'text-foreground' },
      N2: { title: 'N2', difficulty: 'Upper Intermediate', color: 'text-muted-foreground' },
      N3: { title: 'N3', difficulty: 'Intermediate', color: 'text-foreground' },
      N4: { title: 'N4', difficulty: 'Elementary', color: 'text-muted-foreground' },
      N5: { title: 'N5', difficulty: 'Beginner', color: 'text-foreground' }
    },
    driving: {
      karimen: { title: 'Karimen', difficulty: 'Theory Test', color: 'text-foreground' },
      honmen: { title: 'Honmen', difficulty: 'Practical Test', color: 'text-muted-foreground' }
    }
  } as const

  const levelMap = levelMaps[examType] as Record<string, { title: string; difficulty: string; color: string }>

  return levelMap?.[level] || {
    title: level,
    difficulty: 'Unknown',
    color: 'text-gray-600'
  }
}

/**
 * Create level template component
 */
export function createLevelTemplate(
  examType: 'jlpt' | 'driving',
  customContent?: (props: {
    level: string
    type?: string
    translations: TranslationData
    t: (key: string) => string
    levelInfo: ReturnType<typeof getLevelDisplayInfo>
  }) => React.ReactNode
) {
  return function LevelTemplate({ level, type }: { level: string; type?: string }) {
    return (
      <WithTranslations>
        {({ translations, t }) => {
          const levelInfo = getLevelDisplayInfo(level, examType)
          
          if (customContent) {
            return <>{customContent({ level, type, translations, t, levelInfo })}</>
          }

          return (
            <div className="min-h-screen bg-background">
              <div className="app-container py-8">
                <div className="text-center mb-8">
                  <h1 className={`text-4xl font-bold mb-2 ${levelInfo.color}`}>
                    {levelInfo.title}
                  </h1>
                  <p className="text-xl text-muted-foreground">
                    {levelInfo.difficulty}
                  </p>
                </div>
                
                <div className="max-w-4xl mx-auto">
                  <div className="bg-card rounded-2xl p-8 shadow-sm">
                    <p className="text-center text-muted-foreground">
                      Level template for {examType} {level}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )
        }}
      </WithTranslations>
    )
  }
}

// ===== COMPONENT COMPOSITION UTILITIES =====

/**
 * Compose multiple HOCs
 */
export function compose<T>(...hocs: Array<(component: React.ComponentType<any>) => React.ComponentType<any>>) {
  return (Component: React.ComponentType<T>) =>
    hocs.reduceRight((acc, hoc) => hoc(acc), Component)
}

/**
 * Create component with error boundary
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: React.ComponentType<{ error: Error }>
) {
  return function WithErrorBoundaryWrapper(props: P) {
    return (
      <ErrorBoundary fallback={fallback}>
        <Component {...props} />
      </ErrorBoundary>
    )
  }
}

/**
 * Simple error boundary component
 */
class ErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ComponentType<{ error: Error }> },
  { hasError: boolean; error?: Error }
> {
  constructor(props: any) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Only log errors in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Component error:', error, errorInfo)
    }
  }

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback
      
      if (FallbackComponent && this.state.error) {
        return <FallbackComponent error={this.state.error} />
      }

      return (
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center">
            <div className="text-destructive mb-4 text-4xl">⚠️</div>
            <h2 className="text-xl font-semibold mb-2">Something went wrong</h2>
            <p className="text-muted-foreground">
              {this.state.error?.message || 'An unexpected error occurred'}
            </p>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

// ===== PERFORMANCE UTILITIES =====

/**
 * Memoize component with custom comparison
 */
export function memoizeComponent<P extends object>(
  Component: React.ComponentType<P>,
  areEqual?: (prevProps: P, nextProps: P) => boolean
) {
  return React.memo(Component, areEqual)
}

/**
 * Create lazy component with loading fallback
 */
export function createLazyComponent<P extends object>(
  importFn: () => Promise<{ default: React.ComponentType<P> }>,
  fallback?: React.ComponentType
) {
  const LazyComponent = React.lazy(importFn)
  
  return function LazyWrapper(props: P) {
    const FallbackComponent = fallback || TranslationLoadingState
    
    return (
      <React.Suspense fallback={<FallbackComponent />}>
        <LazyComponent {...props} />
      </React.Suspense>
    )
  }
}
