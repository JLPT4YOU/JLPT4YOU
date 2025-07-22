/**
 * Shared Level Card Component
 * Standardizes level card UI across all features (JLPT, Challenge, Driving)
 * Eliminates styling duplication and ensures consistent user experience
 */

"use client"

import { cn } from "@/lib/utils"
import { LevelCardConfig } from "@/shared/constants/levels"
import { 
  BookOpen, 
  Car, 
  GraduationCap, 
  Trophy, 
  Clock, 
  FileText,
  Target,
  Zap
} from "lucide-react"

// Icon mapping for different level types
const ICON_MAP = {
  BookOpen,
  Car,
  GraduationCap,
  Trophy,
  Clock,
  FileText,
  Target,
  Zap
} as const

// Level card variants
export type LevelCardVariant = 'default' | 'compact' | 'detailed' | 'minimal'

// Level card props
export interface LevelCardProps {
  level: LevelCardConfig
  variant?: LevelCardVariant
  isSelected?: boolean
  isDisabled?: boolean
  showStats?: boolean
  onClick?: () => void
  className?: string
}

export function LevelCard({
  level,
  variant = 'default',
  isSelected = false,
  isDisabled = false,
  showStats = false,
  onClick,
  className = ""
}: LevelCardProps) {
  // Get icon component
  const IconComponent = level.icon && level.icon in ICON_MAP 
    ? ICON_MAP[level.icon as keyof typeof ICON_MAP]
    : null

  // Base card classes
  const baseClasses = cn(
    "group cursor-pointer bg-muted/10 rounded-2xl text-center",
    "border border-border/20 focus-ring",
    {
      // Selection state
      "ring-2 ring-primary ring-offset-2 bg-muted/30": isSelected,

      // Disabled state
      "opacity-50 cursor-not-allowed": isDisabled,

      // Interactive states - improved hover effects
      "hover-card-scale": !isDisabled && variant === 'detailed',
      "hover-card": !isDisabled && variant !== 'detailed' && variant !== 'minimal',
      "hover-brightness-light": !isDisabled && variant === 'minimal'
    },
    className
  )

  // Variant-specific classes and content
  const variantConfig = getVariantConfig(variant)

  return (
    <div 
      className={cn(baseClasses, variantConfig.containerClass)}
      onClick={!isDisabled ? onClick : undefined}
    >
      {/* Level Icon/Badge */}
      <div className={cn(
        "mx-auto mb-4 flex items-center justify-center transition-transform duration-200",
        variantConfig.iconContainerClass,
        level.bgColor,
        {
          "group-hover:scale-105": !isDisabled && variant !== 'minimal'
        }
      )}>
        {IconComponent ? (
          <IconComponent className={cn(variantConfig.iconClass, level.textColor)} />
        ) : (
          <span className={cn(variantConfig.textClass, level.textColor)}>
            {level.name}
          </span>
        )}
        
        {/* Custom badge for special levels */}
        {level.id === 'n1' && variant === 'detailed' && (
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-500 rounded-full border-2 border-background" />
        )}
      </div>

      {/* Level Content */}
      <div className={variantConfig.contentClass}>
        {/* Level Name */}
        <h3 className={cn(
          "font-semibold text-foreground mb-2",
          variantConfig.titleClass
        )}>
          {level.name}
        </h3>

        {/* Level Description */}
        {variant !== 'minimal' && (
          <p className={cn(
            "text-muted-foreground leading-relaxed",
            variantConfig.descriptionClass
          )}>
            {level.description}
          </p>
        )}

        {/* Level Stats */}
        {showStats && (level.timeLimit || level.questionCount) && (
          <div className={cn(
            "mt-4 pt-4 border-t border-border/30",
            variantConfig.statsClass
          )}>
            <div className="flex justify-center gap-4 text-xs text-muted-foreground">
              {level.timeLimit && (
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>{formatTime(level.timeLimit)}</span>
                </div>
              )}
              {level.questionCount && (
                <div className="flex items-center gap-1">
                  <FileText className="w-3 h-3" />
                  <span>{level.questionCount} câu</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Progress indicator for selected state */}
        {isSelected && variant === 'detailed' && (
          <div className="mt-4">
            <div className="w-full bg-muted rounded-full h-1">
              <div className="bg-primary h-1 rounded-full w-full transition-all duration-500" />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// Variant configurations
function getVariantConfig(variant: LevelCardVariant) {
  switch (variant) {
    case 'compact':
      return {
        containerClass: "p-4 md:p-6",
        iconContainerClass: "w-12 h-12 rounded-2xl relative",
        iconClass: "w-6 h-6",
        textClass: "text-lg font-bold",
        contentClass: "space-y-2",
        titleClass: "text-sm md:text-base",
        descriptionClass: "text-xs md:text-sm line-clamp-2",
        statsClass: "text-xs"
      }
    
    case 'detailed':
      return {
        containerClass: "p-6 md:p-8 h-full",
        iconContainerClass: "w-20 h-20 rounded-2xl relative shadow-lg",
        iconClass: "w-10 h-10",
        textClass: "text-2xl font-bold",
        contentClass: "space-y-4",
        titleClass: "text-lg md:text-xl",
        descriptionClass: "text-sm md:text-base",
        statsClass: "text-sm"
      }
    
    case 'minimal':
      return {
        containerClass: "p-3 md:p-4",
        iconContainerClass: "w-10 h-10 rounded-full",
        iconClass: "w-5 h-5",
        textClass: "text-base font-semibold",
        contentClass: "space-y-1",
        titleClass: "text-sm",
        descriptionClass: "text-xs line-clamp-1",
        statsClass: "text-xs"
      }
    
    default: // 'default'
      return {
        containerClass: "p-6 md:p-8",
        iconContainerClass: "w-16 h-16 rounded-full relative",
        iconClass: "w-8 h-8",
        textClass: "text-xl md:text-2xl font-bold",
        contentClass: "space-y-3",
        titleClass: "text-base md:text-lg",
        descriptionClass: "text-sm",
        statsClass: "text-sm"
      }
  }
}

// Specialized level card components
export function JLPTLevelCard({
  level,
  isSelected,
  onClick,
  showStats = true,
  className
}: Omit<LevelCardProps, 'variant'>) {
  return (
    <LevelCard
      level={level}
      variant="default"
      isSelected={isSelected}
      onClick={onClick}
      showStats={showStats}
      className={className}
    />
  )
}

export function ChallengeLevelCard({
  level,
  isSelected,
  onClick,
  className
}: Omit<LevelCardProps, 'variant' | 'showStats'>) {
  return (
    <LevelCard
      level={level}
      variant="compact"
      isSelected={isSelected}
      onClick={onClick}
      showStats={false}
      className={className}
    />
  )
}

export function DrivingLevelCard({
  level,
  isSelected,
  onClick,
  showStats = true,
  className
}: Omit<LevelCardProps, 'variant'>) {
  return (
    <LevelCard
      level={level}
      variant="detailed"
      isSelected={isSelected}
      onClick={onClick}
      showStats={showStats}
      className={className}
    />
  )
}

// Utility functions
function formatTime(minutes: number): string {
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`
  }
  return `${minutes}m`
}

// Level card skeleton for loading states
export function LevelCardSkeleton({ 
  variant = 'default',
  className = ""
}: {
  variant?: LevelCardVariant
  className?: string
}) {
  const variantConfig = getVariantConfig(variant)
  
  return (
    <div className={cn(
      "bg-muted/10 rounded-2xl border border-border/20 animate-pulse",
      variantConfig.containerClass,
      className
    )}>
      {/* Icon skeleton */}
      <div className={cn(
        "mx-auto mb-4 bg-muted rounded-full",
        variantConfig.iconContainerClass
      )} />
      
      {/* Content skeleton */}
      <div className={variantConfig.contentClass}>
        {/* Title skeleton */}
        <div className="h-4 bg-muted rounded w-3/4 mx-auto mb-2" />
        
        {/* Description skeleton */}
        {variant !== 'minimal' && (
          <div className="space-y-2">
            <div className="h-3 bg-muted rounded w-full" />
            <div className="h-3 bg-muted rounded w-2/3 mx-auto" />
          </div>
        )}
      </div>
    </div>
  )
}

// Level card grid container for consistent spacing
export function LevelCardGrid({
  children,
  variant = 'default',
  className = ""
}: {
  children: React.ReactNode
  variant?: LevelCardVariant
  className?: string
}) {
  const gridClasses = {
    default: "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5",
    compact: "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5",
    detailed: "grid-cols-1 md:grid-cols-2",
    minimal: "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6"
  }
  
  const gapClasses = {
    default: "gap-6 md:gap-8",
    compact: "gap-4 md:gap-6",
    detailed: "gap-8 md:gap-10",
    minimal: "gap-3 md:gap-4"
  }
  
  return (
    <div className={cn(
      "grid",
      gridClasses[variant],
      gapClasses[variant],
      className
    )}>
      {children}
    </div>
  )
}
