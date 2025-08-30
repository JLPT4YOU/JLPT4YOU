"use client"

import { useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight, Play, Pause, RotateCcw, Settings, SkipForward, SkipBack } from 'lucide-react'
import { FlashcardData, FlashcardSession, FlashcardSettings, UserAction } from './flashcard-types'
import { FlashcardItem } from './flashcard-item'
import { useFlashcardLogic } from './use-flashcard-logic'
import { useTouchGestures, useHapticFeedback } from './use-touch-gestures'
import { cn } from '@/lib/utils'

interface FlashcardContainerProps {
  cards: FlashcardData[]
  onComplete?: (session: FlashcardSession) => void
  onExit?: () => void
  initialSettings?: Partial<FlashcardSettings>
  className?: string
}

export function FlashcardContainer({
  cards,
  onComplete,
  onExit,
  initialSettings,
  className
}: FlashcardContainerProps) {
  const {
    session,
    currentCard,
    canGoNext,
    canGoPrevious,
    handleAction,
    resetSession,
    // pagination
    batchSize,
    offset,
    skipNextBatch,
    skipPreviousBatch,
    resetCurrentBatch,
    changeBatchSize,
    toggleStar,
    totalCount,
    settings,
    updateSettings
  } = useFlashcardLogic(cards, initialSettings)

  // State for sidebar controls
  const [isPlaying, setIsPlaying] = useState(false)
  const [flipTick, setFlipTick] = useState(0)
  const [showSettings, setShowSettings] = useState(false)

  // Auto-play settings (ms)
  const FLIP_DELAY = 3500 // Thời gian xem mặt trước (3.5 giây)
  const NEXT_DELAY = 4000 // Thời gian xem mặt sau trước khi sang thẻ tiếp theo (4 giây)

  // Auto-play effect
  useEffect(() => {
    if (!isPlaying) return

    let flipTimer: any
    let nextTimer: any

    // 1) Flip to back after FLIP_DELAY
    flipTimer = setTimeout(() => {
      setFlipTick(prev => prev + 1)

      // 2) Then go to next after NEXT_DELAY
      nextTimer = setTimeout(() => {
        if (canGoNext) {
          handleAction('next')
        } else {
          // Reached the end: stop playing
          setIsPlaying(false)
        }
      }, NEXT_DELAY)
    }, FLIP_DELAY)

    return () => {
      clearTimeout(flipTimer)
      clearTimeout(nextTimer)
    }
  }, [isPlaying, session.currentIndex])

  // Close settings when clicking outside or pressing Escape
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (showSettings && !(e.target as Element).closest('.settings-modal')) {
        setShowSettings(false)
      }
    }

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showSettings) {
        setShowSettings(false)
      }
    }

    if (showSettings) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden' // Prevent background scroll
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [showSettings])



  // Touch gestures and haptic feedback
  const haptic = useHapticFeedback()
  const touchRef = useTouchGestures({
    onSwipeLeft: () => {
      if (canGoNext) {
        haptic.lightImpact()
        handleAction('next')
      }
    },
    onSwipeRight: () => {
      if (canGoPrevious) {
        haptic.lightImpact()
        handleAction('previous')
      }
    },
    onTap: () => {
      haptic.lightImpact()
      handleAction('flip')
    },
    enabled: true
  })

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      switch (e.key) {
        case ' ':
        case 'Enter':
          e.preventDefault()
          handleAction('flip')
          break
        case 'ArrowLeft':
          e.preventDefault()
          if (canGoPrevious) handleAction('previous')
          break
        case 'ArrowRight':
          e.preventDefault()
          if (canGoNext) handleAction('next')
          break

        case 'Escape':
          e.preventDefault()
          onExit?.()
          break
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [handleAction, canGoNext, canGoPrevious, onExit])

  // Auto-complete session
  useEffect(() => {
    if (session.currentIndex >= session.cards.length && onComplete) {
      onComplete(session)
    }
  }, [session, onComplete])

  if (!currentCard) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <div className="text-lg font-medium text-foreground">
            Phiên học hoàn thành!
          </div>
          <div className="text-muted-foreground">
            Bạn đã hoàn thành tất cả {cards.length} thẻ
          </div>
          <button
            onClick={() => onExit?.()}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
          >
            Quay lại
          </button>
        </div>
      </div>
    )
  }

  return (
    <div
      ref={touchRef as any}
      className={cn("w-full max-w-4xl mx-auto space-y-6", className)}
    >




      {/* Sidebar Navigation */}
      <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50">
        <div className="flex items-center space-x-2 bg-background/95 backdrop-blur-sm border border-border rounded-full px-4 py-3 shadow-lg">
          {/* Progress Display */}
          <div className="px-3 py-1 text-sm font-medium text-foreground min-w-[60px] text-center">
            {session.currentIndex + 1} / {session.cards.length}
          </div>

          {/* Divider */}
          <div className="w-px h-6 bg-border mx-2" />

          {/* Play/Pause Button */}
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className={cn(
              "p-2 rounded-full transition-all duration-200",
              isPlaying
                ? "bg-destructive text-destructive-foreground hover-destructive"
                : "bg-muted hover:bg-muted/80 text-foreground"
            )}
            title={isPlaying ? 'Tạm dừng' : 'Tự động phát'}
          >
            {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
          </button>

          {/* Reset Button */}
          <button
            onClick={() => {
              setIsPlaying(false);
              // Chỉ reset về thẻ đầu của batch hiện tại, không thay đổi offset/batchSize
              resetCurrentBatch();
            }}
            className="p-2 rounded-full bg-muted hover:bg-muted/80 text-foreground transition-all duration-200"
            title="Quay về thẻ đầu tiên của đợt hiện tại"
          >
            <RotateCcw className="w-5 h-5" />
          </button>

          {/* Settings Button */}
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 rounded-full bg-muted hover:bg-muted/80 text-foreground transition-all duration-200"
            title="Cài đặt flashcard"
          >
            <Settings className="w-5 h-5" />
          </button>

          {/* Skip Back Batch */}
          <button
            onClick={() => { setIsPlaying(false); skipPreviousBatch(); }}
            disabled={offset === 0}
            className={cn(
              "p-2 rounded-full transition-all duration-200",
              offset === 0
                ? "bg-muted/50 text-muted-foreground cursor-not-allowed"
                : "bg-muted hover:bg-muted/80 text-foreground"
            )}
            title="Quay về đợt trước"
          >
            <SkipBack className="w-5 h-5" />
          </button>

          {/* Skip Forward Batch */}
          <button
            onClick={() => { setIsPlaying(false); skipNextBatch(); }}
            disabled={offset + batchSize >= totalCount}
            className={cn(
              "p-2 rounded-full transition-all duration-200",
              offset + batchSize >= totalCount
                ? "bg-muted/50 text-muted-foreground cursor-not-allowed"
                : "bg-muted hover:bg-muted/80 text-foreground"
            )}
            title="Bỏ qua sang đợt tiếp theo"
          >
            <SkipForward className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Flashcard with Navigation */}
      <div className="space-y-6">
        {/* Flashcard */}
        <div className="flex justify-center">
          <FlashcardItem
            card={currentCard}
            isActive={true}
            onAction={handleAction}
            autoFlip={false}
            autoFlipDelay={0}
            showAudio={false}
            externalFlipTrigger={flipTick}
            onToggleStar={toggleStar}
            flipDirection={settings.flipDirection}
            className="w-full max-w-md"
          />
        </div>

        {/* Navigation Buttons Below - All devices */}
        <div className="flex items-center justify-center space-x-8">
          <button
            onClick={() => handleAction('previous')}
            disabled={!canGoPrevious}
            className={cn(
              "p-4 rounded-full transition-all duration-200 shadow-lg",
              canGoPrevious
                ? "bg-background/95 backdrop-blur-sm border border-border hover:bg-muted/50 text-foreground"
                : "bg-muted/30 text-muted-foreground cursor-not-allowed opacity-50"
            )}
            title="Thẻ trước"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          <button
            onClick={() => handleAction('next')}
            disabled={!canGoNext}
            className={cn(
              "p-4 rounded-full transition-all duration-200 shadow-lg",
              canGoNext
                ? "bg-background/95 backdrop-blur-sm border border-border hover:bg-muted/50 text-foreground"
                : "bg-muted/30 text-muted-foreground cursor-not-allowed opacity-50"
            )}
            title="Thẻ tiếp theo"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Settings Modal Popup */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="settings-modal bg-background border border-border rounded-2xl shadow-2xl w-full max-w-md mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h2 className="text-lg font-semibold text-foreground">Cài đặt Flashcard</h2>
              <button
                onClick={() => setShowSettings(false)}
                className="p-1 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Toggle Random */}
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-foreground">Xáo trộn thứ tự</div>
                  <div className="text-xs text-muted-foreground">Hiển thị thẻ theo thứ tự ngẫu nhiên</div>
                </div>
                <button
                  onClick={() => updateSettings({ shuffleCards: !settings.shuffleCards })}
                  className="w-11 h-6 bg-muted rounded-full relative transition-all duration-200 focus:outline-none"
                >
                  <div className={cn(
                    "w-5 h-5 bg-foreground rounded-full absolute top-0.5 transition-transform duration-200",
                    settings.shuffleCards ? "translate-x-5" : "translate-x-0.5"
                  )} />
                </button>
              </div>

              {/* Toggle Starred Only */}
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-foreground">Chỉ từ đánh dấu</div>
                  <div className="text-xs text-muted-foreground">Chỉ hiển thị những thẻ đã đánh dấu sao</div>
                </div>
                <button
                  onClick={() => updateSettings({ showStarredOnly: !settings.showStarredOnly })}
                  className="w-11 h-6 bg-muted rounded-full relative transition-all duration-200 focus:outline-none"
                >
                  <div className={cn(
                    "w-5 h-5 bg-foreground rounded-full absolute top-0.5 transition-transform duration-200",
                    settings.showStarredOnly ? "translate-x-5" : "translate-x-0.5"
                  )} />
                </button>
              </div>

              {/* Toggle Flip Direction */}
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-foreground">Đổi chiều lật</div>
                  <div className="text-xs text-muted-foreground">Hiển thị mặt sau trước, mặt trước sau</div>
                </div>
                <button
                  onClick={() => updateSettings({
                    flipDirection: settings.flipDirection === 'normal' ? 'reversed' : 'normal'
                  })}
                  className="w-11 h-6 bg-muted rounded-full relative transition-all duration-200 focus:outline-none"
                >
                  <div className={cn(
                    "w-5 h-5 bg-foreground rounded-full absolute top-0.5 transition-transform duration-200",
                    settings.flipDirection === 'reversed' ? "translate-x-5" : "translate-x-0.5"
                  )} />
                </button>
              </div>

              {/* Batch Size Input */}
              <div className="space-y-3">
                <div>
                  <div className="text-sm font-medium text-foreground">Số lượng từ mỗi đợt</div>
                  <div className="text-xs text-muted-foreground">Số lượng thẻ hiển thị trong một lần học</div>
                </div>
                <div className="flex items-center space-x-3">
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={batchSize}
                    onChange={(e) => {
                      const size = parseInt(e.target.value) || 10
                      changeBatchSize(size)
                    }}
                    className="flex-1 px-3 py-2 bg-muted border border-border rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <span className="text-sm text-muted-foreground">thẻ</span>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-border">
              <button
                onClick={() => setShowSettings(false)}
                className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
              >
                Xong
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
