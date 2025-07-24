import { JLPTLevel, QuestionType, StudyMode } from '@/lib/constants'

// User Progress
export interface UserProgress {
  level: JLPTLevel
  totalStudyTime: number // in minutes
  streakDays: number
  lastStudyDate: string
  completedLessons: string[]
  scores: {
    vocabulary: number
    grammar: number
    kanji: number
    reading: number
    listening: number
  }
}

// Question Interface
export interface Question {
  id: string
  type: QuestionType
  level: JLPTLevel
  question: string
  options: string[]
  correctAnswer: number
  explanation?: string
  difficulty: 'easy' | 'medium' | 'hard'
  tags: string[]
}

// Vocabulary Item
export interface VocabularyItem {
  id: string
  word: string
  hiragana: string
  meaning: string
  level: JLPTLevel
  partOfSpeech: string
  examples: {
    japanese: string
    vietnamese: string
  }[]
  audio?: string
}

// Kanji Item
export interface KanjiItem {
  id: string
  character: string
  meaning: string
  onyomi: string[]
  kunyomi: string[]
  level: JLPTLevel
  strokes: number
  examples: {
    word: string
    reading: string
    meaning: string
  }[]
}

// Grammar Item
export interface GrammarItem {
  id: string
  pattern: string
  meaning: string
  level: JLPTLevel
  usage: string
  examples: {
    japanese: string
    vietnamese: string
  }[]
  notes?: string
}

// Study Session
export interface StudySession {
  id: string
  userId: string
  startTime: Date
  endTime?: Date
  mode: StudyMode
  level: JLPTLevel
  questionsAnswered: number
  correctAnswers: number
  topics: QuestionType[]
}

// Quiz Result
export interface QuizResult {
  sessionId: string
  score: number
  totalQuestions: number
  correctAnswers: number
  timeSpent: number // in seconds
  level: JLPTLevel
  type: QuestionType
  date: Date
}

// Exam Result (Extended for results page)
export interface ExamResult {
  examId: string
  examType: 'jlpt' | 'driving' | 'challenge'
  examSubType?: string // 'custom' | 'official' for JLPT, 'karimen' | 'honmen' for driving, undefined for challenge
  level: string
  sections?: string[] // For JLPT: vocabulary, grammar, reading, listening
  score: number
  totalQuestions: number
  correctAnswers: number
  incorrectAnswers: number
  unansweredQuestions: number
  timeSpent: number // in seconds
  timeLimit: number // in seconds
  percentage: number
  status: 'passed' | 'failed' | 'excellent' | 'good' | 'average' | 'poor'
  sectionResults?: SectionResult[]
  answers: Record<number, 'A' | 'B' | 'C' | 'D'>
  submittedAt: Date
}

// Section Result for detailed analysis
export interface SectionResult {
  name: string
  score: number
  total: number
  percentage: number
  status: 'excellent' | 'good' | 'average' | 'poor'
}

// Review Question for answer review page
export interface ReviewQuestion {
  id: number
  question: string
  options: {
    A: string
    B: string
    C: string
    D: string
  }
  correctAnswer: 'A' | 'B' | 'C' | 'D'
  userAnswer?: 'A' | 'B' | 'C' | 'D'
  explanation?: string
  isCorrect: boolean
  isAnswered: boolean
  section?: string
}

// Review Data for answer review page
export interface ReviewData {
  examResult: ExamResult
  questions: ReviewQuestion[]
  totalQuestions: number
  correctCount: number
  incorrectCount: number
  unansweredCount: number
}

// Study Settings
export interface StudySettings {
  preferredLevel: JLPTLevel
  studyGoalMinutes: number
  enableSound: boolean
  showFurigana: boolean
  autoPlayAudio: boolean
  reviewIncorrectAnswers: boolean
  dailyGoal: number
}

// Lesson
export interface Lesson {
  id: string
  title: string
  description: string
  level: JLPTLevel
  type: QuestionType
  estimatedTime: number // in minutes
  isCompleted: boolean
  progress: number // 0-100
  content: {
    vocabulary?: VocabularyItem[]
    kanji?: KanjiItem[]
    grammar?: GrammarItem[]
    questions?: Question[]
  }
}
