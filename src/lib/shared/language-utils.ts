/**
 * Shared language utilities
 * Centralize detection and instruction mapping
 */

// Lightweight exposure for other modules
export function mapLanguageInstruction(lang: string): string {
  const l = (lang || '').toLowerCase()
  if (lang.includes('English') || l.includes('english')) {
    return 'explanations in English'
  } else if (lang.includes('日本語') || l.includes('japanese')) {
    return 'explanations in Japanese (日本語)'
  } else if (lang.includes('Tiếng Việt') || l.includes('vietnamese')) {
    return 'explanations in Vietnamese (Tiếng Việt)'
  }
  return `explanations in ${lang}`
}

