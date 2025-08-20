import { useReducer, useCallback } from 'react'
import { PDFState, AnnotationTool, UsePDFStateReturn } from '../types'

// Get initial showThumbnails based on screen size
const getInitialShowThumbnails = () => {
  if (typeof window === 'undefined') return false // SSR safe
  return window.innerWidth >= 768 // Only show on desktop by default
}

const initialState: PDFState = {
  numPages: 0,
  pageNumber: 1,
  scale: 1.0,
  rotation: 0,
  loading: true,
  error: null,
  workerReady: false,
  activeAnnotationTool: null,
  showThumbnails: getInitialShowThumbnails(),
  showAnnotationPanel: true,
  isMobileView: false,
  canUndo: false,
  canRedo: false,
  viewMode: 'single', // 'single' or 'continuous'
  pdfDocument: null,
}

// Action types for reducer
type PDFAction =
  | { type: 'SET_NUM_PAGES'; payload: number }
  | { type: 'SET_PAGE_NUMBER'; payload: number }
  | { type: 'SET_SCALE'; payload: number }
  | { type: 'SET_ROTATION'; payload: number }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_WORKER_READY'; payload: boolean }
  | { type: 'SET_ACTIVE_ANNOTATION_TOOL'; payload: AnnotationTool }
  | { type: 'SET_SHOW_THUMBNAILS'; payload: boolean }
  | { type: 'SET_SHOW_ANNOTATION_PANEL'; payload: boolean }
  | { type: 'SET_IS_MOBILE_VIEW'; payload: boolean }
  | { type: 'SET_CAN_UNDO'; payload: boolean }
  | { type: 'SET_CAN_REDO'; payload: boolean }
  | { type: 'SET_VIEW_MODE'; payload: 'single' | 'continuous' }
  | { type: 'SET_PDF_DOCUMENT'; payload: any | null }

// Reducer function
function pdfReducer(state: PDFState, action: PDFAction): PDFState {
  switch (action.type) {
    case 'SET_NUM_PAGES':
      return { ...state, numPages: action.payload }
    case 'SET_PAGE_NUMBER':
      return { ...state, pageNumber: action.payload }
    case 'SET_SCALE':
      return { ...state, scale: action.payload }
    case 'SET_ROTATION':
      return { ...state, rotation: action.payload }
    case 'SET_LOADING':
      return { ...state, loading: action.payload }
    case 'SET_ERROR':
      return { ...state, error: action.payload }
    case 'SET_WORKER_READY':
      return { ...state, workerReady: action.payload }
    case 'SET_ACTIVE_ANNOTATION_TOOL':
      return { ...state, activeAnnotationTool: action.payload }
    case 'SET_SHOW_THUMBNAILS':
      return { ...state, showThumbnails: action.payload }
    case 'SET_SHOW_ANNOTATION_PANEL':
      return { ...state, showAnnotationPanel: action.payload }
    case 'SET_IS_MOBILE_VIEW':
      return { ...state, isMobileView: action.payload }
    case 'SET_CAN_UNDO':
      return { ...state, canUndo: action.payload }
    case 'SET_CAN_REDO':
      return { ...state, canRedo: action.payload }
    case 'SET_VIEW_MODE':
      return { ...state, viewMode: action.payload }
    case 'SET_PDF_DOCUMENT':
      return { ...state, pdfDocument: action.payload }
    default:
      return state
  }
}

export function usePDFState(): UsePDFStateReturn {
  const [state, dispatch] = useReducer(pdfReducer, initialState)

  // Create optimized setter functions using dispatch
  const setNumPages = useCallback((numPages: number) => {
    dispatch({ type: 'SET_NUM_PAGES', payload: numPages })
  }, [])

  const setPageNumber = useCallback((pageNumber: number) => {
    dispatch({ type: 'SET_PAGE_NUMBER', payload: pageNumber })
  }, [])

  const setScale = useCallback((scale: number) => {
    dispatch({ type: 'SET_SCALE', payload: scale })
  }, [])

  const setRotation = useCallback((rotation: number) => {
    dispatch({ type: 'SET_ROTATION', payload: rotation })
  }, [])

  const setLoading = useCallback((loading: boolean) => {
    dispatch({ type: 'SET_LOADING', payload: loading })
  }, [])

  const setError = useCallback((error: string | null) => {
    dispatch({ type: 'SET_ERROR', payload: error })
  }, [])

  const setWorkerReady = useCallback((workerReady: boolean) => {
    dispatch({ type: 'SET_WORKER_READY', payload: workerReady })
  }, [])

  const setActiveAnnotationTool = useCallback((activeAnnotationTool: AnnotationTool) => {
    dispatch({ type: 'SET_ACTIVE_ANNOTATION_TOOL', payload: activeAnnotationTool })
  }, [])

  const setShowThumbnails = useCallback((showThumbnails: boolean) => {
    dispatch({ type: 'SET_SHOW_THUMBNAILS', payload: showThumbnails })
  }, [])

  const setShowAnnotationPanel = useCallback((showAnnotationPanel: boolean) => {
    dispatch({ type: 'SET_SHOW_ANNOTATION_PANEL', payload: showAnnotationPanel })
  }, [])

  const setIsMobileView = useCallback((isMobileView: boolean) => {
    dispatch({ type: 'SET_IS_MOBILE_VIEW', payload: isMobileView })
  }, [])

  const setCanUndo = useCallback((canUndo: boolean) => {
    dispatch({ type: 'SET_CAN_UNDO', payload: canUndo })
  }, [])

  const setCanRedo = useCallback((canRedo: boolean) => {
    dispatch({ type: 'SET_CAN_REDO', payload: canRedo })
  }, [])

  const setViewMode = useCallback((viewMode: 'single' | 'continuous') => {
    dispatch({ type: 'SET_VIEW_MODE', payload: viewMode })
  }, [])

  const setPdfDocument = useCallback((pdfDocument: any | null) => {
    dispatch({ type: 'SET_PDF_DOCUMENT', payload: pdfDocument })
  }, [])

  return {
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
  }
}
