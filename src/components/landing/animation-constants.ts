// Shared animation constants for landing page components
// This prevents code duplication and ensures consistent animations

export const ANIMATION_DURATIONS = {
  fast: 0.3,
  normal: 0.6,
  slow: 0.8,
} as const

export const ANIMATION_DELAYS = {
  none: 0,
  short: 0.2,
  medium: 0.4,
  long: 0.8,
} as const

export const EASING = {
  easeOut: "easeOut",
  easeIn: "easeIn", 
  easeInOut: "easeInOut",
  spring: { type: "spring", stiffness: 100, damping: 10 },
} as const

// Common animation variants
export const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
}

export const fadeInLeft = {
  hidden: { opacity: 0, x: -30 },
  visible: { opacity: 1, x: 0 }
}

export const fadeInRight = {
  hidden: { opacity: 0, x: 30 },
  visible: { opacity: 1, x: 0 }
}

export const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 }
}

export const scaleIn = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: { opacity: 1, scale: 1 }
}

// Container variants for stagger animations
export const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.2
    }
  }
}

// Viewport settings for consistent scroll triggers
export const VIEWPORT_SETTINGS = {
  once: true,
  margin: "-100px"
} as const

export const VIEWPORT_SETTINGS_CLOSE = {
  once: true,
  margin: "-50px"
} as const
