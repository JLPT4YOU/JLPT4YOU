"use client"

import { ProtectedRoute } from "@/components/auth/protected-route";
import { LibraryPageContent } from "@/components/library/library-page-content";
import { LanguagePageWrapper } from "@/components/language-page-wrapper";

export default function LibraryPage() {
  return (
    <ProtectedRoute>
      <LanguagePageWrapper>
        {({ language, translations, t, isLoading, isAuthenticated }) => (
          <LibraryPageContent
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
