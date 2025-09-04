import { useCallback, useEffect, useState, useRef, useMemo } from 'react'
import { Document, Page } from 'react-pdf'
import { Loader2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PDFAnnotationCanvas } from './pdf-annotation-canvas'
import { PDFWatermark } from './pdf-watermark'
import { PDF_CONFIG } from '../config/pdf-config'
import type { AnnotationTool } from '../types'
import {
  getEffectiveScale,
  getDisplayDimensions,
  PDF_CONTAINER_STYLES,
  PDF_CSS_CLASSES,
  getMobileBrushSize
} from '../utils/pdf-helpers'
import { usePDFWithAuth } from '@/hooks/usePDFWithAuth'

interface PDFContinuousViewerProps {
  fileUrl: string
  numPages: number
  scale: number
  rotation: number
  loading: boolean
  onDocumentLoadSuccess: (doc: any) => void
  onDocumentLoadError: (error: Error) => void
  activeAnnotationTool: AnnotationTool
  selectedColor: string
  brushSize: number
  onAnnotationChange?: () => void
  onUndoRedoChange?: (canUndo: boolean, canRedo: boolean) => void
  onCanvasRef?: (canvas: HTMLCanvasElement | null) => void
  onPageInView?: (pageNumber: number) => void
  onPrevPage?: () => void
  onNextPage?: () => void
  onDrawingStart?: () => void
}

