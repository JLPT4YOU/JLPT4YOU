"use client"

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { Target, Brain } from 'lucide-react'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { LanguagePageWrapper } from '@/components/language-page-wrapper'

export default function StudyPracticeGrammarPage() {
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
                <Target className="h-10 w-10 text-foreground" />
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-foreground">
                {t('study.grammar.title')} {level.toUpperCase()}
              </h1>
              <p className="text-lg sm:text-xl text-muted-foreground mt-4">
                Chọn phương thức học ngữ pháp
              </p>
            </header>



            {/* Selection Cards */}
            <main className="flex justify-center app-space-xl" role="main">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 md:gap-8 place-items-center w-max">
                {/* Flashcard Mode */}
                <Link
                  href={`/study/${level}/practice/grammar/flashcard`}
                  className="block w-full max-w-[320px] group focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-2xl"
                  aria-label="Flashcard học ngữ pháp"
                >
                  <article className="bg-muted/10 rounded-2xl p-6 md:p-8 text-center transition-all duration-200 hover:bg-muted/30 border border-border/20 group-hover:scale-105">
                    <div className="w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4 group-hover:scale-105 transition-transform duration-200 bg-green-500/10 group-hover:bg-green-500/20">
                      <Target className="w-8 h-8 text-green-500" />
                    </div>
                    <h2 className="font-semibold text-foreground mb-2 text-xl">Flashcard</h2>
                    <p className="text-muted-foreground text-sm">Học ngữ pháp qua thẻ ghi nhớ tương tác</p>
                  </article>
                </Link>

                {/* AI Quiz Mode */}
                <Link
                  href={`/study/${level}/practice/grammar/quiz`}
                  className="block w-full max-w-[320px] group focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-2xl"
                  aria-label="Trắc nghiệm AI ngữ pháp"
                >
                  <article className="bg-muted/10 rounded-2xl p-6 md:p-8 text-center transition-all duration-200 hover:bg-muted/30 border border-border/20 group-hover:scale-105">
                    <div className="w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4 group-hover:scale-105 transition-transform duration-200 bg-purple-500/10 group-hover:bg-purple-500/20">
                      <Brain className="w-8 h-8 text-purple-500" />
                    </div>
                    <h2 className="font-semibold text-foreground mb-2 text-xl">Trắc nghiệm AI</h2>
                    <p className="text-muted-foreground text-sm">Luyện tập với câu hỏi do AI tạo ra</p>
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
