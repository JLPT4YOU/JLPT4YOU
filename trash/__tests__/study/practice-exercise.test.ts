/**
 * Tests for usePracticeExercise hook
 * Core functionality tests for Practice feature
 */

import { renderHook, act } from '@testing-library/react'
import { usePracticeExercise } from '@/hooks/usePracticeExercise'
import { studyStorage } from '@/lib/study/localStorage-service'

// Mock dependencies
jest.mock('@/lib/study/localStorage-service', () => ({
  studyStorage: {
    startSession: jest.fn(),
    saveAnswer: jest.fn(),
    completeSession: jest.fn(),
  }
}))

jest.mock('@/utils/supabase/client', () => ({
  createClient: jest.fn(() => ({
    auth: {
      getSession: jest.fn(() => Promise.resolve({ data: { session: null } }))
    }
  }))
}))

// Mock fetch
global.fetch = jest.fn()

describe('usePracticeExercise', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(fetch as jest.Mock).mockClear()
  })

  it('should initialize with default state', () => {
    const { result } = renderHook(() => 
      usePracticeExercise({ level: 'n5', type: 'vocabulary' })
    )

    expect(result.current.questions).toEqual([])
    expect(result.current.currentQuestionIndex).toBe(0)
    expect(result.current.isGenerating).toBe(false)
    expect(result.current.error).toBe(null)
    expect(result.current.score).toBe(0)
    expect(result.current.accuracy).toBe(0)
  })

  it('should handle successful exercise generation', async () => {
    const mockQuestions = [
      { id: '1', question: 'Test question', options: ['A', 'B', 'C', 'D'], correct: 0, explanation: 'Test explanation' }
    ]
    
    ;(fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        success: true,
        data: {
          setId: 'test-set-id',
          questions: mockQuestions
        }
      })
    })

    ;(studyStorage.startSession as jest.Mock).mockReturnValue({
      id: 'session-1',
      exerciseSetId: 'test-set-id',
      questions: mockQuestions
    })

    const { result } = renderHook(() => 
      usePracticeExercise({ level: 'n5', type: 'vocabulary' })
    )

    await act(async () => {
      await result.current.generateExercise(5)
    })

    expect(result.current.questions).toEqual(mockQuestions)
    expect(result.current.isGenerating).toBe(false)
    expect(result.current.error).toBe(null)
    expect(studyStorage.startSession).toHaveBeenCalledWith(
      'test-set-id',
      'n5',
      'vocabulary',
      mockQuestions
    )
  })

  it('should handle exercise generation error', async () => {
    ;(fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: () => Promise.resolve({ error: 'Server error' })
    })

    const onError = jest.fn()
    const { result } = renderHook(() => 
      usePracticeExercise({ level: 'n5', type: 'vocabulary', onError })
    )

    await act(async () => {
      await result.current.generateExercise(5)
    })

    expect(result.current.error).toBeTruthy()
    expect(result.current.isGenerating).toBe(false)
    expect(onError).toHaveBeenCalled()
  })

  it('should submit answer correctly', () => {
    const mockQuestions = [
      { id: '1', question: 'Test question', options: ['A', 'B', 'C', 'D'], correct: 0, explanation: 'Test explanation' }
    ]

    const { result } = renderHook(() => 
      usePracticeExercise({ level: 'n5', type: 'vocabulary' })
    )

    // Set up questions manually for testing
    act(() => {
      result.current.questions = mockQuestions
    })

    act(() => {
      result.current.submitAnswer(0) // Correct answer
    })

    expect(studyStorage.saveAnswer).toHaveBeenCalledWith(
      '1',
      0,
      0,
      0,
      expect.any(Number)
    )
    expect(result.current.showExplanation).toBe(true)
  })

  it('should navigate between questions', () => {
    const mockQuestions = [
      { id: '1', question: 'Question 1', options: ['A', 'B', 'C', 'D'], correct: 0, explanation: 'Test' },
      { id: '2', question: 'Question 2', options: ['A', 'B', 'C', 'D'], correct: 1, explanation: 'Test' }
    ]

    const { result } = renderHook(() => 
      usePracticeExercise({ level: 'n5', type: 'vocabulary' })
    )

    // Set up questions manually
    act(() => {
      result.current.questions = mockQuestions
    })

    expect(result.current.currentQuestionIndex).toBe(0)

    act(() => {
      result.current.nextQuestion()
    })

    expect(result.current.currentQuestionIndex).toBe(1)
    expect(result.current.showExplanation).toBe(false)

    act(() => {
      result.current.previousQuestion()
    })

    expect(result.current.currentQuestionIndex).toBe(0)
  })

  it('should complete exercise when reaching last question', () => {
    const mockQuestions = [
      { id: '1', question: 'Question 1', options: ['A', 'B', 'C', 'D'], correct: 0, explanation: 'Test' }
    ]

    const onComplete = jest.fn()
    const { result } = renderHook(() => 
      usePracticeExercise({ level: 'n5', type: 'vocabulary', onComplete })
    )

    // Set up questions and answers
    act(() => {
      result.current.questions = mockQuestions
      result.current.submitAnswer(0)
    })

    act(() => {
      result.current.nextQuestion() // This should trigger completion
    })

    expect(result.current.isCompleted).toBe(true)
  })

  it('should reset exercise correctly', () => {
    const { result } = renderHook(() =>
      usePracticeExercise({ level: 'n5', type: 'vocabulary' })
    )

    act(() => {
      result.current.resetExercise()
    })

    expect(result.current.questions).toEqual([])
    expect(result.current.currentQuestionIndex).toBe(0)
    expect(result.current.isCompleted).toBe(false)
    expect(result.current.score).toBe(0)
    expect(result.current.accuracy).toBe(0)
  })

  it('should retry exercise with same questions', () => {
    const { result } = renderHook(() =>
      usePracticeExercise({ level: 'n5', type: 'vocabulary' })
    )

    const mockQuestions = [
      { id: '1', question: 'Test?', options: ['A', 'B'], correct: 0, explanation: 'Test explanation', type: 'vocabulary' },
      { id: '2', question: 'Test2?', options: ['C', 'D'], correct: 1, explanation: 'Test explanation 2', type: 'vocabulary' }
    ]

    // Set up completed session with questions and answers
    act(() => {
      // Simulate a completed session
      result.current.questions = mockQuestions
      result.current.session = {
        id: 'test-session',
        exerciseSetId: 'test-set',
        level: 'n5',
        type: 'vocabulary',
        startedAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
        questions: mockQuestions,
        answers: [
          { questionId: '1', userAnswer: 0, isCorrect: true, timestamp: new Date().toISOString() },
          { id: '2', userAnswer: 0, isCorrect: false, timestamp: new Date().toISOString() }
        ],
        totalQuestions: 2
      }
      result.current.currentQuestionIndex = 1
      result.current.isCompleted = true
      result.current.score = 1
      result.current.accuracy = 50
    })

    // Retry exercise
    act(() => {
      result.current.retryExercise()
    })

    // Should reset to initial state but keep same questions
    expect(result.current.questions).toEqual(mockQuestions)
    expect(result.current.currentQuestionIndex).toBe(0)
    expect(result.current.isCompleted).toBe(false)
    expect(result.current.score).toBe(0)
    expect(result.current.accuracy).toBe(0)
    expect(result.current.session?.questions).toEqual(mockQuestions)
    expect(result.current.session?.exerciseSetId).toBe('test-set')
  })

  it('should get current question correctly', () => {
    const mockQuestions = [
      { id: '1', question: 'Question 1', options: ['A', 'B', 'C', 'D'], correct: 0, explanation: 'Test' },
      { id: '2', question: 'Question 2', options: ['A', 'B', 'C', 'D'], correct: 1, explanation: 'Test' }
    ]

    const { result } = renderHook(() => 
      usePracticeExercise({ level: 'n5', type: 'vocabulary' })
    )

    act(() => {
      result.current.questions = mockQuestions
    })

    expect(result.current.getCurrentQuestion()).toEqual(mockQuestions[0])

    act(() => {
      result.current.nextQuestion()
    })

    expect(result.current.getCurrentQuestion()).toEqual(mockQuestions[1])
  })

  it('should calculate progress correctly', () => {
    const mockQuestions = [
      { id: '1', question: 'Question 1', options: ['A', 'B', 'C', 'D'], correct: 0, explanation: 'Test' },
      { id: '2', question: 'Question 2', options: ['A', 'B', 'C', 'D'], correct: 1, explanation: 'Test' }
    ]

    const { result } = renderHook(() => 
      usePracticeExercise({ level: 'n5', type: 'vocabulary' })
    )

    act(() => {
      result.current.questions = mockQuestions
      result.current.submitAnswer(0) // Answer first question correctly
    })

    const progress = result.current.getProgress()
    expect(progress.current).toBe(1)
    expect(progress.total).toBe(2)
    expect(progress.answered).toBe(1)
    expect(progress.correct).toBe(1)
    expect(progress.percentage).toBe(50)
  })
})
