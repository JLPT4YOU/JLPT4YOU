"use client"

import { useCallback, useEffect, useState, useRef } from 'react'
import { pdfjs } from 'react-pdf'
import { Loader2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { PDFViewerClientProps } from './types'
import { usePDFState, usePDFNavigation, usePDFAnnotation, usePDFKeyboard } from './hooks'
import {
  PDFViewer,
  PDFContinuousViewer,
  PDFToolbar,
  PageIndicator,
} from './components'
import { PDFThumbnailCached } from './components/pdf-thumbnail-cached'
import { ClearConfirmationModal } from './components/clear-confirmation-modal'
import { PDFErrorWrapper } from './components/pdf-error-boundary'
import { PDF_CONFIG } from './config/pdf-config'
import { ColorStorage } from './utils/pdf-helpers'



function PDFViewerClientInner({ fileUrl, fileName, className }: PDFViewerClientProps) {
  // Additional state for annotation
  const [selectedColor, setSelectedColor] = useState<string>(() => {
    // Load saved color from localStorage, fallback to default
    return ColorStorage.loadSelectedColor('draw')
  })
  const [brushSize, setBrushSize] = useState<number>(() => {
    // Load saved brush size for current tool, fallback to default
    return ColorStorage.loadBrushSize('draw')
  })
  const [hasAnnotations, setHasAnnotations] = useState(false)

  // Ref to access annotation canvas functions
  const annotationCanvasRef = useRef<HTMLCanvasElement>(null)

  // State for clear confirmation modal
  const [showClearModal, setShowClearModal] = useState(false)

  // Mobile-specific states
  const [toolbarVisible, setToolbarVisible] = useState(true)
  const [lastScrollY, setLastScrollY] = useState(0)

  // Container and page dimensions for fit-to-width
  const [containerWidth, setContainerWidth] = useState<number>(0)
  const [pageWidth, setPageWidth] = useState<number>(0)
  const containerRef = useRef<HTMLDivElement>(null)

  // Use custom hooks for state management
  const {
    state,
    setNumPages,
    setPageNumber,
    setScale,
    setRotation,
    setLoading,
    setError,
    setWorkerReady,
    setActiveAnnotationTool,
    setShowThumbnails,
    setShowAnnotationPanel,
    setIsMobileView,
    setCanUndo,
    setCanRedo,
    setViewMode,
    setPdfDocument,
  } = usePDFState()

  const {
    numPages,
    pageNumber,
    scale,
    rotation,
    loading,
    error,
    workerReady,
    activeAnnotationTool,
    showThumbnails,
    showAnnotationPanel,
    isMobileView,
    canUndo,
    canRedo,
    viewMode,
    pdfDocument,
  } = state

  // Navigation hooks with mobile-specific zoom behavior and fit-to-width
  const { goToPrevPage, goToNextPage, zoomIn, zoomOut, zoomByDelta, rotate, fitToWidth, cleanup, debouncedSetScale } = usePDFNavigation({
    pageNumber,
    numPages,
    scale,
    rotation,
    setPageNumber,
    setScale,
    setRotation,
    isMobileView,
    containerWidth,
    pageWidth,
  })

  // Create optimized zoom function for wheel events (debounced)
  const zoomByDeltaWheel = useCallback((delta: number) => {
    const zoomFactor = delta > 0 ? 0.1 : -0.1
    const minZoom = isMobileView ? 0.3 : 0.5
    const maxZoom = isMobileView ? 2.5 : 3.0
    const newScale = Math.max(minZoom, Math.min(maxZoom, scale + zoomFactor))
    debouncedSetScale(newScale) // Use debounced for wheel events
  }, [scale, debouncedSetScale, isMobileView])

  // Cleanup navigation timeouts on unmount
  useEffect(() => {
    return cleanup
  }, [cleanup])

  // Annotation hooks
  const { handleHighlight, handleDraw, handleEraser } = usePDFAnnotation({
    activeAnnotationTool,
    setActiveAnnotationTool,
  })

  // Auto-update color and brush size when annotation tool changes
  useEffect(() => {
    if (activeAnnotationTool) {
      // Load saved color for this tool
      if (activeAnnotationTool !== 'eraser') {
        const savedColor = ColorStorage.loadSelectedColor(activeAnnotationTool)
        setSelectedColor(savedColor)
      }

      // Load saved brush size for this tool
      const savedBrushSize = ColorStorage.loadBrushSize(activeAnnotationTool)
      setBrushSize(savedBrushSize)
    }
  }, [activeAnnotationTool])

  // Set up PDF.js worker on client side
  useEffect(() => {
    if (typeof window !== 'undefined' && !workerReady) {
      try {
        pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.5.3.31.min.js'
        setWorkerReady(true)
      } catch (err) {
        // Only log errors in development
        if (process.env.NODE_ENV === 'development') {
          console.error('Failed to setup PDF worker:', err)
        }
        setError('Không thể khởi tạo PDF viewer')
        setLoading(false)
      }
    }
  }, [workerReady, setError, setLoading])

  // Track previous mobile state to detect transitions
  const [prevIsMobile, setPrevIsMobile] = useState<boolean | null>(null)

  // Handle window resize for mobile detection and auto-optimization with throttling
  useEffect(() => {
    let resizeTimeout: NodeJS.Timeout | null = null

    const handleResize = () => {
      // Throttle resize events to prevent excessive re-renders
      if (resizeTimeout) {
        clearTimeout(resizeTimeout)
      }

      resizeTimeout = setTimeout(() => {
        const isMobile = window.innerWidth < PDF_CONFIG.TABLET_BREAKPOINT
        const wasDesktop = prevIsMobile === false
        const isNowMobile = isMobile && wasDesktop

        setIsMobileView(isMobile)

        // Update container width
        if (containerRef.current) {
          setContainerWidth(containerRef.current.clientWidth)
        }

        // Auto-hide thumbnails only when switching FROM desktop TO mobile
        if (isNowMobile && showThumbnails) {
          setShowThumbnails(false)
        }

        // Auto-hide annotation panel on mobile
        if (isMobile && showAnnotationPanel) {
          setShowAnnotationPanel(false)
        }

        // Update previous state
        setPrevIsMobile(isMobile)
      }, 100) // 100ms throttle for resize events
    }

    if (typeof window !== 'undefined') {
      handleResize() // Initial check
      window.addEventListener('resize', handleResize, { passive: true })
      return () => {
        if (resizeTimeout) {
          clearTimeout(resizeTimeout)
        }
        window.removeEventListener('resize', handleResize)
      }
    }
  }, [setIsMobileView, showThumbnails, showAnnotationPanel, scale, setShowThumbnails, setShowAnnotationPanel, setScale, prevIsMobile, containerWidth, pageWidth, fitToWidth])

  // Auto-hide toolbar on mobile when scrolling with throttling
  useEffect(() => {
    if (!isMobileView) return

    let scrollTimeout: NodeJS.Timeout | null = null

    const handleScroll = () => {
      // Throttle scroll events for better performance
      if (scrollTimeout) {
        clearTimeout(scrollTimeout)
      }

      scrollTimeout = setTimeout(() => {
        const currentScrollY = window.scrollY

        if (currentScrollY > lastScrollY && currentScrollY > 100) {
          // Scrolling down - hide toolbar
          setToolbarVisible(false)
        } else if (currentScrollY < lastScrollY) {
          // Scrolling up - show toolbar
          setToolbarVisible(true)
        }

        setLastScrollY(currentScrollY)
      }, 16) // ~60fps throttling
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => {
      if (scrollTimeout) {
        clearTimeout(scrollTimeout)
      }
      window.removeEventListener('scroll', handleScroll)
    }
  }, [isMobileView, lastScrollY])

  // Handle orientation change
  useEffect(() => {
    const handleOrientationChange = () => {
      // Don't auto-reset scale - let user maintain their preferred zoom level
      // if (isMobileView) {
      //   setTimeout(() => {
      //     setScale(1.0)
      //   }, 100) // Small delay to ensure proper rendering
      // }
    }

    window.addEventListener('orientationchange', handleOrientationChange)
    return () => window.removeEventListener('orientationchange', handleOrientationChange)
  }, [isMobileView, setScale])

  // Reset loading state when fileUrl changes
  useEffect(() => {
    if (fileUrl) {
      setLoading(true)
      setError(null)
    }
  }, [fileUrl, setLoading, setError])

  // Check for existing annotations when canvas is ready
  const checkExistingAnnotations = useCallback(() => {
    // Check localStorage for annotations state for this PDF
    const annotationKey = `pdf-annotations-${fileUrl}`
    const savedAnnotations = localStorage.getItem(annotationKey)
    if (savedAnnotations) {
      try {
        const annotations = JSON.parse(savedAnnotations)
        setHasAnnotations(annotations && annotations.length > 0)
      } catch (error) {
        // Silently handle parsing errors
        setHasAnnotations(false)
      }
    } else {
      setHasAnnotations(false)
    }
  }, [fileUrl])

  // Check for existing annotations on component mount
  useEffect(() => {
    if (fileUrl) {
      checkExistingAnnotations()
    }
  }, [fileUrl, checkExistingAnnotations])

  // PDF document callbacks
  const onDocumentLoadSuccess = useCallback((pdf: any) => {
    const { numPages } = pdf
    setNumPages(numPages)
    setLoading(false)
    setError(null)

    // Store PDF document for thumbnail cache
    setPdfDocument(pdf)

    // Update container width
    if (containerRef.current) {
      setContainerWidth(containerRef.current.clientWidth)
    }

    // Document loaded - container width updated for manual fit-to-width
  }, [setNumPages, setLoading, setError, setPdfDocument, containerWidth, pageWidth, fitToWidth])

  const onDocumentLoadError = useCallback((error: Error) => {
    // Only log errors in development
    if (process.env.NODE_ENV === 'development') {
      console.error('📄 [PDFViewer] Document load error:', error)
    }

    // ✅ ENHANCED: Handle specific error types
    const errorMessage = error.message || ''

    if (errorMessage.includes('401') || errorMessage.includes('Unauthorized')) {
      if (process.env.NODE_ENV === 'development') {

      }
      setError('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại để xem PDF.')
    } else if (errorMessage.includes('403') || errorMessage.includes('Forbidden')) {
      setError('Bạn không có quyền truy cập file này.')
    } else if (errorMessage.includes('404') || errorMessage.includes('Not Found')) {
      setError('File PDF không tồn tại hoặc đã bị xóa.')
    } else if (errorMessage.includes('500') || errorMessage.includes('Internal Server Error')) {
      setError('Lỗi server. Vui lòng thử lại sau.')
    } else {
      setError('Không thể tải file PDF. Vui lòng thử lại.')
    }

    setLoading(false)
  }, [setError, setLoading])

  const onPageLoadSuccess = useCallback((page: any) => {
    const viewport = page.getViewport({ scale: 1 })
    setPageWidth(viewport.width)
    
    // Page dimensions loaded - ready for manual fit-to-width
  }, [containerWidth, fitToWidth])

  // Download PDF function - Disabled for security (proxy protection)
  const downloadPDF = useCallback(() => {
    // Show message that download is not available for protected PDFs
    alert('Tải xuống không khả dụng cho tài liệu được bảo vệ.')
  }, [fileUrl, fileName])

  // Mobile swipe gesture handling
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null)
  const [touchEnd, setTouchEnd] = useState<{ x: number; y: number } | null>(null)

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (!isMobileView || activeAnnotationTool) return // Don't interfere with annotation

    const touch = e.touches[0]
    setTouchStart({ x: touch.clientX, y: touch.clientY })
    setTouchEnd(null)
  }, [isMobileView, activeAnnotationTool])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isMobileView || activeAnnotationTool) return

    const touch = e.touches[0]
    setTouchEnd({ x: touch.clientX, y: touch.clientY })
  }, [isMobileView, activeAnnotationTool])

  const handleTouchEnd = useCallback(() => {
    if (!touchStart || !touchEnd || !isMobileView || activeAnnotationTool) return

    const deltaX = touchStart.x - touchEnd.x
    const deltaY = touchStart.y - touchEnd.y
    const minSwipeDistance = 50

    // Horizontal swipe for page navigation
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > minSwipeDistance) {
      if (deltaX > 0 && pageNumber < numPages) {
        // Swipe left - next page
        setPageNumber(pageNumber + 1)
      } else if (deltaX < 0 && pageNumber > 1) {
        // Swipe right - previous page
        setPageNumber(pageNumber - 1)
      }
    }

    setTouchStart(null)
    setTouchEnd(null)
  }, [touchStart, touchEnd, isMobileView, activeAnnotationTool, pageNumber, numPages, setPageNumber])

  // Wheel zoom handler - now uses immediate response with internal debouncing
  const handleWheel = useCallback((e: WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault()
      // Use debounced zoom for wheel events (smooth continuous zoom)
      zoomByDeltaWheel(-e.deltaY)
    }
  }, [zoomByDeltaWheel])

  // Touch zoom handlers
  const lastTouchDistance = useRef<number>(0)
  const isZooming = useRef<boolean>(false)

  const getTouchDistance = (touches: TouchList) => {
    if (touches.length < 2) return 0
    const touch1 = touches[0]
    const touch2 = touches[1]
    return Math.sqrt(
      Math.pow(touch2.clientX - touch1.clientX, 2) +
      Math.pow(touch2.clientY - touch1.clientY, 2)
    )
  }

  const handleTouchStartZoom = useCallback((e: TouchEvent) => {
    if (e.touches.length === 2) {
      e.preventDefault()
      isZooming.current = true
      lastTouchDistance.current = getTouchDistance(e.touches)
    }
  }, [])

  const handleTouchMoveZoom = useCallback((e: TouchEvent) => {
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

  const handleTouchEndZoom = useCallback((e: TouchEvent) => {
    if (e.touches.length < 2) {
      isZooming.current = false
      lastTouchDistance.current = 0
    }
  }, [])

  // Setup zoom event listeners with performance optimization
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    // Add wheel event listener for mouse zoom with optimized passive handling
    const wheelOptions = { passive: false, capture: false }
    container.addEventListener('wheel', handleWheel, wheelOptions)

    // Add touch event listeners for pinch zoom with optimized passive handling
    const touchOptions = { passive: false, capture: false }
    container.addEventListener('touchstart', handleTouchStartZoom, touchOptions)
    container.addEventListener('touchmove', handleTouchMoveZoom, touchOptions)
    container.addEventListener('touchend', handleTouchEndZoom, touchOptions)

    return () => {
      container.removeEventListener('wheel', handleWheel)
      container.removeEventListener('touchstart', handleTouchStartZoom)
      container.removeEventListener('touchmove', handleTouchMoveZoom)
      container.removeEventListener('touchend', handleTouchEndZoom)
    }
  }, [handleWheel, handleTouchStartZoom, handleTouchMoveZoom, handleTouchEndZoom])

  // Toolbar handler functions
  const handleToggleMobileView = useCallback(() => {
    setIsMobileView(!isMobileView)
  }, [isMobileView, setIsMobileView])

  const handleToggleAnnotationTool = useCallback(() => {
    // Toggle between null and draw for toolbar button
    setActiveAnnotationTool(activeAnnotationTool ? null : 'draw')
  }, [activeAnnotationTool, setActiveAnnotationTool])

  const handleUndo = useCallback(() => {
    // Call undo function from annotation canvas
    const canvas = annotationCanvasRef.current
    if (canvas && (canvas as any).undoAnnotation) {
      (canvas as any).undoAnnotation()
    }
  }, [])

  const handleRedo = useCallback(() => {
    // Call redo function from annotation canvas
    const canvas = annotationCanvasRef.current
    if (canvas && (canvas as any).redoAnnotation) {
      (canvas as any).redoAnnotation()
    }
  }, [])

  // Handle undo/redo state changes from annotation canvas
  const handleUndoRedoChange = useCallback((canUndo: boolean, canRedo: boolean) => {
    setCanUndo(canUndo)
    setCanRedo(canRedo)
  }, [setCanUndo, setCanRedo])

  // Handle annotation changes to update hasAnnotations state
  const handleAnnotationChange = useCallback(() => {
    // Set hasAnnotations to true when any annotation is made
    setHasAnnotations(true)
    // Save to localStorage to persist across reloads
    const annotationKey = `pdf-annotations-${fileUrl}`
    localStorage.setItem(annotationKey, JSON.stringify([{ hasAnnotations: true }]))
  }, [fileUrl])

  // Handle brush size change with tool-specific saving
  const handleBrushSizeChange = useCallback((newSize: number) => {
    setBrushSize(newSize)

    // Save brush size for current tool
    if (activeAnnotationTool) {
      ColorStorage.saveBrushSize(newSize, activeAnnotationTool)
    }
  }, [activeAnnotationTool])

  // Handle canvas ref callback
  const handleCanvasRef = useCallback((canvas: HTMLCanvasElement | null) => {
    annotationCanvasRef.current = canvas
    // Check for existing annotations when canvas is ready
    if (canvas) {
      // Use setTimeout to ensure canvas is fully initialized
      setTimeout(() => {
        checkExistingAnnotations()
      }, 100)
    }
  }, [checkExistingAnnotations])

  // Handle clear all annotations
  const handleClearAll = useCallback(() => {
    setShowClearModal(true)
  }, [])

  // Handle page selection from sidebar - works for both single and continuous mode
  const handlePageSelect = useCallback((page: number) => {
    setPageNumber(page)
    
    // In continuous mode, scroll to the specific page
    if (viewMode === 'continuous') {
      // Find the page element and scroll to it
      setTimeout(() => {
        const pageElement = document.querySelector(`[data-page-number="${page}"]`)
        if (pageElement) {
          pageElement.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start'
          })
        }
      }, 100) // Small delay to ensure DOM is ready
    }
    
    // Close sidebar on mobile after selection
    if (isMobileView) {
      setShowThumbnails(false)
    }
  }, [viewMode, isMobileView, setPageNumber, setShowThumbnails])

  // Keyboard navigation support
  usePDFKeyboard({
    onPrevPage: goToPrevPage,
    onNextPage: goToNextPage,
    onZoomIn: zoomIn,
    onZoomOut: zoomOut,
    onRotate: rotate,
    onDraw: handleDraw,
    onHighlight: handleHighlight,
    onEraser: handleEraser,
    onUndo: handleUndo,
    onRedo: handleRedo,
    onClearAll: handleClearAll,
    canUndo,
    canRedo,
    isEnabled: !loading && !error
  })

  // Handle clear confirmation - Clear ALL PDF annotations
  const handleClearConfirm = useCallback(() => {
    const canvas = annotationCanvasRef.current
    if (canvas && (canvas as any).clearAllPDFAnnotations) {
      (canvas as any).clearAllPDFAnnotations()
    }
    setHasAnnotations(false) // Reset hasAnnotations after clearing
    setShowClearModal(false)
  }, [])

  // Handle clear current page only
  const handleClearCurrentPage = useCallback(() => {
    const canvas = annotationCanvasRef.current
    if (canvas && (canvas as any).clearCurrentPageAnnotations) {
      (canvas as any).clearCurrentPageAnnotations()
    }
    // Check if there are still annotations on other pages
    checkExistingAnnotations()
  }, [checkExistingAnnotations])

  // Handle clear cancel
  const handleClearCancel = useCallback(() => {
    setShowClearModal(false)
  }, [])

  // State to control annotation dropdown visibility  
  const [showAnnotationDropdown, setShowAnnotationDropdown] = useState(true)

  // Reset dropdown when annotation tool changes
  useEffect(() => {
    setShowAnnotationDropdown(true)
  }, [activeAnnotationTool])

  // Handle drawing start (for auto-closing dropdown)
  const handleDrawingStart = useCallback(() => {
    // Close the annotation dropdown when drawing starts
    setShowAnnotationDropdown(false)
  }, [])

  if (!workerReady) {
    return (
      <div className={cn("flex flex-col items-center justify-center p-8 bg-muted/20 rounded-lg", className)}>
        <Loader2 className="h-8 w-8 animate-spin mr-2" />
        <span>Đang khởi tạo PDF viewer...</span>
      </div>
    )
  }

  if (error) {
    // ✅ ENHANCED: Check if this is an authentication error
    const isAuthError = error.includes('đăng nhập') || error.includes('Authentication') || error.includes('401')

    return (
      <div className={cn("flex flex-col items-center justify-center p-8 bg-muted/20 rounded-lg", className)}>
        <AlertCircle className="h-12 w-12 text-destructive mb-4" />
        <h3 className="text-lg font-medium text-foreground mb-2">
          {isAuthError ? 'Lỗi xác thực' : 'Lỗi tải PDF'}
        </h3>
        <p className="text-muted-foreground text-center mb-4">{error}</p>

        <div className="flex gap-3">
          {isAuthError ? (
            <>
              <Button
                onClick={() => {
                  // Trigger session recovery by throwing an error that SessionErrorBoundary can catch
                  throw new Error('Session authentication required for PDF access')
                }}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                🔄 Khôi phục phiên
              </Button>
              <Button
                onClick={() => window.location.href = '/auth/vn/login'}
                variant="outline"
              >
                🔑 Đăng nhập lại
              </Button>
            </>
          ) : (
            <Button
              onClick={() => window.location.reload()}
              variant="outline"
            >
              Thử lại
            </Button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div
      className={cn("flex flex-col bg-background h-full pdf-secure pdf-no-print", className)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onContextMenu={(e) => e.preventDefault()} // Disable right-click context menu
      role="application"
      aria-label="PDF Viewer"
      tabIndex={0}
    >
      {/* Top Toolbar - Auto-hide on mobile */}
      <div className={cn(
        "transition-transform duration-300 ease-in-out",
        isMobileView && !toolbarVisible && "transform -translate-y-full"
      )}>
        <PDFToolbar
          pageNumber={pageNumber}
          numPages={numPages}
          scale={scale}
          loading={loading}
          showThumbnails={showThumbnails}
          showAnnotationPanel={showAnnotationPanel}
          isMobileView={isMobileView}
          canUndo={canUndo}
          canRedo={canRedo}
          activeAnnotationTool={activeAnnotationTool}
          selectedColor={selectedColor}
          brushSize={brushSize}
          hasAnnotations={hasAnnotations}
          viewMode={viewMode}
          onToggleThumbnails={() => {
            setShowThumbnails(!showThumbnails)
          }}
          onToggleAnnotationPanel={() => setShowAnnotationPanel(!showAnnotationPanel)}
          onZoomIn={zoomIn}
          onZoomOut={zoomOut}
          onRotate={rotate}
          onFitToWidth={fitToWidth}
          onToggleViewMode={() => setViewMode(viewMode === 'single' ? 'continuous' : 'single')}
          onPageJump={handlePageSelect}
          onDownload={downloadPDF}
          onToggleMobileView={handleToggleMobileView}
          onToggleAnnotationTool={handleToggleAnnotationTool}
          onDraw={handleDraw}
          onHighlight={handleHighlight}
          onEraser={handleEraser}
          onUndo={handleUndo}
          onRedo={handleRedo}
          onClearAll={handleClearAll}
          onColorChange={setSelectedColor}
          onBrushSizeChange={handleBrushSizeChange}
          onDrawingStart={handleDrawingStart} // Pass callback to toolbar for dropdown auto-close
          showAnnotationDropdown={showAnnotationDropdown} // Control dropdown visibility from parent
        />
      </div>

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden relative" ref={containerRef}>
        {/* Mobile Sidebar Overlay */}
        {showThumbnails && isMobileView && (
          <div
            className="pdf-sidebar-overlay open"
            onClick={() => setShowThumbnails(false)}
          />
        )}

        {/* Left Sidebar - Thumbnails (Cached) */}
        {showThumbnails && (
          <div className={isMobileView ? 'pdf-thumbnail-sidebar-mobile open' : 'flex-shrink-0'}>
            <PDFThumbnailCached
              pdfDocument={pdfDocument}
              numPages={numPages}
              currentPage={pageNumber}
              onPageSelect={handlePageSelect}
            />
          </div>
        )}

        {/* Center - PDF Viewer */}
        {viewMode === 'single' ? (
          <PDFViewer
            fileUrl={fileUrl}
            pageNumber={pageNumber}
            scale={scale}
            rotation={rotation}
            loading={loading}
            numPages={numPages}
            onDocumentLoadSuccess={onDocumentLoadSuccess}
            onDocumentLoadError={onDocumentLoadError}
            onPageLoadSuccess={onPageLoadSuccess}
            onPrevPage={goToPrevPage}
            onNextPage={goToNextPage}
            activeAnnotationTool={activeAnnotationTool}
            selectedColor={selectedColor}
            brushSize={isMobileView ? Math.max(brushSize, 3) : brushSize}
            onAnnotationChange={handleAnnotationChange}
            onUndoRedoChange={handleUndoRedoChange}
            onCanvasRef={handleCanvasRef}
            onDrawingStart={handleDrawingStart}
          />
        ) : (
          <PDFContinuousViewer
            fileUrl={fileUrl}
            numPages={numPages}
            scale={scale}
            rotation={rotation}
            loading={loading}
            onDocumentLoadSuccess={onDocumentLoadSuccess}
            onDocumentLoadError={onDocumentLoadError}
            activeAnnotationTool={activeAnnotationTool}
            selectedColor={selectedColor}
            brushSize={isMobileView ? Math.max(brushSize, 3) : brushSize}
            onAnnotationChange={handleAnnotationChange}
            onUndoRedoChange={handleUndoRedoChange}
            onCanvasRef={handleCanvasRef}
            onPageInView={(page) => setPageNumber(page)}
            onPrevPage={goToPrevPage}
            onNextPage={goToNextPage}
            onDrawingStart={handleDrawingStart}
          />
        )}

        {/* Mobile-only: Floating action button to show toolbar */}
        {isMobileView && !toolbarVisible && (
          <button
            onClick={() => setToolbarVisible(true)}
            className="fixed top-4 right-4 z-50 w-12 h-12 bg-background/90 backdrop-blur-sm border border-border rounded-full shadow-lg flex items-center justify-center"
            title="Hiện thanh công cụ"
          >
            <span className="text-sm">⚙️</span>
          </button>
        )}

        {/* Mobile-only: Interactive page indicator at bottom center */}
        {isMobileView && (
          <PageIndicator
            variant="mobile"
            currentPage={pageNumber}
            totalPages={numPages}
            loading={loading}
            onPageJump={handlePageSelect}
          />
        )}




      </div>

      {/* Clear Confirmation Modal */}
      <ClearConfirmationModal
        isOpen={showClearModal}
        onConfirm={handleClearConfirm}
        onCancel={handleClearCancel}
        onClearCurrentPage={handleClearCurrentPage}
      />
    </div>
  )
}

// Main export with error boundary
export function PDFViewerClient(props: PDFViewerClientProps) {
  return (
    <PDFErrorWrapper>
      <PDFViewerClientInner {...props} />
    </PDFErrorWrapper>
  )
}
