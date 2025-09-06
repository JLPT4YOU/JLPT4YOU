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
  rotation: number, // Add rotation parameter
  options: ScaleOptions = {}
): DisplayDimensions {
  const effectiveScale = getEffectiveScale(baseScale, options)

  // Get dimensions after rotation
  const rotatedDimensions = getRotatedDimensions(pageWidth, pageHeight, rotation)

  return {
    width: rotatedDimensions.width * effectiveScale,
    height: rotatedDimensions.height * effectiveScale
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
 * PDF coordinate transformation utilities
 * Handles conversion between screen coordinates and PDF coordinates
 * with support for rotation and scaling
 */

import { logger } from '../../../lib/logger'

export interface Point {
  x: number
  y: number
}

/**
 * Transform coordinates based on PDF rotation
 * @param point Original point coordinates
 * @param rotation Rotation angle in degrees (0, 90, 180, 270)
 * @param width PDF page width
 * @param height PDF page height
 * @returns Transformed coordinates
 */
export function transformCoordinatesForRotation(
  point: Point,
  rotation: number,
  width: number,
  height: number
): Point {
  // Normalize rotation to 0-360 range
  const normalizedRotation = ((rotation % 360) + 360) % 360

  switch (normalizedRotation) {
    case 0:
      // No rotation
      return { x: point.x, y: point.y }

    case 90:
      // 90 degrees clockwise: (x,y) -> (height-y, x)
      return {
        x: height - point.y,
        y: point.x
      }

    case 180:
      // 180 degrees: (x,y) -> (width-x, height-y)
      return {
        x: width - point.x,
        y: height - point.y
      }

    case 270:
      // 270 degrees clockwise: (x,y) -> (y, width-x)
      return {
        x: point.y,
        y: width - point.x
      }

    default:
      // For non-standard rotations, return original coordinates
      logger.warn('Unsupported rotation angle', { rotation, point })
      return { x: point.x, y: point.y }
  }
}

/**
 * Reverse transform coordinates (from rotated back to original)
 * Used when loading saved annotations that were created in a different rotation
 * @param point Rotated point coordinates
 * @param rotation Rotation angle in degrees (0, 90, 180, 270)
 * @param width PDF page width
 * @param height PDF page height
 * @returns Original coordinates
 */
export function reverseTransformCoordinatesForRotation(
  point: Point,
  rotation: number,
  width: number,
  height: number
): Point {
  // Normalize rotation to 0-360 range
  const normalizedRotation = ((rotation % 360) + 360) % 360

  switch (normalizedRotation) {
    case 0:
      // No rotation
      return { x: point.x, y: point.y }

    case 90:
      // Reverse 90 degrees: (x,y) -> (y, height-x)
      // This is the inverse of: (x,y) -> (height-y, x)
      return {
        x: point.y,
        y: height - point.x
      }

    case 180:
      // Reverse 180 degrees: (x,y) -> (width-x, height-y)
      return {
        x: width - point.x,
        y: height - point.y
      }

    case 270:
      // Reverse 270 degrees: (x,y) -> (width-y, x)
      // This is the inverse of: (x,y) -> (y, width-x)
      return {
        x: width - point.y,
        y: point.x
      }

    default:
      // For non-standard rotations, return original coordinates
      return { x: point.x, y: point.y }
  }
}

/**
 * Get effective dimensions after rotation
 * When PDF is rotated 90/270 degrees, width and height are swapped
 * @param width Original width
 * @param height Original height
 * @param rotation Rotation angle in degrees
 * @returns Effective dimensions after rotation
 */
export function getRotatedDimensions(
  width: number,
  height: number,
  rotation: number
): { width: number; height: number } {
  const normalizedRotation = ((rotation % 360) + 360) % 360

  if (normalizedRotation === 90 || normalizedRotation === 270) {
    // Swap width and height for 90/270 degree rotations
    return { width: height, height: width }
  }

  // No dimension change for 0/180 degree rotations
  return { width, height }
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
      logger.warn('Failed to save selected color', { error, color, tool })
    }
  },

  /** Load selected color from localStorage */
  loadSelectedColor(tool: 'draw' | 'highlight' | 'eraser'): string {
    try {
      const toolColors = this.getToolColors()
      return toolColors[tool] || this.getDefaultColor(tool)
    } catch (error) {
      logger.warn('Failed to load selected color', { error, tool })
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
      logger.warn('Failed to save custom colors', { error, colorsCount: colors.length })
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
      logger.warn('Failed to save brush size', { error, tool, size })
    }
  },

  /** Load brush size for specific tool */
  loadBrushSize(tool: 'draw' | 'highlight' | 'eraser'): number {
    try {
      const toolBrushSizes = this.getToolBrushSizes()
      return toolBrushSizes[tool] || this.getDefaultBrushSize(tool)
    } catch (error) {
      logger.warn('Failed to load brush size', { error, tool })
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
