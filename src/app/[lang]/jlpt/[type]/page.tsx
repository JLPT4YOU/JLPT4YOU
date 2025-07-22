import { JLPTTypeSelection } from "@/components/jlpt-type-selection"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { notFound } from "next/navigation"
import { isValidJLPTType } from "@/lib/utils"

interface JLPTTypePageProps {
  params: Promise<{
    lang: string
    type: string
  }>
}

export default async function JLPTTypePage({ params }: JLPTTypePageProps) {
  const resolvedParams = await params

  // Validate type parameter
  if (!isValidJLPTType(resolvedParams.type)) {
    notFound()
  }

  return (
    <ProtectedRoute>
      <JLPTTypeSelection
        type={resolvedParams.type as 'official' | 'custom'}
        lang={resolvedParams.lang}
      />
    </ProtectedRoute>
  )
}
