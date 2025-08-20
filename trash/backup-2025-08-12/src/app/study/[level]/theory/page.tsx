"use client"

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { LanguagePageWrapper } from '@/components/language-page-wrapper'

export default function StudyTheoryByLevelPage() {
  return (
    <ProtectedRoute>
      <LanguagePageWrapper>
        {() => <Content />}
      </LanguagePageWrapper>
    </ProtectedRoute>
  )
}

function Content() {
  const params = useParams<{ level: string }>()
  const level = (params?.level || 'n5').toLowerCase()

  return (
    <div className="min-h-screen bg-background">
      <div className="app-container py-8">
        <div className="app-content max-w-5xl mx-auto">
          <div className="text-center app-space-md">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">Theory • {level.toUpperCase()}</h1>
            <p className="text-muted-foreground">Choose a category</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 md:gap-8 place-items-center">
            <Link href={`/study/${level}/theory/vocabulary`} className="block w-full max-w-[320px]">
              <div className="rounded-2xl p-6 bg-card border border-border hover:opacity-90 transition">
                <div className="text-center">
                  <h3 className="text-2xl font-bold mb-2">Vocabulary</h3>
                  <p className="text-muted-foreground">Study words by level</p>
                </div>
              </div>
            </Link>

            <Link href={`/study/${level}/theory/grammar`} className="block w-full max-w-[320px]">
              <div className="rounded-2xl p-6 bg-card border border-border hover:opacity-90 transition">
                <div className="text-center">
                  <h3 className="text-2xl font-bold mb-2">Grammar</h3>
                  <p className="text-muted-foreground">Study grammar by level</p>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

