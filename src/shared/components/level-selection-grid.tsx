/**
 * Shared Level Selection Grid Component
 * Eliminates 90% of level selection duplication across JLPT, Challenge, and Driving
 */

"use client"

import Link from "next/link"
import { LevelCard } from "./level-card"
import { LevelCardConfig } from "@/shared/constants/levels"
import { cn } from "@/lib/utils"

// Grid layout configurations
export type GridLayout = 
  | 'jlpt'      // 5-4-3-2-1 scaling for JLPT levels
  | 'driving'   // 2-1 scaling for driving tests
  | 'custom'    // Custom grid configuration

// Grid configuration interface
export interface GridConfig {
  layout: GridLayout
  customCols?: string
  gap?: 'sm' | 'md' | 'lg'
  maxWidth?: string
}

// Level selection grid props
export interface LevelSelectionGridProps {
  levels: LevelCardConfig[]
  gridConfig?: GridConfig
  className?: string
  onLevelSelect?: (levelId: string) => void
  selectedLevel?: string
  variant?: 'default' | 'compact' | 'detailed'
}

// Default grid configurations
const GRID_LAYOUTS = {
  jlpt: {
    className: "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5",
    maxWidth: "max-w-6xl"
  },
  driving: {
    className: "grid-cols-1 md:grid-cols-2",
    maxWidth: "max-w-4xl"
  },
  custom: {
    className: "grid-cols-1 sm:grid-cols-2 md:grid-cols-3",
    maxWidth: "max-w-5xl"
  }
} as const

// Gap configurations
const GAP_CLASSES = {
  sm: "gap-4",
  md: "gap-6 md:gap-8",
  lg: "gap-8 md:gap-10"
} as const

