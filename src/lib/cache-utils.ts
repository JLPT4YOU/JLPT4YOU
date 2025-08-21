/**
 * Cache Utilities for Performance Optimization
 * Implements multiple caching strategies to reduce server response time
 */

// In-memory cache for development/small scale
class MemoryCache {
  private cache = new Map<string, { data: any; expires: number }>();
  
  set(key: string, data: any, ttlSeconds = 300) {
    const expires = Date.now() + (ttlSeconds * 1000);
    this.cache.set(key, { data, expires });
  }
  
  get(key: string) {
    const item = this.cache.get(key);
    if (!item) return null;
    
    if (Date.now() > item.expires) {
      this.cache.delete(key);
      return null;
    }
    
    return item.data;
  }
  
  delete(key: string) {
    this.cache.delete(key);
  }
  
  clear() {
    this.cache.clear();
  }
  
  size() {
    return this.cache.size;
  }
}

// Global memory cache instance
const memoryCache = new MemoryCache();

/**
 * Generic cache wrapper function
 */
export async function getCachedData<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: {
    ttl?: number; // seconds
    useMemoryCache?: boolean;
    revalidate?: boolean;
  } = {}
): Promise<T> {
  const {
    ttl = 300, // 5 minutes default
    useMemoryCache = true,
    revalidate = false
  } = options;

  // Check memory cache first (fastest)
  if (useMemoryCache && !revalidate) {
    const cached = memoryCache.get(key);
    if (cached) {
      return cached;
    }
  }

  // If no cache hit, fetch fresh data
  const data = await fetcher();
  
  // Store in memory cache
  if (useMemoryCache) {
    memoryCache.set(key, data, ttl);
  }
  
  return data;
}

/**
 * Cache for API responses
 */
export async function getCachedApiResponse<T>(
  endpoint: string,
  fetcher: () => Promise<T>,
  ttlSeconds = 300
): Promise<T> {
  const cacheKey = `api:${endpoint}`;
  return getCachedData(cacheKey, fetcher, { ttl: ttlSeconds });
}

/**
 * Cache for database queries
 */
export async function getCachedDbQuery<T>(
  queryName: string,
  params: Record<string, any>,
  fetcher: () => Promise<T>,
  ttlSeconds = 600 // 10 minutes for DB queries
): Promise<T> {
  const cacheKey = `db:${queryName}:${JSON.stringify(params)}`;
  return getCachedData(cacheKey, fetcher, { ttl: ttlSeconds });
}

/**
 * Cache for user-specific data
 */
export async function getCachedUserData<T>(
  userId: string,
  dataType: string,
  fetcher: () => Promise<T>,
  ttlSeconds = 180 // 3 minutes for user data
): Promise<T> {
  const cacheKey = `user:${userId}:${dataType}`;
  return getCachedData(cacheKey, fetcher, { ttl: ttlSeconds });
}

/**
 * Cache invalidation utilities
 */
export const cacheInvalidation = {
  // Invalidate all cache entries matching a pattern
  invalidatePattern(pattern: string) {
    // For memory cache, we need to iterate and delete matching keys
    const keys = Array.from(memoryCache['cache'].keys());
    const regex = new RegExp(pattern);
    
    keys.forEach(key => {
      if (regex.test(key)) {
        memoryCache.delete(key);
      }
    });
  },
  
  // Invalidate user-specific cache
  invalidateUser(userId: string) {
    this.invalidatePattern(`^user:${userId}:`);
  },
  
  // Invalidate API cache
  invalidateApi(endpoint?: string) {
    if (endpoint) {
      memoryCache.delete(`api:${endpoint}`);
    } else {
      this.invalidatePattern('^api:');
    }
  },
  
  // Invalidate database cache
  invalidateDb(queryName?: string) {
    if (queryName) {
      this.invalidatePattern(`^db:${queryName}:`);
    } else {
      this.invalidatePattern('^db:');
    }
  },
  
  // Clear all cache
  clearAll() {
    memoryCache.clear();
  }
};

/**
 * Cache statistics for monitoring
 */
export function getCacheStats() {
  return {
    memoryCache: {
      size: memoryCache.size(),
      entries: Array.from(memoryCache['cache'].keys())
    }
  };
}

/**
 * Next.js specific caching utilities
 */
export const nextCache = {
  // Revalidate Next.js cache
  async revalidatePath(path: string) {
    if (typeof window === 'undefined') {
      const { revalidatePath } = await import('next/cache');
      revalidatePath(path);
    }
  },
  
  // Revalidate specific tag
  async revalidateTag(tag: string) {
    if (typeof window === 'undefined') {
      const { revalidateTag } = await import('next/cache');
      revalidateTag(tag);
    }
  }
};

/**
 * Cache middleware for API routes
 */
export function withCache<T extends any[], R>(
  handler: (...args: T) => Promise<R>,
  options: {
    keyGenerator: (...args: T) => string;
    ttl?: number;
    tags?: string[];
  }
) {
  return async (...args: T): Promise<R> => {
    const cacheKey = options.keyGenerator(...args);
    
    return getCachedData(
      cacheKey,
      () => handler(...args),
      { ttl: options.ttl }
    );
  };
}

/**
 * React hook for cached data - Client-side only
 * This should be moved to a separate client-side file if needed
 */

/**
 * Cache warming utilities
 */
export const cacheWarming = {
  // Warm up critical data
  async warmCriticalData() {
    const criticalEndpoints = [
      '/api/user/profile',
      '/api/jlpt/questions',
      '/api/study/progress'
    ];
    
    // Pre-fetch critical data
    await Promise.allSettled(
      criticalEndpoints.map(endpoint =>
        fetch(endpoint).catch(() => null)
      )
    );
  },
  
  // Warm up user-specific data
  async warmUserData(userId: string) {
    const userEndpoints = [
      `/api/user/${userId}/progress`,
      `/api/user/${userId}/settings`,
      `/api/user/${userId}/history`
    ];
    
    await Promise.allSettled(
      userEndpoints.map(endpoint =>
        fetch(endpoint).catch(() => null)
      )
    );
  }
};

// Export memory cache for direct access if needed
export { memoryCache };
