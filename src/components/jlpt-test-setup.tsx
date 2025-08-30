"use client"

import { TestSectionSelector } from "@/components/test-section-selector"
import { useRouter, usePathname } from "next/navigation"
import { generateJLPTTestUrl } from "@/lib/utils"
import { TranslationData, getLanguageFromPath, DEFAULT_LANGUAGE } from "@/lib/i18n"

interface JLPTTestSetupProps {
  type: 'custom' | 'official'
  level: string
  translations: TranslationData
  t: (key: string) => any
  language: string
}

export function JLPTTestSetup({ type, level, translations }: JLPTTestSetupProps) {
  const router = useRouter()
  const pathname = usePathname()

  const handleStartTest = (
    selectedSections: string[],
    timeMode: 'default' | 'custom' | 'unlimited',
    customTime?: number
  ) => {
    const params = new URLSearchParams({
      sections: selectedSections.join(','),
      timeMode,
      ...(customTime && { customTime: customTime.toString() })
    })

    // Get current language from pathname
    const language = getLanguageFromPath(pathname) || DEFAULT_LANGUAGE
    const testUrl = generateJLPTTestUrl(type, level, params, language)
    router.push(testUrl)
  }

  return (
    <TestSectionSelector
      testType="jlpt"
      onStartTest={handleStartTest}
      translations={translations}
    />
  )
}
