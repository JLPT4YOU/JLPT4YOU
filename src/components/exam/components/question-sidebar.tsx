"use client"

import { forwardRef } from "react"
import { Button } from "@/components/ui/button"
import { Flag, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { TranslationData } from "@/lib/i18n"
import { useTranslation } from "@/lib/use-translation"

export interface Question {
  id: number
  question: string
  options: {
    A: string
    B: string
    C: string
    D: string
  }
  correctAnswer?: 'A' | 'B' | 'C' | 'D'
}

interface QuestionSidebarProps {
  questions: Question[]
  currentQuestion: number
  answers: Record<number, 'A' | 'B' | 'C' | 'D'>
  flagged: Set<number>
  isOpen: boolean
  examMode: 'practice' | 'challenge'
  isPaused: boolean
  onQuestionSelect: (questionNumber: number) => void
  onClose: () => void
  translations: TranslationData
}

export const QuestionSidebar = forwardRef<HTMLDivElement, QuestionSidebarProps>(
  function QuestionSidebar({
    questions,
    currentQuestion,
    answers,
    flagged,
    isOpen,
    examMode,
    isPaused,
    onQuestionSelect,
    onClose,
    translations
  }, questionGridRef) {
    const { t } = useTranslation(translations);
    // Calculate statistics
    const answeredCount = Object.keys(answers).length
    const flaggedCount = flagged.size

    return (
      <>
        {/* Sidebar - Question Grid */}
        <div className={cn(
          "fixed inset-x-4 top-20 bottom-4 z-50 bg-card border rounded-lg shadow-xl transform transition-all duration-300 ease-in-out",
          "md:relative md:translate-x-0 md:translate-y-0 md:opacity-100 md:shadow-none md:w-72 md:h-auto md:max-h-none md:inset-auto md:top-0 md:bottom-0 md:right-0 md:left-auto md:rounded-none md:border-l md:border-t-0 md:border-r-0 md:border-b-0",
          isOpen ? "translate-y-0 opacity-100" : "translate-y-full opacity-0",
          examMode === 'practice' && isPaused && "blur-sm pointer-events-none select-none"
        )}>
          <div className="h-full flex flex-col">
            {/* Sidebar Header */}
            <div className="flex items-center justify-between p-3 border-b bg-muted/30 md:app-p-sm">
              <h3 className="text-sm font-semibold text-foreground">{t('exam.interface.questionList')}</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="md:hidden h-8 w-8 bg-muted/20 hover-brightness-light focus-ring"
              >
                <X className="w-4 h-4 text-foreground" />
              </Button>
            </div>

            {/* Question Grid Container */}
            <div className="flex-1 relative min-h-0">
              <div
                ref={questionGridRef}
                className="h-full overflow-y-auto px-2 py-2 scrollbar-thin scrollbar-thumb-muted-foreground/20 scrollbar-track-transparent md:max-h-[360px] md:px-3"
                style={{
                  scrollbarWidth: 'thin'
                }}
              >
                <div className="grid grid-cols-5 gap-2">
                  {questions.map((_, index) => {
                    const questionNumber = index + 1
                    const isAnswered = answers[questionNumber]
                    const isFlagged = flagged.has(questionNumber)
                    const isCurrent = currentQuestion === questionNumber

                    return (
                      <button
                        key={questionNumber}
                        data-question={questionNumber}
                        onClick={() => onQuestionSelect(questionNumber)}
                        className={cn(
                          "w-9 h-9 rounded-md text-xs font-medium transition-all duration-200 border-2",
                          "hover-scale focus-ring",
                          isCurrent && "ring-2 ring-primary ring-offset-1 scale-105",
                          isAnswered
                            ? "bg-primary text-primary-foreground shadow-sm"
                            : "bg-muted text-muted-foreground hover-brightness-medium",
                          isFlagged
                            ? "relative border-yellow-600 dark:border-yellow-400"
                            : "border-transparent"
                        )}
                      >
                        {questionNumber}
                        {isFlagged && (
                          <Flag className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 text-yellow-600 dark:text-yellow-400 fill-current" />
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Statistics */}
            <div className="border-t bg-muted/20 p-2 md:p-3">
              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <div className="text-lg font-bold text-primary">{answeredCount}</div>
                  <div className="text-xs text-muted-foreground">{t('exam.interface.answered')}</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-muted-foreground">{questions.length - answeredCount}</div>
                  <div className="text-xs text-muted-foreground">{t('exam.interface.unanswered')}</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-accent-foreground">{flaggedCount}</div>
                  <div className="text-xs text-muted-foreground">{t('exam.interface.flagged')}</div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mt-2 md:mt-3">
                <div className="flex justify-between text-xs text-muted-foreground mb-1">
                  <span>{t('exam.interface.progress')}</span>
                  <span>{Math.round((answeredCount / questions.length) * 100)}%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(answeredCount / questions.length) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Sidebar Overlay */}
        {isOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
            onClick={onClose}
          />
        )}
      </>
    )
  }
)
