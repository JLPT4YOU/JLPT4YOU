"use client"

import { LibraryPageContent } from "@/components/library/library-page-content";
import { LanguagePageWrapper } from "@/components/language-page-wrapper";

export default function LibraryPage() {
  return (
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
  );
}
