"use client"

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { ProtectedRoute } from "@/components/auth/protected-route";

export default function StudyPracticePage() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to N5 practice selection by default
    router.replace('/study/n5/practice')
  }, [router])

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Redirecting to practice selection...</p>
        </div>
      </div>
    </ProtectedRoute>
  );
}
