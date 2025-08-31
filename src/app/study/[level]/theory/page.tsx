"use client"

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { BookOpen, Target } from 'lucide-react'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { LanguagePageWrapper } from '@/components/language-page-wrapper'

export default function StudyTheoryByLevelPage() {
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

  return (
    <div className="min-h-screen bg-background">
      <div className="app-container app-section">
        <div className="app-content">
          <div className="max-w-4xl mx-auto app-space-2xl">
            {/* Header Section */}
            <header className="text-center app-space-lg">
              <div className="w-20 h-20 mx-auto mb-6 bg-muted/50 rounded-full flex items-center justify-center border border-border" aria-hidden="true">
                <BookOpen className="h-10 w-10 text-foreground" />
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-foreground">
                {t('study.theory.page.title')} {level.toUpperCase()}
              </h1>
            </header>

            {/* Selection Cards - Responsive Grid: 2-2-2-2-2 for this specific case */}
            <main className="flex justify-center app-space-xl" role="main">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 md:gap-8 place-items-center w-max">
                {/* Vocabulary Card */}
                <Link
                  href={`/study/${level}/theory/vocabulary`}
                  className="block w-full max-w-[320px] group focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-2xl"
                  aria-label={t('study.theory.vocabularyAriaLabel', { level: level.toUpperCase() })}
                >
                  <article className="bg-muted/10 rounded-2xl p-6 md:p-8 text-center transition-all duration-200 hover:bg-muted/30 border border-border/20 group-hover:scale-105">
                    <div className="w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4 group-hover:scale-105 transition-transform duration-200 bg-primary/10 group-hover:bg-primary/20">
                      <BookOpen className="w-8 h-8 text-primary" />
                    </div>
                    <h2 className="font-semibold text-foreground mb-2 text-xl">{t('study.vocabulary.title')}</h2>
                    <p className="text-muted-foreground text-sm">{t('study.vocabulary.description')}</p>
                  </article>
                </Link>

                {/* Grammar Card */}
                <Link
                  href={`/study/${level}/theory/grammar`}
                  className="block w-full max-w-[320px] group focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-2xl"
                  aria-label={t('study.theory.grammarAriaLabel', { level: level.toUpperCase() })}
                >
                  <article className="bg-muted/10 rounded-2xl p-6 md:p-8 text-center transition-all duration-200 hover:bg-muted/30 border border-border/20 group-hover:scale-105">
                    <div className="w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4 group-hover:scale-105 transition-transform duration-200 bg-primary/10 group-hover:bg-primary/20">
                      <Target className="w-8 h-8 text-primary" />
                    </div>
                    <h2 className="font-semibold text-foreground mb-2 text-xl">{t('study.grammar.title')}</h2>
                    <p className="text-muted-foreground text-sm">{t('study.grammar.description')}</p>
                  </article>
                </Link>
              </div>
            </main>
          </div>
        </div>
      </div>
    </div>
  )
}
