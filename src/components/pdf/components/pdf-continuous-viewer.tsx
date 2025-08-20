import { useCallback, useEffect, useState, useRef, useMemo } from 'react'
import { Document, Page } from 'react-pdf'
import { Loader2 } from 'lucide-react'
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
  const containerRef = useRef<HTMLDivElement>(null)

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

  const handlePageLoadSuccess = useCallback((page: any, pageNumber: number) => {
    const viewport = page.getViewport({ scale: 1 })
    setPageWidths(prev => ({ ...prev, [pageNumber]: viewport.width }))
    setPageHeights(prev => ({ ...prev, [pageNumber]: viewport.height }))
  }, [])

  // Use shared utilities with mobile scaling enabled for continuous viewer
  const scaleOptions = {
    useMobileScaling: true,
    maxMobileScale: 2.0,
    mobileScaleMultiplier: 0.85
  }

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
            const pageWidth = pageWidths[pageNumber] || 0
            const pageHeight = pageHeights[pageNumber] || 0
            const dimensions = getDisplayDimensions(scale, pageWidth, pageHeight, scaleOptions)

            return (
              <div
                key={pageNumber}
                ref={(el) => { pageRefs.current[pageNumber] = el }}
                data-page-number={pageNumber}
                className="relative bg-white shadow-lg border border-border flex-shrink-0"
                style={{
                  width: dimensions.width || 'auto',
                  height: dimensions.height || 'auto',
                  maxWidth: 'none',
                  maxHeight: 'none'
                }}
              >
                {/* Loading Overlay for individual pages */}
                {loading && pageWidth === 0 && (
                  <div className="absolute inset-0 flex items-center justify-center bg-muted/80 backdrop-blur-sm z-20">
                    <div className="flex flex-col items-center justify-center p-8">
                      <Loader2 className="h-6 w-6 animate-spin mb-2 text-foreground" />
                      <p className="text-sm text-muted-foreground">Đang tải trang {pageNumber}...</p>
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
