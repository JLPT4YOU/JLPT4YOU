"use client"

import { useEffect, useRef, useState } from 'react'

interface TouchGestureOptions {
  onSwipeLeft?: () => void
  onSwipeRight?: () => void
  onSwipeUp?: () => void
  onSwipeDown?: () => void
  onTap?: () => void
  onDoubleTap?: () => void
  threshold?: number
  enabled?: boolean
}

export function useTouchGestures({
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onSwipeDown,
  onTap,
  onDoubleTap,
  threshold = 50,
  enabled = true
}: TouchGestureOptions) {
  const elementRef = useRef<HTMLElement>(null)
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null)
  const [touchEnd, setTouchEnd] = useState<{ x: number; y: number } | null>(null)
  const [lastTap, setLastTap] = useState<number>(0)

  useEffect(() => {
    const element = elementRef.current
    if (!element || !enabled) return

    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0]
      setTouchStart({ x: touch.clientX, y: touch.clientY })
      setTouchEnd(null)
    }

    const handleTouchMove = (e: TouchEvent) => {
      const touch = e.touches[0]
      setTouchEnd({ x: touch.clientX, y: touch.clientY })
    }

    const handleTouchEnd = (e: TouchEvent) => {
      if (!touchStart || !touchEnd) {
        // Handle tap
        const now = Date.now()
        const timeDiff = now - lastTap
        
        if (timeDiff < 300 && timeDiff > 0) {
          // Double tap
          onDoubleTap?.()
          setLastTap(0)
        } else {
          // Single tap
          setLastTap(now)
          setTimeout(() => {
            if (lastTap === now) {
              onTap?.()
            }
          }, 300)
        }
        return
      }

      // Calculate swipe distance
      const deltaX = touchEnd.x - touchStart.x
      const deltaY = touchEnd.y - touchStart.y
      const absDeltaX = Math.abs(deltaX)
      const absDeltaY = Math.abs(deltaY)

      // Determine swipe direction
      if (Math.max(absDeltaX, absDeltaY) > threshold) {
        if (absDeltaX > absDeltaY) {
          // Horizontal swipe
          if (deltaX > 0) {
            onSwipeRight?.()
          } else {
            onSwipeLeft?.()
          }
        } else {
          // Vertical swipe
          if (deltaY > 0) {
            onSwipeDown?.()
          } else {
            onSwipeUp?.()
          }
        }
      }

      // Reset
      setTouchStart(null)
      setTouchEnd(null)
    }

    // Add event listeners
    element.addEventListener('touchstart', handleTouchStart, { passive: true })
    element.addEventListener('touchmove', handleTouchMove, { passive: true })
    element.addEventListener('touchend', handleTouchEnd, { passive: true })

    return () => {
      element.removeEventListener('touchstart', handleTouchStart)
      element.removeEventListener('touchmove', handleTouchMove)
      element.removeEventListener('touchend', handleTouchEnd)
    }
  }, [
    touchStart,
    touchEnd,
    lastTap,
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp,
    onSwipeDown,
    onTap,
    onDoubleTap,
    threshold,
    enabled
  ])

  return elementRef
}

// Hook for keyboard shortcuts
export function useKeyboardShortcuts(
  shortcuts: Record<string, () => void>,
  enabled = true
) {
  useEffect(() => {
    if (!enabled) return

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) {
        return
      }

      const key = e.key.toLowerCase()
      const handler = shortcuts[key]
      
      if (handler) {
        e.preventDefault()
        handler()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [shortcuts, enabled])
}

// Hook for haptic feedback (mobile)
export function useHapticFeedback() {
  const vibrate = (pattern: number | number[] = 10) => {
    if ('vibrate' in navigator) {
      navigator.vibrate(pattern)
    }
  }

  const lightImpact = () => vibrate(10)
  const mediumImpact = () => vibrate(20)
  const heavyImpact = () => vibrate(30)
  const success = () => vibrate([10, 50, 10])
  const error = () => vibrate([50, 50, 50])

  return {
    vibrate,
    lightImpact,
    mediumImpact,
    heavyImpact,
    success,
    error
  }
}
