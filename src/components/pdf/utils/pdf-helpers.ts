import { PDF_CONFIG } from '../config/pdf-config'

/**
 * PDF Helper Utilities
 * Shared logic for PDF viewer components to eliminate code duplication
 */

export interface ScaleOptions {
  /** Whether to apply mobile-specific scaling adjustments */
  useMobileScaling?: boolean
  /** Maximum scale limit for mobile */
  maxMobileScale?: number
  /** Mobile scale multiplier */
  mobileScaleMultiplier?: number
}

export interface DisplayDimensions {
  width: number
  height: number
}

/**
 * Calculate effective scale based on device type and options
 * Unified logic for both single and continuous PDF viewers
 */
export function getEffectiveScale(
  baseScale: number, 
  options: ScaleOptions = {}
): number {
  const {
    useMobileScaling = false,
    maxMobileScale = 2.0,
    mobileScaleMultiplier = 0.85
  } = options

  // Desktop - always use base scale
  if (typeof window !== 'undefined' && window.innerWidth >= PDF_CONFIG.MOBILE_BREAKPOINT) {
    return baseScale
  }

  // Mobile - apply scaling based on options
  if (useMobileScaling) {
    return Math.min(baseScale * mobileScaleMultiplier, maxMobileScale)
  }

  // Default mobile behavior - respect base scale
  return baseScale
}

/**
 * Calculate display dimensions for PDF pages
 * Handles both single page and multi-page scenarios
 */
export function getDisplayDimensions(
  baseScale: number,
  pageWidth: number,
  pageHeight: number,
  options: ScaleOptions = {}
): DisplayDimensions {
  const effectiveScale = getEffectiveScale(baseScale, options)
  
  return {
    width: pageWidth * effectiveScale,
    height: pageHeight * effectiveScale
  }
}

/**
 * Common container styles for PDF viewers
 * Eliminates style duplication between components
 */
export const PDF_CONTAINER_STYLES = {
  /** Main container style for PDF viewer */
  main: {
    minWidth: '100%',
    minHeight: '100%',
    width: 'fit-content' as const,
    height: 'fit-content' as const
  },
  
  /** Page container style */
  page: {
    maxWidth: 'none' as const,
    maxHeight: 'none' as const
  }
} as const

/**
 * Common CSS classes for PDF components
 */
export const PDF_CSS_CLASSES = {
  /** Main viewer container */
  viewer: 'flex-1 bg-muted relative pdf-viewer-mobile pdf-mobile-optimized overflow-auto',
  
  /** Centered content container */
  centeredContainer: 'flex items-center justify-center p-4',
  
  /** Page wrapper */
  pageWrapper: 'relative',
  
  /** Continuous viewer container */
  continuousContainer: 'flex flex-col items-center space-y-4'
} as const

/**
 * Check if current device is mobile based on screen width
 */
export function isMobileDevice(): boolean {
  if (typeof window === 'undefined') return false
  return window.innerWidth < PDF_CONFIG.MOBILE_BREAKPOINT
}

/**
 * Get mobile-optimized brush size
 * Ensures brush size is appropriate for touch input
 */
export function getMobileBrushSize(baseBrushSize: number): number {
  if (!isMobileDevice()) return baseBrushSize
  return Math.max(baseBrushSize, 3) // Minimum 3px for mobile
}

/**
 * Calculate touch area dimensions for navigation
 * Returns left, center, and right touch zones
 */
export function getTouchAreas(containerWidth: number) {
  const touchArea = containerWidth / 3
  
  return {
    left: { start: 0, end: touchArea },
    center: { start: touchArea, end: containerWidth - touchArea },
    right: { start: containerWidth - touchArea, end: containerWidth }
  }
}

/**
 * Validate and sanitize scale value
 * Ensures scale is within acceptable bounds
 */
export function validateScale(scale: number): number {
  return Math.max(
    PDF_CONFIG.MIN_SCALE,
    Math.min(scale, PDF_CONFIG.MAX_SCALE)
  )
}

/**
 * Color and brush size persistence utilities
 * Save and load selected colors and brush sizes from localStorage
 */
