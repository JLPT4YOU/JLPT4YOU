import { JLPTLevelTemplate } from "@/components/jlpt-level-template"
import { isValidJLPTLevel, isValidJLPTType } from "@/lib/utils"
import { notFound } from "next/navigation"

interface JLPTLevelPageProps {
  params: Promise<{
    type: string
    level: string
  }>
}

export default async function JLPTLevelPage({ params }: JLPTLevelPageProps) {
  const { type, level } = await params

  // Validate parameters
  if (!isValidJLPTType(type) || !isValidJLPTLevel(level)) {
    notFound()
  }

  return (
    <JLPTLevelTemplate
      level={level.toUpperCase() as 'N1' | 'N2' | 'N3' | 'N4' | 'N5'}
      type={type as 'custom' | 'official'}
    />
  )
}

// Generate static params for all valid combinations
export function generateStaticParams() {
  const types = ['custom', 'official']
  const levels = ['n1', 'n2', 'n3', 'n4', 'n5']

  return types.flatMap(type =>
    levels.map(level => ({
      type,
      level
    }))
  )
}
