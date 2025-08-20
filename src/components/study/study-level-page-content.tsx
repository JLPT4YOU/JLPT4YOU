"use client"

import { useParams } from 'next/navigation'
import { BookOpen, Target } from "lucide-react"
import { Language, TranslationData } from "@/lib/i18n"
import { createPageContent, type BasePageContentProps } from "@/components/shared/component-utils"
import { BasePageTemplate, CardItem } from "@/components/layout/base-page-template"

interface StudyLevelPageContentProps extends BasePageContentProps {
  isAuthenticated?: boolean
}

export const StudyLevelPageContent = createPageContent<{ isAuthenticated?: boolean }>(
  function StudyLevelPageContentInner({ language, translations }: StudyLevelPageContentProps) {
    const t = (key: string) => {
      const keys = key.split('.')
      let value: any = translations
      for (const k of keys) {
        value = value?.[k]
      }
      return value || key
    }

    return <StudyLevelContent t={t} language={language} translations={translations} />
  }
)

interface StudyLevelContentProps {
  t: (key: string) => string
  language: Language
  translations: TranslationData
}

function StudyLevelContent({ t, language, translations }: StudyLevelContentProps) {
  const params = useParams<{ level: string }>()
  const level = (params?.level || 'n5').toLowerCase()

  // Study type selection cards
  const studyTypeCards: CardItem[] = [
    {
      id: 'theory',
      title: t('study.types.theory.title') || 'Lý thuyết',
      description: t('study.types.theory.description') || 'Học kiến thức cơ bản',
      subtitle: '',
      icon: BookOpen,
      href: `/study/${level}/theory`,
      bgColor: "bg-card",
      textColor: "text-foreground"
    },
    {
      id: 'practice',
      title: t('study.types.practice.title') || 'Thực hành',
      description: t('study.types.practice.description') || 'Bài tập ứng dụng',
      subtitle: '',
      icon: Target,
      href: `/study/${level}/practice`,
      bgColor: "bg-card",
      textColor: "text-foreground"
    }
  ]

  return (
    <BasePageTemplate
      title={`${t('study.page.title')} - ${level.toUpperCase()}`}
      subtitle={t('study.selectType') || 'Chọn loại học tập'}
      cards={studyTypeCards}
      translations={translations}
      language={language}
      t={t}
    />
  )
}
