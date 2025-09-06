"use client"

import { useState, useCallback, useMemo, useEffect } from 'react'
import { FlashcardData, FlashcardSession, FlashcardSettings, FlashcardProgress, FlashcardStats, UserAction } from './flashcard-types'

const DEFAULT_SETTINGS: FlashcardSettings = {
  autoFlip: false,
  autoFlipDelay: 3,
  showProgress: true,
  shuffleCards: false,
  audioEnabled: true,
  showHints: true,
  spacedRepetition: true,
  showStarredOnly: false,
  flipDirection: 'normal',
  batchSize: 10
}

export function useFlashcardLogic(
  initialCards: FlashcardData[],
  initialSettings?: Partial<FlashcardSettings>
) {
  const [settings, setSettings] = useState<FlashcardSettings>({
    ...DEFAULT_SETTINGS,
    ...initialSettings
  })

  const [session, setSession] = useState<FlashcardSession>(() => {
    const cards = settings.shuffleCards ? shuffleArray([...initialCards]) : initialCards
    return {
      id: generateSessionId(),
      cards,
      currentIndex: 0,
      startTime: new Date(),
      correctAnswers: 0,
      totalAnswers: 0,
      mode: 'study',
      settings
    }
  })

  // Pagination state: batch size and current offset
  const [batchSize, setBatchSize] = useState<number>(settings.batchSize)
  const [offset, setOffset] = useState<number>(0)

  // Keep a stable shuffled version if shuffle is enabled
  const [shuffledCards, setShuffledCards] = useState<FlashcardData[]>(() => {
    return settings.shuffleCards ? shuffleArray([...initialCards]) : initialCards
  })

  // Only re-shuffle when shuffleCards setting changes, not on every offset change
  useEffect(() => {
    let filteredCards = initialCards

    // Filter starred cards if showStarredOnly is enabled
    if (settings.showStarredOnly) {
      filteredCards = initialCards.filter(card => card.isStarred)
    }

    if (settings.shuffleCards) {
      setShuffledCards(shuffleArray([...filteredCards]))
    } else {
      setShuffledCards(filteredCards)
    }
    setOffset(0) // Reset to beginning when settings change
  }, [settings.shuffleCards, settings.showStarredOnly, initialCards])

  // Slice cards for current batch from stable shuffled array
  useEffect(() => {
    const sliced = shuffledCards.slice(offset, offset + batchSize)
    setSession(prev => ({
      ...prev,
      cards: sliced,
      currentIndex: 0,
    }))
  }, [shuffledCards, offset, batchSize])

  const [progressHistory, setProgressHistory] = useState<FlashcardProgress[]>([])

  // Current card
  const currentCard = useMemo(() => {
    return session.cards[session.currentIndex] || null
  }, [session.cards, session.currentIndex])

  // Navigation state
  const canGoNext = session.currentIndex < session.cards.length - 1
  const canGoPrevious = session.currentIndex > 0

  // Statistics
  const stats = useMemo((): FlashcardStats => {
    const totalCards = session.cards.length
    const studiedCards = Math.min(session.currentIndex + 1, totalCards)
    const masteredCards = progressHistory.filter(p => p.isCorrect).length
    const averageAccuracy = session.totalAnswers > 0 
      ? (session.correctAnswers / session.totalAnswers) * 100 
      : 0
    
    const totalStudyTime = session.endTime 
      ? (session.endTime.getTime() - session.startTime.getTime()) / (1000 * 60)
      : (new Date().getTime() - session.startTime.getTime()) / (1000 * 60)

    // Calculate streak (consecutive correct answers)
    let streak = 0
    for (let i = progressHistory.length - 1; i >= 0; i--) {
      if (progressHistory[i].isCorrect) {
        streak++
      } else {
        break
      }
    }

    return {
      totalCards,
      studiedCards,
      masteredCards,
      averageAccuracy,
      totalStudyTime,
      streak,
      lastStudyDate: new Date()
    }
  }, [session, progressHistory])

  // Handle user actions
  const handleAction = useCallback((action: UserAction) => {
    const now = new Date()

    switch (action) {
      case 'flip':
        // Just flip the card - handled by FlashcardItem
        break

      case 'next':
        if (canGoNext) {
          setSession(prev => ({
            ...prev,
            currentIndex: prev.currentIndex + 1
          }))
        }
        break

      case 'previous':
        if (canGoPrevious) {
          setSession(prev => ({
            ...prev,
            currentIndex: prev.currentIndex - 1
          }))
        }
        break

      case 'easy':
      case 'medium':
      case 'hard':
        if (currentCard) {
          const isCorrect = action === 'easy' || action === 'medium'
          
          // Record progress
          const progress: FlashcardProgress = {
            cardId: currentCard.id,
            isCorrect,
            responseTime: 0,
            difficulty: action,
            timestamp: now
          }
          
          setProgressHistory(prev => [...prev, progress])
          
          // Update session stats
          setSession(prev => ({
            ...prev,
            totalAnswers: prev.totalAnswers + 1,
            correctAnswers: prev.correctAnswers + (isCorrect ? 1 : 0)
          }))

          // Update card difficulty and review schedule
          updateCardProgress(currentCard, action)

          // Auto-advance to next card
          if (canGoNext) {
            setTimeout(() => {
              setSession(prev => ({
                ...prev,
                currentIndex: prev.currentIndex + 1
              }))
            }, 500)
          }
        }
        break

      case 'again':
        if (currentCard) {
          // Mark as incorrect and reset card
          const progress: FlashcardProgress = {
            cardId: currentCard.id,
            isCorrect: false,
            responseTime: 0,
            difficulty: 'hard',
            timestamp: now
          }
          
          setProgressHistory(prev => [...prev, progress])
          
          setSession(prev => ({
            ...prev,
            totalAnswers: prev.totalAnswers + 1
          }))

          // Reset card to beginning of deck for review
          resetCardToReview(currentCard)
        }
        break
    }
  }, [currentCard, canGoNext, canGoPrevious])

  // Update settings
  const updateSettings = useCallback((newSettings: Partial<FlashcardSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }))
  }, [])

  // Reset session (use current shuffled cards, don't re-shuffle)
  const resetSession = useCallback(() => {
    // Reset pagination to the beginning
    setOffset(0)

    const sliced = shuffledCards.slice(offset, offset + batchSize)
    setSession({
      id: generateSessionId(),
      cards: sliced,
      currentIndex: 0,
      startTime: new Date(),
      correctAnswers: 0,
      totalAnswers: 0,
      mode: 'study',
      settings
    })
    setProgressHistory([])
  }, [shuffledCards, offset, batchSize, settings])

  // Helper functions
  const updateCardProgress = (card: FlashcardData, difficulty: 'easy' | 'medium' | 'hard') => {
    // Update card's review schedule based on spaced repetition
    const now = new Date()
    card.lastReviewed = now
    card.reviewCount += 1
    
    if (difficulty === 'easy') {
      card.correctCount += 1
      card.difficulty = 'easy'
      // Schedule next review in 4 days
      card.nextReview = new Date(now.getTime() + 4 * 24 * 60 * 60 * 1000)
    } else if (difficulty === 'medium') {
      card.correctCount += 1
      card.difficulty = 'medium'
      // Schedule next review in 2 days
      card.nextReview = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000)
    } else {
      card.difficulty = 'hard'
      // Schedule next review in 1 day
      card.nextReview = new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000)
    }
  }

  const resetCardToReview = (card: FlashcardData) => {
    // Move card back to review pile
    setSession(prev => {
      const newCards = [...prev.cards]
      const cardIndex = newCards.findIndex(c => c.id === card.id)
      
      if (cardIndex !== -1) {
        // Remove card from current position
        const [removedCard] = newCards.splice(cardIndex, 1)
        // Add it back after current position for immediate review
        newCards.splice(prev.currentIndex + 1, 0, removedCard)
      }
      
      return {
        ...prev,
        cards: newCards
      }
    })
  }

  // Skip to next batch
  const skipNextBatch = useCallback(() => {
    setSession(prev => ({ ...prev, currentIndex: 0 }))
    setOffset(prev => prev + batchSize)
  }, [batchSize])

  const skipPreviousBatch = useCallback(() => {
    setSession(prev => ({ ...prev, currentIndex: 0 }))
    setOffset(prev => Math.max(0, prev - batchSize))
  }, [batchSize])

  // Reset to the first card of current batch (keep offset & size)
  const resetCurrentBatch = useCallback(() => {
    setSession(prev => ({ ...prev, currentIndex: 0 }))
  }, [])

  // Change batch size and reset to start
  const changeBatchSize = useCallback((size: number) => {
    setBatchSize(size)
    setSettings(prev => ({ ...prev, batchSize: size }))
    setOffset(0)
  }, [])

  // Toggle star for a card
  const toggleStar = useCallback((cardId: string) => {
    // Update in original cards array
    const cardIndex = initialCards.findIndex(card => card.id === cardId)
    if (cardIndex !== -1) {
      initialCards[cardIndex].isStarred = !initialCards[cardIndex].isStarred

      // Trigger re-filter if showing starred only
      if (settings.showStarredOnly) {
        const filteredCards = initialCards.filter(card => card.isStarred)
        setShuffledCards(settings.shuffleCards ? shuffleArray([...filteredCards]) : filteredCards)
        setOffset(0)
      } else {
        // Just update the current session cards
        setSession(prev => ({
          ...prev,
          cards: prev.cards.map(card =>
            card.id === cardId ? { ...card, isStarred: !card.isStarred } : card
          )
        }))
      }
    }
  }, [initialCards, settings.shuffleCards, settings.showStarredOnly])

  return {
    session,
    currentCard,
    progress: progressHistory,
    stats,
    settings,
    canGoNext,
    canGoPrevious,
    handleAction,
    updateSettings,
    resetSession,
    // pagination
    batchSize,
    offset,
    skipNextBatch,
    skipPreviousBatch,
    resetCurrentBatch,
    changeBatchSize,
    toggleStar,
    totalCount: shuffledCards.length
  }
}

// Utility functions
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}
