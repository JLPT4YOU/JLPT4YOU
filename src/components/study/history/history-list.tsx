'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { PageTemplate } from '@/components/shared/page-template'
import { HistoryCard } from './history-card'
import { studyStorage, PracticeSession } from '@/lib/study/localStorage-service'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle, History } from 'lucide-react'

interface HistoryListProps {
  level: string
  type: string
  language: string
  translations: any
  t: (key: string) => string
}

export function HistoryList({ level, type, language, translations, t }: HistoryListProps) {
  const router = useRouter()
  const [sessions, setSessions] = useState<PracticeSession[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [retryingSessionId, setRetryingSessionId] = useState<string | null>(null)
  const [deletingSessionId, setDeletingSessionId] = useState<string | null>(null)

  // Format the type for display using i18n
  const formatType = (type: string) => {
    return t(`study.practice.types.${type}`) || type
  }

  const breadcrumbs = [
    { label: t('study.practice.breadcrumbs.study'), href: '/study' },
    { label: `N${level.replace('n', '').toUpperCase()}`, href: `/study/${level}` },
    { label: t('study.history.title'), href: `/study/${level}/history` },
    { label: formatType(type), href: '#' }
  ]

  // Load sessions from localStorage
  useEffect(() => {
    try {
      setIsLoading(true)
      setError(null)
      
      // Get sessions for this level and type
      const allSessions = studyStorage.getHistory(level, type)
      
      // Filter only completed sessions
      const completedSessions = allSessions.filter(session => session.completedAt)
      
      setSessions(completedSessions)
    } catch (err) {
      console.error('Error loading history:', err)
      setError(err instanceof Error ? err.message : 'Failed to load history')
    } finally {
      setIsLoading(false)
    }
  }, [level, type])

  // Handle retry session
  const handleRetry = async (sessionId: string) => {
    try {
      setRetryingSessionId(sessionId)
      setError(null)

      const retrySession = studyStorage.loadSessionForRetry(sessionId)
      if (retrySession) {
        // Navigate to exam page - it will automatically load the retry session
        router.push(`/study/${level}/practice/${type}/exam`)
      } else {
        setError(t('study.history.errors.retryFailed'))
      }
    } catch (err) {
      console.error('Error retrying session:', err)
      setError(err instanceof Error ? err.message : 'Failed to retry session')
    } finally {
      setRetryingSessionId(null)
    }
  }

  // Handle delete session
  const handleDelete = (sessionId: string) => {
    try {
      setDeletingSessionId(sessionId)
      setError(null)

      const success = studyStorage.deleteSession(sessionId)
      if (success) {
        // Remove from local state
        setSessions(prev => prev.filter(session => session.id !== sessionId))
      } else {
        setError(t('study.history.errors.deleteFailed'))
      }
    } catch (err) {
      console.error('Error deleting session:', err)
      setError(err instanceof Error ? err.message : 'Failed to delete session')
    } finally {
      setDeletingSessionId(null)
    }
  }

  return (
    <PageTemplate
      title={`${t('study.history.title')} - JLPT N${level.replace('n', '').toUpperCase()} ${formatType(type)}`}
      description={t('study.history.pageDescription')}
      breadcrumbs={breadcrumbs}
    >
      <div className="container mx-auto py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <header className="text-center mb-8">
            <div className="w-20 h-20 mx-auto mb-6 bg-muted/50 rounded-full flex items-center justify-center border border-border">
              <History className="h-10 w-10 text-foreground" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground mb-4">
              {t('study.history.title')} - {formatType(type)}
            </h1>
            <p className="text-lg text-muted-foreground">
              {t('study.history.description')}
            </p>
          </header>

          {/* Error Alert */}
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Loading State */}
          {isLoading && (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">{t('common.loading')}</p>
            </div>
          )}

          {/* Empty State */}
          {!isLoading && sessions.length === 0 && (
            <div className="text-center py-12">
              <History className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-foreground mb-2">
                {t('study.history.empty.title')}
              </h3>
              <p className="text-muted-foreground mb-6">
                {t('study.history.empty.description')}
              </p>
              <button
                onClick={() => router.push(`/study/${level}/practice/${type}`)}
                className="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
              >
                {t('study.history.empty.startPractice')}
              </button>
            </div>
          )}

          {/* Sessions Grid */}
          {!isLoading && sessions.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 sm:gap-6">
              {sessions.map((session) => (
                <HistoryCard
                  key={session.id}
                  session={session}
                  onRetry={handleRetry}
                  onDelete={handleDelete}
                  isRetrying={retryingSessionId === session.id}
                  isDeleting={deletingSessionId === session.id}
                  t={t}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </PageTemplate>
  )
}
