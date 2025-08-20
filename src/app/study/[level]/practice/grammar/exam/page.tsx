"use client"

import { useParams } from 'next/navigation'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { StudyExamPageContent } from '@/components/study/study-exam-page-content'

export default function StudyPracticeGrammarExamPage() {
  const params = useParams<{ level: string }>()
  const level = (params?.level || 'n5').toLowerCase().replace('n', '')
  
  return (
    <ProtectedRoute>
      <StudyExamPageContent level={level} type="grammar" />
    </ProtectedRoute>
  )
}
