"use client"

import Link from "next/link";
import { GraduationCap, BookOpen, Award } from "lucide-react";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { useTranslation } from "@/lib/use-translation";
import { TranslationData, Language } from "@/lib/i18n";

interface JLPTOfficialPageContentProps {
  translations: TranslationData;
  language: Language;
}

export function JLPTOfficialPageContent({ translations, language }: JLPTOfficialPageContentProps) {
  return (
    <ProtectedRoute>
      <JLPTOfficialPageContentInner translations={translations} language={language} />
    </ProtectedRoute>
  );
}

function JLPTOfficialPageContentInner({ translations, language }: JLPTOfficialPageContentProps) {
  const { t } = useTranslation(translations);

  const jlptLevels = [
    {
      level: "N1",
      description: t('challenge.levels.n1'),
      href: `/${language}/jlpt/official/n1`,
      bgColor: "bg-card",
      textColor: "text-foreground"
    },
    {
      level: "N2",
      description: t('challenge.levels.n2'),
      href: `/${language}/jlpt/official/n2`,
      bgColor: "bg-card",
      textColor: "text-foreground"
    },
    {
      level: "N3",
      description: t('challenge.levels.n3'),
      href: `/${language}/jlpt/official/n3`,
      bgColor: "bg-card",
      textColor: "text-foreground"
    },
    {
      level: "N4",
      description: t('challenge.levels.n4'),
      href: `/${language}/jlpt/official/n4`,
      bgColor: "bg-card",
      textColor: "text-foreground"
    },
    {
      level: "N5",
      description: t('challenge.levels.n5'),
      href: `/${language}/jlpt/official/n5`,
      bgColor: "bg-card",
      textColor: "text-foreground"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header Section */}
      <div className="border-b bg-muted/30">
        <div className="app-container app-section">
          <div className="app-content">
            <div className="text-center app-space-md">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto shadow-lg app-mb-md">
                <GraduationCap className="w-8 h-8 text-primary" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
                {t('jlpt.official.page.title')}
              </h1>
              <p className="text-muted-foreground mt-2">
                {t('jlpt.official.page.subtitle')}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* JLPT Levels Selection */}
      <div className="app-container app-section">
        <div className="app-content">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4 md:gap-6">
              {jlptLevels.map((level) => (
                <Link key={level.level} href={level.href}>
                  <div className="group cursor-pointer bg-muted/10 rounded-2xl p-6 md:p-8 text-center hover-card border border-border/20">
                    <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4 group-hover:scale-105 transition-transform duration-200 ${level.bgColor} relative`}>
                      <span className={`text-2xl font-bold ${level.textColor}`}>
                        {level.level}
                      </span>
                      <div className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full flex items-center justify-center">
                        <Award className="w-2 h-2 text-primary-foreground" />
                      </div>
                    </div>
                    <h3 className="font-semibold text-foreground mb-2">
                      JLPT {level.level}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {level.description}
                    </p>
                  </div>
                </Link>
              ))}
            </div>

            {/* Official JLPT Info */}
            <div className="mt-12">
              <div className="bg-muted/30 rounded-2xl border-dashed border-2 border-border/30 p-6 md:p-8 text-center">
                <div className="flex items-center justify-center gap-4 mb-4">
                  <Award className="w-6 h-6 text-primary" />
                  <h3 className="text-lg font-semibold text-foreground">
                    {t('jlpt.official.info.title')}
                  </h3>
                  <Award className="w-6 h-6 text-primary" />
                </div>
                <p className="text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                  {t('jlpt.official.info.description')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
