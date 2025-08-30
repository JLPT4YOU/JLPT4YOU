"use client"

import { useRouter, usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  RotateCcw,
  Eye,
  Plus,
  MessageCircle
} from 'lucide-react'
import { getLanguageFromPath, DEFAULT_LANGUAGE } from '@/lib/i18n'
import { useTranslations } from '@/hooks/use-translations'


interface ResultsActionsProps {
  examType: 'jlpt' | 'driving' | 'challenge'
  level: string
  examSubType?: string
  sections?: string[]
  demoScenario?: string
  onRetake?: () => void

  onNewTest?: () => void
}

export function ResultsActions({
  examType,
  level,
  examSubType,
  sections,
  demoScenario,
  onRetake,
  onNewTest
}: ResultsActionsProps) {
  const router = useRouter()
  const pathname = usePathname()
  
  // Use the new enhanced translations hook
  const { t, language } = useTranslations()

  const getReviewUrl = () => {
    const params = new URLSearchParams({
      type: examType,
      level: level,
      sections: sections?.join(',') || '',
      ...(examSubType && { subType: examSubType }),
      ...(demoScenario && { demo: demoScenario })
    })
    return `/${language}/review-answers?${params.toString()}`
  }

  const handleViewAnswers = () => {
    router.push(getReviewUrl())
  }

  return (
    <div className="space-y-6">
      {/* Primary Actions */}
      <div className="bg-background rounded-2xl p-6 md:p-8 animate-slide-in-up animate-stagger-3">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          {/* Review Answers */}
          <Button
            variant="outline"
            className="flex items-center gap-3 h-auto py-4 md:py-5 rounded-xl border-2 hover:border-primary/20 transition-all duration-200 bg-muted/20 hover:bg-accent/30"
            onClick={handleViewAnswers}
          >
            <Eye className="h-5 w-5" />
            <div className="text-left">
              <div className="text-sm font-semibold">{t('examResults.actions.viewAnswers')}</div>
              <div className="text-xs text-muted-foreground hidden md:block">{t('examResults.actions.viewAnswers')}</div>
            </div>
          </Button>

          {/* Retake Test */}
          <Button
            variant="default"
            className="flex items-center gap-3 h-auto py-4 md:py-5 rounded-xl transition-all duration-200"
            onClick={onRetake}
          >
            <RotateCcw className="h-5 w-5" />
            <div className="text-left">
              <div className="text-sm font-semibold">{t('examResults.actions.retakeTest')}</div>
              <div className="text-xs opacity-80 hidden md:block">{t('examResults.actions.retakeTest')}</div>
            </div>
          </Button>

          {/* New Test */}
          <Button
            variant="outline"
            className="flex items-center gap-3 h-auto py-4 md:py-5 rounded-xl border-2 hover:border-primary/20 transition-all duration-200"
            onClick={onNewTest}
          >
            <Plus className="h-5 w-5" />
            <div className="text-left">
              <div className="text-sm font-semibold">{t('examResults.actions.newTest')}</div>
              <div className="text-xs text-muted-foreground hidden md:block">{t('examResults.actions.newTest')}</div>
            </div>
          </Button>
        </div>
      </div>

      {/* Study Recommendations */}
      <div className="bg-muted/20 rounded-2xl p-6 md:p-8">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-xl bg-primary/10">
            <MessageCircle className="h-5 w-5 text-foreground" />
          </div>
          <div className="flex-1">
            <h3 className="text-base font-semibold text-foreground mb-3">
              {t('home.practiceItems.irin.title')}
            </h3>
            <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
              {getStudyRecommendation(examType, level, t)}
            </p>
            <Button variant="outline" size="sm" className="text-sm h-9 px-4 rounded-lg">
              {t('examResults.actions.viewAnswers')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

function getStudyRecommendation(examType: 'jlpt' | 'driving' | 'challenge', level: string, t: (key: string) => string): string {
  // For now, return a generic recommendation using translations
  // In the future, this could be more sophisticated with AI-generated recommendations
  return t('examResults.sections.performance.good')
}
