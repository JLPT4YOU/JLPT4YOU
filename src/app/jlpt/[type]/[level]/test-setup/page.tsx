import React from "react"
import { JLPTTestSetupPageContent } from "./test-setup-content"
import { isValidJLPTLevel, isValidJLPTType } from "@/lib/utils"
import { notFound } from "next/navigation"

interface JLPTTestSetupPageProps {
  params: Promise<{
    type: string
    level: string
  }>
}

export default async function JLPTTestSetupPage({ params }: JLPTTestSetupPageProps) {
  const resolvedParams = await params

  // Validate params on server side
  if (!isValidJLPTType(resolvedParams.type) || !isValidJLPTLevel(resolvedParams.level)) {
    notFound()
  }

  return (
    <JLPTTestSetupPageContent
      type={resolvedParams.type}
      level={resolvedParams.level}
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
