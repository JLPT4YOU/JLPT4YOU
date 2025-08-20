"use client"

import { ProtectedRoute } from "@/components/auth/protected-route";
import { StudyTheoryPageContent } from "@/components/study/study-theory-page-content";
import { LanguagePageWrapper } from "@/components/language-page-wrapper";

export default function StudyTheoryPage() {
  return (
    <ProtectedRoute>
      <LanguagePageWrapper>
        {({ language, translations, isAuthenticated }) => (
          <StudyTheoryPageContent
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
