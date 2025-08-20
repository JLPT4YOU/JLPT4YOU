/**
 * PDF Reader Configuration
 * Centralized configuration for PDF viewer components
 */

export const PDF_CONFIG = {
  // Default page dimensions (A4)
  DEFAULT_PAGE_WIDTH: 595,
  DEFAULT_PAGE_HEIGHT: 842,
  
  // Annotation settings
  MAX_HISTORY_SIZE: 50,
  DEFAULT_BRUSH_SIZE: 2,
  HIGHLIGHT_BRUSH_MULTIPLIER: 3,
  
  // Colors
  ANNOTATION_COLORS: {
    HIGHLIGHT: '#FFF9B0',
    PEN: '#000000',
    ERASER: '#FFFFFF',
    DEFAULT: '#FF0000'
  },
  
  // Performance settings
  ANNOTATION_SAVE_DELAY: 1000, // ms
  CANVAS_DEBOUNCE_DELAY: 16, // ~60fps
  
  // Mobile settings
  MOBILE_BREAKPOINT: 640,
  TABLET_BREAKPOINT: 768,
  DESKTOP_BREAKPOINT: 1024,
  
  // Touch settings
  MIN_TOUCH_TARGET: 48, // px
  TOUCH_TOLERANCE: 10, // px
  
  // Zoom settings
  MIN_SCALE: 0.5,
  MAX_SCALE: 3.0,
  SCALE_STEP: 0.2,
  
  // Storage settings
  STORAGE_VERSION: '1.0',
  STORAGE_PREFIX: 'pdf_annotations_',
  
  // Performance limits
  MAX_STROKES_PER_PAGE: 1000,
  MAX_POINTS_PER_STROKE: 500,
  MAX_STORAGE_SIZE_MB: 10, // Maximum localStorage usage for PDF annotations
  STORAGE_CLEANUP_THRESHOLD: 0.8, // Clean up when 80% of limit is reached
  
  // Error retry settings
  MAX_RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000, // ms
  
  // Accessibility
  ARIA_LABELS: {
    TOOLBAR: 'PDF Toolbar',
    ZOOM_IN: 'Phóng to',
    ZOOM_OUT: 'Thu nhỏ',
    ROTATE: 'Xoay trang',
    HIGHLIGHT: 'Công cụ tô sáng',
    DRAW: 'Công cụ vẽ',
    ERASER: 'Công cụ xóa',
    UNDO: 'Hoàn tác',
    REDO: 'Làm lại',
    CLEAR: 'Xóa tất cả',
    THUMBNAILS: 'Hiển thị thumbnails',
    PAGE_NAVIGATION: 'Điều hướng trang'
  }
} as const

export type PDFConfig = typeof PDF_CONFIG

// Helper functions
export const getPDFConfig = () => PDF_CONFIG

export const isMobile = () => {
  if (typeof window === 'undefined') return false
  return window.innerWidth < PDF_CONFIG.MOBILE_BREAKPOINT
}

export const isTablet = () => {
  if (typeof window === 'undefined') return false
  return window.innerWidth >= PDF_CONFIG.MOBILE_BREAKPOINT && 
         window.innerWidth < PDF_CONFIG.DESKTOP_BREAKPOINT
}

export const isDesktop = () => {
  if (typeof window === 'undefined') return false
  return window.innerWidth >= PDF_CONFIG.DESKTOP_BREAKPOINT
}

export const getResponsiveConfig = () => {
  if (isMobile()) {
    return {
      showThumbnails: false,
      brushSize: Math.max(PDF_CONFIG.DEFAULT_BRUSH_SIZE, 3),
      touchTargetSize: PDF_CONFIG.MIN_TOUCH_TARGET
    }
  }
  
  if (isTablet()) {
    return {
      showThumbnails: true,
      brushSize: PDF_CONFIG.DEFAULT_BRUSH_SIZE,
      touchTargetSize: PDF_CONFIG.MIN_TOUCH_TARGET
    }
  }
  
  return {
    showThumbnails: true,
    brushSize: PDF_CONFIG.DEFAULT_BRUSH_SIZE,
    touchTargetSize: 40
  }
}
