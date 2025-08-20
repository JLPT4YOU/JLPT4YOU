"use client"

import { ProtectedRoute } from "@/components/auth/protected-route";
import { JLPTLibraryPageContent } from "@/components/library/jlpt-library-page-content";
import { LanguagePageWrapper } from "@/components/language-page-wrapper";

export default function JLPTLibraryPage() {
  return (
    <ProtectedRoute>
      <LanguagePageWrapper>
        {({ language, translations, t, isLoading, isAuthenticated }) => (
          <JLPTLibraryPageContent
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
