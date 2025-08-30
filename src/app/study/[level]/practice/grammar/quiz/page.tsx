"use client"

import { useParams } from 'next/navigation'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { StudyPracticePageContent } from '@/components/study/study-practice-page-content'

export default function StudyPracticeGrammarQuizPage() {
  const params = useParams<{ level: string }>()
  const level = (params?.level || 'n5').toLowerCase().replace('n', '')
  
  return (
    <ProtectedRoute>
      <StudyPracticePageContent level={level} type="grammar" />
    </ProtectedRoute>
  )
}
