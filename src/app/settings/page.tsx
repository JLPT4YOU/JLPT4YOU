"use client"

import { ProtectedRoute } from "@/components/auth/protected-route";
import { Settings } from "lucide-react";
import { useTranslations } from "@/hooks/use-translations";

export default function SettingsPage() {
  const { t } = useTranslations()

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <div className="app-container app-section">
          <div className="app-content">
            <div className="text-center py-16">
              <Settings className="w-16 h-16 mx-auto mb-4 text-primary" />
              <h1 className="text-3xl font-bold text-foreground mb-2">
                {t ? t('pages.settings.title') : 'Settings'}
              </h1>
              <p className="text-muted-foreground mb-8">
                {t ? t('pages.settings.description') : 'Account customization - Feature under development'}
              </p>
              <div className="bg-muted/20 rounded-lg p-8 max-w-md mx-auto">
                <p className="text-sm text-muted-foreground">
                  {t ? t('pages.settings.comingSoon') : 'This page is under construction. Please come back later!'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
