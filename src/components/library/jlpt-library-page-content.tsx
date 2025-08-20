"use client"

import { GraduationCap } from "lucide-react";
import { TranslationData, Language, createTranslationFunction } from "@/lib/i18n";
import { BasePageTemplate } from "@/components/layout/base-page-template";
import { createPageContent, type BasePageContentProps } from "@/components/shared/component-utils";

interface JLPTLibraryPageContentProps extends BasePageContentProps {
  isAuthenticated: boolean;
}

export const JLPTLibraryPageContent = createPageContent<{ isAuthenticated: boolean }>(
  function JLPTLibraryPageContentInner({ translations, language, isAuthenticated }: JLPTLibraryPageContentProps) {
  const t = createTranslationFunction(translations);
  

  
  const jlptLevels = [
    {
      id: "n1",
      title: t('library.jlpt.levels.n1.title'),
      description: "",
      subtitle: "",
      icon: GraduationCap,
      href: "/library/jlpt/n1",
      bgColor: "bg-card",
      textColor: "text-foreground"
    },
    {
      id: "n2",
      title: t('library.jlpt.levels.n2.title'),
      description: "",
      subtitle: "",
      icon: GraduationCap,
      href: "/library/jlpt/n2",
      bgColor: "bg-card",
      textColor: "text-foreground"
    },
    {
      id: "n3",
      title: t('library.jlpt.levels.n3.title'),
      description: "",
      subtitle: "",
      icon: GraduationCap,
      href: "/library/jlpt/n3",
      bgColor: "bg-card",
      textColor: "text-foreground"
    },
    {
      id: "n4",
      title: t('library.jlpt.levels.n4.title'),
      description: "",
      subtitle: "",
      icon: GraduationCap,
      href: "/library/jlpt/n4",
      bgColor: "bg-card",
      textColor: "text-foreground"
    },
    {
      id: "n5",
      title: t('library.jlpt.levels.n5.title'),
      description: "",
      subtitle: "",
      icon: GraduationCap,
      href: "/library/jlpt/n5",
      bgColor: "bg-card",
      textColor: "text-foreground"
    }
  ];

  return (
    <BasePageTemplate
      title={t('library.jlpt.page.title')}
      subtitle={t('library.jlpt.page.subtitle')}
      cards={jlptLevels}
      translations={translations}
      language={language}
      t={t}
    />
  );
  }
);
