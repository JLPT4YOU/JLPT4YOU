import { useState, useCallback, useMemo, useEffect } from 'react'
import { Document, Page } from 'react-pdf'
import { Loader2 } from 'lucide-react'
import { PDFViewerProps } from '../types'
import { PDFAnnotationCanvas } from './pdf-annotation-canvas'
import { PDFWatermark } from './pdf-watermark'
import { PDF_CONFIG } from '../config/pdf-config'
import {
  getEffectiveScale,
  getDisplayDimensions,
  PDF_CONTAINER_STYLES,
  PDF_CSS_CLASSES,
  getTouchAreas,
  getMobileBrushSize
} from '../utils/pdf-helpers'
import { usePDFWithAuth } from '@/hooks/usePDFWithAuth'

export function PDFViewer({
  fileUrl,
  pageNumber,
  scale,
  rotation,
  loading,
  numPages,
  onDocumentLoadSuccess,
  onDocumentLoadError,
  onPageLoadSuccess,
  onPrevPage,
  onNextPage,
  activeAnnotationTool,
  selectedColor = PDF_CONFIG.ANNOTATION_COLORS.DEFAULT,
  brushSize = PDF_CONFIG.DEFAULT_BRUSH_SIZE,
  onAnnotationChange,
  onUndoRedoChange,
  onCanvasRef,
  onDrawingStart,
}: PDFViewerProps) {
  const [pageWidth, setPageWidth] = useState<number>(PDF_CONFIG.DEFAULT_PAGE_WIDTH)
  const [pageHeight, setPageHeight] = useState<number>(PDF_CONFIG.DEFAULT_PAGE_HEIGHT)

  // Fetch PDF with authentication
  const { blobUrl, loading: pdfLoading, error: pdfError } = usePDFWithAuth(fileUrl)

  // Memoize PDF options to prevent unnecessary reloads
  // MUST be before any conditional returns to comply with Rules of Hooks
  const pdfOptions = useMemo(() => ({
    // Remove problematic options that might cause worker issues
    standardFontDataUrl: '/standard_fonts/',
  }), [])

  // Handle PDF loading error - MUST be called before any conditional returns
  useEffect(() => {
    if (pdfError && onDocumentLoadError) {
      onDocumentLoadError(pdfError)
    }
  }, [pdfError, onDocumentLoadError])

  // Handle tap navigation on PDF sides - MUST be called before any conditional returns
  const handlePDFClick = useCallback((e: React.MouseEvent) => {
    // Only handle clicks when no annotation tool is active
    if (activeAnnotationTool) return

    const rect = e.currentTarget.getBoundingClientRect()
    const clickX = e.clientX - rect.left
    const touchAreas = getTouchAreas(rect.width)

    if (clickX < touchAreas.left.end && onPrevPage) {
      // Left third - previous page
      onPrevPage()
    } else if (clickX > touchAreas.right.start && onNextPage) {
      // Right third - next page
      onNextPage()
    }
    // Center third - no action (for other interactions)
  }, [activeAnnotationTool, onPrevPage, onNextPage])

  // Handle touch navigation on PDF sides - MUST be called before any conditional returns
  const handlePDFTouch = useCallback((e: React.TouchEvent) => {
    // Only handle touches when no annotation tool is active
    if (activeAnnotationTool) return

    const rect = e.currentTarget.getBoundingClientRect()
    const touch = e.touches[0] || e.changedTouches[0]
    const touchX = touch.clientX - rect.left
    const touchAreas = getTouchAreas(rect.width)

    if (touchX < touchAreas.left.end && onPrevPage) {
      // Left third - previous page
      onPrevPage()
    } else if (touchX > touchAreas.right.start && onNextPage) {
      // Right third - next page
      onNextPage()
    }
    // Center third - no action (for other interactions)
  }, [activeAnnotationTool, onPrevPage, onNextPage])

  // Calculate display dimensions using shared utilities - MUST be called before any conditional returns
  const displayDimensions = getDisplayDimensions(scale, pageWidth, pageHeight)
  const effectiveScale = getEffectiveScale(scale)

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
    <div className={PDF_CSS_CLASSES.viewer}>
      {/* Container với kích thước chính xác bằng PDF */}
      <div
        className={PDF_CSS_CLASSES.centeredContainer}
        style={PDF_CONTAINER_STYLES.main}
      >
        <div
          className="relative"
          style={{
            width: displayDimensions.width,
            height: displayDimensions.height,
            ...PDF_CONTAINER_STYLES.page
          }}
        >
          {/* Loading Overlay */}
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-muted/80 backdrop-blur-sm z-20">
              <div className="flex flex-col items-center justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin mb-2 text-foreground" />
                <span className="text-foreground text-sm sm:text-base">Đang tải PDF...</span>
              </div>
            </div>
          )}

          {/* Navigation Areas - Invisible touch targets */}
          {onPrevPage && pageNumber > 1 && !loading && (
            <div
              className="absolute left-0 top-0 bottom-0 w-12 sm:w-16 z-10 cursor-pointer"
              onClick={onPrevPage}
              title="Trang trước"
            />
          )}

          {onNextPage && pageNumber < numPages && !loading && (
            <div
              className="absolute right-0 top-0 bottom-0 w-12 sm:w-16 z-10 cursor-pointer"
              onClick={onNextPage}
              title="Trang sau"
            />
          )}

          <div
            className="w-full h-full"
            onClick={handlePDFClick}
            onTouchEnd={handlePDFTouch}
          >
            <Document
              file={blobUrl}
              onLoadSuccess={onDocumentLoadSuccess}
              onLoadError={onDocumentLoadError}
              loading=""
              className="shadow-lg w-full h-full pdf-secure"
              options={pdfOptions}
            >
              <Page
                key={pageNumber}
                pageNumber={pageNumber}
                scale={effectiveScale}
                rotate={rotation}
                renderTextLayer={false}
                renderAnnotationLayer={false}
                className="border border-border w-full h-full"
                onLoadSuccess={onPageLoadSuccess}
                onRenderSuccess={(page) => {
                  const viewport = page.getViewport({ scale: 1 })
                  setPageWidth(viewport.width)
                  setPageHeight(viewport.height)
                }}
              />
            </Document>

            {/* PDF Watermark */}
            {!loading && (
              <PDFWatermark
                scale={effectiveScale}
                pageWidth={pageWidth}
                pageHeight={pageHeight}
              />
            )}

            {/* Annotation Canvas Overlay - Always render to preserve annotations */}
            {!loading && (
              <PDFAnnotationCanvas
                width={pageWidth}
                height={pageHeight}
                scale={effectiveScale}
                activeAnnotationTool={activeAnnotationTool || null}
                selectedColor={selectedColor}
                brushSize={getMobileBrushSize(brushSize)}
                onAnnotationChange={onAnnotationChange}
                onUndoRedoChange={onUndoRedoChange}
                onCanvasRef={onCanvasRef}
                onDrawingStart={onDrawingStart}
                fileUrl={fileUrl}
                pageNumber={pageNumber}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
