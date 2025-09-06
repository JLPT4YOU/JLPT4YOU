"use client"

import { Library, BookOpen } from "lucide-react";
import { TranslationData, Language, createTranslationFunction } from "@/lib/i18n/";
import { BasePageTemplate } from "@/components/layout/base-page-template";
import { createPageContent, type BasePageContentProps } from "@/components/shared/component-utils";

interface LibraryPageContentProps extends BasePageContentProps {
  isAuthenticated: boolean;
}

export const LibraryPageContent = createPageContent<{ isAuthenticated: boolean }>(
  function LibraryPageContentInner({ translations, language, isAuthenticated }: LibraryPageContentProps) {
  const t = createTranslationFunction(translations);
  

  
  const categories = [
    {
      id: "jlpt",
      title: t('library.categories.jlpt.title'),
      description: t('library.categories.jlpt.description'),
      subtitle: t('library.categories.jlpt.subtitle'),
      icon: Library,
      href: "/library/jlpt",
      bgColor: "bg-card",
      textColor: "text-foreground"
    },
    {
      id: "other",
      title: t('library.categories.other.title'),
      description: t('library.categories.other.description'),
      subtitle: t('library.categories.other.subtitle'),
      icon: BookOpen,
      href: "/library/other",
      bgColor: "bg-card",
      textColor: "text-foreground"
    }
  ];

  return (
    <BasePageTemplate
      title={t('library.page.title')}
      subtitle={t('library.page.subtitle')}
      cards={categories}
      translations={translations}
      language={language}
      t={t}
    />
  );
  }
);
