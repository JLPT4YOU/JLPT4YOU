// JLPT Levels
export const JLPT_LEVELS = {
  N5: 'N5',
  N4: 'N4', 
  N3: 'N3',
  N2: 'N2',
  N1: 'N1'
} as const

export type JLPTLevel = keyof typeof JLPT_LEVELS

// JLPT Level Information
export const JLPT_LEVEL_INFO = {
  N5: {
    name: 'N5 - Sơ cấp',
    description: 'Hiểu được tiếng Nhật cơ bản',
    kanji: 100,
    vocabulary: 800,
    color: 'bg-green-500'
  },
  N4: {
    name: 'N4 - Sơ cấp cao',
    description: 'Hiểu được tiếng Nhật cơ bản ở mức độ cao hơn',
    kanji: 300,
    vocabulary: 1500,
    color: 'bg-blue-500'
  },
  N3: {
    name: 'N3 - Trung cấp',
    description: 'Hiểu được tiếng Nhật ở mức độ trung bình',
    kanji: 650,
    vocabulary: 3750,
    color: 'bg-yellow-500'
  },
  N2: {
    name: 'N2 - Trung cấp cao',
    description: 'Hiểu được tiếng Nhật ở mức độ khá cao',
    kanji: 1000,
    vocabulary: 6000,
    color: 'bg-orange-500'
  },
  N1: {
    name: 'N1 - Cao cấp',
    description: 'Hiểu được tiếng Nhật ở mức độ cao',
    kanji: 2000,
    vocabulary: 10000,
    color: 'bg-red-500'
  }
} as const

// Question Types
export const QUESTION_TYPES = {
  VOCABULARY: 'vocabulary',
  GRAMMAR: 'grammar',
  KANJI: 'kanji',
  READING: 'reading',
  LISTENING: 'listening'
} as const

export type QuestionType = typeof QUESTION_TYPES[keyof typeof QUESTION_TYPES]

// Study Modes
export const STUDY_MODES = {
  FLASHCARD: 'flashcard',
  QUIZ: 'quiz',
  PRACTICE_TEST: 'practice_test',
  REVIEW: 'review'
} as const

export type StudyMode = typeof STUDY_MODES[keyof typeof STUDY_MODES]

// App Routes
export const ROUTES = {
  HOME: '/',
  STUDY: '/study',
  PRACTICE: '/practice',
  PROGRESS: '/progress',
  SETTINGS: '/settings'
} as const

// Local Storage Keys
export const STORAGE_KEYS = {
  USER_PROGRESS: 'jlpt4you_user_progress',
  STUDY_SETTINGS: 'jlpt4you_study_settings',
  THEME: 'jlpt4you_theme',
  AUTH_TOKEN: 'jlpt4you_auth_token',
  USER_DATA: 'jlpt4you_user_data'
} as const

// Re-export exam and UI constants for convenience
export {
  EXAM_TIMEOUTS,
  EXAM_LIMITS,
  EXAM_STORAGE_KEYS,
  QUESTION_COUNTS,
  EXAM_MODES,
  EXAM_TYPES,
  TIME_MODES,
  VIOLATION_TYPES,
  EXAM_STATUS,
  PERFORMANCE_THRESHOLDS,
  type ExamMode,
  type ExamType,
  type TimeMode,
  type ViolationType,
  type ExamStatus,
  getExamTimeout,
  getQuestionCount,
  getExamStorageKey,
  isValidExamMode,
  isValidExamType
} from './exam-constants'

export {
  ANIMATION_DURATIONS,
  DEBOUNCE_DELAYS,
  BREAKPOINTS,
  Z_INDEX,
  SPACING,
  BORDER_RADIUS,
  SHADOWS,
  OPACITY,
  COMPONENT_SIZES,
  SCROLL,
  LOADING_STATES,
  VALIDATION,
  getAnimationDuration,
  getBreakpointValue,
  isAboveBreakpoint,
  isBelowBreakpoint,
  getZIndex,
  getSpacing,
  getBorderRadius
} from './ui-constants'

export {
  ERROR_CODES,
  ERROR_MESSAGES_VN,
  ERROR_MESSAGES_EN,
  ERROR_MESSAGES_JP,
  ERROR_SEVERITY,
  ERROR_CATEGORIES,
  type ErrorSeverity,
  type ErrorCategory,
  getErrorMessage,
  isAuthError,
  isExamError,
  isNetworkError,
  isValidationError,
  getErrorSeverity,
  getErrorCategory
} from './error-constants'
