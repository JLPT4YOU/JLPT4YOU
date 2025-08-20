/**
 * Anti-cheat hook for exam monitoring
 * Extracts core anti-cheat logic from the large anti-cheat-system component
 */

"use client"

import { useState, useEffect, useCallback, useRef } from 'react'
import { VIOLATION_TYPES, ANIMATION_DURATIONS, EXAM_LIMITS } from '@/lib/constants'

// Violation types
export type ViolationType = 'TAB_SWITCH' | 'WINDOW_BLUR' | 'FULLSCREEN_EXIT' | 'COPY_PASTE' | 'RIGHT_CLICK' | 'KEYBOARD_SHORTCUT'

// Anti-cheat violation interface
export interface AntiCheatViolation {
  type: ViolationType
  timestamp: Date
  message: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  details?: Record<string, unknown>
}

// Anti-cheat configuration
export interface AntiCheatConfig {
  isActive: boolean
  maxViolations: number
  enableFullscreenMonitoring: boolean
  enableTabSwitchDetection: boolean
  enableCopyPasteDetection: boolean
  enableRightClickBlocking: boolean
  enableKeyboardShortcutBlocking: boolean
  gracePeriodMs: number
  autoSubmitOnMaxViolations: boolean
}

// Anti-cheat state
export interface AntiCheatState {
  violations: AntiCheatViolation[]
  violationCount: number
  isFullscreen: boolean
  isTabActive: boolean
  showWarning: boolean
  currentViolation: AntiCheatViolation | null
  isBlocked: boolean
}

// Default configuration
const DEFAULT_CONFIG: AntiCheatConfig = {
  isActive: true,
  maxViolations: EXAM_LIMITS.MAX_VIOLATIONS,
  enableFullscreenMonitoring: true,
  enableTabSwitchDetection: true,
  enableCopyPasteDetection: true,
  enableRightClickBlocking: true,
  enableKeyboardShortcutBlocking: true,
  gracePeriodMs: ANIMATION_DURATIONS.TOAST.AUTO_DISMISS,
  autoSubmitOnMaxViolations: true
}

// Hook return interface
export interface UseAntiCheatReturn {
  state: AntiCheatState
  config: AntiCheatConfig
  reportViolation: (type: keyof typeof VIOLATION_TYPES, details?: Record<string, unknown>) => void
  dismissWarning: () => void
  requestFullscreen: () => Promise<boolean>
  exitFullscreen: () => Promise<void>
  resetViolations: () => void
  updateConfig: (newConfig: Partial<AntiCheatConfig>) => void
}

/**
 * Enhanced anti-cheat hook with comprehensive monitoring
 */
