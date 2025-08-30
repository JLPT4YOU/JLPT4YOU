import { useState, useEffect, useCallback } from 'react'

export interface UseExamTimerOptions {
  timeLimit: number // in minutes
  examMode: 'practice' | 'challenge'
  onTimeUp: () => void
  initialTimeRemaining?: number // for restoring from localStorage
}

export interface UseExamTimerReturn {
  timeRemaining: number
  isPaused: boolean
  formatTime: (seconds: number) => string
  pause: () => void
  resume: () => void
  setPaused: (paused: boolean) => void
  setOnTimeUp: (callback: () => void) => void
}

export function useExamTimer({
  timeLimit,
  examMode,
  onTimeUp,
  initialTimeRemaining
}: UseExamTimerOptions): UseExamTimerReturn {
  // Initialize time remaining
  const [timeRemaining, setTimeRemaining] = useState<number>(() => {
    return initialTimeRemaining ?? timeLimit * 60
  })

  const [isPaused, setIsPaused] = useState(false)
  const [timeUpCallback, setTimeUpCallback] = useState<() => void>(() => onTimeUp)

  // Format time display - extracted from original component
  const formatTime = useCallback((seconds: number): string => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`
  }, [])

  // Pause/resume functions
  const pause = useCallback(() => {
    // Challenge mode should never be paused
    if (examMode === 'challenge') return
    setIsPaused(true)
  }, [examMode])

  const resume = useCallback(() => {
    setIsPaused(false)
  }, [])

  const setPaused = useCallback((paused: boolean) => {
    // Challenge mode should never be paused
    if (examMode === 'challenge') return
    setIsPaused(paused)
  }, [examMode])

  const setOnTimeUp = useCallback((callback: () => void) => {
    setTimeUpCallback(() => callback)
  }, [])

  // Timer effect - extracted from original component
  useEffect(() => {
    // Don't start timer if time is already up
    if (timeRemaining <= 0) return

    // For practice mode: respect pause state
    // For challenge mode: never pause (isPaused should always be false anyway)
    const shouldPauseTimer = examMode === 'practice' && isPaused
    if (shouldPauseTimer) return

    const timer = setInterval(() => {
      setTimeRemaining(prev => Math.max(0, prev - 1))
    }, 1000)

    return () => clearInterval(timer)
  }, [isPaused, timeRemaining, examMode])

  // Auto submit when time runs out - extracted from original component
  useEffect(() => {
    if (timeRemaining === 0) {
      timeUpCallback()
    }
  }, [timeRemaining, timeUpCallback])

  return {
    timeRemaining,
    isPaused,
    formatTime,
    pause,
    resume,
    setPaused,
    setOnTimeUp
  }
}