export function PDFContinuousViewer({
  fileUrl,
  numPages,
  scale,
  rotation,
  loading,
  onDocumentLoadSuccess,
  onDocumentLoadError,
  activeAnnotationTool,
  selectedColor,
  brushSize,
  onAnnotationChange,
  onUndoRedoChange,
  onCanvasRef,
  onPageInView,
  onPrevPage,
  onNextPage,
  onDrawingStart,
}: PDFContinuousViewerProps) {
  const [pageWidths, setPageWidths] = useState<{ [key: number]: number }>({})
  const [pageHeights, setPageHeights] = useState<{ [key: number]: number }>({})
  const [pageLoadingStates, setPageLoadingStates] = useState<{ [key: number]: boolean }>({})
  const [pageErrors, setPageErrors] = useState<{ [key: number]: string | null }>({})
  const [isZooming, setIsZooming] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const prevScaleRef = useRef<number>(scale)

  // Fetch PDF with authentication
  const { blobUrl, loading: pdfLoading, error: pdfError } = usePDFWithAuth(fileUrl)

  // Handle PDF loading error
  useEffect(() => {
    if (pdfError && onDocumentLoadError) {
      onDocumentLoadError(pdfError)
    }
  }, [pdfError, onDocumentLoadError])

  // Memoize PDF options to prevent unnecessary reloads
  const pdfOptions = useMemo(() => ({
    // Remove problematic options that might cause worker issues
    standardFontDataUrl: '/standard_fonts/',
  }), [])
  const pageRefs = useRef<{ [key: number]: HTMLDivElement | null }>({})

  // Track which page is currently in view
  useEffect(() => {
    if (!numPages || numPages === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const pageNumber = parseInt(entry.target.getAttribute('data-page-number') || '1')
            onPageInView?.(pageNumber)
          }
        })
      },
      {
        root: containerRef.current,
        threshold: 0.5, // Trigger when 50% of page is visible
      }
    )

    // Observe all page elements
    Object.values(pageRefs.current).forEach((pageElement) => {
      if (pageElement) {
        observer.observe(pageElement)
      }
    })

    return () => observer.disconnect()
  }, [numPages, onPageInView])

  // Track scale changes to detect zoom operations
  useEffect(() => {
    if (Math.abs(scale - prevScaleRef.current) > 0.01) {
      setIsZooming(true)

      // Reset page loading states when zoom changes
      setPageLoadingStates({})
      setPageErrors({})

      // Clear zoom state after a delay
      const timeout = setTimeout(() => {
        setIsZooming(false)
      }, 300) // 300ms delay to allow pages to render

      prevScaleRef.current = scale

      return () => clearTimeout(timeout)
    }
  }, [scale])

  const handlePageLoadSuccess = useCallback((page: any, pageNumber: number) => {
    const viewport = page.getViewport({ scale: 1 })
    setPageWidths(prev => ({ ...prev, [pageNumber]: viewport.width }))
    setPageHeights(prev => ({ ...prev, [pageNumber]: viewport.height }))

    // Clear loading state for this page
    setPageLoadingStates(prev => ({ ...prev, [pageNumber]: false }))
    setPageErrors(prev => ({ ...prev, [pageNumber]: null }))
  }, [])

  const handlePageLoadError = useCallback((error: Error, pageNumber: number) => {
    console.warn(`Page ${pageNumber} load error:`, error)
    setPageLoadingStates(prev => ({ ...prev, [pageNumber]: false }))
    setPageErrors(prev => ({ ...prev, [pageNumber]: error.message }))
  }, [])

  // Use shared utilities with mobile scaling enabled for continuous viewer
  const scaleOptions = {
    useMobileScaling: true,
    maxMobileScale: 2.0,
    mobileScaleMultiplier: 0.85
  }

  // Memory management: Clear page states when component unmounts
  useEffect(() => {
    return () => {
      setPageWidths({})
      setPageHeights({})
      setPageLoadingStates({})
      setPageErrors({})
    }
  }, [])

  // Performance optimization: Limit visible pages during zoom
  const visiblePageRange = useMemo(() => {
    if (!isZooming) return { start: 1, end: numPages }

    // During zoom, only render a subset of pages to improve performance
    const maxVisiblePages = 5
    const currentPage = Math.max(1, Math.min(numPages, Math.floor(numPages / 2)))
    const start = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2))
    const end = Math.min(numPages, start + maxVisiblePages - 1)

    return { start, end }
  }, [isZooming, numPages])

  // Progressive loading: Load pages in batches to prevent overwhelming
  const [loadedPages, setLoadedPages] = useState<Set<number>>(new Set())

  useEffect(() => {
    if (!isZooming && numPages > 0) {
      // Progressive loading: Load pages in batches of 3
      const batchSize = 3
      let currentBatch = 1

      const loadNextBatch = () => {
        const startPage = (currentBatch - 1) * batchSize + 1
        const endPage = Math.min(currentBatch * batchSize, numPages)

        setLoadedPages(prev => {
          const newSet = new Set(prev)
          for (let i = startPage; i <= endPage; i++) {
            newSet.add(i)
          }
          return newSet
        })

        currentBatch++
        if (startPage <= numPages) {
          setTimeout(loadNextBatch, 100) // 100ms delay between batches
        }
      }

      // Start loading first batch immediately
      loadNextBatch()
    }
  }, [numPages, isZooming])

  // Show loading state while fetching PDF
  if (pdfLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Đang tải PDF...</p>
        </div>
      </div>
    )
  }

  // Show error if PDF fetch failed
  if (pdfError) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-red-500 mb-2">Lỗi tải PDF</p>
          <p className="text-sm text-muted-foreground">{pdfError.message}</p>
        </div>
      </div>
    )
  }

  // Don't render until we have a blob URL
  if (!blobUrl) {
    return null
  }

  return (
    <div className={PDF_CSS_CLASSES.viewer} ref={containerRef}>
      {/* Container với kích thước chính xác và căn giữa */}
      <div
        className={PDF_CSS_CLASSES.centeredContainer}
        style={PDF_CONTAINER_STYLES.main}
      >
        <div className={PDF_CSS_CLASSES.continuousContainer}>
          <Document
            file={blobUrl}
            onLoadSuccess={onDocumentLoadSuccess}
            onLoadError={onDocumentLoadError}
            loading=""
            className="flex flex-col items-center space-y-4 pdf-secure"
            options={pdfOptions}
          >
          {Array.from({ length: numPages }, (_, index) => {
            const pageNumber = index + 1

            // Performance optimization: Skip rendering pages outside visible range during zoom
            if (isZooming && (pageNumber < visiblePageRange.start || pageNumber > visiblePageRange.end)) {
              return (
                <div
                  key={`placeholder-${pageNumber}`}
                  className="relative bg-muted/20 shadow-lg border border-border flex-shrink-0 flex items-center justify-center"
                  style={{ minHeight: '400px' }}
                >
                  <p className="text-muted-foreground text-sm">Trang {pageNumber}</p>
                </div>
              )
            }

            // Progressive loading: Only render pages that have been loaded
            if (!isZooming && !loadedPages.has(pageNumber)) {
              return (
                <div
                  key={`loading-${pageNumber}`}
                  className="relative bg-muted/10 shadow-lg border border-border flex-shrink-0 flex items-center justify-center"
                  style={{ minHeight: '400px' }}
                >
                  <div className="flex flex-col items-center">
                    <Loader2 className="h-6 w-6 animate-spin mb-2 text-muted-foreground" />
                    <p className="text-muted-foreground text-sm">Đang tải trang {pageNumber}...</p>
                  </div>
                </div>
              )
            }

            const pageWidth = pageWidths[pageNumber] || 0
            const pageHeight = pageHeights[pageNumber] || 0
            const dimensions = getDisplayDimensions(scale, pageWidth, pageHeight, rotation, scaleOptions)
            const isPageLoading = pageLoadingStates[pageNumber] !== false && (pageWidth === 0 || isZooming)
            const pageError = pageErrors[pageNumber]

            return (
              <div
                key={`page-${pageNumber}-${scale}-${rotation}`} // Include scale and rotation in key to force re-render
                ref={(el) => { pageRefs.current[pageNumber] = el }}
                data-page-number={pageNumber}
                className="relative bg-white shadow-lg border border-border flex-shrink-0"
                style={{
                  width: dimensions.width || 'auto',
                  height: dimensions.height || 'auto',
                  maxWidth: 'none',
                  maxHeight: 'none',
                  minHeight: isPageLoading ? '400px' : 'auto' // Prevent layout shift during loading
                }}
              >
                {/* Loading Overlay for individual pages */}
                {isPageLoading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-muted/80 backdrop-blur-sm z-20">
                    <div className="flex flex-col items-center justify-center p-8">
                      <Loader2 className="h-6 w-6 animate-spin mb-2 text-foreground" />
                      <p className="text-sm text-muted-foreground">
                        {isZooming ? `Đang zoom trang ${pageNumber}...` : `Đang tải trang ${pageNumber}...`}
                      </p>
                    </div>
                  </div>
                )}

                {/* Error state for individual pages */}
                {pageError && !isPageLoading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-muted/80 backdrop-blur-sm z-20">
                    <div className="flex flex-col items-center justify-center p-8 text-center">
                      <AlertCircle className="h-8 w-8 text-destructive mb-2" />
                      <p className="text-sm text-muted-foreground">Lỗi tải trang {pageNumber}</p>
                      <Button
                        size="sm"
                        variant="outline"
                        className="mt-2"
                        onClick={() => {
                          setPageErrors(prev => ({ ...prev, [pageNumber]: null }))
                          setPageLoadingStates(prev => ({ ...prev, [pageNumber]: true }))
                        }}
                      >
                        Thử lại
                      </Button>
                    </div>
                  </div>
                )}

                <Page
                  pageNumber={pageNumber}
                  scale={getEffectiveScale(scale, scaleOptions)}
                  rotate={rotation}
                  renderTextLayer={false}
                  renderAnnotationLayer={false}
                  className="w-full h-full"
                  onLoadSuccess={(page) => handlePageLoadSuccess(page, pageNumber)}
                  onLoadError={(error) => handlePageLoadError(error, pageNumber)}
                  loading={
                    <div className="flex items-center justify-center h-full min-h-[200px]">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  }
                />

                {/* PDF Watermark for each page */}
                {!loading && pageWidth > 0 && pageHeight > 0 && (
                  <PDFWatermark
                    scale={getEffectiveScale(scale, scaleOptions)}
                    pageWidth={pageWidth}
                    pageHeight={pageHeight}
                  />
                )}

                {/* Annotation Canvas Overlay for each page */}
                {!loading && pageWidth > 0 && pageHeight > 0 && (
                  <PDFAnnotationCanvas
                    width={pageWidth}
                    height={pageHeight}
                    scale={getEffectiveScale(scale, scaleOptions)}
                    rotation={rotation}
                    activeAnnotationTool={activeAnnotationTool}
                    selectedColor={selectedColor}
                    brushSize={getMobileBrushSize(brushSize)}
                    onAnnotationChange={onAnnotationChange}
                    onUndoRedoChange={onUndoRedoChange}
                    onCanvasRef={pageNumber === 1 ? onCanvasRef : undefined} // Only pass ref for first page
                    onDrawingStart={onDrawingStart}
                    fileUrl={fileUrl}
                    pageNumber={pageNumber}
                  />
                )}


              </div>
            )
          })}
          </Document>

          {/* Loading state for initial document load */}
          {loading && numPages === 0 && (
            <div className="flex justify-center items-center h-full">
              <div className="flex flex-col items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin mb-2 text-foreground" />
                <p className="text-sm text-muted-foreground">Đang tải PDF...</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
