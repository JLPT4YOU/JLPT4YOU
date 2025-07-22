"use client"

import { ExamInterface } from "@/components/exam"
import { generateDrivingQuestions } from "@/lib/sample-exam-data"
import { useRouter } from "next/navigation"
import { useSearchParams } from "next/navigation"
import { Suspense, useEffect, useState } from "react"
import { loadTranslation, getLanguageFromCode, TranslationData } from "@/lib/i18n"
import { notFound } from "next/navigation"

interface HonmenTestPageProps {
  params: Promise<{
    lang: string
  }>
}

function HonmenTestContent({ params }: HonmenTestPageProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [resolvedParams, setResolvedParams] = useState<{ lang: string } | null>(null)
  const [translations, setTranslations] = useState<TranslationData | null>(null)

  useEffect(() => {
    params.then(setResolvedParams)
  }, [params])

  // Get test configuration from URL params
  const timeMode = searchParams.get('timeMode') || 'default'
  const customTime = searchParams.get('customTime')

  // Load translations based on language from URL
  useEffect(() => {
    const loadTranslations = async () => {
      if (!resolvedParams) return

      try {
        const lang = getLanguageFromCode(resolvedParams.lang)
        if (!lang) {
          notFound()
          return
        }

        const translationData = await loadTranslation(lang)
        setTranslations(translationData)
      } catch (error) {
        console.error('Failed to load translations:', error)
        notFound()
      }
    }
    loadTranslations()
  }, [resolvedParams])

  const getTimeLimit = (): number => {
    if (timeMode === 'custom' && customTime) {
      return parseInt(customTime)
    }
    return 50 // Default 50 minutes for Honmen
  }

  const getExamTitle = (): string => {
    return 'Driving License Test - Honmen'
  }

  const getQuestions = () => {
    return generateDrivingQuestions('honmen')
  }

  const handleExamSubmit = (answers: Record<number, 'A' | 'B' | 'C' | 'D'>) => {
    console.log('Honmen exam submitted:', answers)
    // Navigate to results page
    const params = new URLSearchParams({
      type: 'driving',
      level: 'honmen',
      sections: 'traffic-rules,road-signs,safety',
      demo: 'driving-honmen-good'
    })
    if (resolvedParams) {
      router.push(`/${resolvedParams.lang}/exam-results?${params.toString()}`)
    }
  }

  const handleExamPause = () => {
    console.log('Honmen exam paused')
    // Navigate back to driving setup
    if (resolvedParams) {
      router.push(`/${resolvedParams.lang}/driving/honmen`)
    }
  }

  if (!translations) {
    return <div>Loading...</div>
  }

  return (
    <ExamInterface
      examTitle={getExamTitle()}
      questions={getQuestions()}
      timeLimit={getTimeLimit()}
      onSubmit={handleExamSubmit}
      onPause={handleExamPause}
      translations={translations}
    />
  )
}

export default function HonmenTestPage({ params }: HonmenTestPageProps) {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <HonmenTestContent params={params} />
    </Suspense>
  )
}
