"use client"

import { GraduationCap, BookOpen } from "lucide-react";
import { TranslationData, Language, createTranslationFunction } from "@/lib/i18n";
import { BasePageTemplate } from "@/components/layout/base-page-template";
import { createPageContent, type BasePageContentProps } from "@/components/shared/component-utils";

interface JLPTPageContentProps extends BasePageContentProps {
  isAuthenticated: boolean;
}

export const JLPTPageContent = createPageContent<{ isAuthenticated: boolean }>(
  function JLPTPageContentInner({ translations, language, isAuthenticated }: JLPTPageContentProps) {
  const t = createTranslationFunction(translations);
  

  
  const testTypes = [
    {
      id: "official",
      title: t('jlpt.testTypes.official.title'),
      description: t('jlpt.testTypes.official.description'),
      subtitle: t('jlpt.testTypes.official.subtitle'),
      icon: GraduationCap,
      href: "/jlpt/official",
      bgColor: "bg-card",
      textColor: "text-foreground"
    },
    {
      id: "custom",
      title: t('jlpt.testTypes.custom.title'),
      description: t('jlpt.testTypes.custom.description'),
      subtitle: t('jlpt.testTypes.custom.subtitle'),
      icon: BookOpen,
      href: "/jlpt/custom",
      bgColor: "bg-card",
      textColor: "text-foreground"
    }
  ];

  return (
    <BasePageTemplate
      title={t('jlpt.page.title')}
      subtitle={t('jlpt.page.subtitle')}
      cards={testTypes}
      translations={translations}
      language={language}
      t={t}
    />
  );
  }
);
