"use client"

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Filter, CheckCircle, XCircle, Flag, List } from 'lucide-react'
import { ReviewData } from '@/types'
import { cn } from '@/lib/utils'
import { useTranslations } from '@/hooks/use-translations'

interface QuestionFiltersProps {
  reviewData: ReviewData
  currentFilter: 'all' | 'correct' | 'incorrect' | 'flagged'
  onFilterChange: (filter: 'all' | 'correct' | 'incorrect' | 'flagged') => void
}

export function QuestionFilters({
  reviewData,
  currentFilter,
  onFilterChange
}: QuestionFiltersProps) {
  const { t } = useTranslations()
  const { correctCount, incorrectCount, unansweredCount: flaggedCount, totalQuestions } = reviewData

  const filters = [
    {
      key: 'all' as const,
      label: t('reviewAnswers.filters.all'),
      count: totalQuestions,
      icon: <List className="h-3 w-3" />,
      color: 'text-muted-foreground'
    },
    {
      key: 'correct' as const,
      label: t('reviewAnswers.filters.correct'),
      count: correctCount,
      icon: <CheckCircle className="h-3 w-3" />,
      color: 'text-success'
    },
    {
      key: 'incorrect' as const,
      label: t('reviewAnswers.filters.incorrect'),
      count: incorrectCount,
      icon: <XCircle className="h-3 w-3" />,
      color: 'text-destructive'
    },
    {
      key: 'flagged' as const,
      label: t('reviewAnswers.filters.flagged'),
      count: flaggedCount,
      icon: <Flag className="h-3 w-3" />,
      color: 'text-warning'
    }
  ]

  return (
    <Card className="bg-card border shadow-sm">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium text-foreground">{t('reviewAnswers.filters.title')}</span>
        </div>
        <div className="grid grid-cols-4 gap-2 md:flex md:flex-wrap md:gap-2">
          {filters.map((filter) => (
            <Button
              key={filter.key}
              variant={currentFilter === filter.key ? "default" : "outline"}
              size="sm"
              onClick={() => onFilterChange(filter.key)}
              className={cn(
                "flex flex-col md:flex-row items-center gap-1 md:gap-2 h-auto md:h-9 py-2 md:py-1.5 px-2 text-sm min-w-0",
                currentFilter === filter.key
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted/20 hover:bg-accent/40"
              )}
            >
              <span className={cn(
                "flex-shrink-0",
                currentFilter === filter.key ? "text-primary-foreground" : filter.color
              )}>
                {filter.icon}
              </span>
              <span className="truncate text-center md:text-left text-sm font-medium">{filter.label}</span>
              <span
                className={cn(
                  "text-sm font-medium",
                  currentFilter === filter.key
                    ? "text-primary-foreground"
                    : filter.color
                )}
              >
                {filter.count}
              </span>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
