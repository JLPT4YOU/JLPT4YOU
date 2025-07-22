import { DrivingLevelTemplate } from "@/components/driving-level-template"
import { ProtectedRoute } from "@/components/auth/protected-route"

interface DrivingHonmenPageProps {
  params: Promise<{
    lang: string
  }>
}

export default async function DrivingHonmenPage({ params }: DrivingHonmenPageProps) {
  const resolvedParams = await params

  return (
    <ProtectedRoute>
      <DrivingLevelTemplate
        level="honmen"
      />
    </ProtectedRoute>
  )
}
