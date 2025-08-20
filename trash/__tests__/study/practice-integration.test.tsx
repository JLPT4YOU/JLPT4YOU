/**
 * Integration tests for Practice feature
 * Tests the complete flow: generate → answer → results
 */

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { StudyPracticePageContent } from '@/components/study/study-practice-page-content'

// Mock dependencies
jest.mock('@/hooks/use-translations', () => ({
  useTranslations: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'study.practice.breadcrumbs.study': 'Study',
        'study.practice.breadcrumbs.practice': 'Practice',
        'study.practice.types.vocabulary': 'Vocabulary',
        'study.practice.pageDescription': 'Test your knowledge with AI-powered practice exercises',
        'study.practice.generator.title': 'Generate AI-Powered Exercise',
        'study.practice.generator.generateButton': 'Generate Exercise',
        'study.practice.exercise.submitAnswer': 'Submit Answer',
        'study.practice.exercise.next': 'Next',
        'study.practice.exercise.complete': 'Complete',
        'study.practice.exercise.correct': 'Correct!',
        'study.practice.exercise.incorrect': 'Incorrect',
        'study.practice.results.title': 'Practice Results',
        'study.practice.results.actions.retry': 'Retry Same Questions',
        'study.practice.results.actions.newExercise': 'New Exercise'
      }
      return translations[key] || key
    }
  })
}))

jest.mock('@/lib/study/localStorage-service', () => ({
  studyStorage: {
    startSession: jest.fn(() => ({
      id: 'test-session',
      exerciseSetId: 'test-set',
      questions: mockQuestions,
      answers: []
    })),
    saveAnswer: jest.fn(),
    completeSession: jest.fn(() => ({
      id: 'test-session',
      exerciseSetId: 'test-set',
      questions: mockQuestions,
      answers: [
        { questionId: '1', questionIndex: 0, userAnswer: 0, isCorrect: true, timeSpent: 5000 }
      ],
      completedAt: new Date().toISOString(),
      timeSpent: 5000
    }))
  }
}))

jest.mock('@/utils/supabase/client', () => ({
  createClient: jest.fn(() => ({
    auth: {
      getSession: jest.fn(() => Promise.resolve({ data: { session: null } }))
    }
  }))
}))

const mockQuestions = [
  {
    id: '1',
    question: 'What does "こんにちは" mean?',
    options: ['Hello', 'Goodbye', 'Thank you', 'Excuse me'],
    correct: 0,
    explanation: 'こんにちは means "Hello" in Japanese'
  }
]

// Mock fetch for API calls
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({
      success: true,
      data: {
        setId: 'test-set',
        questions: mockQuestions
      }
    })
  })
) as jest.Mock

describe('Practice Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should complete full practice flow: generate → answer → results', async () => {
    render(<StudyPracticePageContent level="n5" type="vocabulary" />)

    // 1. Should start with generator view
    expect(screen.getByText('Generate AI-Powered Exercise')).toBeInTheDocument()

    // 2. Generate exercise
    const generateButton = screen.getByText('Generate Exercise')
    fireEvent.click(generateButton)

    // 3. Wait for exercise to load
    await waitFor(() => {
      expect(screen.getByText('What does "こんにちは" mean?')).toBeInTheDocument()
    })

    // 4. Select an answer
    const firstOption = screen.getByLabelText('Hello')
    fireEvent.click(firstOption)

    // 5. Submit answer
    const submitButton = screen.getByText('Submit Answer')
    fireEvent.click(submitButton)

    // 6. Should show explanation and next/complete button
    await waitFor(() => {
      expect(screen.getByText('Correct!')).toBeInTheDocument()
    })

    // 7. Complete exercise (since it's the last question)
    const completeButton = screen.getByText('Complete')
    fireEvent.click(completeButton)

    // 8. Should show results
    await waitFor(() => {
      expect(screen.getByText('Practice Results')).toBeInTheDocument()
    })

    // 9. Should have action buttons
    expect(screen.getByText('Retry Same Questions')).toBeInTheDocument()
    expect(screen.getByText('New Exercise')).toBeInTheDocument()
  })

  it('should handle retry functionality', async () => {
    render(<StudyPracticePageContent level="n5" type="vocabulary" />)

    // Complete a practice session first
    const generateButton = screen.getByText('Generate Exercise')
    fireEvent.click(generateButton)

    await waitFor(() => {
      expect(screen.getByText('What does "こんにちは" mean?')).toBeInTheDocument()
    })

    const firstOption = screen.getByLabelText('Hello')
    fireEvent.click(firstOption)

    const submitButton = screen.getByText('Submit Answer')
    fireEvent.click(submitButton)

    const completeButton = screen.getByText('Complete')
    fireEvent.click(completeButton)

    await waitFor(() => {
      expect(screen.getByText('Practice Results')).toBeInTheDocument()
    })

    // Click retry
    const retryButton = screen.getByText('Retry Same Questions')
    fireEvent.click(retryButton)

    // Should go back to exercise view with same questions
    await waitFor(() => {
      expect(screen.getByText('What does "こんにちは" mean?')).toBeInTheDocument()
    })
  })

  it('should handle new exercise functionality', async () => {
    render(<StudyPracticePageContent level="n5" type="vocabulary" />)

    // Complete a practice session first
    const generateButton = screen.getByText('Generate Exercise')
    fireEvent.click(generateButton)

    await waitFor(() => {
      expect(screen.getByText('What does "こんにちは" mean?')).toBeInTheDocument()
    })

    const firstOption = screen.getByLabelText('Hello')
    fireEvent.click(firstOption)

    const submitButton = screen.getByText('Submit Answer')
    fireEvent.click(submitButton)

    const completeButton = screen.getByText('Complete')
    fireEvent.click(completeButton)

    await waitFor(() => {
      expect(screen.getByText('Practice Results')).toBeInTheDocument()
    })

    // Click new exercise
    const newExerciseButton = screen.getByText('New Exercise')
    fireEvent.click(newExerciseButton)

    // Should go back to generator view
    await waitFor(() => {
      expect(screen.getByText('Generate AI-Powered Exercise')).toBeInTheDocument()
    })
  })

  it('should handle API errors gracefully', async () => {
    // Mock API error
    ;(global.fetch as jest.Mock).mockImplementationOnce(() =>
      Promise.resolve({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ error: 'Server error' })
      })
    )

    render(<StudyPracticePageContent level="n5" type="vocabulary" />)

    const generateButton = screen.getByText('Generate Exercise')
    fireEvent.click(generateButton)

    // Should stay on generator view and show error
    await waitFor(() => {
      expect(screen.getByText('Generate AI-Powered Exercise')).toBeInTheDocument()
    })
  })
})