export const ColorStorage = {
  /** Storage keys for colors and brush sizes */
  KEYS: {
    SELECTED_COLOR: 'pdf_selected_color',
    CUSTOM_COLORS: 'pdf_custom_colors',
    TOOL_COLORS: 'pdf_tool_colors',
    TOOL_BRUSH_SIZES: 'pdf_tool_brush_sizes'
  },

  /** Save selected color to localStorage */
  saveSelectedColor(color: string, tool: 'draw' | 'highlight' | 'eraser'): void {
    try {
      const toolColors = this.getToolColors()
      toolColors[tool] = color
      localStorage.setItem(this.KEYS.TOOL_COLORS, JSON.stringify(toolColors))
      localStorage.setItem(this.KEYS.SELECTED_COLOR, color)
    } catch (error) {
      console.warn('Failed to save selected color:', error)
    }
  },

  /** Load selected color from localStorage */
  loadSelectedColor(tool: 'draw' | 'highlight' | 'eraser'): string {
    try {
      const toolColors = this.getToolColors()
      return toolColors[tool] || this.getDefaultColor(tool)
    } catch (error) {
      console.warn('Failed to load selected color:', error)
      return this.getDefaultColor(tool)
    }
  },

  /** Get tool-specific colors */
  getToolColors(): Record<string, string> {
    try {
      const stored = localStorage.getItem(this.KEYS.TOOL_COLORS)
      return stored ? JSON.parse(stored) : {}
    } catch (error) {
      return {}
    }
  },

  /** Save custom colors */
  saveCustomColors(colors: string[]): void {
    try {
      localStorage.setItem(this.KEYS.CUSTOM_COLORS, JSON.stringify(colors))
    } catch (error) {
      console.warn('Failed to save custom colors:', error)
    }
  },

  /** Load custom colors */
  loadCustomColors(): string[] {
    try {
      const stored = localStorage.getItem(this.KEYS.CUSTOM_COLORS)
      return stored ? JSON.parse(stored) : []
    } catch (error) {
      return []
    }
  },

  /** Get default color for tool */
  getDefaultColor(tool: 'draw' | 'highlight' | 'eraser'): string {
    switch (tool) {
      case 'highlight':
        return PDF_CONFIG.ANNOTATION_COLORS.HIGHLIGHT
      case 'eraser':
        return PDF_CONFIG.ANNOTATION_COLORS.ERASER
      case 'draw':
      default:
        return PDF_CONFIG.ANNOTATION_COLORS.PEN
    }
  },

  /** Save brush size for specific tool */
  saveBrushSize(size: number, tool: 'draw' | 'highlight' | 'eraser'): void {
    try {
      const toolBrushSizes = this.getToolBrushSizes()
      toolBrushSizes[tool] = size
      localStorage.setItem(this.KEYS.TOOL_BRUSH_SIZES, JSON.stringify(toolBrushSizes))
    } catch (error) {
      console.warn('Failed to save brush size:', error)
    }
  },

  /** Load brush size for specific tool */
  loadBrushSize(tool: 'draw' | 'highlight' | 'eraser'): number {
    try {
      const toolBrushSizes = this.getToolBrushSizes()
      return toolBrushSizes[tool] || this.getDefaultBrushSize(tool)
    } catch (error) {
      console.warn('Failed to load brush size:', error)
      return this.getDefaultBrushSize(tool)
    }
  },

  /** Get tool-specific brush sizes */
  getToolBrushSizes(): Record<string, number> {
    try {
      const stored = localStorage.getItem(this.KEYS.TOOL_BRUSH_SIZES)
      return stored ? JSON.parse(stored) : {}
    } catch (error) {
      return {}
    }
  },

  /** Get default brush size for tool */
  getDefaultBrushSize(tool: 'draw' | 'highlight' | 'eraser'): number {
    switch (tool) {
      case 'highlight':
        return 4 // Larger for highlight
      case 'eraser':
        return 6 // Largest for eraser
      case 'draw':
      default:
        return PDF_CONFIG.DEFAULT_BRUSH_SIZE // 2
    }
  }
}
