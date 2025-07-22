"use client"

import { BookOpen, GraduationCap } from "lucide-react";
import { useTranslation } from "@/lib/use-translation";
import { TranslationData, Language } from "@/lib/i18n";
import { BasePageTemplate } from "@/components/layout/base-page-template";

interface DrivingPageContentProps {
  translations: TranslationData;
  language: Language;
}

export function DrivingPageContent({ translations, language }: DrivingPageContentProps) {
  return (
    <DrivingPageContentInner translations={translations} language={language} />
  );
}

function DrivingPageContentInner({ translations, language }: DrivingPageContentProps) {
  const { t } = useTranslation(translations);

  const drivingLevels = [
    {
      id: "karimen",
      title: t('driving.testTypes.karimen.title'),
      description: t('driving.testTypes.karimen.description'),
      subtitle: t('driving.testTypes.karimen.subtitle'),
      details: t('driving.testTypes.karimen.details'),
      icon: BookOpen,
      href: `/${language}/driving/karimen`,
      bgColor: "bg-muted",
      textColor: "text-foreground"
    },
    {
      id: "honmen",
      title: t('driving.testTypes.honmen.title'),
      description: t('driving.testTypes.honmen.description'),
      subtitle: t('driving.testTypes.honmen.subtitle'),
      details: t('driving.testTypes.honmen.details'),
      icon: GraduationCap,
      href: `/${language}/driving/honmen`,
      bgColor: "bg-muted",
      textColor: "text-foreground"
    }
  ];

  return (
    <BasePageTemplate
      title={t('driving.page.title')}
      subtitle={t('driving.page.subtitle')}
      cards={drivingLevels}
      translations={translations}
      language={language}
      t={t}
    />
  );
}
