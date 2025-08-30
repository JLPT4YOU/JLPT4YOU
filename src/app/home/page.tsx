"use client"

import { ProtectedRoute } from "@/components/auth/protected-route";
import { HomePageContent } from "@/components/home/home-page-content";
import { LanguagePageWrapper } from "@/components/language-page-wrapper";

export default function HomePage() {
  return (
    <ProtectedRoute>
      <LanguagePageWrapper>
        {({ language, translations, t, isLoading, isAuthenticated }) => (
          <HomePageContent
            key={language}
            translations={translations}
            language={language}
            isAuthenticated={isAuthenticated}
          />
        )}
      </LanguagePageWrapper>
    </ProtectedRoute>
  );
}
