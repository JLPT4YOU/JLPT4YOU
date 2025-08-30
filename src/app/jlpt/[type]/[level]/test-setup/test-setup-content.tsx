"use client"

import React from "react"
import { JLPTTestSetup } from "@/components/jlpt-test-setup"
import { LanguagePageWrapper } from "@/components/language-page-wrapper"
import { SearchParamsWrapper } from "@/components/search-params-wrapper"

interface JLPTTestSetupPageContentProps {
  type: string
  level: string
}

export function JLPTTestSetupPageContent({ type, level }: JLPTTestSetupPageContentProps) {
  return (
    <SearchParamsWrapper>
      <LanguagePageWrapper>
        {({ language, translations, t, isLoading, isAuthenticated }) => (
          <JLPTTestSetup
            key={language}
            type={type as 'custom' | 'official'}
            level={level}
            translations={translations}
            t={t}
            language={language}
          />
        )}
      </LanguagePageWrapper>
    </SearchParamsWrapper>
  )
}
