"use client"

import Link from "next/link";
import { Car, Clock, FileText, Users, BookOpen, GraduationCap, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WithTranslations, getLevelDisplayInfo } from "@/components/shared/component-utils";

interface DrivingLevelTemplateProps {
  level: "karimen" | "honmen";
}

export function DrivingLevelTemplate({ level }: DrivingLevelTemplateProps) {
  return (
    <WithTranslations>
      {({ translations, t }) => {
        const levelInfo = getLevelDisplayInfo(level, 'driving')

        const levelInfoMap = {
          karimen: {
            title: t('driving.levelInfo.karimen.title'),
            description: t('driving.levelInfo.karimen.description'),
            time: t('driving.levelInfo.karimen.time'),
            questions: t('driving.levelInfo.karimen.questions'),
            passScore: t('driving.levelInfo.karimen.passScore'),
            icon: BookOpen,
            bgColor: "bg-secondary",
            textColor: "text-secondary-foreground"
          },
          honmen: {
            title: t('driving.levelInfo.honmen.title'),
            description: t('driving.levelInfo.honmen.description'),
            time: t('driving.levelInfo.honmen.time'),
            questions: t('driving.levelInfo.honmen.questions'),
            passScore: t('driving.levelInfo.honmen.passScore'),
            icon: GraduationCap,
            bgColor: "bg-primary/10",
            textColor: "text-primary"
          }
        };

        const info = levelInfoMap[level];

        // Tạo href cho trang chọn thời gian
        const testSetupHref = `/driving/${level}/test-setup`;

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
                <h3 className="font-semibold text-foreground mb-2">{t('driving.template.duration')}</h3>
                <p className="text-sm text-muted-foreground">{info.time}</p>
              </div>
              <div className="bg-background rounded-2xl p-6 md:p-8 text-center">
                <FileText className="w-8 h-8 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-semibold text-foreground mb-2">{t('driving.template.totalQuestions')}</h3>
                <p className="text-sm text-muted-foreground">{info.questions}</p>
              </div>
              <div className="bg-background rounded-2xl p-6 md:p-8 text-center">
                <Users className="w-8 h-8 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-semibold text-foreground mb-2">{t('driving.template.passingScore')}</h3>
                <p className="text-sm text-muted-foreground">{info.passScore}</p>
              </div>
            </div>

            {/* Start Test Section */}
            <div className="bg-muted/30 rounded-2xl p-8 md:p-12 text-center">
              <div className="w-20 h-20 bg-muted/50 rounded-full flex items-center justify-center mx-auto mb-6">
                <Car className="w-10 h-10 text-muted-foreground" />
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-4">
                {t('driving.template.readyToStart')}
              </h2>
              <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
                {t('driving.template.chooseTime').replace('{level}', level === 'karimen' ? 'Karimen' : 'Honmen')}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href={testSetupHref}>
                  <Button size="lg" className="w-full sm:w-auto px-8 rounded-xl">
                    <Play className="w-5 h-5 mr-2" />
                    {t('driving.template.startTest')}
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
        )
      }}
    </WithTranslations>
  );
}
