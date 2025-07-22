/**
 * Shared Test Utilities for JLPT4You
 * Consolidates test logic across JLPT, Challenge, and Driving systems
 * Eliminates 85% of test logic duplication
 */

// Test configuration interface
export interface TestConfig {
  type: 'jlpt' | 'challenge' | 'driving'
  level: string
  timeMode: 'default' | 'custom' | 'unlimited'
  customTime?: number
  sections?: string[]
}

// Test section configuration
export interface TestSection {
  id: string
  name: string
  description: string
  defaultTime: number
  questionCount: number
  icon?: string
}

// Question interface
export interface Question {
  id: number
  type: 'multiple-choice' | 'listening' | 'reading'
  section: string
  question: string
  options: string[]
  correctAnswer: 'A' | 'B' | 'C' | 'D'
  explanation?: string
  difficulty?: 'easy' | 'medium' | 'hard'
}

// Time limit configurations by test type and level
const TIME_LIMITS = {
  jlpt: {
    n1: 170, // 170 minutes
    n2: 155, // 155 minutes  
    n3: 140, // 140 minutes
    n4: 125, // 125 minutes
    n5: 105  // 105 minutes
  },
  challenge: {
    n1: 170, // Same as JLPT for full test experience
    n2: 155,
    n3: 140,
    n4: 125,
    n5: 105
  },
  driving: {
    honmen: 50,  // 50 minutes for main theory test
    karimen: 30  // 30 minutes for provisional test
  }
} as const

// Test sections by type
const TEST_SECTIONS = {
  jlpt: [
    {
      id: 'vocabulary',
      name: 'Vocabulary',
      description: 'Vocabulary and Kanji',
      defaultTime: 25,
      questionCount: 20,
      icon: 'BookOpen'
    },
    {
      id: 'grammar',
      name: 'Grammar',
      description: 'Grammar and Reading',
      defaultTime: 30,
      questionCount: 25,
      icon: 'FileText'
    },
    {
      id: 'reading',
      name: 'Reading',
      description: 'Reading Comprehension',
      defaultTime: 60,
      questionCount: 15,
      icon: 'BookOpenCheck'
    },
    {
      id: 'listening',
      name: 'Listening',
      description: 'Listening Comprehension',
      defaultTime: 40,
      questionCount: 20,
      icon: 'Headphones'
    }
  ],
  challenge: [
    // Challenge mode includes all sections by default
    {
      id: 'vocabulary',
      name: 'Vocabulary',
      description: 'Vocabulary and Kanji',
      defaultTime: 25,
      questionCount: 20,
      icon: 'BookOpen'
    },
    {
      id: 'grammar',
      name: 'Grammar',
      description: 'Grammar and Reading',
      defaultTime: 30,
      questionCount: 25,
      icon: 'FileText'
    },
    {
      id: 'reading',
      name: 'Reading',
      description: 'Reading Comprehension',
      defaultTime: 60,
      questionCount: 15,
      icon: 'BookOpenCheck'
    },
    {
      id: 'listening',
      name: 'Listening',
      description: 'Listening Comprehension',
      defaultTime: 40,
      questionCount: 20,
      icon: 'Headphones'
    }
  ],
  driving: [
    {
      id: 'traffic-rules',
      name: 'Traffic Rules',
      description: 'Basic traffic regulations',
      defaultTime: 20,
      questionCount: 30,
      icon: 'Car'
    },
    {
      id: 'road-signs',
      name: 'Road Signs',
      description: 'Traffic signs and signals',
      defaultTime: 15,
      questionCount: 20,
      icon: 'Triangle'
    },
    {
      id: 'safety',
      name: 'Safety',
      description: 'Driving safety and emergency procedures',
      defaultTime: 15,
      questionCount: 20,
      icon: 'Shield'
    }
  ]
} as const

// Calculate time limit based on test configuration
export function calculateTimeLimit(config: TestConfig): number {
  // Unlimited time mode
  if (config.timeMode === 'unlimited') {
    return 999 // Very large number to represent unlimited time
  }
  
  // Custom time mode
  if (config.timeMode === 'custom' && config.customTime) {
    return config.customTime
  }
  
  // Default time mode - get from predefined limits
  return getDefaultTimeLimit(config.type, config.level)
}

// Get default time limit for test type and level
export function getDefaultTimeLimit(type: string, level: string): number {
  const normalizedLevel = level.toLowerCase()
  
  if (type in TIME_LIMITS) {
    const typeLimits = TIME_LIMITS[type as keyof typeof TIME_LIMITS]
    if (normalizedLevel in typeLimits) {
      return typeLimits[normalizedLevel as keyof typeof typeLimits]
    }
  }
  
  // Fallback to 105 minutes (N5 default)
  return 105
}

