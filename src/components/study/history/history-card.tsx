'use client'

import React, { useState } from 'react'
import { PracticeSession } from '@/lib/study/localStorage-service'
import { RotateCcw, Trash2, Calendar, Clock, Target, Award } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { vi, ja, enUS } from 'date-fns/locale'

interface HistoryCardProps {
  session: PracticeSession
  onRetry: (sessionId: string) => void
  onDelete: (sessionId: string) => void
  t: (key: string) => string
  isRetrying?: boolean
  isDeleting?: boolean
}

export function HistoryCard({ session, onRetry, onDelete, t, isRetrying = false, isDeleting = false }: HistoryCardProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  // Calculate stats
  const correctAnswers = session.answers.filter(a => a.isCorrect).length
  const totalAnswers = session.answers.length
  const accuracy = totalAnswers > 0 ? Math.round((correctAnswers / totalAnswers) * 100) : 0
  const score = session.score || correctAnswers
  const totalQuestions = session.totalQuestions

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const locale = getDateLocale()
    
    try {
      return formatDistanceToNow(date, { 
        addSuffix: true,
        locale 
      })
    } catch {
      return date.toLocaleDateString()
    }
  }

  const getDateLocale = () => {
    // You might want to get this from context or props
    // For now, defaulting to Vietnamese
    return vi
  }

  // Format time spent
  const formatTimeSpent = (seconds?: number) => {
    if (!seconds) return t('study.history.card.timeUnknown')
    
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    
    if (minutes > 0) {
      return `${minutes}${t('study.history.card.timeMinutes')} ${remainingSeconds}${t('study.history.card.timeSeconds')}`
    }
    return `${remainingSeconds}${t('study.history.card.timeSeconds')}`
  }

  // Get accuracy color
  const getAccuracyColor = (accuracy: number) => {
    if (accuracy >= 80) return 'text-green-600'
    if (accuracy >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  // Handle delete with confirmation
  const handleDeleteClick = () => {
    if (showDeleteConfirm) {
      onDelete(session.id)
      setShowDeleteConfirm(false)
    } else {
      setShowDeleteConfirm(true)
      // Auto-hide confirmation after 3 seconds
      setTimeout(() => setShowDeleteConfirm(false), 3000)
    }
  }

  return (
    <article
      className="bg-background rounded-2xl p-6 border border-border/20 hover:border-border/40 transition-all duration-200 hover:shadow-lg"
      role="article"
      aria-label={`${t('study.history.card.testResult')} ${score}/${totalQuestions} (${accuracy}%)`}
    >
      {/* Header with Score */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Award className="h-5 w-5 text-primary" />
          <span className="text-lg font-bold text-foreground">
            {score}/{totalQuestions}
          </span>
        </div>
        <div className={`text-sm font-semibold ${getAccuracyColor(accuracy)}`}>
          {accuracy}%
        </div>
      </div>

      {/* Stats */}
      <div className="space-y-3 mb-6">
        {/* Date */}
        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4" />
          <span>{formatDate(session.completedAt || session.startedAt)}</span>
        </div>

        {/* Time Spent */}
        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
          <Clock className="h-4 w-4" />
          <span>{formatTimeSpent(session.timeSpent)}</span>
        </div>

        {/* Accuracy */}
        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
          <Target className="h-4 w-4" />
          <span>
            {correctAnswers}/{totalAnswers} {t('study.history.card.correct')}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex space-x-2">
        {/* Retry Button */}
        <button
          onClick={() => onRetry(session.id)}
          disabled={isRetrying || isDeleting}
          className="flex-1 inline-flex items-center justify-center px-3 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          title={t('study.history.card.retry')}
        >
          {isRetrying ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground mr-2"></div>
          ) : (
            <RotateCcw className="h-4 w-4 mr-2" />
          )}
          {t('study.history.card.retry')}
        </button>

        {/* Delete Button */}
        <button
          onClick={handleDeleteClick}
          disabled={isRetrying || isDeleting}
          className={`px-3 py-2 rounded-lg transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed ${
            showDeleteConfirm
              ? 'bg-red-600 text-white hover:bg-red-700'
              : 'bg-muted text-muted-foreground hover:bg-muted/80'
          }`}
          title={showDeleteConfirm ? t('study.history.card.confirmDelete') : t('study.history.card.delete')}
        >
          {isDeleting ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
          ) : (
            <Trash2 className="h-4 w-4" />
          )}
        </button>
      </div>

      {/* Delete Confirmation Text */}
      {showDeleteConfirm && (
        <p className="text-xs text-red-600 mt-2 text-center" role="alert">
          {t('study.history.card.deleteConfirmText')}
        </p>
      )}
    </article>
  )
}
