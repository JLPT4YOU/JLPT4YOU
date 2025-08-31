"use client"

import { BookOpen } from "lucide-react"
import { Language, TranslationData } from "@/lib/i18n"
import { createPageContent, type BasePageContentProps } from "@/components/shared/component-utils"

interface StudyTheoryPageContentProps extends BasePageContentProps {
  isAuthenticated?: boolean
}

export const StudyTheoryPageContent = createPageContent<{ isAuthenticated?: boolean }>(
  function StudyTheoryPageContentInner({ translations }: StudyTheoryPageContentProps) {
    const t = (key: string) => {
      const keys = key.split('.')
      let value: any = translations
      for (const k of keys) {
        value = value?.[k]
      }
      return value || key
    }

    return <StudyTheoryContent t={t} />
  }
)

interface StudyTheoryContentProps {
  t: (key: string) => string
}

function StudyTheoryContent({ t }: StudyTheoryContentProps) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center relative app-container">
      {/* Main content container - perfectly centered */}
      <div className="w-full max-w-4xl mx-auto app-px-md app-py-lg sm:app-px-lg lg:app-px-xl">
        <div className="flex flex-col items-center justify-center app-space-lg sm:app-space-xl">
          {/* Header - centered */}
          <div className="text-center app-space-md">
            <div className="w-20 h-20 mx-auto mb-6 bg-muted/50 rounded-full flex items-center justify-center border border-border">
              <BookOpen className="h-10 w-10 text-foreground" />
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-4 text-foreground">
              {t('study.theory.page.title')}
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground">
              {t('study.theory.page.subtitle')}
            </p>
          </div>

          {/* Coming soon section */}
          <div className="w-full max-w-2xl mx-auto app-px-md">
            <div className="bg-muted/60 backdrop-blur-sm rounded-2xl app-p-lg sm:app-p-xl border border-border/50 shadow-lg">
              <div className="text-center app-space-sm">
                <div className="text-base sm:text-lg font-semibold text-foreground mb-4">
                  🚧 {t('study.theory.comingSoon')}
                </div>
                <div className="text-sm sm:text-base text-muted-foreground">
                  {t('study.theory.comingSoonDescription')}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
