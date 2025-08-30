"use client"

import * as React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChallengeRulesPopup } from "@/components/challenge-rules-popup"
import { useRouter } from "next/navigation"
import { useTranslations } from "@/hooks/use-translations"
import {
  BookOpen,
  FileText,
  BookOpenCheck,
  Headphones,
  Clock,
  Trophy
} from "lucide-react"
import Link from "next/link"

interface ChallengeTestSetupProps {
  level: string
}

export function ChallengeTestSetup({ level }: ChallengeTestSetupProps) {
  const router = useRouter()
  const [showRulesPopup, setShowRulesPopup] = React.useState(false)
  const { translations, t, language, isLoading } = useLanguageContext()

  if (isLoading || !translations) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  const challengeSections = [
    {
      id: 'vocabulary',
      name: t('challenge.setup.sections.vocabulary'),
      description: 'Vocabulary',
      icon: BookOpen,
      defaultTime: 25
    },
    {
      id: 'grammar',
      name: t('challenge.setup.sections.grammar'),
      description: 'Grammar',
      icon: FileText,
      defaultTime: 30
    },
    {
      id: 'reading',
      name: t('challenge.setup.sections.reading'),
      description: 'Reading',
      icon: BookOpenCheck,
      defaultTime: 60
    },
    {
      id: 'listening',
      name: t('challenge.setup.sections.listening'),
      description: 'Listening',
      icon: Headphones,
      defaultTime: 40
    }
  ]



  const handleStartTest = () => {
    // Show rules popup before starting test
    setShowRulesPopup(true)
  }

  const handleRulesAccepted = () => {
    setShowRulesPopup(false)

    // Navigate to test page with default time mode only
    const params = new URLSearchParams({
      timeMode: 'default'
    })

    router.push(`/${language}/challenge/${level.toLowerCase()}/test?${params.toString()}`)
  }

  const getTotalDefaultTime = () => {
    return challengeSections.reduce((total, section) => total + section.defaultTime, 0)
  }

  const levelKey = level.toLowerCase() as 'n1' | 'n2' | 'n3' | 'n4' | 'n5';
  const currentLevelInfo = {
    title: t(`jlpt.levelInfo.${levelKey}.title`),
    description: t(`jlpt.levelInfo.${levelKey}.description`)
  }

  return (
    <div className="min-h-screen bg-background">

      <div className="app-container app-section">
        <div className="app-content">
          <div className="max-w-4xl mx-auto app-space-lg">
            
            {/* Challenge Sections Display - Read-only */}
            <div className="app-mb-xl">
              <h2 className="text-xl font-semibold text-foreground app-mb-md">
                {t('challenge.setup.sectionsTitle')}
              </h2>
              <p className="text-sm text-muted-foreground app-mb-md">
                {t('challenge.setup.sectionsSubtitle')}
              </p>
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                {challengeSections.map((section) => {
                  const IconComponent = section.icon

                  return (
                    <Card
                      key={section.id}
                      className="border-primary border-2 bg-primary/5 shadow-lg"
                    >
                      <CardContent className="app-p-md">
                        <div className="flex items-center app-gap-sm">
                          <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-primary text-primary-foreground shadow-md">
                            <IconComponent className="w-5 h-5" />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-medium text-primary">
                              {section.name}
                            </h3>
                            <p className="text-sm text-muted-foreground">{section.description}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-primary font-medium">
                              {section.defaultTime} {t('challenge.setup.minutes')}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </div>

            {/* Time Information */}
            <div className="app-mb-xl">
              <h2 className="text-xl font-semibold text-foreground app-mb-md">
                {t('challenge.setup.timeTitle')}
              </h2>

              <Card className="border-primary bg-primary/5 shadow-sm">
                <CardContent className="app-p-md">
                  <div className="flex items-center app-gap-sm">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-primary text-primary-foreground">
                      <Clock className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-primary">{t('challenge.setup.timeStandard')}</h3>
                      <p className="text-sm text-muted-foreground">
                        {t('challenge.setup.timeDescription').replace('{minutes}', getTotalDefaultTime().toString())}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <p className="text-sm text-muted-foreground app-mt-sm text-center">
                {t('challenge.setup.timeNote')}
              </p>
            </div>

            {/* Start Test Button */}
            <div className="text-center">
              <Button
                size="lg"
                onClick={handleStartTest}
                className="app-px-xl app-py-md text-base font-semibold"
              >
                <Trophy className="w-5 h-5 mr-2" />
                {t('challenge.setup.startChallenge')}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Challenge Rules Popup */}
      {showRulesPopup && (
        <ChallengeRulesPopup
          onAccept={handleRulesAccepted}
          onCancel={() => setShowRulesPopup(false)}
          translations={translations}
        />
      )}
    </div>
  )
}
