"use client"

import { useState, useEffect, useRef } from 'react'
import { Star } from 'lucide-react'
import { FlashcardData, CardState, UserAction } from './flashcard-types'
import { cn } from '@/lib/utils'

interface FlashcardItemProps {
  card: FlashcardData
  isActive: boolean
  onAction: (action: UserAction) => void
  autoFlip?: boolean
  autoFlipDelay?: number
  showAudio?: boolean
  className?: string
  externalFlipTrigger?: number
  onToggleStar?: (cardId: string) => void
  flipDirection?: 'normal' | 'reversed'
}

export function FlashcardItem({
  card,
  isActive,
  onAction,
  autoFlip = false,
  autoFlipDelay = 3,
  showAudio = true,
  className,
  externalFlipTrigger,
  onToggleStar,
  flipDirection = 'normal'
}: FlashcardItemProps) {
  const [cardState, setCardState] = useState<CardState>('front')
  const [isFlipping, setIsFlipping] = useState(false)

  // Auto flip functionality
  useEffect(() => {
    if (!autoFlip || !isActive || cardState === 'back') return

    const timer = setTimeout(() => {
      handleFlip()
    }, autoFlipDelay * 1000)

    return () => clearTimeout(timer)
  }, [autoFlip, autoFlipDelay, isActive, cardState])

  // Reset card state when card changes
  useEffect(() => {
    setCardState('front')
    setIsFlipping(false)
  }, [card.id])

  // Flip when external trigger changes (for auto-play)
  // Use a ref to track the previous trigger value to avoid race conditions
  const prevTriggerRef = useRef<number | undefined>(externalFlipTrigger)
  const cardIdRef = useRef<string>(card.id)

  useEffect(() => {
    if (!isActive || externalFlipTrigger === undefined) return

    // Reset trigger tracking when card changes to prevent stale triggers from previous card
    if (cardIdRef.current !== card.id) {
      prevTriggerRef.current = externalFlipTrigger
      cardIdRef.current = card.id
      return
    }

    // Only flip if the trigger actually changed and we're showing the front
    if (externalFlipTrigger !== prevTriggerRef.current && cardState === 'front') {
      handleFlip()
    }

    prevTriggerRef.current = externalFlipTrigger
  }, [externalFlipTrigger, isActive, cardState, card.id])

  const handleFlip = () => {
    if (isFlipping) return
    
    setIsFlipping(true)
    onAction('flip')
    
    setTimeout(() => {
      setCardState(prev => prev === 'front' ? 'back' : 'front')
      setIsFlipping(false)
    }, 300) // Animation duration
  }

  const handleAudio = (audioUrl?: string) => {
    if (audioUrl) {
      // Play audio file if available
      const audio = new Audio(audioUrl)
      audio.play().catch(console.error)
      return
    }

    // Text-to-speech fallback
    if ('speechSynthesis' in window) {
      // Stop any ongoing speech
      speechSynthesis.cancel()

      const text = cardState === 'front' ? card.front : card.back
      const utterance = new SpeechSynthesisUtterance(text)

      // Configure for Japanese
      utterance.lang = 'ja-JP'
      utterance.rate = 0.8 // Slightly slower for learning
      utterance.pitch = 1.0

      // Try to use Japanese voice if available
      const voices = speechSynthesis.getVoices()
      const japaneseVoice = voices.find(voice =>
        voice.lang.startsWith('ja') || voice.name.includes('Japanese')
      )
      if (japaneseVoice) {
        utterance.voice = japaneseVoice
      }

      speechSynthesis.speak(utterance)
    }
  }

  // Handle flip direction
  const isShowingFront = flipDirection === 'normal'
    ? cardState === 'front'
    : cardState === 'back'

  const currentContent = isShowingFront ? card.front : card.back
  const currentAudio = isShowingFront ? card.frontAudio : card.backAudio

  return (
    <div className={cn("relative w-full max-w-md mx-auto", className)}>
      {/* Main Card */}
      <div
        className={cn(
          "relative h-80 cursor-pointer transition-all duration-300 transform-gpu",
          "bg-card border border-border rounded-2xl shadow-lg",
          "hover:shadow-xl hover:scale-[1.02]",
          isFlipping && "scale-95",
          !isActive && "opacity-50 scale-95"
        )}
        onClick={handleFlip}
        style={{
          perspective: '1000px'
        }}
      >
        {/* Star Button */}
        <button
          onClick={(e) => {
            e.stopPropagation()
            onToggleStar?.(card.id)
          }}
          className={cn(
            "absolute top-4 right-4 z-10 p-1 rounded-full transition-all duration-200",
            "hover:bg-background/80 backdrop-blur-sm",
            card.isStarred
              ? "text-yellow-500 hover:text-yellow-600"
              : "text-muted-foreground hover:text-foreground"
          )}
          title={card.isStarred ? "Bỏ đánh dấu" : "Đánh dấu để xem lại"}
        >
          <Star className={cn("w-5 h-5", card.isStarred && "fill-current")} />
        </button>

        {/* Card Content */}
        {/* Front Side */}
        <div
          className={cn(
            "absolute inset-0 w-full h-full rounded-2xl",
            "flex flex-col items-center justify-center p-6",
            "bg-card border border-border",
            "backface-hidden",
            !isShowingFront && "hidden"
          )}
        >
          <div className="text-center space-y-4 w-full">
            {/* Main Text */}
            <div className="text-2xl md:text-3xl font-bold text-foreground">
              {isShowingFront ? card.front : card.back}
            </div>




          </div>
        </div>

        {/* Back Side */}
        <div
          className={cn(
            "absolute inset-0 w-full h-full rounded-2xl",
            "flex flex-col justify-center p-6",
            "bg-card border border-border",
            "backface-hidden",
            isShowingFront && "hidden"
          )}
        >
          <div className="text-center space-y-4 w-full">
            {/* Parse and display information based on card type */}
            {(() => {
              const content = isShowingFront ? card.front : card.back
              const sections = content.split('\n\n')

              if (card.type === 'vocabulary') {
                // Vocabulary format: Meaning \n\n Đọc: hiragana \n\n Ví dụ: example \n\n English: meaning
                const hiragana = sections.find(s => s.startsWith('Đọc:'))?.replace('Đọc: ', '') || ''
                const example = sections.find(s => s.startsWith('Ví dụ:'))?.replace('Ví dụ: ', '') || ''
                const vietnameseMeaning = sections[0] || ''
                const englishMeaning = sections.find(s => s.startsWith('English:'))?.replace('English: ', '') || ''

                return (
                  <>
                    {/* 1. Hiragana */}
                    {hiragana && (
                      <div className="text-lg font-medium text-foreground">
                        {hiragana}
                      </div>
                    )}

                    {/* 2. Nghĩa tiếng Việt */}
                    {vietnameseMeaning && (
                      <div className="text-xl font-bold text-foreground">
                        {vietnameseMeaning}
                      </div>
                    )}

                    {/* 3. Nghĩa tiếng Anh */}
                    {englishMeaning && (
                      <div className="text-base text-foreground">
                        {englishMeaning}
                      </div>
                    )}

                    {/* 4. Ví dụ - ở dưới cùng */}
                    {example && (
                      <div className="text-base text-foreground leading-relaxed mt-2 pt-2 border-t border-border/30">
                        {example}
                      </div>
                    )}
                  </>
                )
              } else {
                // Grammar format: Meaning \n\n English: meaning \n\n Structure: structure \n\n Usage: usage \n\n Ví dụ: jp \n vn \n en
                const vietnameseMeaning = sections[0] || ''
                const englishMeaning = sections.find(s => s.startsWith('English:'))?.replace('English: ', '') || ''
                const structure = sections.find(s => s.startsWith('Cấu trúc:'))?.replace('Cấu trúc: ', '') || ''
                const usage = sections.find(s => s.startsWith('Cách dùng:'))?.replace('Cách dùng: ', '') || ''

                // Parse example with 3 lines: jp, vn, en
                const exampleSection = sections.find(s => s.startsWith('Ví dụ:'))
                let exampleJp = '', exampleVn = '', exampleEn = ''
                if (exampleSection) {
                  const exampleLines = exampleSection.replace('Ví dụ: ', '').split('\n')
                  exampleJp = exampleLines[0] || ''
                  exampleVn = exampleLines[1] || ''
                  exampleEn = exampleLines[2] || ''
                }

                return (
                  <>
                    {/* 1. Nghĩa tiếng Việt */}
                    {vietnameseMeaning && (
                      <div className="text-xl font-bold text-foreground">
                        {vietnameseMeaning}
                      </div>
                    )}

                    {/* 2. Nghĩa tiếng Anh */}
                    {englishMeaning && (
                      <div className="text-base text-foreground">
                        {englishMeaning}
                      </div>
                    )}

                    {/* 3. Cấu trúc */}
                    {structure && (
                      <div className="text-sm text-muted-foreground">
                        Cấu trúc: {structure}
                      </div>
                    )}

                    {/* 4. Ví dụ - ở dưới cùng với 3 dòng */}
                    {exampleJp && (
                      <div className="text-base text-foreground leading-relaxed mt-2 pt-2 border-t border-border/30 space-y-1">
                        <div>{exampleJp}</div>
                        {exampleVn && <div>{exampleVn}</div>}
                        {exampleEn && <div>{exampleEn}</div>}
                      </div>
                    )}
                  </>
                )
              }
            })()}


          </div>

        </div>
      </div>
    </div>
  )
}
