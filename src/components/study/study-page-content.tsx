"use client"

import { BookOpen } from "lucide-react"
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
  // Level selection cards (N5 -> N1)
  const levelOrder = ["n5", "n4", "n3", "n2", "n1"] as const
  const levelCards: CardItem[] = levelOrder.map((lvl) => ({
    id: `level-${lvl}`,
    title: lvl.toUpperCase(),
    description: "",
    subtitle: "",
    icon: BookOpen,
    href: `/study/${lvl}`,
    bgColor: "bg-card",
    textColor: "text-foreground"
  }))

  return (
    <BasePageTemplate
      title={t('study.page.title')}
      subtitle={t('jlpt.selectLevel') || ''}
      cards={levelCards}
      translations={translations}
      language={language}
      t={t}
    />
  )
}
