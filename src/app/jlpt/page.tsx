"use client"

import { JLPTPageContent } from "@/components/jlpt/jlpt-page-content";
import { ProtectedPageWrapper } from "@/components/layout/page-wrapper";

export default function JLPTPage() {
  return (
    <ProtectedPageWrapper>
      {({ language, translations, isAuthenticated }) => (
        <JLPTPageContent
          key={language}
          translations={translations}
          language={language}
          isAuthenticated={isAuthenticated}
        />
      )}
    </ProtectedPageWrapper>
  );
}


