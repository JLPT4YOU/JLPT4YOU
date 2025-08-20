import { PDF_CONFIG } from '../config/pdf-config'

interface StorageInfo {
  used: number
  available: number
  percentage: number
}

/**
 * Get current localStorage usage for PDF annotations
 */
export function getStorageInfo(): StorageInfo {
  let totalSize = 0
  const maxSize = PDF_CONFIG.MAX_STORAGE_SIZE_MB * 1024 * 1024 // Convert to bytes
  
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith(PDF_CONFIG.STORAGE_PREFIX)) {
        const value = localStorage.getItem(key)
        if (value) {
          totalSize += new Blob([key + value]).size
        }
      }
    }
  } catch (error) {
    // Handle storage access errors
    return {
      used: 0,
      available: maxSize,
      percentage: 0
    }
  }
  
  return {
    used: totalSize,
    available: maxSize - totalSize,
    percentage: (totalSize / maxSize) * 100
  }
}

/**
 * Check if storage cleanup is needed
 */
export function needsCleanup(): boolean {
  const info = getStorageInfo()
  return info.percentage > (PDF_CONFIG.STORAGE_CLEANUP_THRESHOLD * 100)
}

/**
 * Clean up old annotations to free space
 */
export function cleanupOldAnnotations(): number {
  const annotationKeys: Array<{ key: string; timestamp: number; size: number }> = []
  
  try {
    // Collect all annotation keys with timestamps
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith(PDF_CONFIG.STORAGE_PREFIX)) {
        const value = localStorage.getItem(key)
        if (value) {
          try {
            const data = JSON.parse(value)
            const timestamp = data.timestamp || 0
            const size = new Blob([key + value]).size
            annotationKeys.push({ key, timestamp, size })
          } catch (parseError) {
            // Remove corrupted entries
            localStorage.removeItem(key)
          }
        }
      }
    }
    
    // Sort by timestamp (oldest first)
    annotationKeys.sort((a, b) => a.timestamp - b.timestamp)
    
    // Remove oldest entries until we're under threshold
    let removedCount = 0
    let currentInfo = getStorageInfo()
    
    while (currentInfo.percentage > (PDF_CONFIG.STORAGE_CLEANUP_THRESHOLD * 100) && 
           annotationKeys.length > removedCount) {
      const toRemove = annotationKeys[removedCount]
      localStorage.removeItem(toRemove.key)
      removedCount++
      currentInfo = getStorageInfo()
    }
    
    return removedCount
  } catch (error) {
    return 0
  }
}

/**
 * Safely save annotation data with storage management
 */
export function safeStorageSave(key: string, data: any): boolean {
  try {
    const dataString = JSON.stringify(data)
    const dataSize = new Blob([key + dataString]).size
    
    // Check if this single item would exceed limits
    if (dataSize > PDF_CONFIG.MAX_STORAGE_SIZE_MB * 1024 * 1024 * 0.1) { // 10% of max size
      return false
    }
    
    // Check if cleanup is needed
    if (needsCleanup()) {
      cleanupOldAnnotations()
    }
    
    // Try to save
    localStorage.setItem(key, dataString)
    return true
  } catch (error) {
    // If save fails, try cleanup and retry once
    try {
      cleanupOldAnnotations()
      localStorage.setItem(key, JSON.stringify(data))
      return true
    } catch (retryError) {
      return false
    }
  }
}

/**
 * Get storage statistics for debugging
 */
export function getStorageStats(): {
  totalKeys: number
  annotationKeys: number
  totalSize: string
  averageSize: string
  oldestEntry: string
  newestEntry: string
} {
  let totalKeys = 0
  let annotationKeys = 0
  let totalSize = 0
  let oldestTimestamp = Date.now()
  let newestTimestamp = 0
  
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      totalKeys++
      
      if (key && key.startsWith(PDF_CONFIG.STORAGE_PREFIX)) {
        annotationKeys++
        const value = localStorage.getItem(key)
        if (value) {
          totalSize += new Blob([key + value]).size
          
          try {
            const data = JSON.parse(value)
            const timestamp = data.timestamp || 0
            if (timestamp < oldestTimestamp) oldestTimestamp = timestamp
            if (timestamp > newestTimestamp) newestTimestamp = timestamp
          } catch (parseError) {
            // Skip corrupted entries
          }
        }
      }
    }
  } catch (error) {
    // Handle storage access errors
  }
  
  return {
    totalKeys,
    annotationKeys,
    totalSize: `${(totalSize / 1024 / 1024).toFixed(2)} MB`,
    averageSize: annotationKeys > 0 ? `${(totalSize / annotationKeys / 1024).toFixed(2)} KB` : '0 KB',
    oldestEntry: oldestTimestamp < Date.now() ? new Date(oldestTimestamp).toLocaleDateString() : 'N/A',
    newestEntry: newestTimestamp > 0 ? new Date(newestTimestamp).toLocaleDateString() : 'N/A'
  }
}
