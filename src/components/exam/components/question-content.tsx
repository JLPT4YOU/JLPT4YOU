"use client"

import { Button } from "@/components/ui/button"
import {
  Flag,
  ChevronLeft,
  ChevronRight
} from "lucide-react"
import { cn } from "@/lib/utils"
import { TranslationData } from "@/lib/i18n/"
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

interface QuestionContentProps {
  question: Question
  questionNumber: number
  totalQuestions: number
  selectedAnswer?: 'A' | 'B' | 'C' | 'D'
  isFlagged: boolean
  canGoPrevious: boolean
  canGoNext: boolean
  onAnswerSelect: (questionId: number, answer: 'A' | 'B' | 'C' | 'D') => void
  onFlagToggle: (questionId: number) => void
  onPrevious: () => void
  onNext: () => void
  translations: TranslationData
}

export function QuestionContent({
  question,
  questionNumber,
  totalQuestions,
  selectedAnswer,
  isFlagged,
  canGoPrevious,
  canGoNext,
  onAnswerSelect,
  onFlagToggle,
  onPrevious,
  onNext,
  translations
}: QuestionContentProps) {
  const { t } = useTranslation(translations);
  return (
    <div className="bg-background rounded-2xl p-6 md:p-8">
        {/* Question Header with Flag */}
        <div className="flex items-start justify-between mb-4 md:mb-6">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-3 md:gap-2 md:mb-4">
              <span className="text-sm font-medium text-muted-foreground">
                {t('exam.interface.question')} {questionNumber}/{totalQuestions}
              </span>
            </div>
            <h2 className="text-lg font-medium text-foreground leading-relaxed">
              {question.question}
            </h2>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onFlagToggle(question.id)}
            className={cn(
              "ml-4 shrink-0",
              isFlagged
                ? "text-yellow-600 dark:text-yellow-400"
                : "text-muted-foreground"
            )}
          >
            <Flag className="w-5 h-5" />
          </Button>
        </div>

        {/* Answer Options */}
        <div className="space-y-2 mb-4 md:space-y-3 md:mb-6">
          {Object.entries(question.options).map(([key, value]) => (
            <button
              key={key}
              onClick={() => onAnswerSelect(question.id, key as 'A' | 'B' | 'C' | 'D')}
              className={cn(
                "w-full text-left p-3 rounded-lg border-2 transition-all duration-200 md:p-4",
                "hover:bg-accent/50 hover:border-accent-foreground/30",
                "focus-button",
                selectedAnswer === key
                  ? "border-primary bg-primary/10 shadow-md ring-1 ring-primary/20"
                  : "border-border bg-card hover:border-muted-foreground/50"
              )}
            >
              <div className="flex items-start gap-3 md:gap-2">
                <span className={cn(
                  "w-6 h-6 rounded-full border-2 flex items-center justify-center text-sm font-semibold shrink-0 mt-0.5 transition-all duration-200",
                  selectedAnswer === key
                    ? "bg-primary text-primary-foreground border-primary shadow-sm"
                    : "border-muted-foreground bg-muted/20 text-foreground"
                )}>
                  {key}
                </span>
                <span className={cn(
                  "text-sm leading-relaxed transition-colors duration-200",
                  selectedAnswer === key
                    ? "text-foreground font-medium"
                    : "text-foreground"
                )}>{value}</span>
              </div>
            </button>
          ))}
        </div>

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={onPrevious}
            disabled={!canGoPrevious}
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            {t('exam.interface.previous')}
          </Button>

          <Button
            variant="outline"
            onClick={onNext}
            disabled={!canGoNext}
          >
            {t('exam.interface.next')}
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
    </div>
  )
}
