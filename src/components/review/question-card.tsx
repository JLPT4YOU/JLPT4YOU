"use client"

import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  CheckCircle,
  XCircle,
  HelpCircle,
  MessageSquare,
  ChevronDown,
  ChevronUp
} from 'lucide-react'
import { ReviewQuestion } from '@/types'
import { cn } from '@/lib/utils'
import { getQuestionStatusColor } from '@/lib/review-data-utils'
import { useTranslations } from '@/hooks/use-translations'

interface QuestionCardProps {
  question: ReviewQuestion
  questionNumber: number
  isExpanded?: boolean
  onToggleExpand?: (questionId: number) => void
}

export function QuestionCard({
  question,
  questionNumber,
  isExpanded = false,
  onToggleExpand
}: QuestionCardProps) {
  const [showExplanation, setShowExplanation] = useState(false)
  const { t } = useTranslations()

  const getQuestionStatusText = (question: ReviewQuestion): string => {
    if (!question.isAnswered) return t('reviewAnswers.question.status.flagged')
    return question.isCorrect ? t('reviewAnswers.question.status.correct') : t('reviewAnswers.question.status.incorrect')
  }

  const getStatusIcon = () => {
    if (!question.isAnswered) {
      return <HelpCircle className="h-4 w-4 text-muted-foreground" />
    }
    return question.isCorrect 
      ? <CheckCircle className="h-4 w-4 text-foreground" />
      : <XCircle className="h-4 w-4 text-muted-foreground" />
  }

  const getOptionStyle = (optionKey: 'A' | 'B' | 'C' | 'D') => {
    const isCorrect = optionKey === question.correctAnswer
    const isUserAnswer = optionKey === question.userAnswer

    if (isCorrect && isUserAnswer) {
      // User selected correct answer
      return "status-correct"
    } else if (isCorrect) {
      // Correct answer (not selected by user)
      return "bg-success/5 text-success border-success/10"
    } else if (isUserAnswer) {
      // User selected wrong answer
      return "status-incorrect"
    } else {
      // Regular option
      return "bg-muted/30 text-foreground"
    }
  }

  const getOptionIcon = (optionKey: 'A' | 'B' | 'C' | 'D') => {
    const isCorrect = optionKey === question.correctAnswer
    const isUserAnswer = optionKey === question.userAnswer

    if (isCorrect) {
      return <CheckCircle className="h-4 w-4 icon-correct" />
    } else if (isUserAnswer && !isCorrect) {
      return <XCircle className="h-4 w-4 icon-incorrect" />
    }
    return null
  }

  return (
    <div className="bg-background rounded-2xl p-6 md:p-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-muted-foreground">
            {t('reviewAnswers.question.number', { number: questionNumber })}
          </span>
          {getStatusIcon()}
        </div>
        <Badge
          variant="outline"
          className={cn("text-xs", getQuestionStatusColor(question))}
        >
          {getQuestionStatusText(question)}
        </Badge>
        {question.section && (
          <Badge variant="secondary" className="text-xs">
            {question.section}
          </Badge>
        )}
      </div>

        {/* Question Text and Details Button */}
        <div className="flex items-start justify-between gap-4 mb-6">
          <div className="flex-1 text-base text-foreground leading-relaxed whitespace-pre-line">
            {question.question}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onToggleExpand?.(question.id)}
            className="flex items-center gap-2 flex-shrink-0 rounded-xl bg-muted/30 hover:bg-accent/50"
          >
            <span className="text-sm">{t('reviewAnswers.question.details')}</span>
            {isExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Expandable Options */}
        {isExpanded && (
          <div className="space-y-4 mb-6">
            {Object.entries(question.options).map(([key, value]) => {
              const optionKey = key as 'A' | 'B' | 'C' | 'D'
              const icon = getOptionIcon(optionKey)

              return (
                <div
                  key={key}
                  className={cn(
                    "flex items-center gap-4 p-4 md:p-5 rounded-xl transition-colors",
                    getOptionStyle(optionKey)
                  )}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <span className="font-semibold text-sm">
                      {key}.
                    </span>
                    <span className="text-sm">
                      {value}
                    </span>
                  </div>
                  {icon && (
                    <div className="flex-shrink-0">
                      {icon}
                    </div>
                  )}
                </div>
              )
            })}

            {/* Explanation */}
            {question.explanation && (
              <div className="pt-6 border-t border-border/30">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowExplanation(!showExplanation)}
                  className="flex items-center gap-2 h-8 p-0 text-muted-foreground hover:text-foreground bg-muted/10 hover:bg-accent/30"
                >
                  <MessageSquare className="h-4 w-4" />
                  <span className="text-sm">{t('reviewAnswers.question.explanation')}</span>
                  {showExplanation ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>

                {showExplanation && (
                  <div className="mt-4 p-4 md:p-5 rounded-xl bg-muted/20">
                    <div className="text-sm text-foreground leading-relaxed">
                      {question.explanation}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
    </div>
  )
}
