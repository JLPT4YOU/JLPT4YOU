"use client"

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { LanguagePageWrapper } from '@/components/language-page-wrapper'
import { ScoreDisplay } from '@/components/exam-results/score-display'
import { SectionAnalysis } from '@/components/exam-results/section-analysis'
import { ResultsActions } from '@/components/exam-results/results-actions'
import { generateMockExamResult } from '@/lib/exam-results-utils'
import { ExamResult } from '@/types'
import { Button } from '@/components/ui/button'

interface ExamResultsContentProps {
  t: (key: string) => string
  searchParams: URLSearchParams
}

// Component that uses useSearchParams - must be wrapped in Suspense
function ExamResultsWithSearchParams({ t }: { t: (key: string) => string }) {
  const searchParams = useSearchParams()
  return <ExamResultsContent t={t} searchParams={searchParams} />
}

function ExamResultsContent({ t, searchParams }: ExamResultsContentProps) {
  const router = useRouter()
  const [examResult, setExamResult] = useState<ExamResult | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Get exam parameters from URL or localStorage
    const examType = (searchParams.get('type') as 'jlpt' | 'driving' | 'challenge') || 'jlpt'
    const level = searchParams.get('level') || 'n5'
    const sections = searchParams.get('sections')?.split(',').filter(Boolean) || ['vocabulary', 'grammar']
    const demoScenario = searchParams.get('demo') || undefined

    // In real app, this would fetch actual results from API
    // For demo, generate mock data
    const mockResult = generateMockExamResult(examType, level, sections, demoScenario)

    // Store additional params for review page
    mockResult.sections = sections

    // Simulate loading delay
    setTimeout(() => {
      setExamResult(mockResult)
      setIsLoading(false)
    }, 1000)
  }, [searchParams])

  const handleRetake = () => {
    if (!examResult) return

    // Navigate back to test setup with same configuration
    if (examResult.examType === 'jlpt') {
      router.push(`/jlpt/${examResult.examSubType}/${examResult.level}/test-setup`)
    } else if (examResult.examType === 'challenge') {
      router.push(`/challenge/${examResult.level}`)
    } else {
      router.push(`/driving/${examResult.level}/test-setup`)
    }
  }



  const handleNewTest = () => {
    if (!examResult) return

    // Navigate to test selection
    if (examResult.examType === 'jlpt') {
      router.push('/jlpt')
    } else if (examResult.examType === 'challenge') {
      router.push('/challenge')
    } else {
      router.push('/driving')
    }
  }



  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="app-container app-section">
          <div className="app-content max-w-4xl mx-auto">
            <div className="flex items-center justify-center min-h-[60vh]">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">{t('common.loading')}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!examResult) {
    return (
      <div className="min-h-screen bg-background">
        <div className="app-container app-section">
          <div className="app-content max-w-4xl mx-auto">
            <div className="bg-background rounded-2xl app-p-xl text-center">
              <h1 className="text-lg font-semibold text-foreground mb-2">
                {t('common.error')}
              </h1>
              <p className="text-muted-foreground mb-4">
                {t('examResults.noData')}
              </p>
              <Button onClick={() => router.push('/')} className="rounded-xl bg-primary/90 text-primary-foreground hover-primary">
                {t('examResults.actions.backToHome')}
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">


      <div className="relative">

        {/* Main Content */}
        <div className="app-container app-py-lg md:app-py-2xl">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
              {/* Combined Score & Stats Display - 2 columns on desktop */}
              <div className="lg:col-span-2">
                <ScoreDisplay
                  score={examResult.correctAnswers}
                  totalQuestions={examResult.totalQuestions}
                  correctAnswers={examResult.correctAnswers}
                  incorrectAnswers={examResult.incorrectAnswers}
                  unansweredQuestions={examResult.unansweredQuestions}
                  flaggedQuestions={examResult.flaggedQuestions}
                  percentage={examResult.percentage}
                  status={examResult.status}
                  timeSpent={examResult.timeSpent}
                  timeLimit={examResult.timeLimit}
                  examType={examResult.examType}
                  level={examResult.level}
                />
              </div>

              {/* Section Analysis - 1 column on desktop */}
              <div className="lg:col-span-1">
                <SectionAnalysis
                  sectionResults={examResult.sectionResults}
                  examType={examResult.examType}
                />
              </div>

              {/* Actions - Full Width */}
              <div className="lg:col-span-3">
                <ResultsActions
                  examType={examResult.examType}
                  level={examResult.level}
                  examSubType={examResult.examSubType}
                  sections={examResult.sections}
                  demoScenario={searchParams.get('demo') || undefined}
                  onRetake={handleRetake}
                  onNewTest={handleNewTest}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ExamResultsPage() {
  return (
    <LanguagePageWrapper>
      {({ t }) => (
        <Suspense fallback={<div>{t('common.loading')}</div>}>
          <ExamResultsWithSearchParams t={t} />
        </Suspense>
      )}
    </LanguagePageWrapper>
  )
}
