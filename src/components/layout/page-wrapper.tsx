"use client"

import { ReactNode } from "react";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { LanguagePageWrapper } from "@/components/language-page-wrapper";
import { TranslationData, Language } from "@/lib/i18n/";

export interface PageContentProps {
  language: Language;
  translations: TranslationData;
  t: (key: string) => any;
  isLoading: boolean;
  isAuthenticated: boolean;
}

export interface ProtectedPageWrapperProps {
  children: (props: PageContentProps) => ReactNode;
  requireAuth?: boolean;
}

/**
 * Universal page wrapper that handles authentication and language context
 * Eliminates duplicate ProtectedRoute + LanguagePageWrapper patterns
 */
export function ProtectedPageWrapper({ 
  children, 
  requireAuth = true 
}: ProtectedPageWrapperProps) {
  const content = (
    <LanguagePageWrapper>
      {({ language, translations, t, isLoading, isAuthenticated }) => 
        children({ language, translations, t, isLoading, isAuthenticated })
      }
    </LanguagePageWrapper>
  );

  if (requireAuth) {
    return (
      <ProtectedRoute>
        {content}
      </ProtectedRoute>
    );
  }

  return content;
}

/**
 * HOC version for component-based usage
 */
export function withProtectedPage<T extends Record<string, any>>(
  Component: React.ComponentType<T & PageContentProps>,
  requireAuth: boolean = true
) {
  return function WrappedComponent(props: T) {
    return (
      <ProtectedPageWrapper requireAuth={requireAuth}>
        {(pageProps) => <Component {...props} {...pageProps} />}
      </ProtectedPageWrapper>
    );
  };
}
