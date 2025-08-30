/**
 * Centralized exam question data management
 * Provides unified access to all exam questions and metadata
 */

import { Question } from '@/components/exam'
import { EXAM_TYPES, type ExamType } from '@/lib/exam-constants'

// Re-export EXAM_TYPES for backward compatibility
export { EXAM_TYPES } from '@/lib/exam-constants'

// JLPT Questions
import { jlptN1Questions, jlptN1Metadata } from './exam-questions/jlpt/n1'
import { jlptN2Questions, jlptN2Metadata } from './exam-questions/jlpt/n2'
import { jlptN3Questions, jlptN3Metadata } from './exam-questions/jlpt/n3'

// Driving Questions
import { karimenQuestions, karimenMetadata } from './exam-questions/driving/karimen'
import { honmenQuestions, honmenMetadata } from './exam-questions/driving/honmen'

// Question Bank Interface
export interface QuestionBank {
  id: string
  type: ExamType
  level: string
  questions: Question[]
  metadata: QuestionBankMetadata
}

export interface QuestionBankMetadata {
  level: string
  type?: string
  difficulty: 'basic' | 'intermediate' | 'upper-intermediate' | 'advanced'
  totalQuestions: number
  timeLimit: number // in minutes
  passingScore: number // as decimal (0.7 = 70%)
  sections: string[]
  description: string
}

// Question Banks Registry
const questionBanks: Record<string, QuestionBank> = {
  // JLPT Question Banks
  'jlpt-n1': {
    id: 'jlpt-n1',
    type: EXAM_TYPES.JLPT,
    level: 'N1',
    questions: jlptN1Questions,
    metadata: jlptN1Metadata
  },
  'jlpt-n2': {
    id: 'jlpt-n2',
    type: EXAM_TYPES.JLPT,
    level: 'N2',
    questions: jlptN2Questions,
    metadata: jlptN2Metadata
  },
  'jlpt-n3': {
    id: 'jlpt-n3',
    type: EXAM_TYPES.JLPT,
    level: 'N3',
    questions: jlptN3Questions,
    metadata: jlptN3Metadata
  },

  // Driving Question Banks
  'driving-karimen': {
    id: 'driving-karimen',
    type: EXAM_TYPES.DRIVING,
    level: 'karimen',
    questions: karimenQuestions,
    metadata: karimenMetadata
  },
  'driving-honmen': {
    id: 'driving-honmen',
    type: EXAM_TYPES.DRIVING,
    level: 'honmen',
    questions: honmenQuestions,
    metadata: honmenMetadata
  }
}

// Helper Functions

/**
 * Get question bank by exam type and level
 */
export function getQuestionBank(examType: ExamType, level: string): QuestionBank | null {
  const bankId = `${examType}-${level.toLowerCase()}`
  return questionBanks[bankId] || null
}

/**
 * Get questions for a specific exam type and level
 */
export function getQuestions(examType: ExamType, level: string, count?: number): Question[] {
  const bank = getQuestionBank(examType, level)
  if (!bank) return []

  const questions = bank.questions
  if (count && count < questions.length) {
    // Return first N questions if count is specified
    return questions.slice(0, count)
  }

  return questions
}

/**
 * Get metadata for a specific exam type and level
 */
export function getQuestionBankMetadata(examType: ExamType, level: string): QuestionBankMetadata | null {
  const bank = getQuestionBank(examType, level)
  return bank?.metadata || null
}

/**
 * Get all available levels for a specific exam type
 */
export function getAvailableLevels(examType: ExamType): string[] {
  return Object.values(questionBanks)
    .filter(bank => bank.type === examType)
    .map(bank => bank.level)
}

/**
 * Get all question banks for a specific exam type
 */
export function getQuestionBanksByType(examType: ExamType): QuestionBank[] {
  return Object.values(questionBanks).filter(bank => bank.type === examType)
}

/**
 * Generate questions for JLPT tests (backward compatibility)
 */
export function generateJLPTQuestions(
  level: string,
  sections: string[] = [],
  count?: number
): Question[] {
  const questions = getQuestions(EXAM_TYPES.JLPT, level, count)

  // Add section-specific prefixes if sections are specified
  if (sections.length > 0) {
    return questions.map((q, index) => ({
      ...q,
      question: `[${sections[index % sections.length].toUpperCase()}] ${q.question}`
    }))
  }

  return questions
}

/**
 * Generate questions for driving tests (backward compatibility)
 */
export function generateDrivingQuestions(level: 'karimen' | 'honmen'): Question[] {
  return getQuestions(EXAM_TYPES.DRIVING, level)
}

/**
 * Generate sample questions (backward compatibility)
 */
export function generateSampleQuestions(count: number = 50): Question[] {
  // Use N3 questions as base for sample questions
  const baseQuestions = getQuestions(EXAM_TYPES.JLPT, 'N3')
  const questions: Question[] = []

  for (let i = 0; i < count; i++) {
    const baseQuestion = baseQuestions[i % baseQuestions.length]
    questions.push({
      ...baseQuestion,
      id: i + 1,
      question: `Câu ${i + 1}: ${baseQuestion.question}`
    })
  }

  return questions
}

/**
 * Check if a question bank exists
 */
export function hasQuestionBank(examType: ExamType, level: string): boolean {
  const bankId = `${examType}-${level.toLowerCase()}`
  return bankId in questionBanks
}

/**
 * Get total number of available question banks
 */
export function getTotalQuestionBanks(): number {
  return Object.keys(questionBanks).length
}

/**
 * Get statistics about all question banks
 */
export function getQuestionBankStats() {
  const stats = {
    totalBanks: getTotalQuestionBanks(),
    totalQuestions: 0,
    byType: {} as Record<ExamType, number>,
    byDifficulty: {} as Record<string, number>
  }

  Object.values(questionBanks).forEach(bank => {
    stats.totalQuestions += bank.questions.length

    // Count by type
    stats.byType[bank.type] = (stats.byType[bank.type] || 0) + 1

    // Count by difficulty
    const difficulty = bank.metadata.difficulty
    stats.byDifficulty[difficulty] = (stats.byDifficulty[difficulty] || 0) + 1
  })

  return stats
}

// Export all question banks for direct access if needed
export { questionBanks }

// Export individual question arrays for backward compatibility
export {
  jlptN1Questions,
  jlptN2Questions,
  jlptN3Questions,
  karimenQuestions,
  honmenQuestions
}