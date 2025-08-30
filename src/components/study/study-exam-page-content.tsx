'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { PageTemplate } from '@/components/shared/page-template'
import { usePracticeExercise } from '@/hooks/usePracticeExercise'
import { ExerciseDisplay } from '@/components/study/practice/ExerciseDisplay'
import { ExerciseResults } from '@/components/study/practice/ExerciseResults'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle, ArrowLeft } from 'lucide-react'
import { useTranslations } from '@/hooks/use-translations'

interface StudyExamPageContentProps {
  level: string
  type: string
}

type ExamView = 'exercise' | 'results' | 'no-session'

export function StudyExamPageContent({ level, type }: StudyExamPageContentProps) {
  const router = useRouter()
  const [view, setView] = useState<ExamView>('exercise')
  const { t } = useTranslations()

  // Format the type for display using i18n
  const formatType = (type: string) => {
    return t(`study.practice.types.${type}`) || type
  }

  const breadcrumbs = [
    { label: t('study.practice.breadcrumbs.study'), href: '/study' },
    { label: `N${level}`, href: `/study/n${level}` },
    { label: t('study.practice.breadcrumbs.practice'), href: `/study/n${level}/practice` },
    { label: formatType(type), href: `/study/n${level}/practice/${type}` },
    { label: t('study.exam.title'), href: '#' }
  ]
  
  // Use practice exercise hook
  const {
    questions,
    currentQuestionIndex,
    session,
    isGenerating,
    error,
    showExplanation,
    isCompleted,
    score,
    accuracy,
    elapsedTime,
    submitAnswer,
    nextQuestion,
    previousQuestion,
    skipQuestion,
    resetUIState,
    retryExercise,
    getCurrentQuestion,
    getAnswer,
    isCurrentQuestionAnswered,
    getProgress,
    toggleExplanation
  } = usePracticeExercise({
    level: `n${level}`,
    type,
    onComplete: (session) => {
      console.log('Exercise completed:', session)
      setView('results')
    },
    onError: (error) => {
      console.error('Exercise error:', error)
    }
  })

  // Check if there's a session to load
  useEffect(() => {
    if (!session && questions.length === 0) {
      setView('no-session')
    } else if (isCompleted) {
      setView('results')
    } else {
      setView('exercise')
    }
  }, [session, questions.length, isCompleted])

  // Handle retry (same questions)
  const handleRetry = () => {
    if (session && session.questions && session.questions.length > 0) {
      retryExercise()
      setView('exercise')
    }
  }
  
  // Handle back to practice
  const handleBackToPractice = () => {
    resetUIState()
    router.push(`/study/n${level}/practice/${type}`)
  }

  // Handle back to history
  const handleBackToHistory = () => {
    router.push(`/study/n${level}/history/${type}`)
  }
  
  // Handle answer submission
  const handleAnswer = (answerIndex: number) => {
    submitAnswer(answerIndex)
  }
  
  // Handle next question
  const handleNext = () => {
    nextQuestion()
  }

  return (
    <PageTemplate
      title={`${t('study.exam.title')} - JLPT N${level} ${formatType(type)}`}
      description={t('study.exam.pageDescription')}
      breadcrumbs={breadcrumbs}
    >
      <div className="container mx-auto py-8">
        <div className="max-w-4xl mx-auto">
          {/* Error Alert */}
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          {/* No Session State */}
          {view === 'no-session' && (
            <div className="text-center py-12">
              <AlertCircle className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-foreground mb-2">
                {t('study.exam.noSession.title')}
              </h3>
              <p className="text-muted-foreground mb-6">
                {t('study.exam.noSession.description')}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={handleBackToPractice}
                  className="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  {t('study.exam.noSession.createNew')}
                </button>
                <button
                  onClick={handleBackToHistory}
                  className="inline-flex items-center px-4 py-2 bg-muted text-muted-foreground rounded-lg hover:bg-muted/80 transition-colors"
                >
                  {t('study.exam.noSession.viewHistory')}
                </button>
              </div>
            </div>
          )}
          
          {/* Exercise View */}
          {view === 'exercise' && (
            <ExerciseDisplay
              question={getCurrentQuestion()}
              currentIndex={currentQuestionIndex}
              totalQuestions={questions.length}
              userAnswer={getCurrentQuestion() ? getAnswer(getCurrentQuestion()!.id) : undefined}
              showExplanation={showExplanation}
              elapsedTime={elapsedTime}
              onAnswer={handleAnswer}
              onNext={handleNext}
              onSkip={skipQuestion}
              onToggleExplanation={toggleExplanation}
              isLastQuestion={currentQuestionIndex === questions.length - 1}
            />
          )}
          
          {/* Results View */}
          {view === 'results' && session && (
            <ExerciseResults
              session={session}
              score={score}
              accuracy={accuracy}
              onRetry={handleRetry}
              onNewExercise={handleBackToPractice}
              level={`n${level}`}
              type={type}
            />
          )}
        </div>
      </div>
    </PageTemplate>
  )
}
