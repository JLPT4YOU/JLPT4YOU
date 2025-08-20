/**
 * Shared Local Storage Utilities
 * Safe, SSR-aware helpers for localStorage JSON operations
 */

export const isClient = typeof window !== 'undefined'

export function safeGetItem(key: string): string | null {
  if (!isClient) return null
  try {
    return localStorage.getItem(key)
  } catch (err) {
    console.error(`[storage-utils] getItem failed for key=${key}:`, err)
    return null
  }
}

export function safeSetItem(key: string, value: string): boolean {
  if (!isClient) return false
  try {
    localStorage.setItem(key, value)
    return true
  } catch (err) {
    console.error(`[storage-utils] setItem failed for key=${key}:`, err)
    return false
  }
}

export function safeRemoveItem(key: string): boolean {
  if (!isClient) return false
  try {
    localStorage.removeItem(key)
    return true
  } catch (err) {
    console.error(`[storage-utils] removeItem failed for key=${key}:`, err)
    return false
  }
}

export function safeGetJSON<T>(key: string, defaultValue: T | null = null): T | null {
  const raw = safeGetItem(key)
  if (raw == null) return defaultValue
  try {
    return JSON.parse(raw) as T
  } catch (err) {
    console.error(`[storage-utils] parse JSON failed for key=${key}:`, err)
    return defaultValue
  }
}

export function safeSetJSON<T>(key: string, value: T): boolean {
  try {
    const serialized = JSON.stringify(value)
    return safeSetItem(key, serialized)
  } catch (err) {
    console.error(`[storage-utils] stringify JSON failed for key=${key}:`, err)
    return false
  }
}

/**
 * Get combined size of specific localStorage keys
 */
export function getApproxStorageSize(keys: string[]): number {
  if (!isClient) return 0
  let total = 0
  for (const key of keys) {
    try {
      const v = localStorage.getItem(key)
      if (v) total += v.length
    } catch {
      // ignore
    }
  }
  return total
}

