"use client"

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { LanguagePageWrapper } from '@/components/language-page-wrapper'
import { FlashcardContainer } from '@/components/flashcard/flashcard-container'
import { FlashcardData, FlashcardSession } from '@/components/flashcard/flashcard-types'
import { getWordsByLevel, JLPTWord } from '@/utils/jlptAPI'
import { BookOpen } from 'lucide-react'

export default function VocabularyFlashcardPage() {
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
  const router = useRouter()
  const level = (params?.level || 'n5').toLowerCase() as 'n5' | 'n4' | 'n3' | 'n2' | 'n1'

  const [flashcards, setFlashcards] = useState<FlashcardData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Load vocabulary data
  useEffect(() => {
    async function loadVocabulary() {
      try {
        setLoading(true)
        setError(null)

        const response = await getWordsByLevel(level, 50, 0) // Load first 50 words

        // Debug: Log first word to see structure
        if (response.words && response.words.length > 0) {
          console.log('Sample word data:', response.words[0])
          console.log('Available fields:', Object.keys(response.words[0]))
        }

        const flashcardData: FlashcardData[] = response.words.map((word: JLPTWord) => {
          // Build comprehensive back content
          let backContent = word.vn || 'Không có nghĩa'

          // Add reading if available
          if (word.Hiragana) {
            backContent += `\n\nĐọc: ${word.Hiragana}`
          }

          // Add English translation if available
          if (word.en) {
            backContent += `\n\nEnglish: ${word.en}`
          }

          // Add part of speech if available
          if ((word as any).pos) {
            backContent += `\n\nLoại từ: ${(word as any).pos}`
          }

          // Add example if available (field name is 'vd' in API)
          if (word.vd) {
            backContent += `\n\nVí dụ: ${word.vd}`
          }

          return {
            id: `vocab_${word.Kanji}`,
            front: word.Kanji || word.Hiragana || 'N/A',
            back: backContent,
            frontAudio: undefined, // TODO: Add TTS
            backAudio: undefined,
            image: undefined,
            difficulty: 'medium',
            lastReviewed: undefined,
            nextReview: undefined,
            reviewCount: 0,
            correctCount: 0,
            tags: [(word as any).pos || 'vocabulary'],
            type: 'vocabulary',
            level: level
          }
        })
        
        setFlashcards(flashcardData)
      } catch (err) {
        console.error('Error loading vocabulary:', err)
        setError('Không thể tải từ vựng. Vui lòng thử lại.')
      } finally {
        setLoading(false)
      }
    }

    loadVocabulary()
  }, [level])

  const handleSessionComplete = (session: FlashcardSession) => {
    // TODO: Save session results to database
    console.log('Session completed:', session)
    
    // Show completion message and redirect
    alert(`Hoàn thành! Bạn đã học ${session.cards.length} từ vựng với độ chính xác ${Math.round((session.correctAnswers / session.totalAnswers) * 100)}%`)
    router.push(`/study/${level}/practice/vocabulary`)
  }

  const handleExit = () => {
    router.push(`/study/${level}/practice/vocabulary`)
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
                  Đang tải từ vựng...
                </div>
                <div className="text-muted-foreground">
                  Chuẩn bị flashcard cho {level.toUpperCase()}
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
                  Có lỗi xảy ra
                </div>
                <div className="text-muted-foreground">
                  {error}
                </div>
                <button
                  onClick={() => window.location.reload()}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
                >
                  Thử lại
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
                  {t('study.flashcard.errors.noVocabulary')}
                </div>
                <div className="text-muted-foreground">
                  {t('study.flashcard.errors.noVocabularyFound').replace('{level}', level.toUpperCase())}
                </div>
                <Link
                  href={`/study/${level}/practice/vocabulary`}
                  className="inline-block px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
                >
                  {t('study.flashcard.actions.goBack')}
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
      <div className="app-container py-6">
        <div className="app-content">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-foreground">
              {t('study.flashcard.vocabularyTitle').replace('{level}', level.toUpperCase())}
            </h1>
          </div>

          {/* Flashcard Container */}
          <FlashcardContainer
            cards={flashcards}
            onComplete={handleSessionComplete}
            onExit={handleExit}
            initialSettings={{
              autoFlip: false,
              audioEnabled: true,
              shuffleCards: true,
              showHints: true,
              spacedRepetition: true
            }}
          />
        </div>
      </div>
    </div>
  )
}
