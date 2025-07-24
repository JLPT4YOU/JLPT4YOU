"use client"

import Link from "next/link";
import { Clock, FileText, Users, Play, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslations } from "@/hooks/use-translations";

interface JLPTLevelTemplateProps {
  level: "N1" | "N2" | "N3" | "N4" | "N5";
  type: "official" | "custom";
}

export function JLPTLevelTemplate({ level, type }: JLPTLevelTemplateProps) {
  const { translations, t, language, isLoading } = useTranslations();

  if (isLoading || !translations) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  const levelKey = level.toLowerCase() as 'n1' | 'n2' | 'n3' | 'n4' | 'n5';
  const info = {
    title: t(`jlpt.levelInfo.${levelKey}.title`),
    description: t(`jlpt.levelInfo.${levelKey}.description`),
    time: t(`jlpt.levelInfo.${levelKey}.time`),
    questions: t(`jlpt.levelInfo.${levelKey}.questions`),
    passScore: t(`jlpt.levelInfo.${levelKey}.passScore`)
  };
  const isCustom = type === "custom";
  const customTitle = isCustom ? info.title.replace("JLPT", "JLPT4YOU") : info.title;
  const customDescription = isCustom
    ? info.description + " - Bài thi được thiết kế riêng"
    : info.description;

  // Tạo href cho trang chọn phần thi với dynamic routing
  const testSetupHref = `/jlpt/${type}/${level.toLowerCase()}/test-setup`;

  return (
    <div className="min-h-screen bg-background">

      {/* Content Section */}
      <div className="app-container app-section">
        <div className="app-content">
          <div className="max-w-4xl mx-auto">
            {/* Test Info Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 mb-12">
              <div className="bg-background rounded-2xl p-6 md:p-8 text-center">
                <Clock className="w-8 h-8 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-semibold text-foreground mb-2">{t('jlpt.template.duration')}</h3>
                <p className="text-sm text-muted-foreground">{info.time}</p>
              </div>
              <div className="bg-background rounded-2xl p-6 md:p-8 text-center">
                <FileText className="w-8 h-8 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-semibold text-foreground mb-2">{t('jlpt.template.totalQuestions')}</h3>
                <p className="text-sm text-muted-foreground">{info.questions}</p>
              </div>
              <div className="bg-background rounded-2xl p-6 md:p-8 text-center">
                <Users className="w-8 h-8 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-semibold text-foreground mb-2">{t('jlpt.template.passingScore')}</h3>
                <p className="text-sm text-muted-foreground">{info.passScore}</p>
              </div>
            </div>

            {/* Start Test Section */}
            <div className="bg-gradient-to-r from-muted/50 to-accent/30 rounded-2xl p-8 md:p-12 text-center">
              <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
                <GraduationCap className="w-10 h-10 text-foreground" />
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-4">
                {t('jlpt.template.readyToStart')}
              </h2>
              <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
                {t('jlpt.template.chooseSection')}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href={testSetupHref}>
                  <Button size="lg" className="w-full sm:w-auto px-8 rounded-xl">
                    <Play className="w-5 h-5 mr-2" />
                    {t('jlpt.template.startTest')}
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
