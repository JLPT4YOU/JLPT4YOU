"use client"

import { ExamInterface } from "@/components/exam"
import { AntiCheatSystem, AntiCheatViolation } from "@/components/anti-cheat-system"
import { FullscreenRequirementModal } from "@/components/fullscreen-requirement-modal"
import { generateJLPTQuestions } from "@/lib/sample-exam-data"
import { isValidJLPTLevel } from "@/lib/utils"
import { notFound, useRouter } from "next/navigation"
import { useSearchParams } from "next/navigation"
import { useEffect, useState, Suspense } from "react"
import { loadTranslation, getLanguageFromCode, TranslationData } from "@/lib/i18n"

interface ChallengeTestPageProps {
  params: Promise<{
    lang: string
    level: string
  }>
}

function ChallengeTestContent({ params }: ChallengeTestPageProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [resolvedParams, setResolvedParams] = useState<{ lang: string; level: string } | null>(null)

  // Anti-cheat state
  const [showFullscreenModal, setShowFullscreenModal] = useState(true)
  const [isAntiCheatActive, setIsAntiCheatActive] = useState(false)
  const [violations, setViolations] = useState<AntiCheatViolation[]>([])
  const [examStarted, setExamStarted] = useState(false)
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

  const { level } = resolvedParams

  // Validate level parameter
  if (!isValidJLPTLevel(level)) {
    notFound()
  }

  // Get test configuration from URL params
  const timeMode = searchParams.get('timeMode') || 'default'
  const customTime = searchParams.get('customTime')

  const getTimeLimit = (): number => {
    if (timeMode === 'custom' && customTime) {
      return parseInt(customTime)
    }
    
    // Default time limits for challenge mode (shorter than regular tests)
    const defaultTimes: Record<string, number> = {
      'n1': 120, // 2h
      'n2': 105, // 1h 45m
      'n3': 90,  // 1h 30m
      'n4': 75,  // 1h 15m
      'n5': 60   // 1h
    }
    
    return defaultTimes[level] || 90
  }

  const getExamTitle = (): string => {
    return `JLPT ${level.toUpperCase()} Challenge`
  }

  const getQuestions = () => {
    return generateJLPTQuestions(level, ['vocabulary', 'grammar', 'reading', 'listening'])
  }

  const handleExamSubmit = (answers: Record<number, 'A' | 'B' | 'C' | 'D'>) => {
    console.log('Challenge exam submitted:', answers)
    // Navigate to results page
    const params = new URLSearchParams({
      type: 'challenge',
      level: level,
      sections: 'vocabulary,grammar,reading,listening',
      demo: `challenge-${level}-good`
    })
    if (resolvedParams) {
      router.push(`/${resolvedParams.lang}/exam-results?${params.toString()}`)
    }
  }

  const handleExamPause = () => {
    console.log('Challenge exam paused')
    // Navigate back to challenge setup
    router.push(`/${resolvedParams.lang}/challenge/${level}`)
  }

  const handleViolation = (violation: AntiCheatViolation) => {
    setViolations(prev => [...prev, violation])
  }

  const handleMaxViolationsReached = () => {
    console.log('Max violations reached, ending exam')
    // Navigate back to home
    router.push(`/${resolvedParams.lang}/home`)
  }

  const handleFullscreenActivated = () => {
    setShowFullscreenModal(false)
    setIsAntiCheatActive(true)
    setExamStarted(true)
  }

  const handleFullscreenCancel = () => {
    // Navigate back to challenge setup
    router.push(`/${resolvedParams.lang}/challenge/${level}`)
  }

  // Show fullscreen requirement modal first
  if (showFullscreenModal) {
    return (
      <FullscreenRequirementModal
        isOpen={showFullscreenModal}
        onFullscreenActivated={handleFullscreenActivated}
        onCancel={handleFullscreenCancel}
        translations={translations}
      />
    )
  }

  // Show exam with anti-cheat protection
  return (
    <AntiCheatSystem
      isActive={isAntiCheatActive && examStarted}
      onViolation={handleViolation}
      onMaxViolationsReached={handleMaxViolationsReached}
      maxViolations={3}
      translations={translations}
    >
      <ExamInterface
        examTitle={getExamTitle()}
        questions={getQuestions()}
        timeLimit={getTimeLimit()}
        onSubmit={handleExamSubmit}
        onPause={handleExamPause}
        examMode="challenge"
        onViolation={handleViolation}
        violationCount={violations.length}
        translations={translations}
      />
    </AntiCheatSystem>
  )
}

export default function ChallengeTestPage({ params }: ChallengeTestPageProps) {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ChallengeTestContent params={params} />
    </Suspense>
  )
}
