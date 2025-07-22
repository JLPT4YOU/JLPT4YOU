"use client";

import { ReactNode, useEffect, useState } from "react";
import { loadTranslation, DEFAULT_LANGUAGE, type TranslationData, type Language } from "@/lib/i18n";

interface ExamPageTemplateProps {
  /**
   * ISO language code to load translations for. If not provided, falls back to DEFAULT_LANGUAGE.
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
  language = DEFAULT_LANGUAGE,
  children,
  fallback = <div>Loading...</div>,
}: ExamPageTemplateProps) {
  const [translations, setTranslations] = useState<TranslationData | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await loadTranslation(language);
        setTranslations(data);
      } catch (error) {
        console.error("Failed to load translations:", error);
      }
    };

    load();
  }, [language]);

  if (!translations) {
    return <>{fallback}</>;
  }

  return <>{children(translations)}</>;
}
