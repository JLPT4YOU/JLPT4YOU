"use client"

import Link from "next/link";
import { BookOpen, Sparkles, Lightbulb } from "lucide-react";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { LanguagePageWrapper } from "@/components/language-page-wrapper";

export default function JLPTCustomPage() {
  return (
    <ProtectedRoute>
      <LanguagePageWrapper>
        {({ language, translations, t, isLoading, isAuthenticated }) => (
          <JLPTCustomPageContent 
            key={language}
            translations={translations}
            t={t}
            language={language}
            isAuthenticated={isAuthenticated}
          />
        )}
      </LanguagePageWrapper>
    </ProtectedRoute>
  );
}

interface JLPTCustomPageContentProps {
  translations: any;
  t: (key: string) => any;
  language: string;
  isAuthenticated: boolean;
}

function JLPTCustomPageContent({ translations, t, language, isAuthenticated }: JLPTCustomPageContentProps) {
  const jlptLevels = [
    {
      level: "N1",
      description: t('challenge.levels.n1'),
      href: "/jlpt/custom/n1",
      bgColor: "bg-[oklch(var(--jlpt-n1))]",
      textColor: "text-[oklch(var(--jlpt-n1-foreground))]"
    },
    {
      level: "N2",
      description: t('challenge.levels.n2'),
      href: "/jlpt/custom/n2",
      bgColor: "bg-[oklch(var(--jlpt-n2))]",
      textColor: "text-[oklch(var(--jlpt-n2-foreground))]"
    },
    {
      level: "N3",
      description: t('challenge.levels.n3'),
      href: "/jlpt/custom/n3",
      bgColor: "bg-[oklch(var(--jlpt-n3))]",
      textColor: "text-[oklch(var(--jlpt-n3-foreground))]"
    },
    {
      level: "N4",
      description: t('challenge.levels.n4'),
      href: "/jlpt/custom/n4",
      bgColor: "bg-[oklch(var(--jlpt-n4))]",
      textColor: "text-[oklch(var(--jlpt-n4-foreground))]"
    },
    {
      level: "N5",
      description: t('challenge.levels.n5'),
      href: "/jlpt/custom/n5",
      bgColor: "bg-[oklch(var(--jlpt-n5))]",
      textColor: "text-[oklch(var(--jlpt-n5-foreground))]"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header Section */}
      <div className="border-b bg-gradient-to-r from-muted/50 to-accent/30">
        <div className="app-container app-section">
          <div className="app-content">
            <div className="text-center app-space-md">
              <div className="w-16 h-16 bg-accent rounded-full flex items-center justify-center mx-auto shadow-lg app-mb-md">
                <BookOpen className="w-8 h-8 text-accent-foreground" />
              </div>
              <div className="flex items-center justify-center app-gap-xs app-mb-sm">
                <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
                  {t('jlpt.custom.page.title')}
                </h1>
                <Sparkles className="w-6 h-6 text-accent" />
              </div>
              <p className="text-muted-foreground mt-2">
                {t('jlpt.custom.page.subtitle')}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* JLPT Levels Selection */}
      <div className="app-container app-section">
        <div className="app-content">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 app-gap-md">
              {jlptLevels.map((level) => (
                <Link key={level.level} href={level.href}>
                  <div className="group cursor-pointer bg-muted/10 rounded-2xl app-p-lg md:app-p-xl text-center transition-all duration-200 hover:bg-muted/30 border border-border/20">
                    <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4 group-hover:scale-105 transition-transform duration-200 ${level.bgColor} relative`}>
                      <span className={`text-2xl font-bold ${level.textColor}`}>
                        {level.level}
                      </span>
                      <div className="absolute -top-1 -right-1 w-3 h-3 bg-accent rounded-full flex items-center justify-center">
                        <Sparkles className="w-2 h-2 text-accent-foreground" />
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

            {/* Custom JLPT Info */}
            <div className="mt-12">
              <div className="bg-muted/30 rounded-2xl border-dashed border-2 border-border/30 app-p-lg md:app-p-xl text-center">
                <div className="flex items-center justify-center gap-4 mb-4">
                  <Sparkles className="w-6 h-6 text-primary" />
                  <h3 className="text-lg font-semibold text-foreground">
                    {t('jlpt.custom.info.title')}
                  </h3>
                  <Lightbulb className="w-6 h-6 text-primary" />
                </div>
                <p className="text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                  {t('jlpt.custom.info.description')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
