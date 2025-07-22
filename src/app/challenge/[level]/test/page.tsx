"use client"

import { ExamInterface } from "@/components/exam"
import { AntiCheatSystem, AntiCheatViolation } from "@/components/anti-cheat-system"
import { FullscreenRequirementModal } from "@/components/fullscreen-requirement-modal"
import { generateJLPTQuestions } from "@/lib/sample-exam-data"
import { isValidJLPTLevel } from "@/lib/utils"
import { notFound, useRouter } from "next/navigation"
import { useEffect, useState, Suspense } from "react"
import { ExamPageTemplate } from "@/components/layout/exam-page-template";
import { useExamConfig } from "@/hooks/use-exam-config";
import { createTranslationFunction, TranslationData } from "@/lib/i18n"

interface ChallengeTestPageProps {
  params: Promise<{
    level: string
  }>
}

interface ChallengeTestContentProps {
  params: Promise<{ level: string }>;
  translations: TranslationData;
}

function ChallengeTestContent({ params, translations }: ChallengeTestContentProps) {
  const router = useRouter()
  const examConfig = useExamConfig()
  const [resolvedParams, setResolvedParams] = useState<{ level: string } | null>(null)

  // Anti-cheat state
  const [showFullscreenModal, setShowFullscreenModal] = useState(true)
  const [isAntiCheatActive, setIsAntiCheatActive] = useState(false)
  const [violations, setViolations] = useState<AntiCheatViolation[]>([])
  const [examStarted, setExamStarted] = useState(false)
  
  // Translation function
  const t = createTranslationFunction(translations)

  useEffect(() => {
    params.then(setResolvedParams)
  }, [params])

  if (!resolvedParams) {
    return <div>Loading...</div>
  }

  const { level } = resolvedParams

  // Validate parameters
  if (!isValidJLPTLevel(level)) {
    notFound()
  }

  // Get test configuration from exam config hook
  const { timeMode, customTime } = examConfig

  // Challenge mode always includes all sections
  const allSections = ['vocabulary', 'grammar', 'reading', 'listening']

  // Generate exam title for Challenge mode
  const getExamTitle = () => {
    const levelLabel = level.toUpperCase()
    return t('examTitle.challenge').replace('{level}', levelLabel)
  }

  // Calculate time limit based on mode
  const getTimeLimit = () => {
    // Default time limits by level for Challenge mode (full test)
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

  // Generate questions based on level (all sections included)
  const getQuestions = () => {
    return generateJLPTQuestions(level, allSections)
  }

  // Handle exam submission
  const handleExamSubmit = (answers: Record<number, 'A' | 'B' | 'C' | 'D'>) => {
    // In real app, this would submit to API and show results
    console.log('Challenge Exam submitted:', {
      type: 'challenge',
      level,
      sections: allSections,
      timeMode,
      customTime,
      answers
    })

    // Redirect to results page with exam parameters
    const params = examConfig.createResultsParams('challenge', level)
    // Add sections for Challenge mode (all sections included)
    params.set('sections', allSections.join(','))

    router.push(`/exam-results?${params.toString()}`)
  }

  // Handle exam pause (disabled for Challenge mode)
  const handleExamPause = () => {
    console.log('Challenge Exam pause attempted - blocked')
  }

  // Handle fullscreen activation
  const handleFullscreenActivated = () => {
    setShowFullscreenModal(false)
    setIsAntiCheatActive(true)
    setExamStarted(true)
  }

  // Handle fullscreen modal cancel
  const handleFullscreenCancel = () => {
    router.push('/challenge')
  }

  // Handle anti-cheat violation
  const handleViolation = (violation: AntiCheatViolation) => {
    setViolations(prev => [...prev, violation])
    console.log('Anti-cheat violation detected:', violation)
  }

  // Handle max violations reached
  const handleMaxViolationsReached = () => {
    console.log('Max violations reached - ending exam')
    // Removed browser alert popup - user will see custom modal instead
    setTimeout(() => {
      router.push('/')
    }, 2000) // Give time for user to see the final violation warning
  }

  // Show fullscreen modal first
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
      <ExamPageTemplate>
        {(translations) => (
          <ChallengeTestContent params={params} translations={translations} />
        )}
      </ExamPageTemplate>
    </Suspense>
  );
}
