"use client"

import { useParams } from 'next/navigation'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { LanguagePageWrapper } from '@/components/language-page-wrapper'
import { HistoryList } from '@/components/study/history/history-list'

export default function StudyHistoryVocabularyPage() {
  const params = useParams<{ level: string }>()
  const level = (params?.level || 'n5').toLowerCase()
  
  return (
    <ProtectedRoute>
      <LanguagePageWrapper>
        {({ language, translations, t }) => (
          <HistoryList 
            level={level} 
            type="vocabulary"
            language={language}
            translations={translations}
            t={t}
          />
        )}
      </LanguagePageWrapper>
    </ProtectedRoute>
  )
}
