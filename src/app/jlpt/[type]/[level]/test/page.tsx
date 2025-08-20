"use client"

import { ExamInterface } from "@/components/exam"
import { generateJLPTQuestions } from "@/lib/sample-exam-data"
import { ExamPageTemplate } from "@/components/layout/exam-page-template"
import { getLanguageFromPath, DEFAULT_LANGUAGE, type Language } from "@/lib/i18n"
import { usePathname } from "next/navigation"
import { useExamConfig } from "@/hooks/use-exam-config";

import { isValidJLPTLevel, isValidJLPTType } from "@/lib/utils";
import { notFound, useRouter } from "next/navigation"
import { useEffect, useState, Suspense } from "react"
import { TranslationData } from "@/lib/i18n"

interface JLPTTestPageProps {
  params: Promise<{
    type: string
    level: string
  }>
}

interface JLPTTestContentProps {
  params: Promise<{ type: string; level: string }>;
  translations: TranslationData;
}

function JLPTTestContent({ params, translations }: JLPTTestContentProps) {
  const router = useRouter()
  const examConfig = useExamConfig()
  const [resolvedParams, setResolvedParams] = useState<{ type: string; level: string } | null>(null)

  useEffect(() => {
    params.then(setResolvedParams)
  }, [params])

  if (!resolvedParams) {
    return <div>Loading...</div>
  }

  const { type, level } = resolvedParams

  // Validate parameters
  if (!isValidJLPTType(type) || !isValidJLPTLevel(level)) {
    notFound()
  }

  // Get test configuration from exam config hook
  const { sections, timeMode, customTime } = examConfig

  // Generate exam title
  const getExamTitle = () => {
    const typeLabel = type === 'custom' ? 'JLPT4YOU' : 'JLPT'
    const levelLabel = level.toUpperCase()
    const sectionsLabel = sections.length > 0 ? ` - ${sections.join(', ')}` : ''
    return `${typeLabel} ${levelLabel}${sectionsLabel}`
  }

  // Calculate time limit based on mode
  const getTimeLimit = () => {
    // Default time limits by level
    const defaultTimes = {
      n1: 170, // 170 minutes
      n2: 155, // 155 minutes  
      n3: 140, // 140 minutes
      n4: 125, // 125 minutes
      n5: 105  // 105 minutes
    }
    
    const defaultTime = defaultTimes[level as keyof typeof defaultTimes] || 105
    return examConfig.getTimeLimit(defaultTime)
  }

  // Generate questions based on level and sections
  const getQuestions = () => {
    return generateJLPTQuestions(level, sections)
  }

  // Handle exam submission
  const handleExamSubmit = (answers: Record<number, 'A' | 'B' | 'C' | 'D'>) => {
    // In real app, this would submit to API and show results
    console.log('JLPT Exam submitted:', {
      type,
      level,
      sections,
      timeMode,
      customTime,
      answers
    })

    // Redirect to results page with exam parameters
    const params = examConfig.createResultsParams('jlpt', level, type)

    router.push(`/exam-results?${params.toString()}`)
  }

  // Handle exam pause
  const handleExamPause = () => {
    console.log('JLPT Exam paused')
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
  // Detect current language from the URL so the exam page can load correct translations
  const pathname = usePathname()
  const language: Language = getLanguageFromPath(pathname) || DEFAULT_LANGUAGE;
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ExamPageTemplate language={language}>
        {(translations) => (
          <JLPTTestContent params={params} translations={translations} />
        )}
      </ExamPageTemplate>
    </Suspense>
  )
}
