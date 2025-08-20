export interface PDFViewerClientProps {
  fileUrl: string
  fileName?: string
  className?: string
}

export type AnnotationTool = 'highlight' | 'draw' | 'eraser' | null

export type ViewMode = 'single' | 'continuous'

export interface PDFState {
  numPages: number
  pageNumber: number
  scale: number
  rotation: number
  loading: boolean
  error: string | null
  workerReady: boolean
  activeAnnotationTool: AnnotationTool
  showThumbnails: boolean
  showAnnotationPanel: boolean
  isMobileView: boolean
  canUndo: boolean
  canRedo: boolean
  viewMode: ViewMode
  pdfDocument: any | null // PDF.js document object
}

export interface PDFToolbarProps {
  fileName?: string
  pageNumber: number
  numPages: number
  scale: number
  loading: boolean
  showThumbnails: boolean
  showAnnotationPanel: boolean
  isMobileView: boolean
  canUndo: boolean
  canRedo: boolean
  activeAnnotationTool: AnnotationTool
  selectedColor?: string
  brushSize?: number
  hasAnnotations?: boolean
  viewMode: ViewMode
  onToggleThumbnails: () => void
  onToggleAnnotationPanel: () => void
  onZoomIn: () => void
  onZoomOut: () => void
  onRotate: () => void
  onFitToWidth: () => void
  onToggleViewMode: () => void
  onPageJump: (page: number) => void
  onDownload: () => void
  onToggleMobileView: () => void
  onToggleAnnotationTool: () => void
  onDraw: () => void
  onHighlight: () => void
  onEraser: () => void
  onUndo: () => void
  onRedo: () => void
  onClearAll: () => void
  onColorChange?: (color: string) => void
  onBrushSizeChange?: (size: number) => void
  onDrawingStart?: () => void
  showAnnotationDropdown?: boolean
}

export interface PDFThumbnailSidebarProps {
  fileUrl: string
  numPages: number
  currentPage: number
  onPageSelect: (page: number) => void
}

export interface PDFAnnotationPanelProps {
  activeAnnotationTool: AnnotationTool
  onHighlight: () => void
  onDraw: () => void
  onEraser: () => void
  onColorChange?: (color: string) => void
  onBrushSizeChange?: (size: number) => void
}

export interface PDFViewerProps {
  fileUrl: string
  pageNumber: number
  scale: number
  rotation: number
  loading: boolean
  numPages: number
  onDocumentLoadSuccess?: ({ numPages }: { numPages: number }) => void
  onDocumentLoadError: (error: Error) => void
  onPageLoadSuccess?: (page: any) => void
  onPrevPage?: () => void
  onNextPage?: () => void
  activeAnnotationTool?: AnnotationTool
  selectedColor?: string
  brushSize?: number
  onAnnotationChange?: () => void
  onUndoRedoChange?: (canUndo: boolean, canRedo: boolean) => void
  onCanvasRef?: (canvas: HTMLCanvasElement | null) => void
  onDrawingStart?: () => void
}

export interface UsePDFStateReturn {
  state: PDFState
  setNumPages: (numPages: number) => void
  setPageNumber: (pageNumber: number) => void
  setScale: (scale: number) => void
  setRotation: (rotation: number) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  setWorkerReady: (ready: boolean) => void
  setActiveAnnotationTool: (tool: AnnotationTool) => void
  setShowThumbnails: (show: boolean) => void
  setShowAnnotationPanel: (show: boolean) => void
  setIsMobileView: (isMobileView: boolean) => void
  setCanUndo: (canUndo: boolean) => void
  setCanRedo: (canRedo: boolean) => void
  setViewMode: (viewMode: ViewMode) => void
  setPdfDocument: (pdfDocument: any | null) => void
}

export interface UsePDFNavigationReturn {
  goToPrevPage: () => void
  goToNextPage: () => void
  zoomIn: () => void
  zoomOut: () => void
  zoomByDelta: (delta: number) => void
  rotate: () => void
  fitToWidth: () => void
}

export interface UsePDFAnnotationReturn {
  handleHighlight: () => void
  handleDraw: () => void
  handleEraser: () => void
}
