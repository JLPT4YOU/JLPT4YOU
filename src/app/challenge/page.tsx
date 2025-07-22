"use client"

import { ChallengePageContent } from "@/components/challenge/challenge-page-content";
import { ProtectedPageWrapper } from "@/components/layout/page-wrapper";

export default function ChallengePage() {
  return (
    <ProtectedPageWrapper>
      {({ language, translations }) => (
        <ChallengePageContent 
          key={language} 
          translations={translations} 
          language={language}
        />
      )}
    </ProtectedPageWrapper>
  );
}


