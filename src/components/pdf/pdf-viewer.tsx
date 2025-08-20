"use client"

import { useState, useCallback, useRef, useEffect } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'
import {
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Download,
  Loader2,
  AlertCircle
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

// Set up PDF.js worker only on client side
if (typeof window !== 'undefined') {
  pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.5.3.31.min.js'
}

interface PDFViewerProps {
  fileUrl: string
  fileName?: string
  className?: string
}

export function PDFViewer({ fileUrl, fileName, className }: PDFViewerProps) {
  const [numPages, setNumPages] = useState<number>(0)
  const [pageNumber, setPageNumber] = useState<number>(1)
  const [scale, setScale] = useState<number>(1.0)
  const [rotation, setRotation] = useState<number>(0)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  // Refs for zoom functionality
  const containerRef = useRef<HTMLDivElement>(null)
  const lastTouchDistance = useRef<number>(0)
  const isZooming = useRef<boolean>(false)

  const onDocumentLoadSuccess = useCallback(({ numPages }: { numPages: number }) => {
    setNumPages(numPages)
    setLoading(false)
    setError(null)
  }, [])

  const onDocumentLoadError = useCallback((error: Error) => {
    console.error('PDF load error:', error)
    setError('Không thể tải file PDF. Vui lòng thử lại.')
    setLoading(false)
  }, [])

  const goToPrevPage = () => {
    setPageNumber(prev => Math.max(1, prev - 1))
  }

  const goToNextPage = () => {
    setPageNumber(prev => Math.min(numPages, prev + 1))
  }

  const zoomIn = () => {
    setScale(prev => Math.min(3.0, prev + 0.2))
  }

  const zoomOut = () => {
    setScale(prev => Math.max(0.5, prev - 0.2))
  }

  const zoomByDelta = useCallback((delta: number) => {
    const zoomFactor = delta > 0 ? 0.1 : -0.1
    setScale(prev => Math.max(0.5, Math.min(3.0, prev + zoomFactor)))
  }, [])

  const rotate = () => {
    setRotation(prev => (prev + 90) % 360)
  }

  // Mouse wheel zoom handler
  const handleWheel = useCallback((e: WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault()
      zoomByDelta(-e.deltaY)
    }
  }, [zoomByDelta])

  // Touch zoom handlers
  const getTouchDistance = (touches: TouchList) => {
    if (touches.length < 2) return 0
    const touch1 = touches[0]
    const touch2 = touches[1]
    return Math.sqrt(
      Math.pow(touch2.clientX - touch1.clientX, 2) +
      Math.pow(touch2.clientY - touch1.clientY, 2)
    )
  }

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (e.touches.length === 2) {
      e.preventDefault()
      isZooming.current = true
      lastTouchDistance.current = getTouchDistance(e.touches)
    }
  }, [])

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (e.touches.length === 2 && isZooming.current) {
      e.preventDefault()
      const currentDistance = getTouchDistance(e.touches)
      const deltaDistance = currentDistance - lastTouchDistance.current

      if (Math.abs(deltaDistance) > 5) { // Threshold to avoid jittery zoom
        zoomByDelta(deltaDistance)
        lastTouchDistance.current = currentDistance
      }
    }
  }, [zoomByDelta])

  const handleTouchEnd = useCallback((e: TouchEvent) => {
    if (e.touches.length < 2) {
      isZooming.current = false
      lastTouchDistance.current = 0
    }
  }, [])

  // Setup event listeners
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    // Add wheel event listener for mouse zoom
    container.addEventListener('wheel', handleWheel, { passive: false })

    // Add touch event listeners for pinch zoom
    container.addEventListener('touchstart', handleTouchStart, { passive: false })
    container.addEventListener('touchmove', handleTouchMove, { passive: false })
    container.addEventListener('touchend', handleTouchEnd, { passive: false })

    return () => {
      container.removeEventListener('wheel', handleWheel)
      container.removeEventListener('touchstart', handleTouchStart)
      container.removeEventListener('touchmove', handleTouchMove)
      container.removeEventListener('touchend', handleTouchEnd)
    }
  }, [handleWheel, handleTouchStart, handleTouchMove, handleTouchEnd])

  const downloadPDF = () => {
    // Show message that download is not available for protected PDFs
    alert('Tải xuống không khả dụng cho tài liệu được bảo vệ.')
  }

  if (error) {
    return (
      <div className={cn("flex flex-col items-center justify-center p-8 bg-muted/20 rounded-lg", className)}>
        <AlertCircle className="h-12 w-12 text-destructive mb-4" />
        <h3 className="text-lg font-medium text-foreground mb-2">Lỗi tải PDF</h3>
        <p className="text-muted-foreground text-center">{error}</p>
        <Button 
          onClick={() => window.location.reload()} 
          className="mt-4"
          variant="outline"
        >
          Thử lại
        </Button>
      </div>
    )
  }

  return (
    <div className={cn("flex flex-col bg-background", className)}>
      {/* Toolbar */}
      <div className="flex items-center justify-between p-4 border-b border-border bg-muted/20">
        <div className="flex items-center gap-2">
          {/* Page Navigation */}
          <Button
            variant="outline"
            size="sm"
            onClick={goToPrevPage}
            disabled={pageNumber <= 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <span className="text-sm text-muted-foreground px-2">
            {loading ? '...' : `${pageNumber} / ${numPages}`}
          </span>
          
          <Button
            variant="outline"
            size="sm"
            onClick={goToNextPage}
            disabled={pageNumber >= numPages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center gap-2">
          {/* Zoom Controls */}
          <Button
            variant="outline"
            size="sm"
            onClick={zoomOut}
            disabled={scale <= 0.5}
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          
          <span
            className="text-sm text-muted-foreground px-2 min-w-[60px] text-center"
            title="Sử dụng Ctrl + cuộn chuột hoặc chạm hai ngón tay để zoom"
          >
            {Math.round(scale * 100)}%
          </span>
          
          <Button
            variant="outline"
            size="sm"
            onClick={zoomIn}
            disabled={scale >= 3.0}
          >
            <ZoomIn className="h-4 w-4" />
          </Button>

          {/* Rotate */}
          <Button
            variant="outline"
            size="sm"
            onClick={rotate}
          >
            <RotateCw className="h-4 w-4" />
          </Button>

          {/* Download - Hidden for security */}
          {/*
          <Button
            variant="outline"
            size="sm"
            onClick={downloadPDF}
          >
            <Download className="h-4 w-4" />
          </Button>
          */}
        </div>
      </div>

      {/* PDF Content */}
      <div
        ref={containerRef}
        className="flex-1 overflow-auto bg-gray-100 dark:bg-gray-900"
      >
        <div className="flex justify-center p-4">
          {loading && (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin mr-2" />
              <span>Đang tải PDF...</span>
            </div>
          )}
          
          <Document
            file={fileUrl}
            onLoadSuccess={onDocumentLoadSuccess}
            onLoadError={onDocumentLoadError}
            loading=""
            className="shadow-lg"
          >
            <Page
              pageNumber={pageNumber}
              scale={scale}
              rotate={rotation}
              className="border border-border"
              renderTextLayer={false}
              renderAnnotationLayer={false}
            />
          </Document>
        </div>
      </div>
    </div>
  )
}
