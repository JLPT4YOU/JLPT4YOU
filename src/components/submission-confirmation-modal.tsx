"use client"

import { Button } from "@/components/ui/button"
import {
  Send,
  CheckCircle,
  AlertCircle,
  Flag,
  FileQuestion,
  Clock
} from "lucide-react"
import { cn } from "@/lib/utils"
import { TranslationData } from "@/lib/i18n/"
import { useTranslation } from "@/lib/use-translation"

interface SubmissionStats {
  totalQuestions: number
  answeredQuestions: number
  unansweredQuestions: number
  flaggedQuestions: number
  timeRemaining: number // in seconds
}

interface SubmissionConfirmationModalProps {
  isOpen: boolean
  stats: SubmissionStats
  onConfirm: () => void
  onCancel: () => void
  examMode?: 'practice' | 'challenge'
  translations: TranslationData
}

export function SubmissionConfirmationModal({
  isOpen,
  stats,
  onConfirm,
  onCancel,
  examMode = 'practice',
  translations
}: SubmissionConfirmationModalProps) {
  const { t } = useTranslation(translations);
  if (!isOpen) return null

  const {
    totalQuestions,
    answeredQuestions,
    unansweredQuestions,
    flaggedQuestions,
    timeRemaining
  } = stats

  const completionPercentage = Math.round((answeredQuestions / totalQuestions) * 100)
  const hasUnanswered = unansweredQuestions > 0
  const hasFlagged = flaggedQuestions > 0
  const hasWarnings = hasUnanswered || hasFlagged

  // Format time display
  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div
      className="fixed inset-0 z-[200] bg-background/80 backdrop-blur-sm flex items-center justify-center animate-in fade-in duration-300 p-4"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Modal Card */}
      <div
        className="relative max-w-md w-full md:max-w-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-background rounded-2xl">
          <div className="p-6 md:p-8">
            {/* Header */}
            <div className="text-center mb-6">
              <div className={cn(
                "w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 md:w-20 md:h-20 md:mb-6",
                hasUnanswered ? "bg-destructive/10" : hasFlagged ? "bg-warning/10" : "bg-primary/10"
              )}>
                {hasWarnings ? (
                  <AlertCircle className={cn(
                    "w-8 h-8 md:w-10 md:h-10",
                    hasUnanswered ? "text-destructive" : "text-warning"
                  )} />
                ) : (
                  <Send className={cn(
                    "w-8 h-8 md:w-10 md:h-10",
                    "text-primary"
                  )} />
                )}
              </div>
              
              <h2 className="text-xl font-semibold text-foreground mb-2 md:text-2xl">
                {hasWarnings ? t('exam.submission.confirmTitle') : t('exam.submission.readyTitle')}
              </h2>

              <p className="text-muted-foreground text-sm md:text-base">
                {hasWarnings
                  ? t('exam.submission.confirmMessage')
                  : t('exam.submission.readyMessage')
                }
              </p>
            </div>

            {/* Stats Grid */}
            <div className="space-y-4 mb-6">
              {/* Progress Overview */}
              <div className="bg-muted/30 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-foreground">{t('exam.submission.progressLabel')}</span>
                  <span className="text-sm font-semibold text-primary">{completionPercentage}%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div 
                    className="bg-primary h-2 rounded-full transition-all duration-300"
                    style={{ width: `${completionPercentage}%` }}
                  />
                </div>
              </div>

              {/* Stats Items */}
              <div className="grid grid-cols-2 gap-3">
                {/* Answered Questions */}
                <div className="bg-success/5 border border-success/20 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <CheckCircle className="w-4 h-4 text-success" />
                    <span className="text-xs font-medium text-success">{t('exam.interface.answered')}</span>
                  </div>
                  <div className="text-lg font-semibold text-foreground">
                    {answeredQuestions}/{totalQuestions}
                  </div>
                </div>

                {/* Time Remaining */}
                <div className="bg-muted/50 border border-border rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span className="text-xs font-medium text-muted-foreground">{t('exam.submission.timeRemainingLabel')}</span>
                  </div>
                  <div className={cn(
                    "text-lg font-semibold font-mono",
                    timeRemaining < 300 ? "text-destructive" : "text-foreground"
                  )}>
                    {formatTime(timeRemaining)}
                  </div>
                </div>

                {/* Unanswered Questions - Show warning if any */}
                {unansweredQuestions > 0 && (
                  <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <FileQuestion className="w-4 h-4 text-destructive" />
                      <span className="text-xs font-medium text-destructive">{t('exam.interface.unanswered')}</span>
                    </div>
                    <div className="text-lg font-semibold text-foreground">
                      {unansweredQuestions}
                    </div>
                  </div>
                )}

                {/* Flagged Questions - Show if any */}
                {flaggedQuestions > 0 && (
                  <div className="bg-warning/5 border border-warning/20 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <Flag className="w-4 h-4 text-warning" />
                      <span className="text-xs font-medium text-warning">{t('exam.interface.flagged')}</span>
                    </div>
                    <div className="text-lg font-semibold text-foreground">
                      {flaggedQuestions}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Warning Messages */}
            {hasWarnings && (
              <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-4 mb-6">
                <div className="space-y-2">
                  {hasUnanswered && (
                    <p className="text-sm text-destructive flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
                      {t('exam.submission.unansweredWarning').replace('{count}', unansweredQuestions.toString())}
                    </p>
                  )}
                  {hasFlagged && (
                    <p className="text-sm text-warning flex items-center gap-2">
                      <Flag className="w-4 h-4 flex-shrink-0" />
                      {t('exam.submission.flaggedWarning').replace('{count}', flaggedQuestions.toString())}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2 md:gap-3">
              {/* Cancel Button - Left */}
              <Button
                onClick={onCancel}
                variant="outline"
                size="lg"
                className="flex-1 h-20 md:h-24 text-base md:text-xl lg:text-2xl font-semibold px-2 sm:px-4 md:px-8 lg:px-10"
              >
                <span className="truncate">{t('exam.submission.cancel')}</span>
              </Button>

              {/* Confirm Submit Button - Right */}
              <Button
                onClick={onConfirm}
                size="lg"
                className={cn(
                  "flex-1 h-20 md:h-24 text-base md:text-xl lg:text-2xl font-semibold px-2 sm:px-4 md:px-8 lg:px-10",
                  hasUnanswered && "bg-destructive hover:bg-destructive/90 text-destructive-foreground",
                  !hasUnanswered && hasFlagged && "bg-warning hover:bg-warning/90 text-warning-foreground"
                )}
              >
                <Send className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 lg:w-8 lg:h-8 mr-2 sm:mr-3 md:mr-4" />
                <span className="truncate">{t('exam.submission.confirm')}</span>
              </Button>
            </div>

            {/* Challenge Mode Notice */}
            {examMode === 'challenge' && (
              <div className="mt-4 text-center">
                <p className="text-xs text-muted-foreground">
                  {t('exam.submission.challengeNotice')}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
