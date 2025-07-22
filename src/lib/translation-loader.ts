import { Language, TranslationData, DEFAULT_LANGUAGE, loadTranslation } from '@/lib/i18n'

// Configuration for retry logic
interface RetryConfig {
  maxRetries: number
  baseDelay: number
  maxDelay: number
  backoffFactor: number
}

// Result of translation loading
interface TranslationLoadResult {
  translations: TranslationData
  language: Language
  source: 'cache' | 'network' | 'fallback'
  error?: Error
  loadTime: number
}

// Loading state for a specific language
interface TranslationLoadingState {
  isLoading: boolean
  hasLoaded: boolean
  error: Error | null
  retryCount: number
  lastAttempt: number
  loadTime?: number
}

// Cache configuration
interface CacheConfig {
  maxCacheSize: number
  maxAge: number // in milliseconds
  cleanupInterval: number // in milliseconds
}

// Default configurations
const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelay: 1000, // 1 second
  maxDelay: 10000, // 10 seconds
  backoffFactor: 2
}

const DEFAULT_CACHE_CONFIG: CacheConfig = {
  maxCacheSize: 3, // Keep max 3 languages in memory
  maxAge: 30 * 60 * 1000, // 30 minutes
  cleanupInterval: 5 * 60 * 1000 // Cleanup every 5 minutes
}

// Cache entry with metadata
interface CacheEntry {
  translations: TranslationData
  timestamp: number
  accessCount: number
  lastAccessed: number
}

/**
 * Advanced Translation Loader with caching, retry logic, and performance optimization
 */
export class TranslationLoader {
  private cache = new Map<Language, CacheEntry>()
  private loadingPromises = new Map<Language, Promise<TranslationData>>()
  private loadingStates = new Map<Language, TranslationLoadingState>()
  private cleanupTimer: NodeJS.Timeout | null = null
  
  constructor(
    private retryConfig: RetryConfig = DEFAULT_RETRY_CONFIG,
    private cacheConfig: CacheConfig = DEFAULT_CACHE_CONFIG
  ) {
    this.startCleanupTimer()
  }

  /**
   * Load translation with retry logic and caching
   */
  async loadTranslation(language: Language): Promise<TranslationLoadResult> {
    const startTime = Date.now()
    
    // Check cache first
    const cached = this.getCachedTranslation(language)
    if (cached) {
      return {
        translations: cached,
        language,
        source: 'cache',
        loadTime: Date.now() - startTime
      }
    }

    // Check if already loading to prevent duplicate requests
    const existingPromise = this.loadingPromises.get(language)
    if (existingPromise) {
      try {
        const translations = await existingPromise
        return {
          translations,
          language,
          source: 'network',
          loadTime: Date.now() - startTime
        }
      } catch (error) {
        // If the existing promise failed, we'll try again below
        this.loadingPromises.delete(language)
      }
    }

    // Start loading
    const loadingPromise = this.loadTranslationWithRetry(language)
    this.loadingPromises.set(language, loadingPromise)

    try {
      const translations = await loadingPromise
      
      // Cache the result
      this.setCachedTranslation(language, translations)
      
      // Update loading state
      this.updateLoadingState(language, {
        isLoading: false,
        hasLoaded: true,
        error: null,
        retryCount: 0,
        lastAttempt: Date.now(),
        loadTime: Date.now() - startTime
      })

      return {
        translations,
        language,
        source: 'network',
        loadTime: Date.now() - startTime
      }
    } catch (error) {
      // Update loading state with error
      this.updateLoadingState(language, {
        isLoading: false,
        hasLoaded: false,
        error: error as Error,
        retryCount: this.getLoadingState(language).retryCount + 1,
        lastAttempt: Date.now()
      })

      // Try fallback to default language
      if (language !== DEFAULT_LANGUAGE) {
        console.warn(`Failed to load ${language}, falling back to ${DEFAULT_LANGUAGE}`)
        const fallbackResult = await this.loadTranslation(DEFAULT_LANGUAGE)
        return {
          ...fallbackResult,
          source: 'fallback',
          error: error as Error
        }
      }

      throw error
    } finally {
      this.loadingPromises.delete(language)
    }
  }

  /**
   * Load translation with retry logic
   */
  private async loadTranslationWithRetry(
    language: Language,
    retryCount = 0
  ): Promise<TranslationData> {
    // Update loading state
    this.updateLoadingState(language, {
      isLoading: true,
      hasLoaded: false,
      error: null,
      retryCount,
      lastAttempt: Date.now()
    })

    try {
      return await loadTranslation(language)
    } catch (error) {
      if (retryCount < this.retryConfig.maxRetries) {
        const delay = Math.min(
          this.retryConfig.baseDelay * Math.pow(this.retryConfig.backoffFactor, retryCount),
          this.retryConfig.maxDelay
        )
        
        console.warn(`Translation loading failed for ${language}, retrying in ${delay}ms (attempt ${retryCount + 1}/${this.retryConfig.maxRetries})`)
        
        await new Promise(resolve => setTimeout(resolve, delay))
        return this.loadTranslationWithRetry(language, retryCount + 1)
      }
      throw error
    }
  }

