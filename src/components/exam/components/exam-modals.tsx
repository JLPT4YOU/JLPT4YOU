"use client"

import { Button } from "@/components/ui/button"
import { Clock, Pause } from "lucide-react"
import { cn } from "@/lib/utils"
import { SubmissionConfirmationModal } from "@/components/submission-confirmation-modal"
import { UseExamTimerReturn } from "../hooks/useExamTimer"
import { TranslationData } from "@/lib/i18n/"
import { useTranslation } from "@/lib/use-translation"

interface SubmissionStats {
  totalQuestions: number
  answeredQuestions: number
  unansweredQuestions: number
  flaggedQuestions: number
  timeRemaining: number
}

interface ExamModalsProps {
  examMode: 'practice' | 'challenge'
  isPaused: boolean
  timer: UseExamTimerReturn
  showSubmissionModal: boolean
  submissionStats: SubmissionStats
  onPause: () => void
  onConfirmSubmit: () => void
  onCancelSubmit: () => void
  translations: TranslationData
}

export function ExamModals({
  examMode,
  isPaused,
  timer,
  showSubmissionModal,
  submissionStats,
  onPause,
  onConfirmSubmit,
  onCancelSubmit,
  translations
}: ExamModalsProps) {
  const { t } = useTranslation(translations);
  return (
    <>
      {/* Pause Overlay - Only for practice mode */}
      {examMode === 'practice' && isPaused && (
        <div className="fixed inset-0 z-[100] bg-background/80 backdrop-blur-sm flex items-center justify-center animate-in fade-in duration-300">
          {/* Blur overlay for question content */}
          <div className="absolute inset-0 bg-background/60" />

          {/* Pause message card */}
          <div className="relative max-w-md w-full mx-4 md:max-w-lg">
            <div className="bg-background rounded-2xl p-6 text-center md:p-8">
              {/* Pause Icon */}
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4 md:w-20 md:h-20 md:mb-6">
                <Pause className="w-8 h-8 text-muted-foreground md:w-10 md:h-10" />
              </div>

              {/* Pause Message */}
              <h2 className="text-xl font-semibold text-foreground mb-2 md:text-2xl md:mb-3">
                {t('exam.interface.pausedTitle')}
              </h2>
              <p className="text-muted-foreground mb-6 text-sm md:text-base md:mb-8">
                {t('exam.interface.pausedDescription')}
              </p>

              {/* Timer Display */}
              <div className="bg-muted/50 rounded-xl p-4 mb-6 md:p-6 md:mb-8">
                <div className="flex items-center justify-center gap-2">
                  <Clock className="w-5 h-5 text-muted-foreground md:w-6 md:h-6" />
                  <span className={cn(
                    "font-mono text-xl font-semibold md:text-2xl",
                    timer.timeRemaining < 300 ? "text-destructive" : "text-foreground"
                  )}>
                    {timer.formatTime(timer.timeRemaining)}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-2 md:text-sm">
                  {t('exam.interface.timeRemaining')}
                </p>
              </div>

              {/* Resume Button */}
              <Button
                onClick={onPause}
                size="lg"
                className="w-full text-base h-11 md:h-12 md:text-lg rounded-xl"
              >
                {t('exam.interface.resume')}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Submission Confirmation Modal */}
      <SubmissionConfirmationModal
        isOpen={showSubmissionModal}
        stats={submissionStats}
        onConfirm={onConfirmSubmit}
        onCancel={onCancelSubmit}
        examMode={examMode}
        translations={translations}
      />
    </>
  )
}
