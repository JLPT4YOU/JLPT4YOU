// Standardized spacing system for landing page sections
// This ensures consistent vertical rhythm across all components

export const SECTION_SPACING = {
  // Standard section padding
  default: "py-16 md:py-20 lg:py-24",
  
  // Compact section padding (for dense content)
  compact: "py-12 md:py-16 lg:py-20",
  
  // Large section padding (for hero/important sections)
  large: "py-20 md:py-24 lg:py-32",
  
  // Small section padding (for minor sections)
  small: "py-8 md:py-12 lg:py-16",
} as const

export const CONTENT_SPACING = {
  // Spacing between major content blocks
  section: "mb-12 md:mb-16",
  
  // Spacing between content elements
  element: "mb-6 md:mb-8",
  
  // Spacing between small elements
  small: "mb-4 md:mb-6",
  
  // Spacing between text elements
  text: "mb-3 md:mb-4",
} as const

export const GRID_SPACING = {
  // Gap between grid items
  default: "gap-6 md:gap-8",
  compact: "gap-4 md:gap-6",
  large: "gap-8 md:gap-12",
} as const

// Usage examples:
// <section className={SECTION_SPACING.default}>
// <div className={CONTENT_SPACING.section}>
// <div className={`grid grid-cols-2 ${GRID_SPACING.default}`}>
