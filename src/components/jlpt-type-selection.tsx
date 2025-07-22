"use client"

import Link from "next/link";
import { ArrowLeft, GraduationCap, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/use-translation";
import { useEffect, useState } from "react";
import { loadTranslation, DEFAULT_LANGUAGE, TranslationData } from "@/lib/i18n";

interface JLPTTypeSelectionProps {
  type: "official" | "custom";
  lang: string;
}

export function JLPTTypeSelection({ type, lang }: JLPTTypeSelectionProps) {
  const [translations, setTranslations] = useState<TranslationData | null>(null);

  useEffect(() => {
    const loadPageTranslations = async () => {
      try {
        const translationData = await loadTranslation(DEFAULT_LANGUAGE);
        setTranslations(translationData);
      } catch (error) {
        console.error('Failed to load translations:', error);
      }
    };

    loadPageTranslations();
  }, []);

  // Always call hooks first
  const { t } = useTranslation(translations || {} as TranslationData);

  if (!translations) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  const levels = ["N1", "N2", "N3", "N4", "N5"];
  const typeTitle = type === 'official' ? t('jlpt.testTypes.official.title') : t('jlpt.testTypes.custom.title');
  const typeDescription = type === 'official' ? t('jlpt.testTypes.official.description') : t('jlpt.testTypes.custom.description');
  const typeIcon = type === 'official' ? GraduationCap : BookOpen;
  const TypeIcon = typeIcon;

  return (
    <div className="min-h-screen bg-background">
      {/* Header Section */}
      <div className="border-b bg-gradient-to-r from-muted/50 to-accent/30">
        <div className="app-container app-section">
          <div className="app-content">
            <div className="flex items-center app-mb-md">
              <Link href={`/${lang}/jlpt`}>
                <Button variant="ghost" size="icon" className="mr-2">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <h1 className="text-2xl font-bold text-foreground">
                {typeTitle}
              </h1>
            </div>
            <p className="text-muted-foreground">
              {typeDescription}
            </p>
          </div>
        </div>
      </div>

      {/* Level Selection */}
      <div className="app-container app-section">
        <div className="app-content">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-xl font-semibold text-foreground mb-6">
              {t('jlpt.selectLevel')}
            </h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 app-gap-md">
              {levels.map((level) => (
                <Link key={level} href={`/${lang}/jlpt/${type}/${level.toLowerCase()}`}>
                  <div className="group cursor-pointer bg-muted/10 rounded-2xl p-6 md:p-8 text-center transition-all duration-200 hover:bg-muted/30 border border-border/20">
                    <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4 group-hover:scale-105 transition-transform duration-200 bg-[oklch(var(--jlpt-${level.toLowerCase()}))]`}>
                      <span className={`text-2xl font-bold text-[oklch(var(--jlpt-${level.toLowerCase()}-foreground))]`}>
                        {level}
                      </span>
                    </div>
                    <h3 className="font-semibold text-foreground mb-2">
                      JLPT {level}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {t(`jlpt.levels.${level.toLowerCase()}`)}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
