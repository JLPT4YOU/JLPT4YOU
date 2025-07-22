"use client"

import { JLPTPageContent } from "@/components/jlpt/jlpt-page-content";
import { ProtectedPageWrapper } from "@/components/layout/page-wrapper";

export default function JLPTPage() {
  return (
    <ProtectedPageWrapper>
      {({ language, translations, t, isAuthenticated }) => (
        <JLPTPageContent 
          key={language} 
          translations={translations} 
          language={language}
          t={t}
          isAuthenticated={isAuthenticated}
        />
      )}
    </ProtectedPageWrapper>
  );
}


