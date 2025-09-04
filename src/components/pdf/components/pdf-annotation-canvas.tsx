import { useRef, useEffect, useState, useCallback, useMemo } from 'react'
import { AnnotationTool } from '../types'
import { PDF_CONFIG } from '../config/pdf-config'
import { safeStorageSave } from '../utils/storage-manager'
import {
  transformCoordinatesForRotation,
  reverseTransformCoordinatesForRotation,
  getRotatedDimensions,
  Point as HelperPoint
} from '../utils/pdf-helpers'

interface PDFAnnotationCanvasProps {
  width: number
  height: number
  scale: number
  rotation: number
  activeAnnotationTool: AnnotationTool | null
  selectedColor?: string
  brushSize?: number
  onAnnotationChange?: () => void
  onUndoRedoChange?: (canUndo: boolean, canRedo: boolean) => void
  onCanvasRef?: (canvas: HTMLCanvasElement | null) => void
  onDrawingStart?: () => void
  fileUrl?: string
  pageNumber?: number
}

interface AnnotationPoint {
  x: number
  y: number
}

interface Stroke {
  points: AnnotationPoint[]
  color: string
  size: number
  tool: 'draw' | 'highlight' | 'eraser'
  rotation?: number // Add rotation context for saved strokes
}

// Create simple black dot cursor
const createCircularCursor = (size: number, isEraser: boolean = false) => {
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  if (!ctx) return 'crosshair'

  // Scale cursor size to be more visible but proportional
  const diameter = Math.max(size * 2, 8) // Minimum 8px, scale by 2x
  canvas.width = diameter
  canvas.height = diameter

  const radius = diameter / 2
  const center = radius

  ctx.beginPath()
  ctx.arc(center, center, radius - 1, 0, 2 * Math.PI)

  if (isEraser) {
    // Eraser: white fill with black border
    ctx.fillStyle = '#ffffff'
    ctx.fill()
    ctx.strokeStyle = '#000000'
    ctx.lineWidth = 1
    ctx.stroke()
  } else {
    // Pen/Highlight: simple black dot
    ctx.fillStyle = '#000000'
    ctx.fill()
  }

  return `url(${canvas.toDataURL()}) ${center} ${center}, crosshair`
}

