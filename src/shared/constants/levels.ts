/**
 * Shared Level Constants for JLPT4You
 * Centralizes all level configurations to eliminate duplication
 */

// JLPT Level configuration
export interface JLPTLevel {
  id: string
  name: string
  displayName: string
  description: string
  timeLimit: number
  questionCount: number
  passScore: number
  color: string
  colorForeground: string
  difficulty: 'beginner' | 'elementary' | 'intermediate' | 'advanced' | 'expert'
  order: number
}

// JLPT Levels configuration
export const JLPT_LEVELS: readonly JLPTLevel[] = [
  {
    id: 'n5',
    name: 'N5',
    displayName: 'JLPT N5',
    description: 'Beginner level - Basic Japanese understanding',
    timeLimit: 105, // 105 minutes
    questionCount: 80,
    passScore: 80,
    color: 'jlpt-n5',
    colorForeground: 'jlpt-n5-foreground',
    difficulty: 'beginner',
    order: 5
  },
  {
    id: 'n4',
    name: 'N4',
    displayName: 'JLPT N4',
    description: 'Elementary level - Basic conversational Japanese',
    timeLimit: 125, // 125 minutes
    questionCount: 90,
    passScore: 90,
    color: 'jlpt-n4',
    colorForeground: 'jlpt-n4-foreground',
    difficulty: 'elementary',
    order: 4
  },
  {
    id: 'n3',
    name: 'N3',
    displayName: 'JLPT N3',
    description: 'Intermediate level - Everyday Japanese understanding',
    timeLimit: 140, // 140 minutes
    questionCount: 95,
    passScore: 95,
    color: 'jlpt-n3',
    colorForeground: 'jlpt-n3-foreground',
    difficulty: 'intermediate',
    order: 3
  },
  {
    id: 'n2',
    name: 'N2',
    displayName: 'JLPT N2',
    description: 'Advanced level - Complex Japanese in various contexts',
    timeLimit: 155, // 155 minutes
    questionCount: 100,
    passScore: 100,
    color: 'jlpt-n2',
    colorForeground: 'jlpt-n2-foreground',
    difficulty: 'advanced',
    order: 2
  },
  {
    id: 'n1',
    name: 'N1',
    displayName: 'JLPT N1',
    description: 'Expert level - Advanced Japanese in academic and professional contexts',
    timeLimit: 170, // 170 minutes
    questionCount: 110,
    passScore: 100,
    color: 'jlpt-n1',
    colorForeground: 'jlpt-n1-foreground',
    difficulty: 'expert',
    order: 1
  }
] as const

// Driving test level configuration
export interface DrivingLevel {
  id: string
  name: string
  displayName: string
  description: string
  timeLimit: number
  questionCount: number
  passScore: number
  color: string
  colorForeground: string
  type: 'theory' | 'practical'
  order: number
}

// Driving test levels
export const DRIVING_LEVELS: readonly DrivingLevel[] = [
  {
    id: 'karimen',
    name: 'Karimen',
    displayName: 'Karimen (仮免)',
    description: 'Provisional license theory test',
    timeLimit: 30, // 30 minutes
    questionCount: 50,
    passScore: 45, // 90% pass rate
    color: 'driving-karimen',
    colorForeground: 'driving-karimen-foreground',
    type: 'theory',
    order: 1
  },
  {
    id: 'honmen',
    name: 'Honmen',
    displayName: 'Honmen (本免)',
    description: 'Full license theory test',
    timeLimit: 50, // 50 minutes
    questionCount: 95,
    passScore: 85, // ~90% pass rate
    color: 'driving-honmen',
    colorForeground: 'driving-honmen-foreground',
    type: 'theory',
    order: 2
  }
] as const

// Level utilities
export function getJLPTLevelById(id: string): JLPTLevel | undefined {
  return JLPT_LEVELS.find(level => level.id === id.toLowerCase())
}

export function getJLPTLevelByName(name: string): JLPTLevel | undefined {
  return JLPT_LEVELS.find(level => level.name.toLowerCase() === name.toLowerCase())
}

export function getDrivingLevelById(id: string): DrivingLevel | undefined {
  return DRIVING_LEVELS.find(level => level.id === id.toLowerCase())
}

export function isValidJLPTLevel(level: string): boolean {
  return JLPT_LEVELS.some(l => l.id === level.toLowerCase() || l.name.toLowerCase() === level.toLowerCase())
}

