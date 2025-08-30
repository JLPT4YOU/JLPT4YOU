"use client"

import { DrivingPageContent } from "@/components/driving/driving-page-content";
import { ProtectedPageWrapper } from "@/components/layout/page-wrapper";

export default function DrivingPage() {
  return (
    <ProtectedPageWrapper>
      {({ language, translations, t }) => (
        <DrivingPageContent 
          key={language}
          translations={translations} 
          language={language}
        />
      )}
    </ProtectedPageWrapper>
  );
}


