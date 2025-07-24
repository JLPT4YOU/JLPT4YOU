import { ExamResult, SectionResult } from '@/types'

/**
 * Generate mock exam result data for testing
 */
export function generateMockExamResult(
  examType: 'jlpt' | 'driving' | 'challenge',
  level: string,
  sections?: string[],
  demoScenario?: string
): ExamResult {
  // Mock answers with realistic distribution
  const totalQuestions = (examType === 'jlpt' || examType === 'challenge') ?
    (level === 'n1' ? 60 : level === 'n2' ? 55 : level === 'n3' ? 50 : level === 'n4' ? 45 : 40) :
    (level === 'honmen' ? 95 : 50)

  // Use predefined scenarios for demo
  let correctAnswers: number
  if (demoScenario) {
    correctAnswers = getDemoScenarioScore(demoScenario, totalQuestions)
  } else {
    correctAnswers = Math.floor(totalQuestions * (0.6 + Math.random() * 0.3)) // 60-90% correct
  }

  const incorrectAnswers = Math.floor((totalQuestions - correctAnswers) * 0.8) // Most wrong answers are incorrect, not unanswered
  const unansweredQuestions = totalQuestions - correctAnswers - incorrectAnswers

  const percentage = Math.round((correctAnswers / totalQuestions) * 100)
  const timeLimit = (examType === 'jlpt' || examType === 'challenge') ?
    (level === 'n1' ? 170 : level === 'n2' ? 155 : level === 'n3' ? 140 : level === 'n4' ? 125 : 105) * 60 :
    (level === 'honmen' ? 50 : 45) * 60

  const timeSpent = Math.floor(timeLimit * (0.7 + Math.random() * 0.25)) // 70-95% of time limit
  
  // Generate mock answers
  const answers: Record<number, 'A' | 'B' | 'C' | 'D'> = {}
  const options: ('A' | 'B' | 'C' | 'D')[] = ['A', 'B', 'C', 'D']
  
  for (let i = 1; i <= totalQuestions; i++) {
    if (i <= correctAnswers + incorrectAnswers) {
      answers[i] = options[Math.floor(Math.random() * 4)]
    }
    // Unanswered questions don't have entries in answers
  }

  // Generate section results for JLPT and Challenge
  let sectionResults: SectionResult[] | undefined
  if ((examType === 'jlpt' || examType === 'challenge') && sections && sections.length > 0) {
    sectionResults = sections.map(section => {
      const sectionTotal = Math.floor(totalQuestions / sections.length)
      const sectionCorrect = Math.floor(sectionTotal * (0.5 + Math.random() * 0.4)) // 50-90% per section
      const sectionPercentage = Math.round((sectionCorrect / sectionTotal) * 100)
      
return {
        name: section,
        score: sectionCorrect,
        total: sectionTotal,
        percentage: sectionPercentage,
        status: getPerformanceStatus(sectionPercentage)
      }
    })
  }

  return {
    examId: `exam_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
    examType,
    examSubType: examType === 'jlpt' ? 'custom' : examType === 'challenge' ? undefined : level,
    level,
    sections,
    score: correctAnswers,
    totalQuestions,
    correctAnswers,
    incorrectAnswers,
    unansweredQuestions,
    timeSpent,
    timeLimit,
    percentage,
    status: getOverallStatus(percentage),
    sectionResults,
    answers,
    submittedAt: new Date()
  }
}

/**
 * Get display name for section
 */
export function getSectionDisplayName(section: string, t?: (key: string) => string): string {
  if (t) {
    return t(`examResults.sections.names.${section}`) || section
  }

  // Fallback to Vietnamese for backward compatibility
  const displayNames: Record<string, string> = {
    vocabulary: 'Từ vựng',
    grammar: 'Ngữ pháp',
    reading: 'Đọc hiểu',
    listening: 'Nghe hiểu',
    kanji: 'Kanji'
  }
  return displayNames[section] || section
}

/**
 * Get performance status based on percentage
 */
export function getPerformanceStatus(percentage: number): 'excellent' | 'good' | 'average' | 'poor' {
  if (percentage >= 90) return 'excellent'
  if (percentage >= 75) return 'good'
  if (percentage >= 60) return 'average'
  return 'poor'
}

/**
 * Get overall exam status
 */
function getOverallStatus(percentage: number): 'passed' | 'failed' | 'excellent' | 'good' | 'average' | 'poor' {
  if (percentage >= 90) return 'excellent'
  if (percentage >= 75) return 'good'
  if (percentage >= 60) return 'average'
  if (percentage >= 50) return 'passed'
  return 'failed'
}

/**
 * Get status color class for monochrome design
 */
export function getStatusColorClass(status: string): string {
  const colorClasses: Record<string, string> = {
    excellent: 'text-foreground bg-primary/10 border-primary/20',
    good: 'text-foreground bg-muted border-muted-foreground/20',
    average: 'text-muted-foreground bg-muted/50 border-muted-foreground/10',
    poor: 'text-muted-foreground bg-muted/30 border-muted-foreground/5',
    passed: 'text-foreground bg-muted border-muted-foreground/20',
    failed: 'text-muted-foreground bg-muted/30 border-muted-foreground/5'
  }
  return colorClasses[status] || colorClasses.average
}

/**
 * Get status display text
 */
export function getStatusDisplayText(status: string, t?: (key: string) => string): string {
  if (t) {
    return t(`examResults.score.status.${status}`) || status
  }

  // Fallback to Vietnamese for backward compatibility
  const statusTexts: Record<string, string> = {
    excellent: 'Xuất sắc',
    good: 'Tốt',
    average: 'Trung bình',
    poor: 'Yếu',
    passed: 'Đậu',
    failed: 'Rớt'
  }
  return statusTexts[status] || status
}

/**
 * Format time duration
 */
export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const remainingSeconds = seconds % 60

  if (hours > 0) {
    return `${hours}h ${minutes}m ${remainingSeconds}s`
  } else if (minutes > 0) {
    return `${minutes}m ${remainingSeconds}s`
  } else {
    return `${remainingSeconds}s`
  }
}

/**
 * Calculate time efficiency percentage
 */
export function calculateTimeEfficiency(timeSpent: number, timeLimit: number): number {
  return Math.round((timeSpent / timeLimit) * 100)
}

/**
 * Get demo scenario score based on scenario ID
 */
function getDemoScenarioScore(scenarioId: string, totalQuestions: number): number {
  const scenarios: Record<string, number> = {
    'jlpt-n5-excellent': 0.95,
    'jlpt-n3-good': 0.78,
    'jlpt-n1-average': 0.65,
    'jlpt-n2-poor': 0.45,
    'driving-karimen-excellent': 0.92,
    'driving-honmen-failed': 0.48
  }

  const percentage = scenarios[scenarioId] || 0.75
  return Math.floor(totalQuestions * percentage)
}
