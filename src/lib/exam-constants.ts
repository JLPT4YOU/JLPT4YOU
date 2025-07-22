/**
 * Exam-related constants and configuration
 * Centralized location for all exam timeouts, limits, and storage keys
 */

// Exam timeouts (in minutes)
export const EXAM_TIMEOUTS = {
  // JLPT exam timeouts by level
  JLPT: {
    N1: 60,
    N2: 55,
    N3: 50,
    N4: 45,
    N5: 40,
    DEFAULT: 60
  },
  // Driving exam timeouts
  DRIVING: {
    KARIMEN: 45,
    HONMEN: 50,
    DEFAULT: 45
  },
  // Challenge mode timeout
  CHALLENGE: 90,
  // Custom timeout limits
  CUSTOM: {
    MIN: 10,
    MAX: 180,
    DEFAULT: 60
  }
} as const

// Exam limits and constraints
export const EXAM_LIMITS = {
  // Maximum violations before auto-submit
  MAX_VIOLATIONS: 3,
  // Maximum questions per exam
  MAX_QUESTIONS_PER_EXAM: 100,
  // Minimum time between state saves (ms)
  MIN_TIME_BETWEEN_SAVES: 500,
  // Debounce delay for state saving (ms)
  SAVE_STATE_DEBOUNCE: 1000,
  // Maximum attempts for scroll restoration
  MAX_SCROLL_RESTORE_ATTEMPTS: 10,
  // Delay between scroll restore attempts (ms)
  SCROLL_RESTORE_DELAY: 50
} as const

// Exam storage keys
export const EXAM_STORAGE_KEYS = {
  // Exam state storage
  EXAM_STATE_PREFIX: 'exam-state-',
  TIMER_STATE_PREFIX: 'timer-state-',
  VIOLATIONS_PREFIX: 'violations-',
  // Specific storage keys
  SCROLL_POSITION: 'landing-scroll-position',
  FULLSCREEN_STATE: 'fullscreen-state',
  ANTI_CHEAT_WARNINGS: 'anti-cheat-warnings'
} as const

// Question counts by exam type and level
export const QUESTION_COUNTS = {
  JLPT: {
    N1: 60,
    N2: 55,
    N3: 50,
    N4: 45,
    N5: 40
  },
  DRIVING: {
    KARIMEN: 50,
    HONMEN: 95
  },
  CHALLENGE: {
    DEFAULT: 30
  }
} as const

// Exam modes
export const EXAM_MODES = {
  PRACTICE: 'practice',
  CHALLENGE: 'challenge',
  OFFICIAL: 'official'
} as const

export type ExamMode = typeof EXAM_MODES[keyof typeof EXAM_MODES]

// Exam types
export const EXAM_TYPES = {
  JLPT: 'jlpt',
  DRIVING: 'driving',
  CHALLENGE: 'challenge'
} as const

export type ExamType = typeof EXAM_TYPES[keyof typeof EXAM_TYPES]

// Time mode options
export const TIME_MODES = {
  DEFAULT: 'default',
  CUSTOM: 'custom',
  UNLIMITED: 'unlimited'
} as const

export type TimeMode = typeof TIME_MODES[keyof typeof TIME_MODES]

// Anti-cheat violation types
export const VIOLATION_TYPES = {
  TAB_SWITCH: 'tab_switch',
  WINDOW_BLUR: 'window_blur',
  FULLSCREEN_EXIT: 'fullscreen_exit',
  COPY_PASTE: 'copy_paste',
  RIGHT_CLICK: 'right_click',
  KEYBOARD_SHORTCUT: 'keyboard_shortcut'
} as const

export type ViolationType = typeof VIOLATION_TYPES[keyof typeof VIOLATION_TYPES]

// Exam status types
export const EXAM_STATUS = {
  NOT_STARTED: 'not_started',
  IN_PROGRESS: 'in_progress',
  PAUSED: 'paused',
  COMPLETED: 'completed',
  SUBMITTED: 'submitted',
  EXPIRED: 'expired'
} as const

export type ExamStatus = typeof EXAM_STATUS[keyof typeof EXAM_STATUS]

// Performance thresholds
export const PERFORMANCE_THRESHOLDS = {
  EXCELLENT: 0.9,
  GOOD: 0.75,
  AVERAGE: 0.6,
  POOR: 0.4
} as const

// Helper functions
export function getExamTimeout(examType: ExamType, level?: string): number {
  switch (examType) {
    case EXAM_TYPES.JLPT:
      if (level && level.toUpperCase() in EXAM_TIMEOUTS.JLPT) {
        return EXAM_TIMEOUTS.JLPT[level.toUpperCase() as keyof typeof EXAM_TIMEOUTS.JLPT]
      }
      return EXAM_TIMEOUTS.JLPT.DEFAULT
    case EXAM_TYPES.DRIVING:
      if (level && level.toUpperCase() in EXAM_TIMEOUTS.DRIVING) {
        return EXAM_TIMEOUTS.DRIVING[level.toUpperCase() as keyof typeof EXAM_TIMEOUTS.DRIVING]
      }
      return EXAM_TIMEOUTS.DRIVING.DEFAULT
    case EXAM_TYPES.CHALLENGE:
      return EXAM_TIMEOUTS.CHALLENGE
    default:
      return EXAM_TIMEOUTS.CUSTOM.DEFAULT
  }
}

export function getQuestionCount(examType: ExamType, level?: string): number {
  switch (examType) {
    case EXAM_TYPES.JLPT:
      if (level && level.toUpperCase() in QUESTION_COUNTS.JLPT) {
        return QUESTION_COUNTS.JLPT[level.toUpperCase() as keyof typeof QUESTION_COUNTS.JLPT]
      }
      return QUESTION_COUNTS.JLPT.N5
    case EXAM_TYPES.DRIVING:
      if (level && level.toUpperCase() in QUESTION_COUNTS.DRIVING) {
        return QUESTION_COUNTS.DRIVING[level.toUpperCase() as keyof typeof QUESTION_COUNTS.DRIVING]
      }
      return QUESTION_COUNTS.DRIVING.KARIMEN
    case EXAM_TYPES.CHALLENGE:
      return QUESTION_COUNTS.CHALLENGE.DEFAULT
    default:
      return 30
  }
}

export function getExamStorageKey(prefix: string, examTitle: string): string {
  return `${prefix}${examTitle}`
}

export function isValidExamMode(mode: string): mode is ExamMode {
  return Object.values(EXAM_MODES).includes(mode as ExamMode)
}

export function isValidExamType(type: string): type is ExamType {
  return Object.values(EXAM_TYPES).includes(type as ExamType)
}