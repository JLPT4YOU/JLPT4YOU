"use client"

import { BookOpen, Target } from "lucide-react"
import { BasePageTemplate, CardItem } from "@/components/layout/base-page-template"
import { Language, TranslationData } from "@/lib/i18n"
import { createPageContent, type BasePageContentProps } from "@/components/shared/component-utils"

interface StudyPageContentProps extends BasePageContentProps {
  isAuthenticated?: boolean
}

export const StudyPageContent = createPageContent<{ isAuthenticated?: boolean }>(
  function StudyPageContentInner({ language, translations }: StudyPageContentProps) {
    const t = (key: string) => {
      const keys = key.split('.')
      let value: any = translations
      for (const k of keys) {
        value = value?.[k]
      }
      return value || key
    }

    return <StudyContent t={t} language={language} translations={translations} />
  }
)

interface StudyContentProps {
  t: (key: string) => string
  language: Language
  translations: TranslationData
}

function StudyContent({ t, language, translations }: StudyContentProps) {
  // Study type cards configuration
  const studyCards: CardItem[] = [
    {
      id: "theory",
      title: t('study.types.theory.title'),
      description: t('study.types.theory.description'),
      subtitle: t('study.types.theory.subtitle'),
      icon: BookOpen,
      href: "/study/theory",
      bgColor: "bg-card",
      textColor: "text-foreground"
    },
    {
      id: "practice",
      title: t('study.types.practice.title'),
      description: t('study.types.practice.description'),
      subtitle: t('study.types.practice.subtitle'),
      icon: Target,
      href: "/study/practice",
      bgColor: "bg-card",
      textColor: "text-foreground"
    }
  ]

  return (
    <BasePageTemplate
      title={t('study.page.title')}
      subtitle={t('study.page.subtitle')}
      cards={studyCards}
      translations={translations}
      language={language}
      t={t}
    />
  )
}

