/**
 * Cached PDF Thumbnail Component
 * Uses cached thumbnails to avoid re-rendering when sidebar toggles
 */

import { useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'
import { usePDFThumbnailCache } from '../hooks/usePDFThumbnailCache'
import { PDF_CONFIG } from '../config/pdf-config'
import { Loader2 } from 'lucide-react'

interface PDFThumbnailCachedProps {
  pdfDocument: any // PDF.js document object
  numPages: number
  currentPage: number
  onPageSelect: (page: number) => void
  className?: string
}

export function PDFThumbnailCached({
  pdfDocument,
  numPages,
  currentPage,
  onPageSelect,
  className
}: PDFThumbnailCachedProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  const {
    loadThumbnail,
    loadAllThumbnails,
    loadVisibleThumbnails,
    getThumbnail,
    isLoading,
    cacheSize
  } = usePDFThumbnailCache({
    pdfDocument,
    numPages,
    scale: 0.15
  })

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (!containerRef.current) return

    const observer = new IntersectionObserver(
      (entries) => {
        const visiblePages: number[] = []
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const pageNumber = parseInt(entry.target.getAttribute('data-page') || '0')
            if (pageNumber > 0) {
              visiblePages.push(pageNumber)
            }
          }
        })

        if (visiblePages.length > 0) {
          loadVisibleThumbnails(visiblePages)
        }
      },
      {
        root: containerRef.current,
        rootMargin: '50px',
        threshold: 0.1
      }
    )

    // Observe all thumbnail containers
    const thumbnailElements = containerRef.current.querySelectorAll('[data-page]')
    thumbnailElements.forEach(el => observer.observe(el))

    return () => observer.disconnect()
  }, [numPages, loadVisibleThumbnails])

  // Load all thumbnails when user scrolls to bottom
  useEffect(() => {
    if (cacheSize >= numPages * 0.8) { // When 80% cached, load the rest
      loadAllThumbnails()
    }
  }, [cacheSize, numPages, loadAllThumbnails])

  if (!numPages || numPages <= 1) return null

  return (
    <div
      ref={containerRef}
      className={cn(
        "w-32 sm:w-48 bg-sidebar border-r border-sidebar-border overflow-y-auto h-full",
        className
      )}
      role="navigation"
      aria-label={PDF_CONFIG.ARIA_LABELS.PAGE_NAVIGATION}
    >
      <div className="px-2 sm:px-6 py-2 sm:py-4 space-y-2 sm:space-y-3">

        {Array.from({ length: numPages }, (_, i) => i + 1).map((page) => {
          const thumbnail = getThumbnail(page)
          const loading = isLoading(page)

          return (
            <div
              key={page}
              data-page={page}
              className="cursor-pointer flex flex-col items-center touch-manipulation"
              onClick={() => onPageSelect(page)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  onPageSelect(page)
                }
              }}
              tabIndex={0}
              role="button"
              aria-label={`Trang ${page}${currentPage === page ? ' (hiện tại)' : ''}`}
            >
              <div className={cn(
                "bg-background rounded overflow-hidden flex items-center justify-center p-0.5 sm:p-1 mb-1 sm:mb-2 border-2 sm:border-4 transition-colors inline-block relative",
                currentPage === page
                  ? "border-primary"
                  : "border-sidebar-border hover:border-sidebar-accent"
              )}>
                {thumbnail ? (
                  // Cached thumbnail
                  <img
                    src={thumbnail}
                    alt={`Trang ${page}`}
                    className="block sm:scale-110 max-w-full h-auto"
                    style={{
                      width: 'auto',
                      height: 'auto',
                      maxWidth: '100%',
                      maxHeight: '120px'
                    }}
                    loading="lazy"
                  />
                ) : loading ? (
                  // Loading state
                  <div className="flex items-center justify-center w-20 h-28 sm:w-24 sm:h-32">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  // Placeholder
                  <div
                    className="flex items-center justify-center w-20 h-28 sm:w-24 sm:h-32 bg-muted text-muted-foreground text-xs cursor-pointer"
                    onClick={() => loadThumbnail(page)}
                  >
                    <div className="text-center">
                      <div className="text-lg font-bold">{page}</div>
                      <div className="text-xs">Nhấn để tải</div>
                    </div>
                  </div>
                )}
              </div>

              {/* Page number */}
              <div className="text-xs text-center text-sidebar-foreground">
                {page}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default PDFThumbnailCached