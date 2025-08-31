"use client"

import { useParams } from 'next/navigation'
import { BookOpen, Brain } from 'lucide-react'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { LanguagePageWrapper } from '@/components/language-page-wrapper'
import { PracticeModeSelector } from '@/components/practice/PracticeModeSelector'

export default function StudyPracticeVocabularyPage() {
  return (
    <ProtectedRoute>
      <LanguagePageWrapper>
        {({ language, translations, t }) => <Content language={language} translations={translations} t={t} />}
      </LanguagePageWrapper>
    </ProtectedRoute>
  )
}

interface ContentProps {
  language: string
  translations: any
  t: (key: string) => string
}

function Content({ language, translations, t }: ContentProps) {
  const params = useParams<{ level: string }>()
  const level = (params?.level || 'n5').toLowerCase()

  const modes = [
    {
      type: 'flashcard' as const,
      title: t('study.flashcard.title'),
      description: t('study.practice.modes.flashcard.vocabulary'),
      icon: BookOpen,
      color: 'blue' as const,
      ariaLabel: t('study.practice.modes.flashcard.vocabularyAriaLabel')
    },
    {
      type: 'quiz' as const,
      title: t('study.practice.modes.quiz.title'),
      description: t('study.practice.modes.quiz.description'),
      icon: Brain,
      color: 'purple' as const,
      ariaLabel: t('study.practice.modes.quiz.vocabularyAriaLabel')
    }
  ]

  return (
    <PracticeModeSelector
      titleKey="study.vocabulary.title"
      subtitleKey="study.practice.modes.selectMethod.vocabulary"
      HeaderIcon={BookOpen}
      modes={modes}
      basePath={`/study/${level}/practice/vocabulary`}
      level={level}
      t={t}
    />
  )
}
