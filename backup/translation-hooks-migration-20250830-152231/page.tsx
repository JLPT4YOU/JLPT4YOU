"use client"

import { ProtectedRoute } from "@/components/auth/protected-route";
import { TopUpInterface } from "@/components/top-up/top-up-interface";
import { useTranslations } from "@/hooks/use-translations";

export default function TopUpPage() {
  const { t } = useLanguageContext()

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <div className="app-container app-section">
          <div className="app-content">
            <TopUpInterface />
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
