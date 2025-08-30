import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Generate JLPT test URL based on type, level and query parameters
 */
export function generateJLPTTestUrl(
  type: 'custom' | 'official',
  level: string,
  params: URLSearchParams,
  language?: string // eslint-disable-line @typescript-eslint/no-unused-vars
): string {
  // JLPT routes don't use language prefix - they are protected routes
  return `/jlpt/${type}/${level.toLowerCase()}/test?${params.toString()}`
}

/**
 * Validate JLPT level
 */
export function isValidJLPTLevel(level: string): boolean {
  return ['n1', 'n2', 'n3', 'n4', 'n5'].includes(level.toLowerCase())
}

/**
 * Validate JLPT type
 */
export function isValidJLPTType(type: string): boolean {
  return ['custom', 'official'].includes(type.toLowerCase())
}

/**
 * Generate Challenge test URL based on level and query parameters
 */
export function generateChallengeTestUrl(
  level: string,
  params: URLSearchParams,
  language?: string
): string {
  const basePath = language ? `/${language}` : ''
  return `${basePath}/challenge/${level.toLowerCase()}/test?${params.toString()}`
}

/**
 * Validate Challenge level (same as JLPT level)
 */
export function isValidChallengeLevel(level: string): boolean {
  return isValidJLPTLevel(level)
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('vi-VN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date)
}

export function formatTime(date: Date): string {
  return new Intl.DateTimeFormat('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null
  
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

export function throttle<T extends (...args: unknown[]) => unknown>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => inThrottle = false, limit)
    }
  }
}
