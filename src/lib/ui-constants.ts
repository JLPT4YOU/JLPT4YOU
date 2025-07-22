/**
 * UI-related constants and configuration
 * Centralized location for animation durations, breakpoints, and UI timing
 */

// Animation durations (in milliseconds)
export const ANIMATION_DURATIONS = {
  // Modal animations
  MODAL: {
    ENTER: 200,
    EXIT: 150,
    BACKDROP: 100
  },
  // Sidebar animations
  SIDEBAR: {
    SLIDE: 300,
    FADE: 200
  },
  // Toast notifications
  TOAST: {
    SHOW: 200,
    HIDE: 150,
    AUTO_DISMISS: 3000
  },
  // Page transitions
  PAGE: {
    ENTER: 300,
    EXIT: 200
  },
  // Component transitions
  COMPONENT: {
    FADE: 200,
    SLIDE: 250,
    SCALE: 150,
    BOUNCE: 300
  },
  // Loading states
  LOADING: {
    SPINNER: 1000,
    SKELETON: 1500,
    PULSE: 2000
  }
} as const

// Debounce delays (in milliseconds)
export const DEBOUNCE_DELAYS = {
  // Search input
  SEARCH: 300,
  // Auto-save functionality
  SAVE: 1000,
  // Window resize events
  RESIZE: 100,
  // Scroll events
  SCROLL: 50,
  // Input validation
  VALIDATION: 500,
  // API calls
  API: 300
} as const

// Responsive breakpoints (in pixels)
export const BREAKPOINTS = {
  // Mobile devices
  MOBILE: 768,
  // Tablet devices
  TABLET: 1024,
  // Desktop devices
  DESKTOP: 1280,
  // Large desktop
  LARGE_DESKTOP: 1536,
  // Extra small (for very small phones)
  XS: 480,
  // Small mobile
  SM: 640,
  // Medium (tablet)
  MD: 768,
  // Large (desktop)
  LG: 1024,
  // Extra large
  XL: 1280,
  // 2X large
  XXL: 1536
} as const

// Z-index layers
export const Z_INDEX = {
  // Base layer
  BASE: 0,
  // Content layer
  CONTENT: 10,
  // Sticky elements
  STICKY: 100,
  // Fixed elements
  FIXED: 200,
  // Dropdown menus
  DROPDOWN: 1000,
  // Modals
  MODAL: 2000,
  // Tooltips
  TOOLTIP: 3000,
  // Toast notifications
  TOAST: 4000,
  // Loading overlays
  OVERLAY: 5000,
  // Maximum z-index
  MAX: 9999
} as const

// Spacing values (in pixels or rem units)
export const SPACING = {
  // Extra small
  XS: 4,
  // Small
  SM: 8,
  // Medium
  MD: 16,
  // Large
  LG: 24,
  // Extra large
  XL: 32,
  // 2X large
  XXL: 48,
  // 3X large
  XXXL: 64
} as const

// Border radius values
export const BORDER_RADIUS = {
  // No radius
  NONE: 0,
  // Small radius
  SM: 4,
  // Default radius
  DEFAULT: 8,
  // Medium radius
  MD: 12,
  // Large radius
  LG: 16,
  // Extra large radius
  XL: 24,
  // Full radius (circle)
  FULL: 9999
} as const

// Shadow levels
export const SHADOWS = {
  // No shadow
  NONE: 'none',
  // Small shadow
  SM: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  // Default shadow
  DEFAULT: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
  // Medium shadow
  MD: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  // Large shadow
  LG: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  // Extra large shadow
  XL: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  // 2X large shadow
  XXL: '0 25px 50px -12px rgb(0 0 0 / 0.25)'
} as const

// Opacity levels
export const OPACITY = {
  // Transparent
  TRANSPARENT: 0,
  // Very light
  LIGHT: 0.1,
  // Light
  MEDIUM_LIGHT: 0.25,
  // Medium
  MEDIUM: 0.5,
  // Medium dark
  MEDIUM_DARK: 0.75,
  // Dark
  DARK: 0.9,
  // Opaque
  OPAQUE: 1
} as const

// Component sizes
export const COMPONENT_SIZES = {
  // Button sizes
  BUTTON: {
    SM: { height: 32, padding: '8px 12px', fontSize: 14 },
    MD: { height: 40, padding: '10px 16px', fontSize: 16 },
    LG: { height: 48, padding: '12px 20px', fontSize: 18 }
  },
  // Input sizes
  INPUT: {
    SM: { height: 32, padding: '8px 12px', fontSize: 14 },
    MD: { height: 40, padding: '10px 16px', fontSize: 16 },
    LG: { height: 48, padding: '12px 20px', fontSize: 18 }
  },
  // Icon sizes
  ICON: {
    XS: 12,
    SM: 16,
    MD: 20,
    LG: 24,
    XL: 32,
    XXL: 48
  }
} as const

// Scroll behavior constants
export const SCROLL = {
  // Smooth scroll duration
  SMOOTH_DURATION: 500,
  // Scroll offset for fixed headers
  OFFSET: 80,
  // Scroll threshold for showing back-to-top
  BACK_TO_TOP_THRESHOLD: 400,
  // Scroll restoration delay
  RESTORATION_DELAY: 150,
  // Maximum scroll restoration attempts
  MAX_RESTORATION_ATTEMPTS: 10
} as const

// Loading states
export const LOADING_STATES = {
  // Skeleton loading
  SKELETON: {
    LINES: [100, 80, 90, 70],
    ANIMATION_DURATION: 1500
  },
  // Spinner sizes
  SPINNER: {
    SM: 16,
    MD: 24,
    LG: 32,
    XL: 48
  }
} as const

// Validation timing
export const VALIDATION = {
  // Debounce delay for real-time validation
  DEBOUNCE: 300,
  // Delay before showing error messages
  ERROR_DELAY: 500,
  // Delay before hiding success messages
  SUCCESS_HIDE_DELAY: 3000
} as const

// Helper functions
export function getAnimationDuration(type: keyof typeof ANIMATION_DURATIONS, variant?: string): number {
  const category = ANIMATION_DURATIONS[type]
  if (typeof category === 'number') {
    return category
  }
  if (variant && variant in category) {
    return category[variant as keyof typeof category]
  }
  return Object.values(category)[0] as number
}

export function getBreakpointValue(breakpoint: keyof typeof BREAKPOINTS): number {
  return BREAKPOINTS[breakpoint]
}

export function isAboveBreakpoint(width: number, breakpoint: keyof typeof BREAKPOINTS): boolean {
  return width >= BREAKPOINTS[breakpoint]
}

export function isBelowBreakpoint(width: number, breakpoint: keyof typeof BREAKPOINTS): boolean {
  return width < BREAKPOINTS[breakpoint]
}

export function getZIndex(layer: keyof typeof Z_INDEX): number {
  return Z_INDEX[layer]
}

export function getSpacing(size: keyof typeof SPACING): number {
  return SPACING[size]
}

export function getBorderRadius(size: keyof typeof BORDER_RADIUS): number {
  return BORDER_RADIUS[size]
}