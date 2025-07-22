import { ChallengeTestSetup } from "@/components/challenge-test-setup"
import { isValidJLPTLevel } from "@/lib/utils"
import { notFound } from "next/navigation"

interface ChallengeLevelPageProps {
  params: Promise<{
    level: string
  }>
}

export default async function ChallengeLevelPage({ params }: ChallengeLevelPageProps) {
  const { level } = await params

  // Validate level parameter
  if (!isValidJLPTLevel(level)) {
    notFound()
  }

  return (
    <ChallengeTestSetup level={level} />
  )
}

// Generate static params for all valid levels
export function generateStaticParams() {
  const levels = ['n1', 'n2', 'n3', 'n4', 'n5']

  return levels.map(level => ({
    level
  }))
}
