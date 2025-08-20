// BACKUP 2025-08-13 of src/app/study/[level]/theory/page.tsx
// Original file before UI improvements for vocabulary/grammar selection
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
      <div className="app-container py-6">
        <div className="app-content max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2">Lý thuyết {level.toUpperCase()}</h1>
            <p className="text-muted-foreground">Chọn loại lý thuyết bạn muốn học</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 md:gap-8 place-items-center">
            <Link href={`/study/${level}/theory/vocabulary`} className="block w-full max-w-[320px]">
              <div className="rounded-2xl p-6 bg-card border border-border hover:opacity-90 transition">
                <div className="text-center">
                  <h3 className="text-2xl font-bold mb-2">Từ vựng</h3>
                  <p className="text-muted-foreground">Học từ vựng theo cấp độ</p>
                </div>
              </div>
            </Link>

            <Link href={`/study/${level}/theory/grammar`} className="block w-full max-w-[320px]">
              <div className="rounded-2xl p-6 bg-card border border-border hover:opacity-90 transition">
                <div className="text-center">
                  <h3 className="text-2xl font-bold mb-2">Ngữ pháp</h3>
                  <p className="text-muted-foreground">Học ngữ pháp theo cấp độ</p>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
