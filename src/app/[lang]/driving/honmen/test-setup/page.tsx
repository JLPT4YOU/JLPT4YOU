"use client"

import { TestSectionSelector } from "@/components/test-section-selector"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { loadTranslation, getLanguageFromCode, TranslationData } from "@/lib/i18n"
import { notFound } from "next/navigation"

interface HonmenTestSetupPageProps {
  params: Promise<{
    lang: string
  }>
}

export default function HonmenTestSetupPage({ params }: HonmenTestSetupPageProps) {
  const router = useRouter()
  const [translations, setTranslations] = useState<TranslationData | null>(null)
  const [language, setLanguage] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      try {
        const resolvedParams = await params
        const lang = getLanguageFromCode(resolvedParams.lang)
        
        if (!lang) {
          notFound()
          return
        }

        setLanguage(lang)
        const translationData = await loadTranslation(lang)
        setTranslations(translationData)
        setIsLoading(false)
      } catch (error) {
        console.error('Failed to load translations:', error)
        setIsLoading(false)
        notFound()
      }
    }
    loadData()
  }, [params])

  const handleStartTest = (
    _selectedSections: string[],
    timeMode: 'default' | 'custom' | 'unlimited',
    customTime?: number
  ) => {
    const searchParams = new URLSearchParams({
      timeMode,
      ...(customTime && { customTime: customTime.toString() })
    })
    
    router.push(`/${language}/driving/honmen/test?${searchParams.toString()}`)
  }

  if (isLoading || !translations || !language) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading translations...</p>
        </div>
      </div>
    )
  }

  return (
    <TestSectionSelector
      testType="driving"
      onStartTest={handleStartTest}
      translations={translations}
    />
  )
}