export function PDFAnnotationCanvas({
  width,
  height,
  scale,
  rotation,
  activeAnnotationTool,
  selectedColor = PDF_CONFIG.ANNOTATION_COLORS.DEFAULT,
  brushSize = PDF_CONFIG.DEFAULT_BRUSH_SIZE,
  onAnnotationChange,
  onUndoRedoChange,
  onCanvasRef,
  onDrawingStart,
  fileUrl,
  pageNumber
}: PDFAnnotationCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [strokes, setStrokes] = useState<Stroke[]>([])
  const [currentStroke, setCurrentStroke] = useState<AnnotationPoint[]>([])
  const [cursorStyle, setCursorStyle] = useState('crosshair')
  // const { reportError } = usePDFErrorReporting() // Removed to avoid dependency issues

  // Track previous page to save annotations before switching
  const prevPageRef = useRef<{ fileUrl?: string; pageNumber?: number }>({})
  const prevStrokesRef = useRef<Stroke[]>([])

  // Performance optimization refs
  const lastTouchTime = useRef<number>(0)
  const touchDebounceDelay = PDF_CONFIG.CANVAS_DEBOUNCE_DELAY

  // Update refs when strokes change
  useEffect(() => {
    prevStrokesRef.current = strokes
  }, [strokes])

  // Undo/Redo state management
  const [history, setHistory] = useState<Stroke[][]>([])
  const [redoStack, setRedoStack] = useState<Stroke[][]>([])
  const maxHistorySize = PDF_CONFIG.MAX_HISTORY_SIZE

  // Generate storage key for current PDF page
  const getStorageKey = useCallback(() => {
    if (!fileUrl || pageNumber === undefined) return null
    // Create a safe key from fileUrl and pageNumber
    const safeFileUrl = fileUrl.replace(/[^a-zA-Z0-9]/g, '_')
    return `${PDF_CONFIG.STORAGE_PREFIX}${safeFileUrl}_page_${pageNumber}`
  }, [fileUrl, pageNumber])

  // Save annotations to localStorage with error handling
  const saveAnnotations = useCallback(() => {
    const key = getStorageKey()
    if (!key) return

    try {
      // Check storage quota before saving
      if (strokes.length > PDF_CONFIG.MAX_STROKES_PER_PAGE) {
        return
      }

      const annotationData = {
        fileUrl,
        pageNumber,
        strokes,
        timestamp: Date.now(),
        version: PDF_CONFIG.STORAGE_VERSION
        // No need to save rotation - strokes are already in original coordinate space
      }

      safeStorageSave(key, annotationData)
    } catch (error) {
      // Silently handle storage errors
    }
  }, [getStorageKey, fileUrl, pageNumber, strokes]) // Remove reportError to prevent re-creation

  // Load annotations from localStorage with validation
  const loadAnnotations = useCallback(() => {
    const key = getStorageKey()
    if (!key) return

    try {
      const stored = localStorage.getItem(key)
      if (stored) {
        const annotationData = JSON.parse(stored)

        // Validate data structure and version
        if (annotationData.version !== PDF_CONFIG.STORAGE_VERSION) {
          return
        }

        if (annotationData.strokes && Array.isArray(annotationData.strokes)) {
          // Validate stroke count
          if (annotationData.strokes.length > PDF_CONFIG.MAX_STROKES_PER_PAGE) {
            return
          }

          // Strokes are already saved in original PDF coordinate space
          // No need to process them - they will be transformed during rendering
          setStrokes(annotationData.strokes)
          // Don't affect undo/redo history when loading
          setHistory([])
          setRedoStack([])
        }
      }
    } catch (error) {
      // Silently handle parsing errors
    }
  }, [getStorageKey, fileUrl, pageNumber, rotation, width, height]) // Add rotation and dimensions for coordinate transformation

  // Get current drawing settings
  const getCurrentSettings = useCallback(() => {
    switch (activeAnnotationTool) {
      case 'draw':
        return {
          color: selectedColor,
          size: brushSize,
          globalCompositeOperation: 'source-over' as GlobalCompositeOperation
        }
      case 'highlight':
        // Convert solid color to semi-transparent for highlight effect
        const highlightColor = convertToHighlightColor(selectedColor)
        return {
          color: highlightColor,
          size: brushSize * PDF_CONFIG.HIGHLIGHT_BRUSH_MULTIPLIER,
          globalCompositeOperation: 'source-over' as GlobalCompositeOperation
        }
      case 'eraser':
        return {
          color: PDF_CONFIG.ANNOTATION_COLORS.ERASER,
          size: brushSize * PDF_CONFIG.HIGHLIGHT_BRUSH_MULTIPLIER, // Same size as highlight
          globalCompositeOperation: 'destination-out' as GlobalCompositeOperation
        }
      default:
        return {
          color: selectedColor,
          size: brushSize,
          globalCompositeOperation: 'source-over' as GlobalCompositeOperation
        }
    }
  }, [activeAnnotationTool, selectedColor, brushSize])

  // Convert solid color to semi-transparent highlight color
  const convertToHighlightColor = useCallback((color: string): string => {
    // If color is already in rgba format, extract and modify alpha
    if (color.startsWith('rgba')) {
      return color.replace(/,\s*[\d.]+\)$/, ', 0.3)')
    }

    // If color is in hex format, convert to rgba with transparency
    if (color.startsWith('#')) {
      const hex = color.slice(1)
      const r = parseInt(hex.slice(0, 2), 16)
      const g = parseInt(hex.slice(2, 4), 16)
      const b = parseInt(hex.slice(4, 6), 16)
      return `rgba(${r}, ${g}, ${b}, 0.3)`
    }

    // If color is in rgb format, convert to rgba
    if (color.startsWith('rgb')) {
      return color.replace('rgb', 'rgba').replace(')', ', 0.3)')
    }

    // Default fallback - yellow highlight
    return 'rgba(255, 255, 0, 0.3)'
  }, [])

  // Helper function to update undo/redo button states
  const updateUndoRedoState = useCallback(() => {
    const canUndo = history.length > 0
    const canRedo = redoStack.length > 0
    onUndoRedoChange?.(canUndo, canRedo)
  }, [history.length, redoStack.length, onUndoRedoChange])

  // Save current state to history before making changes
  const saveToHistory = useCallback(() => {
    setHistory(prev => {
      const newHistory = [...prev, [...strokes]]
      // Limit history size to prevent memory issues
      if (newHistory.length > maxHistorySize) {
        return newHistory.slice(-maxHistorySize)
      }
      return newHistory
    })
    // Clear redo stack when new action is performed
    setRedoStack([])
  }, [strokes, maxHistorySize])

  // Undo function
  const undo = useCallback(() => {
    if (history.length === 0) return

    // Save current state to redo stack
    setRedoStack(prev => [...prev, [...strokes]])

    // Restore previous state from history
    const previousState = history[history.length - 1]
    setStrokes([...previousState])

    // Remove the restored state from history
    setHistory(prev => prev.slice(0, -1))

    onAnnotationChange?.()
  }, [history, strokes, onAnnotationChange])

  // Redo function
  const redo = useCallback(() => {
    if (redoStack.length === 0) return

    // Save current state to history
    setHistory(prev => [...prev, [...strokes]])

    // Restore state from redo stack
    const redoState = redoStack[redoStack.length - 1]
    setStrokes([...redoState])

    // Remove the restored state from redo stack
    setRedoStack(prev => prev.slice(0, -1))

    onAnnotationChange?.()
  }, [redoStack, strokes, onAnnotationChange])

  // Get mouse/touch position relative to canvas with proper coordinate mapping
  // Returns normalized coordinates (0-1 range based on original PDF dimensions)
  // Now includes rotation transformation
  const getMousePos = useCallback((e: MouseEvent | React.MouseEvent | TouchEvent | React.TouchEvent): AnnotationPoint => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }

    const rect = canvas.getBoundingClientRect()
    let clientX: number, clientY: number

    if ('touches' in e && e.touches.length > 0) {
      clientX = e.touches[0].clientX
      clientY = e.touches[0].clientY
    } else if ('changedTouches' in e && e.changedTouches.length > 0) {
      clientX = e.changedTouches[0].clientX
      clientY = e.changedTouches[0].clientY
    } else {
      clientX = (e as MouseEvent | React.MouseEvent).clientX
      clientY = (e as MouseEvent | React.MouseEvent).clientY
    }

    const canvasX = clientX - rect.left
    const canvasY = clientY - rect.top

    // Get rotated dimensions
    const rotatedDims = getRotatedDimensions(width, height, rotation)
    
    // Normalize to rotated PDF space (0-1 range)
    const normalizedX = (canvasX / rect.width) * rotatedDims.width
    const normalizedY = (canvasY / rect.height) * rotatedDims.height

    // Transform back to original PDF coordinates
    const transformedPoint = reverseTransformCoordinatesForRotation(
      { x: normalizedX, y: normalizedY },
      rotation,
      width,
      height
    )

    return transformedPoint
  }, [width, height, rotation])

  // Start drawing (mouse)
  const startDrawing = useCallback((e: React.MouseEvent) => {
    if (!activeAnnotationTool || activeAnnotationTool === null) return

    // Save current state to history before starting new stroke
    saveToHistory()

    // Notify that drawing has started (to close dropdown)
    onDrawingStart?.()

    setIsDrawing(true)
    const point = getMousePos(e)
    setCurrentStroke([point])
  }, [activeAnnotationTool, getMousePos, saveToHistory, onDrawingStart])

  // Start drawing (touch)
  const startDrawingTouch = useCallback((e: React.TouchEvent) => {
    if (!activeAnnotationTool || activeAnnotationTool === null) return

    // Don't preventDefault here - it's handled by touch-none CSS class

    // Save current state to history before starting new stroke
    saveToHistory()

    // Notify that drawing has started (to close dropdown)
    onDrawingStart?.()

    setIsDrawing(true)
    const point = getMousePos(e)
    setCurrentStroke([point])
  }, [activeAnnotationTool, getMousePos, saveToHistory, onDrawingStart])

  // Continue drawing (mouse)
  const draw = useCallback((e: React.MouseEvent) => {
    if (!isDrawing || !activeAnnotationTool) return

    const point = getMousePos(e)
    setCurrentStroke(prev => [...prev, point])

    // Draw on canvas immediately for smooth experience
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const settings = getCurrentSettings()

    ctx.globalCompositeOperation = settings.globalCompositeOperation
    ctx.strokeStyle = settings.color
    ctx.lineWidth = settings.size * scale // Scale brush size with zoom
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'

    if (currentStroke.length > 0) {
      const prevPoint = currentStroke[currentStroke.length - 1]
      
      // Get rotated dimensions
      const rotatedDims = getRotatedDimensions(width, height, rotation)

      // Transform coordinates for current rotation before scaling
      const transformedPrev = transformCoordinatesForRotation(
        prevPoint,
        rotation,
        width,
        height
      )
      const transformedCurrent = transformCoordinatesForRotation(
        point,
        rotation,
        width,
        height
      )

      // Scale transformed coordinates when drawing
      const scaledPrevX = (transformedPrev.x / rotatedDims.width) * canvas.width
      const scaledPrevY = (transformedPrev.y / rotatedDims.height) * canvas.height
      const scaledX = (transformedCurrent.x / rotatedDims.width) * canvas.width
      const scaledY = (transformedCurrent.y / rotatedDims.height) * canvas.height

      ctx.beginPath()
      ctx.moveTo(scaledPrevX, scaledPrevY)
      ctx.lineTo(scaledX, scaledY)
      ctx.stroke()
    }
  }, [isDrawing, activeAnnotationTool, currentStroke, getMousePos, getCurrentSettings, scale, rotation, width, height])

  // Stop drawing
  const stopDrawing = useCallback(() => {
    if (!isDrawing || currentStroke.length === 0) return

    // Save the stroke
    if (activeAnnotationTool && activeAnnotationTool !== null) {
      const settings = getCurrentSettings()
      const newStroke: Stroke = {
        points: currentStroke,
        color: settings.color,
        size: settings.size,
        tool: activeAnnotationTool as 'draw' | 'highlight' | 'eraser'
        // No need to save rotation - points are already in original coordinate space
      }

      setStrokes(prev => [...prev, newStroke])
      onAnnotationChange?.()
    }

    setIsDrawing(false)
    setCurrentStroke([])
  }, [isDrawing, currentStroke, activeAnnotationTool, getCurrentSettings, onAnnotationChange, rotation])

  // Redraw all strokes with proper scaling and rotation transformation
  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Get current rotated dimensions for transformation
    const rotatedDims = getRotatedDimensions(width, height, rotation)

    // Redraw all strokes with scaling and rotation applied
    strokes.forEach(stroke => {
      if (stroke.points.length < 2) return

      // Set composite operation based on tool
      ctx.globalCompositeOperation = stroke.tool === 'eraser'
        ? 'destination-out'
        : 'source-over' // Use source-over for both draw and highlight

      // Set stroke style - highlight colors should already have transparency
      ctx.strokeStyle = stroke.color

      // Scale brush size - highlight strokes should already have wider size stored
      ctx.lineWidth = stroke.size * scale
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'

      ctx.beginPath()

      // Transform and scale the first point
      const firstPoint = stroke.points[0]
      const transformedFirst = transformCoordinatesForRotation(
        firstPoint,
        rotation,
        width,
        height
      )
      const scaledFirstX = (transformedFirst.x / rotatedDims.width) * canvas.width
      const scaledFirstY = (transformedFirst.y / rotatedDims.height) * canvas.height
      ctx.moveTo(scaledFirstX, scaledFirstY)

      // Transform and scale all subsequent points
      for (let i = 1; i < stroke.points.length; i++) {
        const point = stroke.points[i]
        const transformedPoint = transformCoordinatesForRotation(
          point,
          rotation,
          width,
          height
        )
        const scaledX = (transformedPoint.x / rotatedDims.width) * canvas.width
        const scaledY = (transformedPoint.y / rotatedDims.height) * canvas.height
        ctx.lineTo(scaledX, scaledY)
      }

      ctx.stroke()
    })
  }, [strokes, scale, rotation, width, height])

  // Update canvas size when dimensions or rotation change
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    // Get effective dimensions based on rotation
    const rotatedDims = getRotatedDimensions(width, height, rotation)

    // Set canvas internal dimensions to match PDF at current scale for high resolution
    const scaledWidth = rotatedDims.width * scale
    const scaledHeight = rotatedDims.height * scale

    canvas.width = scaledWidth
    canvas.height = scaledHeight

    // Set canvas display size to match PDF display size
    canvas.style.width = `${scaledWidth}px`
    canvas.style.height = `${scaledHeight}px`

    // Redraw after resize
    redrawCanvas()
  }, [width, height, scale, rotation, redrawCanvas])

  // Redraw when strokes change
  useEffect(() => {
    redrawCanvas()
  }, [redrawCanvas])

  // Update undo/redo state when history changes
  useEffect(() => {
    updateUndoRedoState()
  }, [updateUndoRedoState])

  // Debounced auto-save annotations when strokes change
  useEffect(() => {
    if (strokes.length === 0) return

    const timeoutId = setTimeout(() => {
      saveAnnotations()
    }, PDF_CONFIG.ANNOTATION_SAVE_DELAY)

    return () => {
      clearTimeout(timeoutId)
    }
  }, [strokes, saveAnnotations])

  // Handle page changes with proper save/load sequence
  useEffect(() => {
    const currentPage = { fileUrl, pageNumber }
    const prevPage = prevPageRef.current

    // Check if this is actually a page change (not initial load)
    const isPageChange = prevPage.fileUrl && prevPage.pageNumber !== undefined &&
                        (prevPage.fileUrl !== fileUrl || prevPage.pageNumber !== pageNumber)

    if (isPageChange) {
      // Save annotations from previous page if there were any
      if (prevStrokesRef.current.length > 0) {
        const prevKey = `${PDF_CONFIG.STORAGE_PREFIX}${prevPage.fileUrl?.replace(/[^a-zA-Z0-9]/g, '_')}_page_${prevPage.pageNumber}`
        try {
          const annotationData = {
            fileUrl: prevPage.fileUrl,
            pageNumber: prevPage.pageNumber,
            strokes: prevStrokesRef.current,
            timestamp: Date.now(),
            version: PDF_CONFIG.STORAGE_VERSION,
            currentRotation: rotation
          }
          safeStorageSave(prevKey, annotationData)
        } catch (error) {
          // Silently handle storage errors
        }
      }

      // Clear current state immediately
      setStrokes([])
      setCurrentStroke([])
      setHistory([])
      setRedoStack([])

      // Clear canvas
      const canvas = canvasRef.current
      if (canvas) {
        const ctx = canvas.getContext('2d')
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height)
        }
      }
    }

    // Update previous page reference
    prevPageRef.current = currentPage

    // Load annotations for current page
    loadAnnotations()
  }, [fileUrl, pageNumber]) // Only depend on fileUrl and pageNumber

  // Save annotations when component unmounts
  useEffect(() => {
    return () => {
      // Save current annotations on unmount
      if (prevStrokesRef.current.length > 0 && fileUrl && pageNumber !== undefined) {
        const key = `${PDF_CONFIG.STORAGE_PREFIX}${fileUrl.replace(/[^a-zA-Z0-9]/g, '_')}_page_${pageNumber}`
        try {
          const annotationData = {
            fileUrl,
            pageNumber,
            strokes: prevStrokesRef.current,
            timestamp: Date.now(),
            version: PDF_CONFIG.STORAGE_VERSION,
            currentRotation: rotation
          }
          safeStorageSave(key, annotationData)
        } catch (error) {
          // Silently handle storage errors
        }
      }
    }
  }, []) // Empty dependency array - only run on unmount

  // Clear annotations for current page only
  const clearCurrentPageAnnotations = useCallback(() => {
    // Clear current state
    setStrokes([])
    setCurrentStroke([])

    // Clear undo/redo history
    setHistory([])
    setRedoStack([])

    // Clear canvas
    const canvas = canvasRef.current
    if (canvas) {
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height)
      }
    }

    // Clear from storage for current page
    const key = getStorageKey()
    if (key) {
      try {
        localStorage.removeItem(key)
      } catch (error) {
        // Silently handle storage errors
      }
    }

    onAnnotationChange?.()
  }, [getStorageKey, onAnnotationChange])

  // Clear ALL annotations for entire PDF
  const clearAllPDFAnnotations = useCallback(() => {
    if (!fileUrl) return

    // Clear current page state
    setStrokes([])
    setCurrentStroke([])
    setHistory([])
    setRedoStack([])

    // Clear canvas
    const canvas = canvasRef.current
    if (canvas) {
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height)
      }
    }

    // Clear ALL pages from localStorage
    const safeFileUrl = fileUrl.replace(/[^a-zA-Z0-9]/g, '_')
    const prefix = `${PDF_CONFIG.STORAGE_PREFIX}${safeFileUrl}_page_`

    try {
      // Get all localStorage keys
      const keysToRemove: string[] = []
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && key.startsWith(prefix)) {
          keysToRemove.push(key)
        }
      }

      // Remove all annotation keys for this PDF
      keysToRemove.forEach(key => {
        localStorage.removeItem(key)
      })
    } catch (error) {
      // Silently handle storage errors
    }

    onAnnotationChange?.()
  }, [fileUrl, getStorageKey, onAnnotationChange])

  // Expose undo/redo/clear functions via ref (for parent component access)
  useEffect(() => {
    if (canvasRef.current) {
      // Attach functions to canvas element for external access
      (canvasRef.current as any).undoAnnotation = undo;
      (canvasRef.current as any).redoAnnotation = redo;
      (canvasRef.current as any).clearCurrentPageAnnotations = clearCurrentPageAnnotations;
      (canvasRef.current as any).clearAllPDFAnnotations = clearAllPDFAnnotations;

      // Call parent callback with canvas ref
      onCanvasRef?.(canvasRef.current)
    }
  }, [undo, redo, clearCurrentPageAnnotations, clearAllPDFAnnotations, onCanvasRef])

  // Memoized cursor creation to prevent unnecessary re-creation
  const customCursor = useMemo(() => {
    if (!activeAnnotationTool) return 'default'

    const settings = getCurrentSettings()
    return createCircularCursor(
      settings.size,
      activeAnnotationTool === 'eraser'
    )
  }, [activeAnnotationTool, brushSize, selectedColor, getCurrentSettings])

  // Update cursor style when memoized cursor changes
  useEffect(() => {
    setCursorStyle(customCursor)
  }, [customCursor])

  // Handle touch events with proper preventDefault
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !activeAnnotationTool) return

    const handleTouchMove = (e: TouchEvent) => {
      if (isDrawing) {
        e.preventDefault() // This works with addEventListener
      }
    }

    const handleTouchStart = (e: TouchEvent) => {
      if (activeAnnotationTool) {
        e.preventDefault() // This works with addEventListener
      }
    }

    // Add passive: false to allow preventDefault
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false })
    canvas.addEventListener('touchstart', handleTouchStart, { passive: false })

    return () => {
      canvas.removeEventListener('touchmove', handleTouchMove)
      canvas.removeEventListener('touchstart', handleTouchStart)
    }
  }, [activeAnnotationTool, isDrawing])





  // Touch drawing handlers with performance optimization
  const drawTouch = useCallback((e: React.TouchEvent) => {
    if (!isDrawing || !activeAnnotationTool) return

    // Debounce touch events for better performance
    const now = Date.now()
    if (now - lastTouchTime.current < touchDebounceDelay) {
      return
    }
    lastTouchTime.current = now

    // Don't preventDefault here - it's handled by touch-none CSS class
    const point = getMousePos(e)
    setCurrentStroke(prev => [...prev, point])

    // Draw on canvas immediately for smooth experience
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const settings = getCurrentSettings()

    ctx.globalCompositeOperation = settings.globalCompositeOperation
    ctx.strokeStyle = settings.color
    ctx.lineWidth = Math.max(settings.size * scale, 2) // Minimum 2px for touch
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'

    if (currentStroke.length > 0) {
      const prevPoint = currentStroke[currentStroke.length - 1]

      // Transform coordinates for current rotation before scaling
      const transformedPrev = transformCoordinatesForRotation(
        prevPoint,
        rotation,
        width,
        height
      )
      const transformedCurrent = transformCoordinatesForRotation(
        point,
        rotation,
        width,
        height
      )

      // Scale transformed coordinates when drawing
      const scaledPrevX = transformedPrev.x * scale
      const scaledPrevY = transformedPrev.y * scale
      const scaledX = transformedCurrent.x * scale
      const scaledY = transformedCurrent.y * scale

      ctx.beginPath()
      ctx.moveTo(scaledPrevX, scaledPrevY)
      ctx.lineTo(scaledX, scaledY)
      ctx.stroke()
    }
  }, [isDrawing, activeAnnotationTool, currentStroke, getMousePos, getCurrentSettings, scale, touchDebounceDelay, rotation, width, height])

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 ${activeAnnotationTool ? 'pointer-events-auto' : 'pointer-events-none'}`}
      style={{
        cursor: activeAnnotationTool ? cursorStyle : 'default',
        zIndex: activeAnnotationTool ? 10 : 1,
        touchAction: activeAnnotationTool ? 'none' : 'auto' // Better touch handling
      }}
      onMouseDown={activeAnnotationTool ? startDrawing : undefined}
      onMouseMove={activeAnnotationTool ? draw : undefined}
      onMouseUp={activeAnnotationTool ? stopDrawing : undefined}
      onMouseLeave={activeAnnotationTool ? stopDrawing : undefined}
      onTouchStart={activeAnnotationTool ? startDrawingTouch : undefined}
      onTouchMove={activeAnnotationTool ? drawTouch : undefined}
      onTouchEnd={activeAnnotationTool ? stopDrawing : undefined}
      onTouchCancel={activeAnnotationTool ? stopDrawing : undefined}
    />
  )
}
