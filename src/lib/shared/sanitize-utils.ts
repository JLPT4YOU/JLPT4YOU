/**
 * Shared sanitize utilities for user-provided text
 * Prevent identity override and prompt injection; keep consistent limits
 */

const FORBIDDEN_PATTERNS: RegExp[] = [
  /you are not/gi,
  /ignore previous/gi,
  /forget that( you are)?/gi,
  /act as if( you are)?/gi,
  /pretend to be/gi,
  /your name is not/gi,
  /you are actually/gi,
  /you are chatgpt/gi,
  /not irin/gi,
  /you are gpt/gi,
  /you are openai/gi,
  /system\s*:/gi,
  /assistant\s*:/gi,
  /human\s*:/gi
]

/**
 * Sanitize arbitrary text input
 */
export function sanitizeText(input: string, maxLen = 300): string {
  if (!input) return ''
  let sanitized = input
  FORBIDDEN_PATTERNS.forEach((pattern) => {
    sanitized = sanitized.replace(pattern, '[FILTERED]')
  })
  return sanitized.slice(0, maxLen).trim()
}

