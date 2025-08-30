"use client"

import { ProtectedRoute } from "@/components/auth/protected-route";
import { BookSelectionPageContent } from "@/components/library/book-selection-page-content";
import { LanguagePageWrapper } from "@/components/language-page-wrapper";

export default function N5BooksPage() {
  return (
    <ProtectedRoute>
      <LanguagePageWrapper>
        {({ language, translations, t, isLoading, isAuthenticated }) => (
          <BookSelectionPageContent
            key={language}
            translations={translations}
            language={language}
            isAuthenticated={isAuthenticated}
            category="n5"
          />
        )}
      </LanguagePageWrapper>
    </ProtectedRoute>
  );
}
