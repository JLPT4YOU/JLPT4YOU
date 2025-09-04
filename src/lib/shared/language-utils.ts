/**
 * Shared language utilities
 * Centralize detection and instruction mapping
 */

// Lightweight exposure for other modules
export function mapLanguageInstruction(lang: string): string {
  const l = (lang || '').toLowerCase()
  
  // Handle direct language codes from metadata
  if (l === 'english' || lang.includes('English') || l.includes('english')) {
    return 'explanations in English'
  } else if (l === 'japanese' || lang.includes('日本語') || l.includes('japanese')) {
    return 'explanations in Japanese (日本語)'
  } else if (l === 'vietnamese' || lang.includes('Tiếng Việt') || l.includes('vietnamese')) {
    return 'explanations in Vietnamese (Tiếng Việt)'
  } else if (l === 'auto') {
    // For 'auto', instruct AI to detect from user input
    return 'explanations in the same language as the user input'
  }
  
  // Custom or other languages
  return `explanations in ${lang}`
}

