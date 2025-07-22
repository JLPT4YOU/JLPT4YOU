"use client"

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { LanguagePageWrapper } from '@/components/language-page-wrapper'

import { ReviewHeader } from '@/components/review/review-header'
import { QuestionFilters } from '@/components/review/question-filters'
import { QuestionCard } from '@/components/review/question-card'
import { QuestionPagination } from '@/components/review/question-pagination'
import { generateReviewData, filterQuestionsByStatus } from '@/lib/review-data-utils'
import { generateMockExamResult } from '@/lib/exam-results-utils'
import { ReviewData } from '@/types'

const QUESTIONS_PER_PAGE = 5

interface ReviewAnswersContentProps {
  t: (key: string) => any
  language: string
}

function ReviewAnswersContent({ t, language }: ReviewAnswersContentProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  
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

  const handleBack = () => {
    // Navigate back to results page with same parameters
    const params = new URLSearchParams(searchParams.toString())
    router.push(`/exam-results?${params.toString()}`)
  }

  const handleToggleExpand = (questionId: number) => {
    setExpandedQuestion(prev => prev === questionId ? null : questionId)
  }

  // Reset page when filter changes
  useEffect(() => {
    setCurrentPage(1)
  }, [currentFilter])

  // Early returns should come after all hooks
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

  if (!reviewData) {
    return (
      <div className="min-h-screen bg-background">
        <div className="app-container app-section">
          <div className="app-content max-w-4xl mx-auto">
            <div className="bg-background rounded-2xl p-8 text-center">
              <h1 className="text-lg font-semibold text-foreground mb-2">
                {t('common.error')}
              </h1>
              <p className="text-muted-foreground mb-4">
                {t('reviewAnswers.noData')}
              </p>
              <Button onClick={() => router.push('/')} className="rounded-xl bg-primary/90 hover:bg-primary">
                {t('common.back')}
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Filter questions
  const filteredQuestions = filterQuestionsByStatus(reviewData.questions, currentFilter)

  // Pagination
  const totalPages = Math.ceil(filteredQuestions.length / QUESTIONS_PER_PAGE)
  const startIndex = (currentPage - 1) * QUESTIONS_PER_PAGE
  const paginatedQuestions = filteredQuestions.slice(startIndex, startIndex + QUESTIONS_PER_PAGE)

  return (
    <div className="min-h-screen bg-background">
      <div className="app-container app-py-md md:app-section">
        <div className="app-content max-w-4xl mx-auto space-y-6">
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
            {paginatedQuestions.length > 0 ? (
              paginatedQuestions.map((question) => (
                <div
                  key={question.id}
                  className="transition-all duration-200"
                >
                  <QuestionCard
                    question={question}
                    questionNumber={question.id}
                    isExpanded={expandedQuestion === question.id}
                    onToggleExpand={handleToggleExpand}
                  />
                </div>
              ))
            ) : (
              <div className="bg-background rounded-2xl app-p-xl text-center">
                <p className="text-muted-foreground">
                  {t('reviewAnswers.noQuestionsFound')}
                </p>
              </div>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <QuestionPagination
              currentPage={currentPage}
              totalPages={totalPages}
              questionsPerPage={QUESTIONS_PER_PAGE}
              totalQuestions={filteredQuestions.length}
              onPageChange={setCurrentPage}
            />
          )}
        </div>
      </div>
    </div>
  )
}

export default function ReviewAnswersPage() {
  return (
    <LanguagePageWrapper>
      {({ language, translations, t, isLoading, isAuthenticated }) => (
        <Suspense fallback={<div>{t('common.loading')}</div>}>
          <ReviewAnswersContent t={t} language={language} />
        </Suspense>
      )}
    </LanguagePageWrapper>
  )
}