  /**
   * Preload translations for better performance
   */
  async preloadTranslations(languages: Language[]): Promise<void> {
    const promises = languages.map(language => 
      this.loadTranslation(language).catch(error => {
        console.warn(`Failed to preload ${language}:`, error)
        return null
      })
    )
    
    await Promise.allSettled(promises)
  }

  /**
   * Get cached translation if available and not expired
   */
  getCachedTranslation(language: Language): TranslationData | null {
    const entry = this.cache.get(language)
    if (!entry) return null

    const now = Date.now()
    const isExpired = now - entry.timestamp > this.cacheConfig.maxAge

    if (isExpired) {
      this.cache.delete(language)
      return null
    }

    // Update access metadata
    entry.accessCount++
    entry.lastAccessed = now

    return entry.translations
  }

  /**
   * Set cached translation with metadata
   */
  private setCachedTranslation(language: Language, translations: TranslationData): void {
    const now = Date.now()
    
    // Check cache size limit
    if (this.cache.size >= this.cacheConfig.maxCacheSize) {
      this.evictLeastRecentlyUsed()
    }

    this.cache.set(language, {
      translations,
      timestamp: now,
      accessCount: 1,
      lastAccessed: now
    })
  }

  /**
   * Evict least recently used cache entry
   */
  private evictLeastRecentlyUsed(): void {
    let oldestEntry: [Language, CacheEntry] | null = null
    let oldestTime = Date.now()

    for (const [language, entry] of this.cache.entries()) {
      if (entry.lastAccessed < oldestTime) {
        oldestTime = entry.lastAccessed
        oldestEntry = [language, entry]
      }
    }

    if (oldestEntry) {
      this.cache.delete(oldestEntry[0])
      console.debug(`Evicted cached translation for ${oldestEntry[0]}`)
    }
  }

  /**
   * Get loading state for a language
   */
  getLoadingState(language: Language): TranslationLoadingState {
    return this.loadingStates.get(language) || {
      isLoading: false,
      hasLoaded: false,
      error: null,
      retryCount: 0,
      lastAttempt: 0
    }
  }

  /**
   * Update loading state for a language
   */
  private updateLoadingState(language: Language, state: Partial<TranslationLoadingState>): void {
    const currentState = this.getLoadingState(language)
    this.loadingStates.set(language, { ...currentState, ...state })
  }

  /**
   * Clear cache for specific language or all languages
   */
  clearCache(language?: Language): void {
    if (language) {
      this.cache.delete(language)
      this.loadingStates.delete(language)
    } else {
      this.cache.clear()
      this.loadingStates.clear()
    }
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    const entries = Array.from(this.cache.entries())
    const now = Date.now()
    
    return {
      size: this.cache.size,
      maxSize: this.cacheConfig.maxCacheSize,
      entries: entries.map(([language, entry]) => ({
        language,
        age: now - entry.timestamp,
        accessCount: entry.accessCount,
        lastAccessed: entry.lastAccessed,
        isExpired: now - entry.timestamp > this.cacheConfig.maxAge
      }))
    }
  }

  /**
   * Start automatic cache cleanup
   */
  private startCleanupTimer(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer)
    }

    this.cleanupTimer = setInterval(() => {
      this.cleanupExpiredEntries()
    }, this.cacheConfig.cleanupInterval)
  }

  /**
   * Clean up expired cache entries
   */
  private cleanupExpiredEntries(): void {
    const now = Date.now()
    const expiredLanguages: Language[] = []

    for (const [language, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.cacheConfig.maxAge) {
        expiredLanguages.push(language)
      }
    }

    expiredLanguages.forEach(language => {
      this.cache.delete(language)
      console.debug(`Cleaned up expired translation cache for ${language}`)
    })
  }

  /**
   * Destroy the loader and cleanup resources
   */
  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer)
      this.cleanupTimer = null
    }
    this.clearCache()
    this.loadingPromises.clear()
  }
}

// Global singleton instance
let globalTranslationLoader: TranslationLoader | null = null

/**
 * Get the global translation loader instance
 */
export function getTranslationLoader(): TranslationLoader {
  if (!globalTranslationLoader) {
    globalTranslationLoader = new TranslationLoader()
  }
  return globalTranslationLoader
}

/**
 * Convenience function to load translation using global loader
 */
export async function loadTranslationWithLoader(language: Language): Promise<TranslationLoadResult> {
  const loader = getTranslationLoader()
  return loader.loadTranslation(language)
}

/**
 * Convenience function to preload translations using global loader
 */
export async function preloadTranslations(languages: Language[]): Promise<void> {
  const loader = getTranslationLoader()
  return loader.preloadTranslations(languages)
}