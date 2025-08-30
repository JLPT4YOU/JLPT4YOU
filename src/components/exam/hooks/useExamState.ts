"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { UseExamTimerReturn } from "./useExamTimer"

export interface Question {
  id: number
  question: string
  options: {
    A: string
    B: string
    C: string
    D: string
  }
  correctAnswer?: 'A' | 'B' | 'C' | 'D'
}

export interface ExamState {
  currentQuestion: number
  answers: Record<number, 'A' | 'B' | 'C' | 'D'>
  flagged: Set<number>
}

interface SubmissionStats {
  totalQuestions: number
  answeredQuestions: number
  unansweredQuestions: number
  flaggedQuestions: number
  timeRemaining: number
}

interface UseExamStateProps {
  examTitle: string
  examMode: 'practice' | 'challenge'
  questions: Question[]
  timer: UseExamTimerReturn
}

export function useExamState({
  examTitle,
  examMode,
  questions,
  timer
}: UseExamStateProps) {
  // Initialize exam state (without timer-related fields)
  const [examState, setExamState] = useState<ExamState>(() => {
    // For challenge mode, never restore from localStorage - always start fresh
    if (examMode === 'challenge') {
      return {
        currentQuestion: 1,
        answers: {},
        flagged: new Set()
      }
    }

    // Try to restore state from localStorage on component mount (practice mode only)
    if (typeof window !== 'undefined') {
      const savedState = localStorage.getItem(`exam-state-${examTitle}`)
      if (savedState) {
        try {
          const parsed = JSON.parse(savedState)
          return {
            currentQuestion: parsed.currentQuestion || 1,
            answers: parsed.answers || {},
            flagged: new Set(parsed.flagged || [])
          }
        } catch (error) {
          console.warn('Failed to restore exam state:', error)
        }
      }
    }

    return {
      currentQuestion: 1,
      answers: {},
      flagged: new Set()
    }
  })

  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [showSubmissionModal, setShowSubmissionModal] = useState(false)
  const saveStateTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Debounced save function to prevent performance issues
  const debouncedSaveState = useCallback((state: ExamState, timeRemaining: number) => {
    // Clear existing timeout
    if (saveStateTimeoutRef.current) {
      clearTimeout(saveStateTimeoutRef.current)
    }

    // Set new timeout - only save after 1 second of no changes
    saveStateTimeoutRef.current = setTimeout(() => {
      if (typeof window !== 'undefined' && examMode === 'practice') {
        const stateToSave = {
          ...state,
          flagged: Array.from(state.flagged),
          timeRemaining // Include timer state
        }
        localStorage.setItem(`exam-state-${examTitle}`, JSON.stringify(stateToSave))
      }
      saveStateTimeoutRef.current = null
    }, 1000)
  }, [examTitle, examMode])

  // Clean up localStorage for challenge mode on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && examMode === 'challenge') {
      // Remove any existing saved state to ensure fresh start
      localStorage.removeItem(`exam-state-${examTitle}`)
    }
  }, [examTitle, examMode])

  // Save exam state to localStorage with debouncing (practice mode only)
  useEffect(() => {
    if (examMode === 'practice') {
      debouncedSaveState(examState, timer.timeRemaining)
    }
  }, [examState, examMode, debouncedSaveState, timer.timeRemaining])

  // Cleanup timeout on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      if (saveStateTimeoutRef.current) {
        clearTimeout(saveStateTimeoutRef.current)
        saveStateTimeoutRef.current = null
      }
    }
  }, [])

  // Handle answer selection
  const handleAnswerSelect = useCallback((questionId: number, answer: 'A' | 'B' | 'C' | 'D') => {
    setExamState(prev => ({
      ...prev,
      answers: { ...prev.answers, [questionId]: answer }
    }))
  }, [])

  // Handle flag toggle
  const handleFlagToggle = useCallback((questionId: number) => {
    setExamState(prev => {
      const newFlagged = new Set(prev.flagged)
      if (newFlagged.has(questionId)) {
        newFlagged.delete(questionId)
      } else {
        newFlagged.add(questionId)
      }
      return { ...prev, flagged: newFlagged }
    })
  }, [])

  // Navigation functions
  const goToQuestion = useCallback((questionNumber: number) => {
    if (questionNumber >= 1 && questionNumber <= questions.length) {
      setExamState(prev => ({ ...prev, currentQuestion: questionNumber }))
      setSidebarOpen(false) // Close sidebar on mobile after selection
    }
  }, [questions.length])

  const goToPrevious = useCallback(() => {
    goToQuestion(examState.currentQuestion - 1)
  }, [examState.currentQuestion, goToQuestion])

  const goToNext = useCallback(() => {
    goToQuestion(examState.currentQuestion + 1)
  }, [examState.currentQuestion, goToQuestion])

  // Show flagged questions
  const showFlaggedQuestions = useCallback(() => {
    const flaggedArray = Array.from(examState.flagged)
    if (flaggedArray.length > 0) {
      goToQuestion(flaggedArray[0])
    }
  }, [examState.flagged, goToQuestion])

  // Calculate submission stats
  const getSubmissionStats = useCallback((): SubmissionStats => {
    const totalQuestions = questions.length
    const answeredQuestions = Object.keys(examState.answers).length
    const unansweredQuestions = totalQuestions - answeredQuestions
    const flaggedQuestions = examState.flagged.size

    return {
      totalQuestions,
      answeredQuestions,
      unansweredQuestions,
      flaggedQuestions,
      timeRemaining: timer.timeRemaining
    }
  }, [questions.length, examState.answers, examState.flagged.size, timer.timeRemaining])

  // Clear saved state (used on submission)
  const clearSavedState = useCallback(() => {
    if (typeof window !== 'undefined' && examMode === 'practice') {
      localStorage.removeItem(`exam-state-${examTitle}`)
    }
  }, [examTitle, examMode])

  return {
    examState,
    sidebarOpen,
    showSubmissionModal,
    setSidebarOpen,
    setShowSubmissionModal,
    handleAnswerSelect,
    handleFlagToggle,
    goToQuestion,
    goToPrevious,
    goToNext,
    showFlaggedQuestions,
    getSubmissionStats,
    clearSavedState
  }
}
