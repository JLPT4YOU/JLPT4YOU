"use client"

import { useEffect, useCallback, useState, createContext, useContext, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { AlertTriangle, X, CheckCircle, ExternalLink } from 'lucide-react'
import { ANIMATION_DURATIONS, EXAM_LIMITS, VIOLATION_TYPES } from '@/lib/constants'
import { useRouter } from 'next/navigation'
import { TranslationData } from '@/lib/i18n'
import { useTranslation } from '@/lib/use-translation'

// Navigation Protection Context
interface NavigationProtectionContextType {
  isProtected: boolean
  interceptNavigation: (action: () => void) => void
  showNavigationWarning: boolean
  setShowNavigationWarning: (show: boolean) => void
  pendingNavigation: (() => void) | null
  setPendingNavigation: (action: (() => void) | null) => void
}

const NavigationProtectionContext = createContext<NavigationProtectionContextType | null>(null)

export function useNavigationProtection() {
  const context = useContext(NavigationProtectionContext)
  if (!context) {
    return {
      isProtected: false,
      interceptNavigation: (action: () => void) => action(),
      showNavigationWarning: false,
      setShowNavigationWarning: () => {},
      pendingNavigation: null,
      setPendingNavigation: () => {}
    }
  }
  return context
}

interface NavigationProtectionProviderProps {
  isActive: boolean
  children: React.ReactNode
}

export function NavigationProtectionProvider({ isActive, children }: NavigationProtectionProviderProps) {
  const [showNavigationWarning, setShowNavigationWarning] = useState(false)
  const [pendingNavigation, setPendingNavigation] = useState<(() => void) | null>(null)

  const interceptNavigation = useCallback((action: () => void) => {
    if (isActive) {
      setShowNavigationWarning(true)
      setPendingNavigation(() => action)
    } else {
      action()
    }
  }, [isActive])

  const value = {
    isProtected: isActive,
    interceptNavigation,
    showNavigationWarning,
    setShowNavigationWarning,
    pendingNavigation,
    setPendingNavigation
  }

  return (
    <NavigationProtectionContext.Provider value={value}>
      {children}
    </NavigationProtectionContext.Provider>
  )
}

export interface AntiCheatViolation {
  type: 'fullscreen_exit' | 'window_blur' | 'tab_switch'
  timestamp: Date
  description: string
}

interface AntiCheatSystemProps {
  isActive: boolean
  onViolation: (violation: AntiCheatViolation) => void
  onMaxViolationsReached: () => void
  maxViolations?: number
  children: React.ReactNode
  translations: TranslationData
}

interface ViolationWarningProps {
  violationCount: number
  maxViolations: number
  onDismiss: () => void
  violation: AntiCheatViolation | null
  translations: TranslationData
}

interface NavigationWarningProps {
  isVisible: boolean
  onConfirm: () => void
  onCancel: () => void
  translations: TranslationData
}

// Navigation Warning Component
function NavigationWarning({ isVisible, onConfirm, onCancel, translations }: NavigationWarningProps) {
  const { t } = useTranslation(translations);

  if (!isVisible) return null

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-background/90 backdrop-blur-sm">
      <div className="w-full max-w-md mx-4 border-2 border-destructive bg-background rounded-2xl p-6 md:p-8">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <ExternalLink className="w-8 h-8 text-destructive" />
          </div>

          <h3 className="text-lg font-bold text-destructive mb-3">
            {t('exam.antiCheat.navigationWarning.title')}
          </h3>

          <p className="text-sm text-muted-foreground mb-4">
            {t('exam.antiCheat.navigationWarning.description')}
          </p>

          <div className="p-3 bg-muted/50 rounded-xl mb-4 text-left">
            <ul className="text-xs text-foreground space-y-1">
              {t('exam.antiCheat.navigationWarning.consequences').map((consequence: string, index: number) => (
                <li key={index}>• {consequence}</li>
              ))}
            </ul>
          </div>

          <p className="text-xs text-destructive font-medium mb-4">
            {t('exam.antiCheat.navigationWarning.confirmQuestion')}
          </p>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={onCancel}
              className="flex-1 rounded-xl bg-muted/30 hover:bg-accent/50"
            >
              {t('exam.antiCheat.navigationWarning.stayButton')}
            </Button>
            <Button
              variant="destructive"
              onClick={onConfirm}
              className="flex-1 rounded-xl"
            >
              {t('exam.antiCheat.navigationWarning.leaveButton')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

function ViolationWarning({ violationCount, maxViolations, onDismiss, violation, translations }: ViolationWarningProps) {
  const { t } = useTranslation(translations);

  if (!violation) return null

  const getViolationMessage = (type: AntiCheatViolation['type']) => {
    switch (type) {
      case 'fullscreen_exit':
        return t('exam.antiCheat.violationWarning.violations.fullscreen_exit')
      case 'window_blur':
        return t('exam.antiCheat.violationWarning.violations.window_blur')
      case 'tab_switch':
        return t('exam.antiCheat.violationWarning.violations.tab_switch')
      default:
        return t('exam.antiCheat.violationWarning.violations.default')
    }
  }

  const isMaxViolationsReached = violationCount >= maxViolations

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="w-full max-w-md mx-4 border-2 border-destructive bg-background rounded-2xl p-6 md:p-8">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
            {isMaxViolationsReached ? (
              <X className="w-8 h-8 text-destructive" />
            ) : (
              <AlertTriangle className="w-8 h-8 text-destructive" />
            )}
          </div>

          <h3 className="text-lg font-bold text-destructive mb-3">
            {isMaxViolationsReached
              ? t('exam.antiCheat.violationWarning.titleMaxReached')
              : t('exam.antiCheat.violationWarning.title')
            }
          </h3>

          <p className="text-sm text-muted-foreground mb-4">
            {isMaxViolationsReached
              ? t('exam.antiCheat.violationWarning.maxViolationsMessage')
              : getViolationMessage(violation.type)
            }
          </p>

          <div className="p-3 bg-muted/50 rounded-xl mb-4">
            <p className="text-sm font-medium text-foreground">
              {t('exam.antiCheat.violationWarning.warningCount')
                .replace('{count}', violationCount.toString())
                .replace('{max}', maxViolations.toString())
              }
            </p>
            {isMaxViolationsReached ? (
              <p className="text-xs text-destructive mt-2">
                {t('exam.antiCheat.violationWarning.examEndedMessage')}
              </p>
            ) : (
              <p className="text-xs text-muted-foreground mt-2">
                {t('exam.antiCheat.violationWarning.remainingWarnings')
                  .replace('{remaining}', (maxViolations - violationCount).toString())
                }
              </p>
            )}
          </div>

          {!isMaxViolationsReached && (
            <Button onClick={onDismiss} className="w-full rounded-xl">
              {t('exam.antiCheat.violationWarning.continueButton')}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

// Fullscreen Restored Notification
function FullscreenRestoredNotification({ isVisible, translations }: { isVisible: boolean; translations: TranslationData }) {
  const { t } = useTranslation(translations);

  if (!isVisible) return null

  return (
    <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top-2 duration-300">
      <div className="border-2 border-green-500/20 bg-green-500/10 rounded-xl p-3">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 bg-green-500/20 rounded-full flex items-center justify-center">
            <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
          </div>
          <span className="text-sm font-medium text-green-700 dark:text-green-300">
            {t('exam.antiCheat.fullscreenRestored')}
          </span>
        </div>
      </div>
    </div>
  )
}

export function AntiCheatSystem({
  isActive,
  onViolation,
  onMaxViolationsReached,
  maxViolations = 3,
  children,
  translations
}: AntiCheatSystemProps) {
  const router = useRouter()
  const [violations, setViolations] = useState<AntiCheatViolation[]>([])
  const [showWarning, setShowWarning] = useState(false)
  const [currentViolation, setCurrentViolation] = useState<AntiCheatViolation | null>(null)
  const [showFullscreenRestored, setShowFullscreenRestored] = useState(false)

  // Use refs for timers to avoid dependency issues
  const fullscreenGracePeriodRef = useRef<NodeJS.Timeout | null>(null)
  const restoredNotificationTimerRef = useRef<NodeJS.Timeout | null>(null)
  
  // Use the navigation protection context
  const { 
    showNavigationWarning, 
    setShowNavigationWarning, 
    pendingNavigation, 
    setPendingNavigation 
  } = useNavigationProtection()

  const reportViolation = useCallback((type: AntiCheatViolation['type'], description: string) => {
    if (!isActive) return

    const violation: AntiCheatViolation = {
      type,
      timestamp: new Date(),
      description
    }

    setViolations(prev => {
      const newViolations = [...prev, violation]
      
      // Check if max violations reached
      if (newViolations.length >= maxViolations) {
        // Auto-dismiss popup and trigger max violations callback after showing final warning
        setTimeout(() => {
          setShowWarning(false)
          setCurrentViolation(null)
          onMaxViolationsReached()
        }, ANIMATION_DURATIONS.TOAST.AUTO_DISMISS) // Show final warning for 3 seconds
      }
      
      return newViolations
    })

    setCurrentViolation(violation)
    setShowWarning(true)
    onViolation(violation)
  }, [isActive, maxViolations, onViolation, onMaxViolationsReached])

  // Fullscreen monitoring with grace period
  useEffect(() => {
    if (!isActive) return

    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        // User exited fullscreen - start grace period
        const graceTimer = setTimeout(() => {
          // If still not in fullscreen after grace period, report violation
          if (!document.fullscreenElement) {
            reportViolation('fullscreen_exit', 'User exited fullscreen mode')
          }
          fullscreenGracePeriodRef.current = null
        }, 3000) // 3 second grace period

        fullscreenGracePeriodRef.current = graceTimer
      } else {
        // User returned to fullscreen - clear grace period and show confirmation
        if (fullscreenGracePeriodRef.current) {
          clearTimeout(fullscreenGracePeriodRef.current)
          fullscreenGracePeriodRef.current = null

          // Show brief confirmation that fullscreen is restored
          setShowFullscreenRestored(true)

          // Clear any existing notification timer before setting new one
          if (restoredNotificationTimerRef.current) {
            clearTimeout(restoredNotificationTimerRef.current)
          }

          const notificationTimer = setTimeout(() => {
            setShowFullscreenRestored(false)
            restoredNotificationTimerRef.current = null
          }, 2000)
          restoredNotificationTimerRef.current = notificationTimer
        }
      }
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
      // Clean up timers on unmount to prevent memory leaks
      if (fullscreenGracePeriodRef.current) {
        clearTimeout(fullscreenGracePeriodRef.current)
        fullscreenGracePeriodRef.current = null
      }
      if (restoredNotificationTimerRef.current) {
        clearTimeout(restoredNotificationTimerRef.current)
        restoredNotificationTimerRef.current = null
      }
    }
  }, [isActive, reportViolation])

  // Window focus/blur monitoring
  useEffect(() => {
    if (!isActive) return

    const handleWindowBlur = () => {
      reportViolation('window_blur', 'User switched to another application')
    }

    const handleVisibilityChange = () => {
      if (document.hidden) {
        reportViolation('tab_switch', 'User switched to another tab')
      }
    }

    window.addEventListener('blur', handleWindowBlur)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      window.removeEventListener('blur', handleWindowBlur)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [isActive, reportViolation])

  // Right-click prevention (silent blocking - no violation reported)
  useEffect(() => {
    if (!isActive) return

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault()
      // Silent blocking - no violation reported for right-click attempts
    }

    document.addEventListener('contextmenu', handleContextMenu)
    return () => document.removeEventListener('contextmenu', handleContextMenu)
  }, [isActive])

  // Text selection prevention
  useEffect(() => {
    if (!isActive) return

    const handleSelectStart = (e: Event) => {
      e.preventDefault()
    }

    document.addEventListener('selectstart', handleSelectStart)
    return () => document.removeEventListener('selectstart', handleSelectStart)
  }, [isActive])

  // Browser navigation warning system (replace browser popup)
  useEffect(() => {
    if (!isActive) return

    let isNavigating = false

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      // Don't show browser popup, handle with custom popup instead
      if (!isNavigating) {
        e.preventDefault()
        return false // This prevents default browser popup
      }
    }

    // Handle navigation attempts (back button, forward button, etc.)
    const handlePopState = (e: PopStateEvent) => {
      if (!isNavigating) {
        e.preventDefault()
        // Show custom navigation warning
        setShowNavigationWarning(true)
        // Store the navigation action for later execution
        setPendingNavigation(() => () => {
          isNavigating = true
          router.push('/challenge')
        })
        // DO NOT push state here. We will handle it on cancel.
      }
    }

    // Prevent back button initially
    window.history.pushState(null, '', window.location.href)

    window.addEventListener('beforeunload', handleBeforeUnload)
    window.addEventListener('popstate', handlePopState)

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      window.removeEventListener('popstate', handlePopState)
    }
  }, [isActive, router, setShowNavigationWarning, setPendingNavigation])

  // Handle navigation warning responses
  const handleConfirmNavigation = useCallback(() => {
    setShowNavigationWarning(false)
    if (pendingNavigation) {
      pendingNavigation()
      setPendingNavigation(null)
    }
  }, [pendingNavigation, setShowNavigationWarning, setPendingNavigation])

  const handleCancelNavigation = useCallback(() => {
    setShowNavigationWarning(false)
    setPendingNavigation(null)
    // Since the back action has already occurred, we push the user forward
    // to "cancel" the navigation and stay on the page.
    router.forward()
  }, [setShowNavigationWarning, setPendingNavigation, router])

  const handleDismissWarning = () => {
    setShowWarning(false)
    setCurrentViolation(null)
  }



  return (
    <div className="relative">
      {children}

      {/* Violation Warning Modal */}
      {showWarning && (
        <ViolationWarning
          violationCount={violations.length}
          maxViolations={maxViolations}
          onDismiss={handleDismissWarning}
          violation={currentViolation}
          translations={translations}
        />
      )}

      {/* Navigation Warning Modal */}
      <NavigationWarning
        isVisible={showNavigationWarning}
        onConfirm={handleConfirmNavigation}
        onCancel={handleCancelNavigation}
        translations={translations}
      />

      {/* Fullscreen Restored Notification */}
      <FullscreenRestoredNotification isVisible={showFullscreenRestored} translations={translations} />
    </div>
  )
}

// Warning Badge Component for Exam Header
interface AntiCheatWarningBadgeProps {
  violationCount: number
  maxViolations: number
  isVisible: boolean
  translations: TranslationData
}

export function AntiCheatWarningBadge({ violationCount, maxViolations, isVisible, translations }: AntiCheatWarningBadgeProps) {
  const { t } = useTranslation(translations);

  if (!isVisible || violationCount === 0) return null

  return (
    <div className="flex items-center gap-2 bg-background border-2 border-red-400 rounded-lg px-3 py-2 dark:border-red-600">
      <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400" />
      {/* Mobile: Show only violation count */}
      <span className="block md:hidden text-xs font-bold text-red-700 dark:text-red-300">
        {violationCount}/{maxViolations}
      </span>
      {/* Desktop: Show full text */}
      <span className="hidden md:block text-xs font-bold text-red-700 dark:text-red-300">
        {t('exam.antiCheat.warningBadge')}: {violationCount}/{maxViolations}
      </span>
    </div>
  )
}
