"use client"

import { TestSectionSelector } from "@/components/test-section-selector"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { loadTranslation, DEFAULT_LANGUAGE, TranslationData } from "@/lib/i18n"

export default function KarimenTestSetupPage() {
  const router = useRouter()
  const [translations, setTranslations] = useState<TranslationData | null>(null)

  // Load translations
  useEffect(() => {
    const loadTranslations = async () => {
      try {
        const translationData = await loadTranslation(DEFAULT_LANGUAGE)
        setTranslations(translationData)
      } catch (error) {
        console.error('Failed to load translations:', error)
      }
    }
    loadTranslations()
  }, [])

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
