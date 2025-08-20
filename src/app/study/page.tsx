"use client"

import { ProtectedRoute } from "@/components/auth/protected-route";
import { StudyPageContent } from "@/components/study/study-page-content";
import { LanguagePageWrapper } from "@/components/language-page-wrapper";

export default function StudyPage() {
  return (
    <ProtectedRoute>
      <LanguagePageWrapper>
        {({ language, translations, isAuthenticated }) => (
          <StudyPageContent
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
