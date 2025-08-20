import { notFound } from 'next/navigation'
import type { ReactNode } from 'react'
import { use } from 'react'

const ALLOWED_LEVELS = new Set(['n1', 'n2', 'n3', 'n4', 'n5'])

export default function StudyLevelLayout({
  children,
  params,
}: {
  children: ReactNode
  params: Promise<{ level: string }>
}) {
  const { level } = use(params)
  const lv = (level || '').toLowerCase()
  if (!ALLOWED_LEVELS.has(lv)) {
    notFound()
  }
  return children
}

