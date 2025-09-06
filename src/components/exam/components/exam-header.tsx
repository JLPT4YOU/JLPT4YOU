"use client"

import { Button } from "@/components/ui/button"
import {
  Clock,
  Pause,
  Send,
  Eye,
  Menu
} from "lucide-react"
import { cn } from "@/lib/utils"
import { AntiCheatWarningBadge } from "@/components/anti-cheat-system"
import { UseExamTimerReturn } from "../hooks/useExamTimer"
import { TranslationData } from "@/lib/i18n/"
import { useTranslation } from "@/lib/use-translation"

interface ExamHeaderProps {
  examTitle: string
  timer: UseExamTimerReturn
  examMode: 'practice' | 'challenge'
  violationCount?: number
  flaggedCount: number
  onShowFlaggedQuestions: () => void
  onPause: () => void
  onSubmit: () => void
  onToggleSidebar: () => void
  translations: TranslationData
}

export function ExamHeader({
  examTitle,
  timer,
  examMode,
  violationCount = 0,
  flaggedCount,
  onShowFlaggedQuestions,
  onPause,
  onSubmit,
  onToggleSidebar,
  translations
}: ExamHeaderProps) {
  const { t } = useTranslation(translations);
  return (
    <header className="sticky top-0 z-30 border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
      <div className="px-4 sm:px-6 lg:px-8 py-2">
        <div className="max-w-6xl mx-auto">
          <div className="max-w-4xl mx-auto flex items-center justify-between gap-1 md:gap-4">
          {/* Left: Exam Title */}
          <div className="flex items-center min-w-0 flex-1 md:flex-none">
            <h1 className="text-sm font-semibold text-foreground truncate md:text-lg">
              {examTitle}
            </h1>
          </div>

          {/* Center: Timer */}
          <div className="flex items-center gap-1 md:gap-2">
            <Clock className="w-4 h-4 text-muted-foreground md:w-5 md:h-5" />
            <span className={cn(
              "font-mono text-sm font-semibold md:text-lg",
              timer.timeRemaining < 300 ? "text-destructive" : "text-foreground"
            )}>
              {timer.formatTime(timer.timeRemaining)}
            </span>
          </div>

          {/* Right: Action Buttons */}
          <div className="flex items-center gap-1 md:gap-2">
            {/* Anti-Cheat Warning Badge for Challenge Mode */}
            <AntiCheatWarningBadge
              violationCount={violationCount}
              maxViolations={3}
              isVisible={examMode === 'challenge'}
              translations={translations}
            />

            {/* Mobile: Icon-only flagged questions button */}
            <Button
              variant="outline"
              size="sm"
              onClick={onShowFlaggedQuestions}
              disabled={flaggedCount === 0}
              className="md:hidden bg-muted/30 focus-ring"
              title={`${t('exam.interface.showFlaggedTitle')} (${flaggedCount})`}
            >
              <Eye className="w-4 h-4 text-foreground" />
            </Button>

            {/* Desktop: Full flagged questions button */}
            <Button
              variant="outline"
              size="sm"
              onClick={onShowFlaggedQuestions}
              disabled={flaggedCount === 0}
              className="hidden md:flex bg-muted/30 focus-ring"
            >
              <Eye className="w-4 h-4 mr-1 text-foreground" />
              {t('exam.interface.showFlagged')} ({flaggedCount})
            </Button>

            {/* Pause buttons - Only for practice mode */}
            {examMode === 'practice' && (
              <>
                {/* Mobile: Icon-only pause button */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onPause}
                  className="md:hidden bg-muted/30 focus-ring"
                  title={timer.isPaused ? t('exam.interface.resume') : t('exam.interface.pause')}
                >
                  <Pause className="w-4 h-4 text-foreground" />
                </Button>

                {/* Desktop: Full pause button */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onPause}
                  className="hidden md:flex bg-muted/30 focus-ring"
                >
                  <Pause className="w-4 h-4 mr-1 text-foreground" />
                  {timer.isPaused ? t('exam.interface.resume') : t('exam.interface.pause')}
                </Button>
              </>
            )}

            {/* Mobile: Icon-only submit button */}
            <Button
              variant="default"
              size="sm"
              onClick={onSubmit}
              className="md:hidden focus-ring"
              title={t('exam.interface.submit')}
            >
              <Send className="w-4 h-4 text-primary-foreground" />
            </Button>

            {/* Desktop: Full submit button */}
            <Button
              variant="default"
              size="sm"
              onClick={onSubmit}
              className="hidden md:flex focus-ring"
            >
              <Send className="w-4 h-4 mr-1 text-primary-foreground" />
              {t('exam.interface.submit')}
            </Button>

            {/* Mobile sidebar toggle */}
            <Button
              variant="outline"
              size="sm"
              onClick={onToggleSidebar}
              className="md:hidden bg-muted/30 focus-ring"
              title={t('exam.interface.questionList')}
            >
              <Menu className="w-4 h-4 text-foreground" />
            </Button>
          </div>
          </div>
        </div>
      </div>
    </header>
  )
}
