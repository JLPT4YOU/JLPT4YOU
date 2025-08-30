'use client'

import React, { useState } from 'react'
import { PageTemplate } from '@/components/shared/page-template'
import { usePracticeExercise } from '@/hooks/usePracticeExercise'
import { ExerciseGenerator } from '@/components/study/practice/ExerciseGenerator'
import { ExerciseDisplay } from '@/components/study/practice/ExerciseDisplay'
import { ExerciseResults } from '@/components/study/practice/ExerciseResults'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle } from 'lucide-react'
import { useTranslations } from '@/hooks/use-translations'

interface StudyPracticePageContentProps {
  level: string
  type: string
}

type PracticeView = 'generator' | 'exercise' | 'results'

export function StudyPracticePageContent({ level, type }: StudyPracticePageContentProps) {
  const [view, setView] = useState<PracticeView>('generator')
  const { t } = useTranslations()

  // Format the type for display using i18n
  const formatType = (type: string) => {
    return t(`study.practice.types.${type}`) || type
  }

  const breadcrumbs = [
    { label: t('study.practice.breadcrumbs.study'), href: '/study' },
    { label: `N${level}`, href: `/study/n${level}` },
    { label: formatType(type), href: `/study/n${level}/${type}` },
    { label: t('study.practice.breadcrumbs.practice'), href: '#' }
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
    generateExercise,
    loadExerciseSet,
    submitAnswer,
    nextQuestion,
    previousQuestion,
    skipQuestion,
    resetExercise,
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
  
  // Handle exercise generation
  const handleGenerate = async (params: { count: number; difficulty?: string; selectionMode: 'random' | 'sequential'; offset?: number; materialLimit?: number; model?: string; enableThinking?: boolean }) => {
    await generateExercise(params.count, params.difficulty, params.selectionMode, params.offset, params.model, params.enableThinking, params.materialLimit)
    if (!error) setView('exercise')
  }
  
  // Handle retry (same questions)
  const handleRetry = () => {
    if (session && session.exerciseSetId) {
      resetExercise()
      loadExerciseSet(session.exerciseSetId)
      setView('exercise')
    }
  }
  
  // Handle new exercise
  const handleNewExercise = () => {
    resetExercise()
    setView('generator')
  }
  
  // Handle answer submission
  const handleAnswer = (answerIndex: number) => {
    submitAnswer(answerIndex)
  }
  
  // Handle next question
  const handleNext = () => {
    // Always call nextQuestion - it will handle completion automatically
    // The onComplete callback will handle view transition for the last question
    nextQuestion()
  }

  return (
    <PageTemplate
      title={`JLPT N${level} ${formatType(type)} ${t('study.practice.breadcrumbs.practice')}`}
      description={t('study.practice.pageDescription')}
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
          
          {/* Main Content */}
          {view === 'generator' && (
            <ExerciseGenerator
              level={`n${level}`}
              type={type}
              onGenerate={handleGenerate}
              isGenerating={isGenerating}
            />
          )}
          
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
              onPrevious={previousQuestion}
              onSkip={skipQuestion}
              onToggleExplanation={toggleExplanation}
              isLastQuestion={currentQuestionIndex === questions.length - 1}
            />
          )}
          
          {view === 'results' && session && (
            <ExerciseResults
              session={session}
              score={score}
              accuracy={accuracy}
              onRetry={handleRetry}
              onNewExercise={handleNewExercise}
              level={`n${level}`}
              type={type}
            />
          )}
        </div>
      </div>
    </PageTemplate>
  )
}
