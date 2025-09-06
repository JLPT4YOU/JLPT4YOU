"use client"

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { BookOpen, Target, FileText, History } from 'lucide-react'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { LanguagePageWrapper } from '@/components/language-page-wrapper'
import { PracticeTypeCard } from '@/components/practice/PracticeTypeCard'

export default function StudyPracticeByLevelPage() {
  return (
    <ProtectedRoute>
      <LanguagePageWrapper>
        {({ language, translations, t }) => <Content language={language} translations={translations} t={t} />}
      </LanguagePageWrapper>
    </ProtectedRoute>
  )
}

interface ContentProps {
  language: string
  translations: any
  t: (key: string) => string
}

function Content({ language, translations, t }: ContentProps) {
  const params = useParams<{ level: string }>()
  const level = (params?.level || 'n5').toLowerCase()

  const practiceTypes = [
    {
      href: `/study/${level}/practice/vocabulary`,
      title: t('study.vocabulary.title'),
      description: t('study.vocabulary.description'),
      Icon: BookOpen,
      ariaLabel: `${t('study.vocabulary.title')} ${level.toUpperCase()}`
    },
    {
      href: `/study/${level}/practice/grammar`,
      title: t('study.grammar.title'),
      description: t('study.grammar.description'),
      Icon: Target,
      ariaLabel: `${t('study.grammar.title')} ${level.toUpperCase()}`
    },
    {
      href: `/study/${level}/practice/reading`,
      title: t('study.practice.reading.title'),
      description: t('study.practice.reading.description'),
      Icon: FileText,
      ariaLabel: `${t('study.practice.types.reading')} ${level.toUpperCase()}`
    }
  ]

  return (
    <div className="min-h-screen bg-background">
      <div className="app-container app-section">
        <div className="app-content">
          <div className="max-w-4xl mx-auto space-y-12">
            {/* Header Section */}
            <header className="text-center space-y-6">
              <div className="w-20 h-20 mx-auto mb-6 bg-muted/50 rounded-full flex items-center justify-center border border-border" aria-hidden="true">
                <Target className="h-10 w-10 text-foreground" />
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-foreground">
                {t('study.practice.levelTitle').replace('{level}', level.toUpperCase())}
              </h1>
              <p className="text-lg sm:text-xl text-muted-foreground mt-4">
                {t('study.practice.selectType')}
              </p>

              {/* History Button */}
              <div className="mt-6">
                <Link
                  href={`/study/${level}/history`}
                  className="inline-flex items-center px-4 py-2 bg-muted/20 text-foreground rounded-lg hover:bg-muted/40 transition-colors border border-border/20"
                >
                  <History className="h-4 w-4 mr-2" />
                  {t('study.history.viewHistory')}
                </Link>
              </div>
            </header>

            {/* Selection Cards */}
            <main className="flex justify-center space-y-8" role="main">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8 items-stretch justify-items-center">
                {practiceTypes.map((practiceType, index) => (
                  <PracticeTypeCard
                    key={index}
                    href={practiceType.href}
                    title={practiceType.title}
                    description={practiceType.description}
                    Icon={practiceType.Icon}
                    level={level}
                    ariaLabel={practiceType.ariaLabel}
                  />
                ))}
              </div>
            </main>
          </div>
        </div>
      </div>
    </div>
  )
}
