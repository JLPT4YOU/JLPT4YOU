import { DrivingLevelTemplate } from "@/components/driving-level-template"
import { ProtectedRoute } from "@/components/auth/protected-route"

interface DrivingKarimenPageProps {
  params: Promise<{
    lang: string
  }>
}

export default async function DrivingKarimenPage({ params }: DrivingKarimenPageProps) {
  const resolvedParams = await params

  return (
    <ProtectedRoute>
      <DrivingLevelTemplate
        level="karimen"
      />
    </ProtectedRoute>
  )
}
