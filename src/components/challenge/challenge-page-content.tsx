"use client"

import { Trophy } from "lucide-react";
import { TranslationData, Language, createTranslationFunction } from "@/lib/i18n/";
import { BasePageTemplate } from "@/components/layout/base-page-template";
import { createPageContent, type BasePageContentProps } from "@/components/shared/component-utils";

interface ChallengePageContentProps extends BasePageContentProps {}

export const ChallengePageContent = createPageContent(
  function ChallengePageContentInner({ translations, language }: ChallengePageContentProps) {
  const t = createTranslationFunction(translations);
  
  const challengeLevels = [
    {
      level: "N1",
      description: t('challenge.levels.n1'),
      href: "/challenge/n1", // Clean URL for authenticated users
      bgColor: "bg-card",
      textColor: "text-foreground"
    },
    {
      level: "N2",
      description: t('challenge.levels.n2'),
      href: "/challenge/n2", // Clean URL for authenticated users
      bgColor: "bg-card",
      textColor: "text-foreground"
    },
    {
      level: "N3",
      description: t('challenge.levels.n3'),
      href: "/challenge/n3", // Clean URL for authenticated users
      bgColor: "bg-card",
      textColor: "text-foreground"
    },
    {
      level: "N4",
      description: t('challenge.levels.n4'),
      href: "/challenge/n4", // Clean URL for authenticated users
      bgColor: "bg-card",
      textColor: "text-foreground"
    },
    {
      level: "N5",
      description: t('challenge.levels.n5'),
      href: "/challenge/n5", // Clean URL for authenticated users
      bgColor: "bg-card",
      textColor: "text-foreground"
    }
  ];

  // Map to BasePageTemplate card items
  const cards = challengeLevels.map((level) => ({
    id: level.level,
    title: level.level,
    description: level.description,
    subtitle: undefined,
    icon: Trophy,
    href: level.href,
    bgColor: level.bgColor,
    textColor: level.textColor
  }));

  return (
    <BasePageTemplate
      title={t('challenge.page.title')}
      subtitle={t('challenge.page.subtitle')}
      cards={cards}
      translations={translations}
      language={language}
      t={t}
    />
  );
  }
);
