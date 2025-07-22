/**
 * Responsive Container Components for Mobile-First Design
 * Optimized for Core Web Vitals and international accessibility
 */

import Image from 'next/image'
import { cn } from '@/lib/utils'
import { ReactNode } from 'react'

// Responsive container with mobile-first approach
interface ResponsiveContainerProps {
  children: ReactNode
  className?: string
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full'
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl'
  center?: boolean
}

export function ResponsiveContainer({
  children,
  className,
  maxWidth = 'lg',
  padding = 'md',
  center = true
}: ResponsiveContainerProps) {
  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md', 
    lg: 'max-w-4xl',
    xl: 'max-w-6xl',
    '2xl': 'max-w-7xl',
    full: 'max-w-full'
  }

  const paddingClasses = {
    none: '',
    sm: 'px-4 py-2',
    md: 'px-4 py-4 sm:px-6 sm:py-6',
    lg: 'px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10',
    xl: 'px-4 py-8 sm:px-6 sm:py-10 lg:px-8 lg:py-12'
  }

  return (
    <div
      className={cn(
        'w-full',
        maxWidthClasses[maxWidth],
        paddingClasses[padding],
        center && 'mx-auto',
        className
      )}
    >
      {children}
    </div>
  )
}

// Responsive grid with mobile-first breakpoints
interface ResponsiveGridProps {
  children: ReactNode
  className?: string
  cols?: {
    default: number
    sm?: number
    md?: number
    lg?: number
    xl?: number
  }
  gap?: 'sm' | 'md' | 'lg' | 'xl'
}

export function ResponsiveGrid({
  children,
  className,
  cols = { default: 1, sm: 2, md: 3, lg: 4 },
  gap = 'md'
}: ResponsiveGridProps) {
  const gapClasses = {
    sm: 'gap-2',
    md: 'gap-4',
    lg: 'gap-6',
    xl: 'gap-8'
  }

  const gridCols = `grid-cols-${cols.default}`
  const smCols = cols.sm ? `sm:grid-cols-${cols.sm}` : ''
  const mdCols = cols.md ? `md:grid-cols-${cols.md}` : ''
  const lgCols = cols.lg ? `lg:grid-cols-${cols.lg}` : ''
  const xlCols = cols.xl ? `xl:grid-cols-${cols.xl}` : ''

  return (
    <div
      className={cn(
        'grid',
        gridCols,
        smCols,
        mdCols,
        lgCols,
        xlCols,
        gapClasses[gap],
        className
      )}
    >
      {children}
    </div>
  )
}

// Responsive text with optimal reading experience
interface ResponsiveTextProps {
  children: ReactNode
  className?: string
  size?: 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl'
  weight?: 'normal' | 'medium' | 'semibold' | 'bold'
  color?: 'default' | 'muted' | 'accent' | 'destructive'
  align?: 'left' | 'center' | 'right'
  responsive?: boolean
}

export function ResponsiveText({
  children,
  className,
  size = 'base',
  weight = 'normal',
  color = 'default',
  align = 'left',
  responsive = true
}: ResponsiveTextProps) {
  const sizeClasses = responsive ? {
    xs: 'text-xs sm:text-sm',
    sm: 'text-sm sm:text-base',
    base: 'text-base sm:text-lg',
    lg: 'text-lg sm:text-xl',
    xl: 'text-xl sm:text-2xl',
    '2xl': 'text-2xl sm:text-3xl',
    '3xl': 'text-3xl sm:text-4xl lg:text-5xl'
  } : {
    xs: 'text-xs',
    sm: 'text-sm',
    base: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl',
    '2xl': 'text-2xl',
    '3xl': 'text-3xl'
  }

  const weightClasses = {
    normal: 'body-text',
    medium: 'interactive-text',
    semibold: 'heading-secondary',
    bold: 'heading-primary'
  }

  const colorClasses = {
    default: 'text-foreground',
    muted: 'text-muted-foreground',
    accent: 'text-accent-foreground',
    destructive: 'text-destructive'
  }

  const alignClasses = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right'
  }

  return (
    <div
      className={cn(
        sizeClasses[size],
        weightClasses[weight],
        colorClasses[color],
        alignClasses[align],
        'leading-relaxed', // Better readability
        className
      )}
    >
      {children}
    </div>
  )
}

