// Main exam interface component
export { ExamInterface } from './exam-interface'
export type { Question, ExamInterfaceProps } from './exam-interface'

// Exam components
export { ExamHeader } from './components/exam-header'
export { QuestionContent } from './components/question-content'
export { QuestionSidebar } from './components/question-sidebar'
export { ExamModals } from './components/exam-modals'

// Exam hooks
export { useExamTimer } from './hooks/useExamTimer'
export type { UseExamTimerReturn } from './hooks/useExamTimer'
export { useExamState } from './hooks/useExamState'
export type { ExamState } from './hooks/useExamState'

// Re-export types for convenience
export type { Question as ExamQuestion } from './hooks/useExamState'
