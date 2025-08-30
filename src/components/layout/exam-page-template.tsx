"use client";

import { ReactNode } from "react";
import { LanguagePageWrapper } from "@/components/language-page-wrapper";
import { type TranslationData, type Language } from "@/lib/i18n";

interface ExamPageTemplateProps {
  /**
   * ISO language code to load translations for. This prop is now optional
   * as LanguagePageWrapper will handle language detection from context.
   */
  language?: Language;
  /**
   * Render prop. Receives the loaded TranslationData and must return the exam JSX (usually <ExamInterface />).
   */
  children: (translations: TranslationData) => ReactNode;
  /**
   * Optional fallback element shown while translations are loading.
   */
  fallback?: ReactNode;
}

/**
 * Generic wrapper that handles translation loading & loading UI for all exam-type pages.
 * Now integrated with LanguageContext for consistent language switching across the app.
 *
 * Usage:
 * ```tsx
 * <ExamPageTemplate>
 *   {(t) => (
 *     <ExamInterface questions={...} translations={t} ... />
 *   )}
 * </ExamPageTemplate>
 * ```
 */
export function ExamPageTemplate({
  language,
  children,
  fallback = <div>Loading...</div>,
}: ExamPageTemplateProps) {
  return (
    <LanguagePageWrapper 
      loadingFallback={fallback}
    >
      {({ translations }) => {
        // If translations are available from context, use them
        if (translations) {
          return <>{children(translations)}</>;
        }
        // This shouldn't happen as LanguagePageWrapper handles loading
        return <>{fallback}</>;
      }}
    </LanguagePageWrapper>
  );
}