// Responsive image with lazy loading and optimization
interface ResponsiveImageProps {
  src: string
  alt: string
  className?: string
  width?: number
  height?: number
  priority?: boolean
  sizes?: string
  objectFit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down'
}

export function ResponsiveImage({
  src,
  alt,
  className,
  width,
  height,
  priority = false,
  sizes = '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw',
  objectFit = 'cover'
}: ResponsiveImageProps) {
  const objectFitClasses = {
    contain: 'object-contain',
    cover: 'object-cover',
    fill: 'object-fill',
    none: 'object-none',
    'scale-down': 'object-scale-down'
  }

  return (
    <Image
      src={src}
      alt={alt}
      width={width}
      height={height}
      priority={priority}
      sizes={sizes}
      className={cn(
        'w-full h-auto',
        objectFitClasses[objectFit],
        'transition-opacity duration-300',
        className
      )}
      style={{
        aspectRatio: width && height ? `${width}/${height}` : undefined
      }}
    />
  )
}

// Responsive card with mobile-optimized spacing
interface ResponsiveCardProps {
  children: ReactNode
  className?: string
  padding?: 'sm' | 'md' | 'lg'
  shadow?: 'none' | 'sm' | 'md' | 'lg'
  border?: boolean
  hover?: boolean
}

export function ResponsiveCard({
  children,
  className,
  padding = 'md',
  shadow = 'sm',
  border = true,
  hover = false
}: ResponsiveCardProps) {
  const paddingClasses = {
    sm: 'p-3 sm:p-4',
    md: 'p-4 sm:p-6',
    lg: 'p-6 sm:p-8'
  }

  const shadowClasses = {
    none: '',
    sm: 'shadow-sm',
    md: 'shadow-md',
    lg: 'shadow-lg'
  }

  return (
    <div
      className={cn(
        'bg-background rounded-lg',
        paddingClasses[padding],
        shadowClasses[shadow],
        border && 'border border-border',
        hover && 'hover-card',
        'focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2',
        className
      )}
    >
      {children}
    </div>
  )
}

// Responsive button with touch-friendly sizing
interface ResponsiveButtonProps {
  children: ReactNode
  className?: string
  size?: 'sm' | 'md' | 'lg'
  variant?: 'default' | 'outline' | 'ghost'
  fullWidth?: boolean
  onClick?: () => void
  disabled?: boolean
  type?: 'button' | 'submit' | 'reset'
}

export function ResponsiveButton({
  children,
  className,
  size = 'md',
  variant = 'default',
  fullWidth = false,
  onClick,
  disabled = false,
  type = 'button'
}: ResponsiveButtonProps) {
  const sizeClasses = {
    sm: 'px-3 py-2 text-sm min-h-[36px] sm:min-h-[32px]', // Touch-friendly on mobile
    md: 'px-4 py-2 text-base min-h-[44px] sm:min-h-[40px]',
    lg: 'px-6 py-3 text-lg min-h-[48px] sm:min-h-[44px]'
  }

  const variantClasses = {
    default: 'bg-primary text-primary-foreground hover-primary',
    outline: 'border border-input bg-background text-foreground hover-muted',
    ghost: 'text-foreground hover-ghost'
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'inline-flex items-center justify-center rounded-md font-medium',
        'focus-ring disabled:pointer-events-none disabled:opacity-50',
        'touch-manipulation', // Optimize for touch devices
        sizeClasses[size],
        variantClasses[variant],
        fullWidth && 'w-full',
        className
      )}
    >
      {children}
    </button>
  )
}