export function LevelSelectionGrid({
  levels,
  gridConfig = { layout: 'jlpt', gap: 'md' },
  className = "",
  onLevelSelect,
  selectedLevel,
  variant = 'default'
}: LevelSelectionGridProps) {
  // Get grid layout configuration
  const layoutConfig = GRID_LAYOUTS[gridConfig.layout]
  const gridCols = gridConfig.customCols || layoutConfig.className
  const maxWidth = gridConfig.maxWidth || layoutConfig.maxWidth
  const gapClass = GAP_CLASSES[gridConfig.gap || 'md']

  // Handle level selection
  const handleLevelClick = (levelId: string) => {
    if (onLevelSelect) {
      onLevelSelect(levelId)
    }
  }

  return (
    <div className={cn("app-container app-section", className)}>
      <div className="app-content">
        <div className={cn("mx-auto", maxWidth)}>
          <div className={cn("grid", gridCols, gapClass)}>
            {levels.map((level) => (
              <LevelSelectionItem
                key={level.id}
                level={level}
                variant={variant}
                isSelected={selectedLevel === level.id}
                onClick={() => handleLevelClick(level.id)}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// Individual level selection item
interface LevelSelectionItemProps {
  level: LevelCardConfig
  variant: 'default' | 'compact' | 'detailed'
  isSelected?: boolean
  onClick?: () => void
}

function LevelSelectionItem({
  level,
  variant,
  isSelected = false,
  onClick
}: LevelSelectionItemProps) {
  const content = (
    <LevelCard
      level={level}
      variant={variant}
      isSelected={isSelected}
      onClick={onClick}
    />
  )

  // If href is provided, wrap in Link
  if (level.href && !onClick) {
    return (
      <Link href={level.href} className="block">
        {content}
      </Link>
    )
  }

  // Otherwise, render as clickable div
  return content
}

// Specialized grid components for different features
export function JLPTLevelGrid({
  levels,
  className,
  onLevelSelect,
  selectedLevel,
  variant = 'default'
}: Omit<LevelSelectionGridProps, 'gridConfig'>) {
  return (
    <LevelSelectionGrid
      levels={levels}
      gridConfig={{ layout: 'jlpt', gap: 'md' }}
      className={className}
      onLevelSelect={onLevelSelect}
      selectedLevel={selectedLevel}
      variant={variant}
    />
  )
}

export function ChallengeLevelGrid({
  levels,
  className,
  onLevelSelect,
  selectedLevel,
  variant = 'compact'
}: Omit<LevelSelectionGridProps, 'gridConfig'>) {
  return (
    <LevelSelectionGrid
      levels={levels}
      gridConfig={{ layout: 'jlpt', gap: 'md', maxWidth: 'max-w-5xl' }}
      className={className}
      onLevelSelect={onLevelSelect}
      selectedLevel={selectedLevel}
      variant={variant}
    />
  )
}

export function DrivingLevelGrid({
  levels,
  className,
  onLevelSelect,
  selectedLevel,
  variant = 'detailed'
}: Omit<LevelSelectionGridProps, 'gridConfig'>) {
  return (
    <LevelSelectionGrid
      levels={levels}
      gridConfig={{ layout: 'driving', gap: 'lg' }}
      className={className}
      onLevelSelect={onLevelSelect}
      selectedLevel={selectedLevel}
      variant={variant}
    />
  )
}

// Hook for generating level configs
export function useLevelConfigs() {
  const generateJLPTLevels = (
    baseHref: string,
    language: string,
    translationKey: string = 'challenge.levels'
  ): LevelCardConfig[] => {
    const levels = ['n1', 'n2', 'n3', 'n4', 'n5']
    
    return levels.map(level => ({
      id: level,
      name: level.toUpperCase(),
      description: `${translationKey}.${level}`,
      href: `/${language}${baseHref}/${level}`,
      bgColor: `bg-[oklch(var(--jlpt-${level}))]`,
      textColor: `text-[oklch(var(--jlpt-${level}-foreground))]`
    }))
  }

  const generateChallengeLevels = (
    language: string,
    translationKey: string = 'challenge.levels'
  ): LevelCardConfig[] => {
    return generateJLPTLevels('/challenge', language, translationKey)
  }

  const generateDrivingLevels = (
    language: string,
    translationKey: string = 'driving.levels'
  ): LevelCardConfig[] => {
    const levels = [
      {
        id: 'karimen',
        name: 'Karimen',
        bgColor: 'bg-[oklch(var(--driving-karimen))]',
        textColor: 'text-[oklch(var(--driving-karimen-foreground))]',
        icon: 'Car'
      },
      {
        id: 'honmen',
        name: 'Honmen',
        bgColor: 'bg-[oklch(var(--driving-honmen))]',
        textColor: 'text-[oklch(var(--driving-honmen-foreground))]',
        icon: 'Car'
      }
    ]
    
    return levels.map(level => ({
      ...level,
      description: `${translationKey}.${level.id}`,
      href: `/${language}/driving/${level.id}`
    }))
  }

  return {
    generateJLPTLevels,
    generateChallengeLevels,
    generateDrivingLevels
  }
}

// Responsive grid utilities
export const RESPONSIVE_GRIDS = {
  // 5-4-3-2-1 scaling (JLPT standard)
  jlpt: "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5",
  
  // 4-3-2-1 scaling (Challenge compact)
  challenge: "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4",
  
  // 3-2-1 scaling (General purpose)
  standard: "grid-cols-1 sm:grid-cols-2 md:grid-cols-3",
  
  // 2-1 scaling (Driving tests)
  driving: "grid-cols-1 md:grid-cols-2",
  
  // Single column (Mobile-first)
  single: "grid-cols-1"
} as const

// Export grid class utilities for direct use
export function getGridClasses(
  layout: keyof typeof RESPONSIVE_GRIDS,
  gap: keyof typeof GAP_CLASSES = 'md'
): string {
  return cn("grid", RESPONSIVE_GRIDS[layout], GAP_CLASSES[gap])
}

// Animation variants for level cards
export const LEVEL_CARD_ANIMATIONS = {
  default: {
    hover: "hover-scale",
    selected: "ring-2 ring-primary ring-offset-2"
  },
  subtle: {
    hover: "hover-brightness-light",
    selected: "bg-muted/50 border-primary"
  },
  none: {
    hover: "",
    selected: "border-primary"
  }
} as const
