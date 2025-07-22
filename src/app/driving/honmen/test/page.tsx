"use client"

import { ExamInterface } from "@/components/exam"
import { generateDrivingQuestions } from "@/lib/sample-exam-data"
import { ExamPageTemplate } from "@/components/layout/exam-page-template";
import { useExamConfig } from "@/hooks/use-exam-config";
import { useRouter } from "next/navigation"
import { TranslationData } from "@/lib/i18n";
import { Suspense } from "react"

interface HonmenTestContentProps {
  translations: TranslationData
}

function HonmenTestContent({ translations }: HonmenTestContentProps) {
  const router = useRouter()
  const examConfig = useExamConfig()

  // Get test configuration from exam config hook
  const { timeMode, customTime } = examConfig

  // Generate exam title
  const getExamTitle = () => {
    return (translations as any).examTitle?.honmen || 'Honmen - Official Theory Test'
  }

  // Calculate time limit based on mode
  const getTimeLimit = () => {
    // Default time limit for Honmen
    const defaultTime = 95 // 95 minutes
    return examConfig.getTimeLimit(defaultTime)
  }

  // Generate questions for Honmen test
  const getQuestions = () => {
    return generateDrivingQuestions('honmen')
  }

  // Handle exam submission
  const handleExamSubmit = (answers: Record<number, 'A' | 'B' | 'C' | 'D'>) => {
    // In real app, this would submit to API and show results
    console.log('Honmen Exam submitted:', {
      timeMode,
      customTime,
      answers
    })

    // Redirect to results page with exam parameters
    const params = examConfig.createResultsParams('driving', 'honmen')

    router.push(`/exam-results?${params.toString()}`)
  }

  // Handle exam pause
  const handleExamPause = () => {
    console.log('Honmen Exam paused')
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

export default function HonmenTestPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ExamPageTemplate>
        {(translations) => (
          <HonmenTestContent translations={translations} />
        )}
      </ExamPageTemplate>
    </Suspense>
  );
}
