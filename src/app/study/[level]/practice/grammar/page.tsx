"use client"

import { useParams } from 'next/navigation'
import { Target, Brain } from 'lucide-react'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { LanguagePageWrapper } from '@/components/language-page-wrapper'
import { PracticeModeSelector } from '@/components/practice/PracticeModeSelector'

export default function StudyPracticeGrammarPage() {
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
      description: t('study.practice.modes.flashcard.grammar'),
      icon: Target,
      color: 'green' as const,
      ariaLabel: t('study.practice.modes.flashcard.grammarAriaLabel')
    },
    {
      type: 'quiz' as const,
      title: t('study.practice.modes.quiz.title'),
      description: t('study.practice.modes.quiz.description'),
      icon: Brain,
      color: 'purple' as const,
      ariaLabel: t('study.practice.modes.quiz.grammarAriaLabel')
    }
  ]

  return (
    <PracticeModeSelector
      titleKey="study.grammar.title"
      subtitleKey="study.practice.modes.selectMethod.grammar"
      HeaderIcon={Target}
      modes={modes}
      basePath={`/study/${level}/practice/grammar`}
      level={level}
      t={t}
    />
  )
}
