import { JLPTTestSetup } from "@/components/jlpt-test-setup"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { notFound } from "next/navigation"
import { isValidJLPTType, isValidJLPTLevel } from "@/lib/utils"
import { loadTranslation, getLanguageFromCode } from "@/lib/i18n"

interface JLPTLevelPageProps {
  params: Promise<{
    lang: string
    type: string
    level: string
  }>
}

export default async function JLPTLevelPage({ params }: JLPTLevelPageProps) {
  const resolvedParams = await params

  // Validate parameters
  if (!isValidJLPTType(resolvedParams.type) || !isValidJLPTLevel(resolvedParams.level)) {
    notFound()
  }

  // Get language and load translations
  const language = getLanguageFromCode(resolvedParams.lang)
  if (!language) {
    notFound()
  }

  const translations = await loadTranslation(language)

  return (
    <ProtectedRoute>
      <JLPTTestSetup
        type={resolvedParams.type as 'official' | 'custom'}
        level={resolvedParams.level}
        translations={translations}
      />
    </ProtectedRoute>
  )
}
