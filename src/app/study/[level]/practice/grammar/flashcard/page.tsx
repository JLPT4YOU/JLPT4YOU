"use client"

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { LanguagePageWrapper } from '@/components/language-page-wrapper'
import { FlashcardContainer } from '@/components/flashcard/flashcard-container'
import { FlashcardData, FlashcardSession } from '@/components/flashcard/flashcard-types'
import { getGrammarByLevel, JLPTGrammar } from '@/utils/jlptAPI'
import { BookOpen } from 'lucide-react'
import { useTranslations } from '@/hooks/use-translations'

export default function GrammarFlashcardPage() {
  return (
    <ProtectedRoute>
      <LanguagePageWrapper>
        {() => <Content />}
      </LanguagePageWrapper>
    </ProtectedRoute>
  )
}

function Content() {
  const { t } = useTranslations()
  const params = useParams<{ level: string }>()
  const router = useRouter()
  const level = (params?.level || 'n5').toLowerCase() as 'n5' | 'n4' | 'n3' | 'n2' | 'n1'

  const [flashcards, setFlashcards] = useState<FlashcardData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Load grammar data
  useEffect(() => {
    async function loadGrammar() {
      try {
        setLoading(true)
        setError(null)

        const response = await getGrammarByLevel(level, 30, 0) // Load first 30 grammar points
        
        const flashcardData: FlashcardData[] = response.grammar.map((grammar: JLPTGrammar) => {
          // Build comprehensive back content
          let backContent = grammar.meaning_vn || grammar.meaning_en || t('study.flashcard.noMeaning')

          // Add English meaning if Vietnamese is primary
          if (grammar.meaning_vn && grammar.meaning_en) {
            backContent += `\n\nEnglish: ${grammar.meaning_en}`
          }

          // Add structure if available
          if (grammar.structure) {
            backContent += `\n\n${t('study.flashcard.structure')}: ${grammar.structure}`
          }

          // Add usage note if available
          if ((grammar as any).usage) {
            backContent += `\n\n${t('study.flashcard.usage')}: ${(grammar as any).usage}`
          }

          // Add first example only if available
          if (grammar.examples && grammar.examples.length > 0) {
            const firstExample = grammar.examples[0]
            if (firstExample.jp) {
              backContent += `\n\n${t('study.flashcard.example')}: ${firstExample.jp}`
              if (firstExample.vn) {
                backContent += `\n${firstExample.vn}`
              }
              if (firstExample.en) {
                backContent += `\n${firstExample.en}`
              }
            }
          }

          return {
            id: `grammar_${grammar.id}`,
            front: grammar.grammar,
            back: backContent,
            frontAudio: undefined,
            backAudio: undefined,
            image: undefined,
            difficulty: 'medium',
            lastReviewed: undefined,
            nextReview: undefined,
            reviewCount: 0,
            correctCount: 0,
            tags: ['grammar'],
            type: 'grammar',
            level: level
          }
        })
        
        setFlashcards(flashcardData)
      } catch (err) {
        console.error('Error loading grammar:', err)
        setError(t('study.flashcard.error.loadGrammar'))
      } finally {
        setLoading(false)
      }
    }

    loadGrammar()
  }, [level])

  const handleSessionComplete = (session: FlashcardSession) => {
    // TODO: Save session results to database
    console.log('Session completed:', session)
    
    // Show completion message and redirect
    alert(t('study.flashcard.sessionComplete.grammar', { count: session.cards.length, accuracy: Math.round((session.correctAnswers / session.totalAnswers) * 100) }))
    router.push(`/study/${level}/practice/grammar`)
  }

  const handleExit = () => {
    router.push(`/study/${level}/practice/grammar`)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="app-container py-6">
          <div className="app-content max-w-4xl mx-auto">


            {/* Loading State */}
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="text-center space-y-4">
                <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
                  <BookOpen className="w-8 h-8 text-primary animate-pulse" />
                </div>
                <div className="text-lg font-medium text-foreground">
                  {t('study.loadingGrammar')}
                </div>
                <div className="text-muted-foreground">
                  {t('study.flashcard.preparingGrammar', { level: level.toUpperCase() })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <div className="app-container py-6">
          <div className="app-content max-w-4xl mx-auto">


            {/* Error State */}
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="text-center space-y-4">
                <div className="text-lg font-medium text-destructive">
                  {t('common.error')}
                </div>
                <div className="text-muted-foreground">
                  {error}
                </div>
                <button
                  onClick={() => window.location.reload()}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
                >
                  {t('common.retry')}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (flashcards.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <div className="app-container py-6">
          <div className="app-content max-w-4xl mx-auto">


            {/* Empty State */}
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="text-center space-y-4">
                <div className="text-lg font-medium text-foreground">
                  {t('study.flashcard.noGrammar')}
                </div>
                <div className="text-muted-foreground">
                  {t('study.flashcard.noGrammarForLevel', { level: level.toUpperCase() })}
                </div>
                <Link
                  href={`/study/${level}/practice/grammar`}
                  className="inline-block px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
                >
                  {t('common.back')}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="app-container">
        <div className="app-content flex flex-col justify-center min-h-[calc(100vh-120px)] py-8">
          <div className="space-y-4">
            {/* Header */}
            <div className="text-center">
              <h1 className="text-2xl font-bold text-foreground">
                {t('study.flashcard.grammarTitle', { level: level.toUpperCase() })}
              </h1>
            </div>

            {/* Flashcard Container */}
            <FlashcardContainer
              cards={flashcards}
              onComplete={handleSessionComplete}
              onExit={handleExit}
              initialSettings={{
                autoFlip: false,
                audioEnabled: false, // Grammar doesn't need audio by default
                shuffleCards: false,
                showHints: true,
                spacedRepetition: true
              }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
