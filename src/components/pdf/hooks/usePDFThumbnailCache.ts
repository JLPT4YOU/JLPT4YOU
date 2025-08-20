/**
 * PDF Thumbnail Cache Hook
 * Caches thumbnail images to avoid re-rendering when sidebar toggles
 * Uses existing PDF document instead of making new requests
 */

import { useState, useEffect, useRef, useCallback } from 'react'

interface ThumbnailCache {
  [pageNumber: number]: string // Base64 image data URL
}

interface UsePDFThumbnailCacheProps {
  pdfDocument: any // PDF.js document object
  numPages: number
  scale?: number
}

export function usePDFThumbnailCache({
  pdfDocument,
  numPages,
  scale = 0.15
}: UsePDFThumbnailCacheProps) {
  const [thumbnailCache, setThumbnailCache] = useState<ThumbnailCache>({})
  const [loadingPages, setLoadingPages] = useState<Set<number>>(new Set())
  const [isInitializing, setIsInitializing] = useState(false)
  const cacheKeyRef = useRef<string>('')

  // Generate cache key based on document and scale
  const cacheKey = pdfDocument ? `${pdfDocument.fingerprint}_${scale}` : ''

  // Check if PDF document is available
  const isPDFReady = useCallback(() => {
    return pdfDocument && typeof pdfDocument.getPage === 'function'
  }, [pdfDocument])

  // Generate thumbnail for a specific page
  const generateThumbnail = useCallback(async (pageNumber: number): Promise<string | null> => {
    try {
      if (!isPDFReady()) {
        console.warn('PDF document not ready for thumbnail generation')
        return null
      }

      const page = await pdfDocument.getPage(pageNumber)
      const viewport = page.getViewport({ scale })

      // Create canvas
      const canvas = document.createElement('canvas')
      const context = canvas.getContext('2d')
      if (!context) return null

      canvas.height = viewport.height
      canvas.width = viewport.width

      // Render page to canvas
      const renderContext = {
        canvasContext: context,
        viewport: viewport,
      }

      await page.render(renderContext).promise

      // Convert to base64 data URL
      const dataUrl = canvas.toDataURL('image/jpeg', 0.8)

      // Clean up
      canvas.remove()

      return dataUrl
    } catch (error) {
      console.error(`Failed to generate thumbnail for page ${pageNumber}:`, error)
      return null
    }
  }, [pdfDocument, isPDFReady, scale])

  // Load thumbnail for a specific page
  const loadThumbnail = useCallback(async (pageNumber: number) => {
    // Skip if already cached or loading
    if (thumbnailCache[pageNumber] || loadingPages.has(pageNumber)) {
      return
    }

    setLoadingPages(prev => new Set(prev).add(pageNumber))

    try {
      const thumbnail = await generateThumbnail(pageNumber)
      if (thumbnail) {
        setThumbnailCache(prev => ({
          ...prev,
          [pageNumber]: thumbnail
        }))
      }
    } finally {
      setLoadingPages(prev => {
        const newSet = new Set(prev)
        newSet.delete(pageNumber)
        return newSet
      })
    }
  }, [thumbnailCache, loadingPages, generateThumbnail])

  // Load all thumbnails (batch loading)
  const loadAllThumbnails = useCallback(async () => {
    if (!numPages || !isPDFReady()) return

    // Load thumbnails in batches to avoid overwhelming the browser
    const batchSize = 3
    const batches = []

    for (let i = 1; i <= numPages; i += batchSize) {
      const batch = []
      for (let j = i; j < i + batchSize && j <= numPages; j++) {
        if (!thumbnailCache[j] && !loadingPages.has(j)) {
          batch.push(j)
        }
      }
      if (batch.length > 0) {
        batches.push(batch)
      }
    }

    // Process batches sequentially with small delay
    for (const batch of batches) {
      await Promise.all(batch.map(pageNumber => loadThumbnail(pageNumber)))
      // Small delay between batches to prevent blocking UI
      await new Promise(resolve => setTimeout(resolve, 50))
    }
  }, [numPages, isPDFReady, thumbnailCache, loadingPages, loadThumbnail])

  // Load visible thumbnails first (priority loading)
  const loadVisibleThumbnails = useCallback((visiblePages: number[]) => {
    visiblePages.forEach(pageNumber => {
      if (pageNumber >= 1 && pageNumber <= numPages) {
        loadThumbnail(pageNumber)
      }
    })
  }, [numPages, loadThumbnail])

  // Clear cache when PDF document changes
  useEffect(() => {
    if (cacheKeyRef.current !== cacheKey) {
      setThumbnailCache({})
      setLoadingPages(new Set())
      cacheKeyRef.current = cacheKey
    }
  }, [cacheKey])

  // Auto-load first few thumbnails when PDF is ready
  useEffect(() => {
    if (numPages > 0 && isPDFReady()) {
      // Load first 5 pages immediately for better UX
      const initialPages = Array.from({ length: Math.min(5, numPages) }, (_, i) => i + 1)
      loadVisibleThumbnails(initialPages)
    }
  }, [numPages, isPDFReady, loadVisibleThumbnails])

  return {
    thumbnailCache,
    loadingPages,
    isInitializing,
    loadThumbnail,
    loadAllThumbnails,
    loadVisibleThumbnails,
    // Helper to get thumbnail or placeholder
    getThumbnail: (pageNumber: number) => thumbnailCache[pageNumber] || null,
    isLoading: (pageNumber: number) => loadingPages.has(pageNumber),
    // Cache stats
    cacheSize: Object.keys(thumbnailCache).length,
    totalPages: numPages
  }
}
