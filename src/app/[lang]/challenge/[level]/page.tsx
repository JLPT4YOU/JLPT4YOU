import { ChallengeTestSetup } from "@/components/challenge-test-setup"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { notFound } from "next/navigation"
import { isValidJLPTLevel } from "@/lib/utils"

// Force dynamic rendering for pages using useSearchParams
export const dynamic = 'force-dynamic'

interface ChallengeLevelPageProps {
  params: Promise<{
    lang: string
    level: string
  }>
}

export default async function ChallengeLevelPage({ params }: ChallengeLevelPageProps) {
  const resolvedParams = await params
  
  // Validate level parameter
  if (!isValidJLPTLevel(resolvedParams.level)) {
    notFound()
  }

  return (
    <ProtectedRoute>
      <ChallengeTestSetup
        level={resolvedParams.level}
      />
    </ProtectedRoute>
  )
}
