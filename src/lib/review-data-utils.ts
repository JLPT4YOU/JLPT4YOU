import { ReviewData, ReviewQuestion, ExamResult } from '@/types'
import { generateJLPTQuestions, generateDrivingQuestions } from './sample-exam-data'
import { Question } from '@/components/exam'

/**
 * Generate review data from exam result
 */
export function generateReviewData(examResult: ExamResult): ReviewData {
  // Get questions based on exam type
  let baseQuestions: Question[]
  
  if (examResult.examType === 'jlpt') {
    baseQuestions = generateJLPTQuestions(examResult.level, examResult.sections, examResult.totalQuestions)
  } else {
    baseQuestions = generateDrivingQuestions(examResult.level as 'karimen' | 'honmen')
  }

  // Convert to review questions with user answers
  const reviewQuestions: ReviewQuestion[] = baseQuestions.map((q, index) => {
    const questionId = index + 1
    const userAnswer = examResult.answers[questionId]
    const isAnswered = !!userAnswer
    const correctAnswer = q.correctAnswer || 'A' // Fallback to 'A' if undefined
    const isCorrect = isAnswered && userAnswer === correctAnswer

    return {
      id: questionId,
      question: q.question,
      options: q.options,
      correctAnswer,
      userAnswer,
      explanation: generateExplanation(q, examResult.examType),
      isCorrect,
      isAnswered,
      section: extractSection(q.question, examResult.sections)
    }
  })

  // Calculate counts
  const correctCount = reviewQuestions.filter(q => q.isCorrect).length
  const incorrectCount = reviewQuestions.filter(q => q.isAnswered && !q.isCorrect).length
  const unansweredCount = reviewQuestions.filter(q => !q.isAnswered).length

  return {
    examResult,
    questions: reviewQuestions,
    totalQuestions: reviewQuestions.length,
    correctCount,
    incorrectCount,
    unansweredCount
  }
}

/**
 * Generate explanation for a question
 */
function generateExplanation(_question: Question, examType: 'jlpt' | 'driving' | 'challenge'): string {
  if (examType === 'jlpt' || examType === 'challenge') {
    // Generate JLPT explanations
    const explanations = [
      "「のに」は逆接の接続助詞で、前の事実と後の事実が対照的な関係にあることを表します。",
      "「だんだん」は徐々に変化していく様子を表す副詞です。",
      "時刻を表す場合は助詞「に」を使います。",
      "「〜てはいけません」は禁止を表す表現です。",
      "「一生懸命」は副詞として使われ、「に」は不要です。"
    ]
    return explanations[Math.floor(Math.random() * explanations.length)]
  } else {
    // Generate driving explanations
    const explanations = [
      "一般道路での制限速度は標識で指定されていない限り60km/hです。",
      "黄信号では安全に停止できる場合は停止する必要があります。",
      "安全な車間距離は速度に応じて調整する必要があります。",
      "三角形の赤い縁取りは危険を警告する標識です。",
      "故障時はまず安全な場所に移動し、ハザードランプを点灯させます。"
    ]
    return explanations[Math.floor(Math.random() * explanations.length)]
  }
}

/**
 * Extract section from question text
 */
function extractSection(questionText: string, sections?: string[]): string | undefined {
  if (!sections || sections.length === 0) return undefined
  
  // Simple section detection based on question content
  if (questionText.includes('[VOCABULARY]') || questionText.includes('語彙')) return 'vocabulary'
  if (questionText.includes('[GRAMMAR]') || questionText.includes('文法')) return 'grammar'
  if (questionText.includes('[READING]') || questionText.includes('読解')) return 'reading'
  if (questionText.includes('[LISTENING]') || questionText.includes('聴解')) return 'listening'
  
  // Default to first section if no specific match
  return sections[0]
}

/**
 * Filter questions by status
 */
export function filterQuestionsByStatus(
  questions: ReviewQuestion[],
  status: 'all' | 'correct' | 'incorrect' | 'flagged'
): ReviewQuestion[] {
  switch (status) {
    case 'correct':
      return questions.filter(q => q.isCorrect)
    case 'incorrect':
      return questions.filter(q => q.isAnswered && !q.isCorrect)
    case 'flagged':
      return questions.filter(q => !q.isAnswered)
    default:
      return questions
  }
}



/**
 * Get question status color class
 */
export function getQuestionStatusColor(question: ReviewQuestion): string {
  if (!question.isAnswered) return 'text-yellow-800 bg-yellow-100 border-yellow-300'
  return question.isCorrect
    ? 'text-green-800 bg-green-100 border-green-300'
    : 'text-red-800 bg-red-100 border-red-300'
}