export function useAntiCheat(
  initialConfig: Partial<AntiCheatConfig> = {},
  onMaxViolationsReached?: () => void,
  onViolation?: (violation: AntiCheatViolation) => void
): UseAntiCheatReturn {
  // Merge config with defaults
  const config = { ...DEFAULT_CONFIG, ...initialConfig }

  // State management
  const [state, setState] = useState<AntiCheatState>({
    violations: [],
    violationCount: 0,
    isFullscreen: false,
    isTabActive: true,
    showWarning: false,
    currentViolation: null,
    isBlocked: false
  })

  // Refs for cleanup and timers
  const fullscreenGracePeriodRef = useRef<NodeJS.Timeout | null>(null)
  const warningTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const restoredNotificationTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Report violation function
  const reportViolation = useCallback((
    type: keyof typeof VIOLATION_TYPES,
    details: Record<string, unknown> = {}
  ) => {
    if (!config.isActive) return

    const violation: AntiCheatViolation = {
      type,
      timestamp: new Date(),
      message: getViolationMessage(type),
      severity: getViolationSeverity(type),
      details
    }

    setState(prevState => {
      const newViolations = [...prevState.violations, violation]
      const newViolationCount = newViolations.length

      // Check if max violations reached
      const maxReached = newViolationCount >= config.maxViolations

      return {
        ...prevState,
        violations: newViolations,
        violationCount: newViolationCount,
        showWarning: true,
        currentViolation: violation,
        isBlocked: maxReached
      }
    })

    // Call violation callback
    onViolation?.(violation)

    // Handle max violations
    if (state.violationCount + 1 >= config.maxViolations) {
      if (config.autoSubmitOnMaxViolations) {
        // Auto-dismiss warning and trigger max violations callback
        warningTimeoutRef.current = setTimeout(() => {
          setState(prev => ({
            ...prev,
            showWarning: false,
            currentViolation: null
          }))
          onMaxViolationsReached?.()
        }, config.gracePeriodMs)
      }
    }
  }, [config, state.violationCount, onViolation, onMaxViolationsReached])

  // Dismiss warning function
  const dismissWarning = useCallback(() => {
    setState(prev => ({
      ...prev,
      showWarning: false,
      currentViolation: null
    }))

    // Clear warning timeout
    if (warningTimeoutRef.current) {
      clearTimeout(warningTimeoutRef.current)
      warningTimeoutRef.current = null
    }
  }, [])

  // Fullscreen management
  const requestFullscreen = useCallback(async (): Promise<boolean> => {
    if (!config.enableFullscreenMonitoring) return true

    try {
      const element = document.documentElement
      
      if (element.requestFullscreen) {
        await element.requestFullscreen()
      } else if ('webkitRequestFullscreen' in element) {
        await (element as HTMLElement & { webkitRequestFullscreen(): Promise<void> }).webkitRequestFullscreen()
      } else if ('msRequestFullscreen' in element) {
        await (element as HTMLElement & { msRequestFullscreen(): Promise<void> }).msRequestFullscreen()
      }

      return true
    } catch (error) {
      console.error('Failed to request fullscreen:', error)
      reportViolation('FULLSCREEN_EXIT', {
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      return false
    }
  }, [config.enableFullscreenMonitoring, reportViolation])

  const exitFullscreen = useCallback(async (): Promise<void> => {
    try {
      if (document.exitFullscreen) {
        await document.exitFullscreen()
      } else if ('webkitExitFullscreen' in document) {
        await (document as Document & { webkitExitFullscreen(): Promise<void> }).webkitExitFullscreen()
      } else if ('msExitFullscreen' in document) {
        await (document as Document & { msExitFullscreen(): Promise<void> }).msExitFullscreen()
      }
    } catch (error) {
      console.error('Failed to exit fullscreen:', error)
    }
  }, [])

  // Reset violations
  const resetViolations = useCallback(() => {
    setState(prev => ({
      ...prev,
      violations: [],
      violationCount: 0,
      showWarning: false,
      currentViolation: null,
      isBlocked: false
    }))
  }, [])

  // Update configuration
  const updateConfig = useCallback((newConfig: Partial<AntiCheatConfig>) => {
    Object.assign(config, newConfig)
  }, [config])

  // Fullscreen monitoring
  useEffect(() => {
    if (!config.isActive || !config.enableFullscreenMonitoring) return

    const handleFullscreenChange = () => {
      const isCurrentlyFullscreen = !!(
        document.fullscreenElement ||
        ('webkitFullscreenElement' in document && (document as Document & { webkitFullscreenElement: Element | null }).webkitFullscreenElement) ||
        ('msFullscreenElement' in document && (document as Document & { msFullscreenElement: Element | null }).msFullscreenElement)
      )

      setState(prev => ({ ...prev, isFullscreen: isCurrentlyFullscreen }))

      if (!isCurrentlyFullscreen) {
        // User exited fullscreen - start grace period
        fullscreenGracePeriodRef.current = setTimeout(() => {
          // If still not in fullscreen after grace period, report violation
          if (!document.fullscreenElement) {
            reportViolation('FULLSCREEN_EXIT')
          }
          fullscreenGracePeriodRef.current = null
        }, config.gracePeriodMs)
      } else {
        // User entered fullscreen - clear grace period and show restored notification
        if (fullscreenGracePeriodRef.current) {
          clearTimeout(fullscreenGracePeriodRef.current)
          fullscreenGracePeriodRef.current = null
        }
      }
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange)
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange)
    document.addEventListener('msfullscreenchange', handleFullscreenChange)

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange)
      document.removeEventListener('msfullscreenchange', handleFullscreenChange)
    }
  }, [config.isActive, config.enableFullscreenMonitoring, config.gracePeriodMs, reportViolation])

  // Tab visibility monitoring
  useEffect(() => {
    if (!config.isActive || !config.enableTabSwitchDetection) return

    const handleVisibilityChange = () => {
      const isTabActive = !document.hidden
      setState(prev => ({ ...prev, isTabActive }))

      if (!isTabActive) {
        reportViolation('TAB_SWITCH')
      }
    }

    const handleWindowBlur = () => {
      setState(prev => ({ ...prev, isTabActive: false }))
      reportViolation('WINDOW_BLUR')
    }

    const handleWindowFocus = () => {
      setState(prev => ({ ...prev, isTabActive: true }))
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('blur', handleWindowBlur)
    window.addEventListener('focus', handleWindowFocus)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('blur', handleWindowBlur)
      window.removeEventListener('focus', handleWindowFocus)
    }
  }, [config.isActive, config.enableTabSwitchDetection, reportViolation])

  // Keyboard shortcut blocking
  useEffect(() => {
    if (!config.isActive || !config.enableKeyboardShortcutBlocking) return

    const handleKeyDown = (event: KeyboardEvent) => {
      // Block common shortcuts
      const blockedShortcuts = [
        // Developer tools
        { key: 'F12' },
        { key: 'I', ctrlKey: true, shiftKey: true },
        { key: 'J', ctrlKey: true, shiftKey: true },
        { key: 'U', ctrlKey: true },
        // Copy/paste
        { key: 'C', ctrlKey: true },
        { key: 'V', ctrlKey: true },
        { key: 'X', ctrlKey: true },
        // Navigation
        { key: 'R', ctrlKey: true },
        { key: 'F5' },
        // Alt+Tab
        { key: 'Tab', altKey: true }
      ]

      const isBlocked = blockedShortcuts.some(shortcut => {
        return event.key === shortcut.key &&
               (!shortcut.ctrlKey || event.ctrlKey) &&
               (!shortcut.shiftKey || event.shiftKey) &&
               (!shortcut.altKey || event.altKey)
      })

      if (isBlocked) {
        event.preventDefault()
        event.stopPropagation()
        reportViolation('KEYBOARD_SHORTCUT', {
          key: event.key,
          ctrlKey: event.ctrlKey,
          shiftKey: event.shiftKey,
          altKey: event.altKey
        })
      }
    }

    document.addEventListener('keydown', handleKeyDown, true)

    return () => {
      document.removeEventListener('keydown', handleKeyDown, true)
    }
  }, [config.isActive, config.enableKeyboardShortcutBlocking, reportViolation])

  // Copy/paste detection
  useEffect(() => {
    if (!config.isActive || !config.enableCopyPasteDetection) return

    const handleCopy = (event: ClipboardEvent) => {
      event.preventDefault()
      reportViolation('COPY_PASTE', { action: 'copy' })
    }

    const handlePaste = (event: ClipboardEvent) => {
      event.preventDefault()
      reportViolation('COPY_PASTE', { action: 'paste' })
    }

    document.addEventListener('copy', handleCopy)
    document.addEventListener('paste', handlePaste)

    return () => {
      document.removeEventListener('copy', handleCopy)
      document.removeEventListener('paste', handlePaste)
    }
  }, [config.isActive, config.enableCopyPasteDetection, reportViolation])

  // Right-click blocking
  useEffect(() => {
    if (!config.isActive || !config.enableRightClickBlocking) return

    const handleContextMenu = (event: MouseEvent) => {
      event.preventDefault()
      reportViolation('RIGHT_CLICK')
    }

    document.addEventListener('contextmenu', handleContextMenu)

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu)
    }
  }, [config.isActive, config.enableRightClickBlocking, reportViolation])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (fullscreenGracePeriodRef.current) {
        clearTimeout(fullscreenGracePeriodRef.current)
      }
      if (warningTimeoutRef.current) {
        clearTimeout(warningTimeoutRef.current)
      }
      if (restoredNotificationTimerRef.current) {
        clearTimeout(restoredNotificationTimerRef.current)
      }
    }
  }, [])

  return {
    state,
    config,
    reportViolation,
    dismissWarning,
    requestFullscreen,
    exitFullscreen,
    resetViolations,
    updateConfig
  }
}

// Helper functions
function getViolationMessage(type: ViolationType): string {
  const messages = {
    'TAB_SWITCH': 'Tab switching detected',
    'WINDOW_BLUR': 'Window focus lost',
    'FULLSCREEN_EXIT': 'Fullscreen mode exited',
    'COPY_PASTE': 'Copy/paste attempt detected',
    'RIGHT_CLICK': 'Right-click blocked',
    'KEYBOARD_SHORTCUT': 'Keyboard shortcut blocked'
  }
  return messages[type] || 'Unknown violation'
}

function getViolationSeverity(type: ViolationType): 'low' | 'medium' | 'high' | 'critical' {
  const severityMap = {
    'TAB_SWITCH': 'high' as const,
    'WINDOW_BLUR': 'high' as const,
    'FULLSCREEN_EXIT': 'critical' as const,
    'COPY_PASTE': 'medium' as const,
    'RIGHT_CLICK': 'low' as const,
    'KEYBOARD_SHORTCUT': 'medium' as const
  }
  return severityMap[type] || 'medium'
}