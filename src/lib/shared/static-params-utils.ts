/**
 * Shared Static Params Generation Utilities
 * Eliminates duplicate generateStaticParams functions across the app
 */

export interface LanguageParam {
  lang: string
}

/**
 * Standard language static params for all [lang] routes
 * Includes both primary language codes and backward compatibility codes
 */
export const LANGUAGE_STATIC_PARAMS: LanguageParam[] = [
  // Primary language codes
  { lang: 'vn' }, // Vietnamese (primary)
  { lang: 'jp' }, // Japanese (primary) 
  { lang: 'en' }, // English (primary)
  
  // Backward compatibility codes
  { lang: '1' },  // Vietnamese (backward compatibility)
  { lang: '2' },  // Japanese (backward compatibility)
  { lang: '3' }   // English (backward compatibility)
]

/**
 * Generate static params for language routes
 * Use this in all [lang] page components instead of duplicating the array
 * 
 * @example
 * ```typescript
 * export async function generateStaticParams() {
 *   return generateLanguageStaticParams()
 * }
 * ```
 */
export function generateLanguageStaticParams(): LanguageParam[] {
  return LANGUAGE_STATIC_PARAMS
}

/**
 * Generate static params for nested language routes with additional params
 * 
 * @param additionalParams - Additional static params to combine with language params
 * @example
 * ```typescript
 * export async function generateStaticParams() {
 *   return generateLanguageStaticParamsWithExtras([
 *     { level: 'n1' }, { level: 'n2' }, { level: 'n3' }
 *   ])
 * }
 * ```
 */
export function generateLanguageStaticParamsWithExtras<T extends Record<string, string>>(
  additionalParams: T[]
): (LanguageParam & T)[] {
  const result: (LanguageParam & T)[] = []
  
  for (const langParam of LANGUAGE_STATIC_PARAMS) {
    for (const extraParam of additionalParams) {
      result.push({ ...langParam, ...extraParam })
    }
  }
  
  return result
}

/**
 * Validate if a language parameter is supported
 */
export function isValidLanguageParam(lang: string): boolean {
  return LANGUAGE_STATIC_PARAMS.some(param => param.lang === lang)
}

/**
 * Get all supported language codes
 */
export function getSupportedLanguageCodes(): string[] {
  return LANGUAGE_STATIC_PARAMS.map(param => param.lang)
}
