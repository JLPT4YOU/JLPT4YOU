/**
 * Flashcard System Types
 * Inspired by Quizlet, Anki, and modern flashcard apps
 */

export interface FlashcardData {
  id: string
  front: string
  back: string
  frontAudio?: string
  backAudio?: string
  image?: string
  difficulty: 'easy' | 'medium' | 'hard'
  lastReviewed?: Date
  nextReview?: Date
  reviewCount: number
  correctCount: number
  tags?: string[]
  type: 'vocabulary' | 'grammar'
  level: 'n5' | 'n4' | 'n3' | 'n2' | 'n1'
  isStarred?: boolean
}

export interface FlashcardSession {
  id: string
  cards: FlashcardData[]
  currentIndex: number
  startTime: Date
  endTime?: Date
  correctAnswers: number
  totalAnswers: number
  mode: FlashcardMode
  settings: FlashcardSettings
}

export type FlashcardMode = 'study' | 'review' | 'test' | 'quick'

export interface FlashcardSettings {
  autoFlip: boolean
  autoFlipDelay: number // seconds
  showProgress: boolean
  shuffleCards: boolean
  audioEnabled: boolean
  showHints: boolean
  spacedRepetition: boolean
  showStarredOnly: boolean
  flipDirection: 'normal' | 'reversed' // normal: front->back, reversed: back->front
  batchSize: number
}

export interface FlashcardProgress {
  cardId: string
  isCorrect: boolean
  responseTime: number // milliseconds
  difficulty: 'easy' | 'medium' | 'hard'
  timestamp: Date
}

export interface FlashcardStats {
  totalCards: number
  studiedCards: number
  masteredCards: number
  averageAccuracy: number
  totalStudyTime: number // minutes
  streak: number
  lastStudyDate?: Date
}

// Animation states for card flipping
export type CardState = 'front' | 'back' | 'flipping'

// User interaction types
export type UserAction = 'flip' | 'next' | 'previous' | 'easy' | 'medium' | 'hard' | 'again'
