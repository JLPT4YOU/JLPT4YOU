"use client"

import { ExamInterface } from "@/components/exam"
import { generateJLPTQuestions } from "@/lib/sample-exam-data"
import { isValidJLPTLevel, isValidJLPTType } from "@/lib/utils"
import { notFound, useRouter } from "next/navigation"
import { useSearchParams } from "next/navigation"
import { useEffect, useState, Suspense } from "react"
import { loadTranslation, getLanguageFromCode, TranslationData } from "@/lib/i18n"

interface JLPTTestPageProps {
  params: Promise<{
    lang: string
    type: string
    level: string
  }>
}

function JLPTTestContent({ params }: JLPTTestPageProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [resolvedParams, setResolvedParams] = useState<{ lang: string; type: string; level: string } | null>(null)
  const [translations, setTranslations] = useState<TranslationData | null>(null)

  useEffect(() => {
    params.then(setResolvedParams)
  }, [params])

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

  if (!resolvedParams || !translations) {
    return <div>Loading...</div>
  }

  const { type, level } = resolvedParams

  // Validate parameters
  if (!isValidJLPTType(type) || !isValidJLPTLevel(level)) {
    notFound()
  }

  // Get test configuration from URL params
  const timeMode = searchParams.get('timeMode') || 'default'
  const customTime = searchParams.get('customTime')
  const sections = searchParams.get('sections')?.split(',') || ['vocabulary', 'grammar', 'reading', 'listening']

  const getTimeLimit = (): number => {
    if (timeMode === 'custom' && customTime) {
      return parseInt(customTime)
    }
    
    // Default time limits based on level
    const defaultTimes: Record<string, number> = {
      'n1': 170, // 2h 50m
      'n2': 155, // 2h 35m  
      'n3': 140, // 2h 20m
      'n4': 125, // 2h 5m
      'n5': 105  // 1h 45m
    }
    
    return defaultTimes[level] || 120
  }

  const getExamTitle = (): string => {
    const typeText = type === 'official' ? 'Official' : 'Custom'
    return `JLPT ${level.toUpperCase()} ${typeText} Test`
  }

  const getQuestions = () => {
    return generateJLPTQuestions(level, sections)
  }

  const handleExamSubmit = (answers: Record<number, 'A' | 'B' | 'C' | 'D'>) => {
    console.log('Exam submitted:', answers)
    // Navigate to results page
    const params = new URLSearchParams({
      type: 'jlpt',
      level: level,
      sections: sections.join(','),
      demo: `jlpt-${level}-good`
    })
    if (resolvedParams) {
      router.push(`/${resolvedParams.lang}/exam-results?${params.toString()}`)
    }
  }

  const handleExamPause = () => {
    console.log('Exam paused')
    // Navigate back to test setup
    router.push(`/${resolvedParams.lang}/jlpt/${type}/${level}`)
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

export default function JLPTTestPage({ params }: JLPTTestPageProps) {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <JLPTTestContent params={params} />
    </Suspense>
  )
}
