"use client"

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ReviewHeader } from '@/components/review/review-header'
import { QuestionFilters } from '@/components/review/question-filters'
import { QuestionCard } from '@/components/review/question-card'
import { QuestionPagination } from '@/components/review/question-pagination'
import { generateReviewData, filterQuestionsByStatus } from '@/lib/review-data-utils'
import { generateMockExamResult } from '@/lib/exam-results-utils'
import { ReviewData } from '@/types'
import { TranslationData, Language } from '@/lib/i18n'
import { useTranslations } from '@/hooks/use-translations'
const QUESTIONS_PER_PAGE = 5

interface ReviewAnswersPageContentProps {
  translations: TranslationData
  language: Language
}

export function ReviewAnswersPageContent({ translations, language }: ReviewAnswersPageContentProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { t } = useTranslations()
  
  // State
  const [reviewData, setReviewData] = useState<ReviewData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [currentFilter, setCurrentFilter] = useState<'all' | 'correct' | 'incorrect' | 'flagged'>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [expandedQuestion, setExpandedQuestion] = useState<number | null>(null)
  
  useEffect(() => {
    // Get exam parameters from URL
    const examType = (searchParams.get('type') as 'jlpt' | 'driving' | 'challenge') || 'jlpt'
    const level = searchParams.get('level') || 'n5'
    const sections = searchParams.get('sections')?.split(',').filter(Boolean) || ['vocabulary', 'grammar']
    const demoScenario = searchParams.get('demo') || undefined

    // Generate mock exam result (in real app, this would come from API/localStorage)
    const mockExamResult = generateMockExamResult(examType, level, sections, demoScenario)

    // Generate review data
    const mockReviewData = generateReviewData(mockExamResult)

    // Simulate loading delay
    setTimeout(() => {
      setReviewData(mockReviewData)
      setIsLoading(false)
    }, 800)
  }, [searchParams])

  // Reset to page 1 when filter changes
  useEffect(() => {
    setCurrentPage(1)
  }, [currentFilter])

  const handleBack = () => {
    // Navigate back to results page with same parameters
    const params = new URLSearchParams(searchParams.toString())
    router.push(`/${language}/exam-results?${params.toString()}`)
  }

  // const handleRetakeTest = () => {
  //   if (!reviewData) return
  //
  //   // Navigate to test setup with same configuration
  //   if (reviewData.examType === 'jlpt') {
  //     router.push(`/${language}/jlpt/${reviewData.examSubType}/${reviewData.level}/test-setup`)
  //   } else if (reviewData.examType === 'challenge') {
  //     router.push(`/${language}/challenge/${reviewData.level}`)
  //   } else {
  //     router.push(`/${language}/driving/${reviewData.level}/test-setup`)
  //   }
  // }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">{t('common.loading')}</p>
        </div>
      </div>
    )
  }

  if (!reviewData) {
    return (
      <div className="min-h-screen bg-background">
        <div className="app-container app-section">
          <div className="app-content max-w-4xl mx-auto">
            <div className="bg-background rounded-2xl p-8 text-center">
              <h1 className="text-lg font-semibold text-foreground mb-2">
                {t('examResults.actions.viewAnswers')}
              </h1>
              <p className="text-muted-foreground mb-4">
                {t('common.error')}
              </p>
              <Button onClick={() => router.push(`/${language}/home`)} className="rounded-xl bg-primary/90 hover:bg-primary">
                {t('examResults.actions.backToHome')}
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Filter questions based on current filter
  const filteredQuestions = filterQuestionsByStatus(reviewData.questions, currentFilter)
  
  // Calculate pagination
  const totalPages = Math.ceil(filteredQuestions.length / QUESTIONS_PER_PAGE)
  const startIndex = (currentPage - 1) * QUESTIONS_PER_PAGE
  const endIndex = startIndex + QUESTIONS_PER_PAGE
  const currentQuestions = filteredQuestions.slice(startIndex, endIndex)

  return (
    <div className="min-h-screen bg-background">
      <div className="app-container py-6 md:py-12">
        <div className="max-w-4xl mx-auto space-y-6 md:space-y-8">
          {/* Header */}
          <ReviewHeader
            reviewData={reviewData}
            onBack={handleBack}
          />

          {/* Filters */}
          <QuestionFilters
            reviewData={reviewData}
            currentFilter={currentFilter}
            onFilterChange={setCurrentFilter}
          />

          {/* Questions */}
          <div className="space-y-4">
            {currentQuestions.length > 0 ? (
              currentQuestions.map((question, index) => (
                <QuestionCard
                  key={question.id}
                  question={question}
                  questionNumber={startIndex + index + 1}
                  isExpanded={expandedQuestion === question.id}
                  onToggleExpand={() =>
                    setExpandedQuestion(expandedQuestion === question.id ? null : question.id)
                  }
                />
              ))
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground">
                  {t('common.error')}
                </p>
              </div>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <QuestionPagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              questionsPerPage={QUESTIONS_PER_PAGE}
              totalQuestions={filteredQuestions.length}
              translations={translations}
            />
          )}
        </div>
      </div>
    </div>
  )
}
