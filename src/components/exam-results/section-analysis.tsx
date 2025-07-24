"use client"

import { useState, useEffect } from 'react'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { BarChart3, TrendingUp, BookOpen, Headphones, FileText, Zap } from 'lucide-react'
import { cn } from '@/lib/utils'
import { SectionResult } from '@/types'
import { getStatusColorClass, getStatusDisplayText } from '@/lib/exam-results-utils'
import { useTranslations } from '@/hooks/use-translations'

interface SectionAnalysisProps {
  sectionResults?: SectionResult[]
  examType: 'jlpt' | 'driving' | 'challenge'
}

interface SectionCardProps {
  section: SectionResult
  index: number
  t: (key: string) => string
}

function SectionCard({ section, index, t }: SectionCardProps) {
  const [animatedPercentage, setAnimatedPercentage] = useState(0)

  // Animate progress bar
  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedPercentage(section.percentage)
    }, index * 200) // Stagger animations

    return () => clearTimeout(timer)
  }, [section.percentage, index])

  const getSectionIcon = (sectionName: string) => {
    const icons: Record<string, React.ReactNode> = {
      vocabulary: <BookOpen className="h-4 w-4" />,
      grammar: <FileText className="h-4 w-4" />,
      reading: <BookOpen className="h-4 w-4" />,
      listening: <Headphones className="h-4 w-4" />,
      kanji: <Zap className="h-4 w-4" />
    }
    return icons[sectionName] || <BarChart3 className="h-4 w-4" />
  }

  return (
    <div className="p-4 md:p-5 rounded-xl bg-muted/20 transition-all duration-200 hover:bg-muted/30">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-background/60">
            {getSectionIcon(section.name)}
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">
{t(`examResults.sections.names.${section.name}`)}
            </h3>
            <p className="text-xs text-muted-foreground">
              {section.score}/{section.total} {t('examResults.stats.correctAnswers')}
            </p>
          </div>
        </div>

        <Badge
          variant="secondary"
          className={cn(
            "text-xs font-medium",
            getStatusColorClass(section.status)
          )}
        >
          {t(`examResults.score.status.${section.status}`) || getStatusDisplayText(section.status)}
        </Badge>
      </div>

      {/* Progress Bar */}
      <div className="space-y-3">
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground">{t('examResults.stats.accuracy')}</span>
          <span className="font-semibold text-foreground">{section.percentage}%</span>
        </div>
        <Progress
          value={animatedPercentage}
          className="h-2.5 bg-muted/40"
        />
      </div>
    </div>
  )
}

export function SectionAnalysis({ sectionResults, examType }: SectionAnalysisProps) {
  // Use the new enhanced translations hook
  const { t } = useTranslations()

  if (!sectionResults || sectionResults.length === 0) {
    return (
      <div className="bg-background rounded-2xl p-6 md:p-8">
        <div className="flex items-center gap-3 mb-6">
          <BarChart3 className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-base font-semibold text-foreground">{t('examResults.sections.title')}</h2>
        </div>
        <div className="text-center py-8">
          <div className="text-muted-foreground text-sm">
            {examType === 'jlpt'
              ? t('examResults.sections.noData')
              : t('examResults.sections.overallAnalysis')
            }
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-background rounded-2xl p-6 md:p-8 animate-slide-in-up animate-stagger-2">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <BarChart3 className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-base font-semibold text-foreground">{t('examResults.sections.title')}</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          {t('examResults.sections.title')}
        </p>
      </div>

      <div className="space-y-4">
        {sectionResults.map((section, index) => (
          <SectionCard
            key={section.name}
            section={section}
            index={index}
            t={t}
          />
        ))}

        {/* Overall Performance Insight */}
        <div className="mt-8 p-5 rounded-xl bg-muted/20">
          <div className="flex items-start gap-3">
            <TrendingUp className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-foreground mb-2">
                {t('examResults.sections.overallInsight')}
              </h4>
              <p className="text-sm text-muted-foreground">
                {getPerformanceInsight(sectionResults, t)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function getPerformanceInsight(sections: SectionResult[], t: (key: string) => string): string {
  const averageScore = sections.reduce((sum, section) => sum + section.percentage, 0) / sections.length

  if (averageScore >= 80) {
    return t('examResults.sections.performance.excellent')
  } else if (averageScore >= 60) {
    return t('examResults.sections.performance.good')
  } else if (averageScore >= 40) {
    return t('examResults.sections.performance.mixed')
  } else {
    return t('examResults.sections.performance.needsImprovement')
  }
}
