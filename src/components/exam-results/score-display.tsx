"use client"

import { useState, useEffect } from 'react'
import { Badge } from '@/components/ui/badge'
import {
  Trophy,
  Target,
  Clock,
  CheckCircle,
  XCircle,
  Flag
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  getStatusColorClass,
  getStatusDisplayText,
  formatDuration,
  calculateTimeEfficiency
} from '@/lib/exam-results-utils'
import { useTranslations } from '@/hooks/use-translations'

interface ScoreDisplayProps {
  score: number
  totalQuestions: number
  correctAnswers: number
  incorrectAnswers: number
  unansweredQuestions: number
  percentage: number
  status: string
  timeSpent: number
  timeLimit: number
  examType: 'jlpt' | 'driving' | 'challenge'
  level: string
}

interface StatItemProps {
  icon: React.ReactNode
  label: string
  value: string | number
  subtitle?: string
  className?: string
  labelClassName?: string
}

function StatItem({ icon, label, value, subtitle, className, labelClassName }: StatItemProps) {
  return (
    <div className={cn(
      "text-center p-4 md:p-5 rounded-xl transition-all duration-200",
      // Clean background without borders
      "bg-muted/30 hover:bg-muted/40",
      // Remove borders and shadows for cleaner look
      className
    )}>
      <div className="flex items-center justify-center gap-2 mb-3">
        <div className="p-2 rounded-lg bg-background/60">
          {icon}
        </div>
        <span className={cn("text-xs font-medium", labelClassName || "text-muted-foreground")}>{label}</span>
      </div>
      <div className="text-lg md:text-xl font-semibold text-foreground mb-1">
        {value}
      </div>
      {subtitle && (
        <div className="text-xs text-muted-foreground">
          {subtitle}
        </div>
      )}
    </div>
  )
}

export function ScoreDisplay({
  score,
  totalQuestions,
  correctAnswers,
  incorrectAnswers,
  unansweredQuestions,
  percentage,
  status,
  timeSpent,
  timeLimit,
  examType,
  level
}: ScoreDisplayProps) {
  const [animatedScore, setAnimatedScore] = useState(0)
  const [animatedPercentage, setAnimatedPercentage] = useState(0)
  
  // Use the new enhanced translations hook
  const { t } = useTranslations()

  // Animate score count-up effect
  useEffect(() => {
    const duration = 2000 // 2 seconds
    const steps = 60
    const scoreIncrement = score / steps
    const percentageIncrement = percentage / steps
    const stepDuration = duration / steps

    let currentStep = 0
    const timer = setInterval(() => {
      currentStep++
      setAnimatedScore(Math.min(Math.round(scoreIncrement * currentStep), score))
      setAnimatedPercentage(Math.min(Math.round(percentageIncrement * currentStep), percentage))

      if (currentStep >= steps) {
        clearInterval(timer)
      }
    }, stepDuration)

    return () => clearInterval(timer)
  }, [score, percentage])

  // Calculate additional stats
  const timeEfficiency = calculateTimeEfficiency(timeSpent, timeLimit)

  const getExamTitle = () => {
    if (examType === 'jlpt') {
      return `JLPT ${level.toUpperCase()}`
    }
    return level === 'karimen' ? 'Karimen' : 'Honmen'
  }

  const getExamTypeTranslation = () => {
    return t(`examTypes.${examType}`)
  }

  const isPassed = status === 'passed' || status === 'good' || status === 'excellent'

  return (
    <div className="bg-background rounded-2xl animate-slide-in-up">
      <div className="p-6 md:p-8">
        {/* Header */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="flex items-center justify-center gap-3 mb-3">
            <Trophy className="h-6 w-6 text-muted-foreground" />
            <h1 className="text-xl md:text-2xl font-bold text-foreground">
              {t('examResults.title').replace('{examType}', getExamTitle())}
            </h1>
          </div>
          <p className="text-sm text-muted-foreground">
            {t('examResults.completedAt').replace('{time}', new Date().toLocaleString())}
          </p>
        </div>

        {/* Main Score Display */}
        <div className="text-center mb-8">
          <div className="relative inline-block">
            {/* Circular Progress Ring */}
            <div className="relative w-28 h-28 md:w-32 md:h-32 mx-auto mb-4">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
                {/* Background circle */}
                <circle
                  cx="60"
                  cy="60"
                  r="50"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="8"
                  className="text-muted/20"
                />
                {/* Progress circle */}
                <circle
                  cx="60"
                  cy="60"
                  r="50"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="8"
                  strokeLinecap="round"
                  className={cn(
                    "transition-all duration-1000 ease-out",
                    isPassed ? "text-foreground" : "text-muted-foreground"
                  )}
                  strokeDasharray={`${(animatedPercentage / 100) * 314} 314`}
                />
              </svg>

              {/* Score Text Overlay */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="text-2xl md:text-3xl font-bold text-foreground">
                  {animatedScore}
                </div>
                <div className="text-xs md:text-sm text-muted-foreground">
                  / {totalQuestions}
                </div>
              </div>
            </div>

            {/* Percentage */}
            <div className="text-xl md:text-2xl font-semibold text-foreground mb-3 animate-count-up">
              {animatedPercentage}%
            </div>

            {/* Status Badge */}
            <Badge
              variant="outline"
              className={cn(
                "text-sm font-medium animate-fade-in animate-stagger-2",
                getStatusColorClass(status)
              )}
            >
              {t(`examResults.score.status.${status}`)}
            </Badge>
          </div>
        </div>

        {/* Divider */}
        <div className="w-full h-px bg-border/30 mb-8"></div>

        {/* Detailed Stats Grid */}
        <div className="space-y-6">
          <div className="flex items-center gap-3 mb-6">
            <Target className="h-5 w-5 text-muted-foreground" />
            <h3 className="text-base font-semibold text-foreground">{t('examResults.score.title')}</h3>
          </div>

          <div className="grid grid-cols-2 gap-4 md:gap-6">
            {/* Correct Answers */}
            <StatItem
              icon={<CheckCircle className="h-4 w-4 text-green-600" />}
              label={t('examResults.stats.correctAnswers')}
              labelClassName="text-green-600"
              value={`${correctAnswers}/${totalQuestions}`}
              subtitle={t('examResults.score.percentage').replace('{percentage}', percentage.toString())}
              className="animate-fade-in animate-stagger-1"
            />

            {/* Time Spent */}
            <StatItem
              icon={<Clock className="h-4 w-4 text-muted-foreground" />}
              label={t('examResults.stats.timeSpent')}
              value={formatDuration(timeSpent)}
              subtitle={t('examResults.stats.timeEfficiency').replace('{percentage}', timeEfficiency.toString())}
              className="animate-fade-in animate-stagger-2"
            />

            {/* Incorrect Answers */}
            <StatItem
              icon={<XCircle className="h-4 w-4 text-red-600" />}
              label={t('examResults.stats.incorrectAnswers')}
              labelClassName="text-red-600"
              value={incorrectAnswers}
              subtitle={t('examResults.score.percentage').replace('{percentage}', Math.round((incorrectAnswers / totalQuestions) * 100).toString())}
              className="animate-fade-in animate-stagger-3"
            />

            {/* Flagged Questions */}
            <StatItem
              icon={<Flag className="h-4 w-4 text-yellow-600" />}
              label={t('examResults.stats.unansweredQuestions')}
              labelClassName="text-yellow-600"
              value={unansweredQuestions}
              subtitle={t('examResults.score.percentage').replace('{percentage}', Math.round((unansweredQuestions / totalQuestions) * 100).toString())}
              className="animate-fade-in animate-stagger-4"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
