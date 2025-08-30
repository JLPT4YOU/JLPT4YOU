"use client"

import { TestSectionSelector } from "@/components/test-section-selector"
import { useRouter } from "next/navigation"
import { TranslationData } from "@/lib/i18n"
import { useTranslations } from "@/hooks/use-translations"

export default function KarimenTestSetupPage() {
  const router = useRouter()
  const { translations } = useTranslations()

  const handleStartTest = (
    _selectedSections: string[],
    timeMode: 'default' | 'custom' | 'unlimited',
    customTime?: number
  ) => {
    const params = new URLSearchParams({
      timeMode,
      ...(customTime && { customTime: customTime.toString() })
    })

    router.push(`/driving/karimen/test?${params.toString()}`)
  }

  if (!translations) {
    return <div>Loading...</div>
  }

  return (
    <TestSectionSelector
      testType="driving"
      onStartTest={handleStartTest}
      translations={translations}
    />
  )
}