export function isValidDrivingLevel(level: string): boolean {
  return DRIVING_LEVELS.some(l => l.id === level.toLowerCase())
}

// Get levels sorted by difficulty (easiest to hardest)
export function getJLPTLevelsByDifficulty(): readonly JLPTLevel[] {
  return [...JLPT_LEVELS].sort((a, b) => b.order - a.order) // N5 to N1
}

// Get levels sorted by order (hardest to easiest for display)
export function getJLPTLevelsForDisplay(): readonly JLPTLevel[] {
  return [...JLPT_LEVELS].sort((a, b) => a.order - b.order) // N1 to N5
}

// Level card configuration for UI
export interface LevelCardConfig {
  id: string
  name: string
  description: string
  href: string
  bgColor: string
  textColor: string
  timeLimit?: number
  questionCount?: number
  icon?: string
}

// Generate level card configs for JLPT
export function generateJLPTLevelCards(
  baseHref: string,
  language: string = 'vn',
  translationKey: string = 'challenge.levels'
): LevelCardConfig[] {
  return JLPT_LEVELS.map(level => ({
    id: level.id,
    name: level.name,
    description: `${translationKey}.${level.id}`, // Translation key
    href: `/${language}${baseHref}/${level.id}`,
    bgColor: "bg-card",
    textColor: "text-foreground",
    timeLimit: level.timeLimit,
    questionCount: level.questionCount
  }))
}

// Generate level card configs for Driving
export function generateDrivingLevelCards(
  baseHref: string,
  language: string = 'vn',
  translationKey: string = 'driving.levels'
): LevelCardConfig[] {
  return DRIVING_LEVELS.map(level => ({
    id: level.id,
    name: level.displayName,
    description: `${translationKey}.${level.id}`, // Translation key
    href: `/${language}${baseHref}/${level.id}`,
    bgColor: "bg-card",
    textColor: "text-foreground",
    timeLimit: level.timeLimit,
    questionCount: level.questionCount,
    icon: 'Car'
  }))
}

// CSS color variables for levels (to be added to globals.css)
export const LEVEL_CSS_VARIABLES = `
/* JLPT Level Colors */
:root {
  --jlpt-n1: 0.02 0.00 0.15; /* Dark red */
  --jlpt-n1-foreground: 0.98 0.00 0.95;
  
  --jlpt-n2: 0.15 0.00 0.35; /* Orange */
  --jlpt-n2-foreground: 0.98 0.00 0.95;
  
  --jlpt-n3: 0.25 0.00 0.55; /* Yellow */
  --jlpt-n3-foreground: 0.15 0.00 0.15;
  
  --jlpt-n4: 0.45 0.00 0.65; /* Green */
  --jlpt-n4-foreground: 0.98 0.00 0.95;
  
  --jlpt-n5: 0.65 0.00 0.75; /* Blue */
  --jlpt-n5-foreground: 0.98 0.00 0.95;
  
  /* Driving Test Colors */
  --driving-karimen: 0.55 0.00 0.65; /* Light blue */
  --driving-karimen-foreground: 0.98 0.00 0.95;
  
  --driving-honmen: 0.35 0.00 0.45; /* Dark blue */
  --driving-honmen-foreground: 0.98 0.00 0.95;
}

[data-theme="dark"] {
  --jlpt-n1: 0.02 0.00 0.25;
  --jlpt-n2: 0.15 0.00 0.45;
  --jlpt-n3: 0.25 0.00 0.65;
  --jlpt-n4: 0.45 0.00 0.75;
  --jlpt-n5: 0.65 0.00 0.85;
  
  --driving-karimen: 0.55 0.00 0.75;
  --driving-honmen: 0.35 0.00 0.55;
}
`

// Export level types for type safety
export type JLPTLevelId = typeof JLPT_LEVELS[number]['id']
export type JLPTLevelName = typeof JLPT_LEVELS[number]['name']
export type DrivingLevelId = typeof DRIVING_LEVELS[number]['id']

// Level validation functions
export function validateLevelForFeature(level: string, feature: 'jlpt' | 'challenge' | 'driving'): boolean {
  switch (feature) {
    case 'jlpt':
    case 'challenge':
      return isValidJLPTLevel(level)
    case 'driving':
      return isValidDrivingLevel(level)
    default:
      return false
  }
}