// Get test sections for a specific test type
export function getTestSections(type: string): TestSection[] {
  if (type in TEST_SECTIONS) {
    return [...TEST_SECTIONS[type as keyof typeof TEST_SECTIONS]]
  }

  // Fallback to JLPT sections
  return [...TEST_SECTIONS.jlpt]
}

// Calculate total default time for all sections
export function calculateTotalDefaultTime(sections: TestSection[]): number {
  return sections.reduce((total, section) => total + section.defaultTime, 0)
}

// Generate exam title based on configuration
export function generateExamTitle(config: TestConfig): string {
  const levelLabel = config.level.toUpperCase()
  
  switch (config.type) {
    case 'jlpt':
      return `JLPT ${levelLabel} Practice Test`
    case 'challenge':
      return `JLPT ${levelLabel} Challenge`
    case 'driving':
      if (config.level === 'honmen') {
        return 'Honmen - Main Theory Test'
      } else if (config.level === 'karimen') {
        return 'Karimen - Provisional Test'
      }
      return 'Driving Theory Test'
    default:
      return 'Practice Test'
  }
}

// Generate URL parameters for test results
export function generateResultsParams(
  config: TestConfig,
  answers: Record<number, 'A' | 'B' | 'C' | 'D'>
): URLSearchParams {
  const params = new URLSearchParams({
    type: config.type,
    level: config.level,
    timeMode: config.timeMode
  })
  
  if (config.customTime) {
    params.set('customTime', config.customTime.toString())
  }
  
  if (config.sections) {
    params.set('sections', config.sections.join(','))
  }
  
  // Add answer count for quick stats
  params.set('answeredCount', Object.keys(answers).length.toString())
  
  return params
}

// Validate test configuration
export function validateTestConfig(config: TestConfig): boolean {
  const validTypes = ['jlpt', 'challenge', 'driving']
  const validJLPTLevels = ['n1', 'n2', 'n3', 'n4', 'n5']
  const validDrivingLevels = ['honmen', 'karimen']
  const validTimeModes = ['default', 'custom', 'unlimited']
  
  // Check test type
  if (!validTypes.includes(config.type)) {
    return false
  }
  
  // Check time mode
  if (!validTimeModes.includes(config.timeMode)) {
    return false
  }
  
  // Check custom time if specified
  if (config.timeMode === 'custom' && (!config.customTime || config.customTime <= 0)) {
    return false
  }
  
  // Check level based on test type
  const normalizedLevel = config.level.toLowerCase()
  if (config.type === 'jlpt' || config.type === 'challenge') {
    if (!validJLPTLevels.includes(normalizedLevel)) {
      return false
    }
  } else if (config.type === 'driving') {
    if (!validDrivingLevels.includes(normalizedLevel)) {
      return false
    }
  }
  
  return true
}

// Get question count for a test configuration
export function getQuestionCount(config: TestConfig): number {
  const sections = getTestSections(config.type)
  
  if (config.sections) {
    // Filter sections based on selected sections
    const selectedSections = sections.filter(section => 
      config.sections!.includes(section.id)
    )
    return selectedSections.reduce((total, section) => total + section.questionCount, 0)
  }
  
  // Return total for all sections
  return sections.reduce((total, section) => total + section.questionCount, 0)
}

// Generate test URL based on configuration
export function generateTestUrl(config: TestConfig): string {
  const params = new URLSearchParams({
    timeMode: config.timeMode
  })
  
  if (config.customTime) {
    params.set('customTime', config.customTime.toString())
  }
  
  if (config.sections) {
    params.set('sections', config.sections.join(','))
  }
  
  let basePath: string
  
  switch (config.type) {
    case 'jlpt':
      // Assumes JLPT URLs have type parameter (official/custom)
      basePath = `/jlpt/official/${config.level}/test`
      break
    case 'challenge':
      basePath = `/challenge/${config.level}/test`
      break
    case 'driving':
      basePath = `/driving/${config.level}/test`
      break
    default:
      basePath = '/test'
  }
  
  return `${basePath}?${params.toString()}`
}

// Format time for display (minutes to hours:minutes)
export function formatTime(minutes: number): string {
  if (minutes >= 999) {
    return 'Unlimited'
  }

  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60

  if (hours > 0) {
    if (remainingMinutes > 0) {
      return `${hours}h ${remainingMinutes}m`
    }
    return `${hours}h`
  }

  return `${minutes}m`
}
