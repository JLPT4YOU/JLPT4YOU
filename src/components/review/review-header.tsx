"use client"

import { Badge } from '@/components/ui/badge'
import { BarChart3, CheckCircle, XCircle, Flag, Target } from 'lucide-react'
import { ReviewData } from '@/types'
import { cn } from '@/lib/utils'
import { useTranslations } from '@/hooks/use-translations'

interface ReviewHeaderProps {
  reviewData: ReviewData
}

interface StatItemProps {
  icon: React.ReactNode
  label: string
  value: string | number
  className?: string
  labelClassName?: string
}

function StatItem({ icon, label, value, className, labelClassName }: StatItemProps) {
  return (
    <div className={cn(
      "text-center p-4 md:p-5 rounded-xl transition-all duration-200",
      // Clean background without borders
      "bg-muted/30 hover:bg-muted/40",
      className
    )}>
      <div className="flex items-center justify-center gap-2 mb-3">
        <div className="p-2 rounded-lg bg-background/60">
          {icon}
        </div>
        <span className={cn("text-xs font-medium", labelClassName || "text-muted-foreground")}>{label}</span>
      </div>
      <div className="text-lg md:text-xl font-semibold text-foreground">
        {value}
      </div>
    </div>
  )
}

export function ReviewHeader({ reviewData }: ReviewHeaderProps) {
  const { t } = useTranslations()
  const { examResult, correctCount, incorrectCount, unansweredCount: flaggedCount, totalQuestions } = reviewData

  const getExamTitle = () => {
    if (examResult.examType === 'jlpt') {
      return `JLPT ${examResult.level.toUpperCase()}`
    }
    return examResult.level === 'karimen' ? 'Karimen' : 'Honmen'
  }

  const percentage = Math.round((correctCount / totalQuestions) * 100)

  return (
    <div className="space-y-4">
      {/* Title */}
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <h1 className="text-lg font-semibold text-foreground">
            {t('reviewAnswers.header.title')}
          </h1>
          <p className="text-sm text-muted-foreground">
            {getExamTitle()} • {totalQuestions} questions
          </p>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="bg-background rounded-2xl p-6 md:p-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <BarChart3 className="h-5 w-5 text-muted-foreground" />
            <h2 className="text-base font-semibold text-foreground">
              {t('reviewAnswers.header.overview')}
            </h2>
          </div>
          <Badge variant="outline" className="text-sm">
            {percentage}% accuracy
          </Badge>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {/* Total Questions */}
            <StatItem
              icon={<Target className="h-4 w-4 text-muted-foreground" />}
              label={t('review.totalQuestions')}
              value={totalQuestions}
            />

            {/* Correct Answers */}
            <StatItem
              icon={<CheckCircle className="h-4 w-4 text-green-600" />}
              label={t('review.correctAnswers')}
              labelClassName="text-green-600"
              value={correctCount}
            />

            {/* Incorrect Answers */}
            <StatItem
              icon={<XCircle className="h-4 w-4 text-red-600" />}
              label={t('review.incorrectAnswers')}
              labelClassName="text-red-600"
              value={incorrectCount}
            />

            {/* Flagged Questions */}
            <StatItem
              icon={<Flag className="h-4 w-4 text-yellow-600" />}
              label={t('review.flaggedAnswers')}
              labelClassName="text-yellow-600"
              value={flaggedCount}
            />
        </div>
      </div>
    </div>
  )
}
