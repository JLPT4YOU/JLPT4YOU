"use client"

import { ProtectedRoute } from "@/components/auth/protected-route";
import { StudyLevelPageContent } from "@/components/study/study-level-page-content";
import { LanguagePageWrapper } from "@/components/language-page-wrapper";

export default function StudyLevelPage() {
  return (
    <ProtectedRoute>
      <LanguagePageWrapper>
        {({ language, translations, isAuthenticated }) => (
          <StudyLevelPageContent
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
