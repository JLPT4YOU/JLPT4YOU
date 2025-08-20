"use client"

import { DictionaryPage } from "@/components/dict/dictionary-page";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { LanguagePageWrapper } from "@/components/language-page-wrapper";

export default function DictPage() {
  return (
    <ProtectedRoute>
      <LanguagePageWrapper>
        {({ language, translations, isAuthenticated }) => (
          <DictionaryPage
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
