"use client"

import { GraduationCap, BookOpen } from "lucide-react";
import { TranslationData, Language } from "@/lib/i18n";
import { BasePageTemplate } from "@/components/layout/base-page-template";

interface JLPTPageContentProps {
  translations: TranslationData;
  language: Language;
  t: (key: string) => any;
  isAuthenticated: boolean;
}

export function JLPTPageContent({ translations, language, t, isAuthenticated }: JLPTPageContentProps) {
  return (
    <JLPTPageContentInner translations={translations} language={language} t={t} isAuthenticated={isAuthenticated} />
  );
}

function JLPTPageContentInner({ translations, language, t, isAuthenticated }: JLPTPageContentProps) {
  
  console.log('JLPTPageContent render with language:', language, 'title:', t('jlpt.page.title'));
  
  const testTypes = [
    {
      id: "official",
      title: t('jlpt.testTypes.official.title'),
      description: t('jlpt.testTypes.official.description'),
      subtitle: t('jlpt.testTypes.official.subtitle'),
      icon: GraduationCap,
      href: "/jlpt/official",
      bgColor: "bg-muted",
      textColor: "text-foreground"
    },
    {
      id: "custom",
      title: t('jlpt.testTypes.custom.title'),
      description: t('jlpt.testTypes.custom.description'),
      subtitle: t('jlpt.testTypes.custom.subtitle'),
      icon: BookOpen,
      href: "/jlpt/custom",
      bgColor: "bg-muted",
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
