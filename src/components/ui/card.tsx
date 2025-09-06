import * as React from "react"
import { cn } from "@/lib/utils"

export type CardSize = 'sm' | 'md' | 'lg' | 'none'
export type CardRadius = 'md' | 'lg' | 'xl' | '2xl'
export type CardElevation = 'none' | 'sm' | 'md'

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  interactive?: boolean
  size?: CardSize
  radius?: CardRadius
  elevation?: CardElevation
}

const sizeClasses: Record<CardSize, string> = {
  none: "",
  sm: "p-4",
  md: "p-6",
  lg: "p-8",
}

const radiusClasses: Record<CardRadius, string> = {
  md: "rounded-md",
  lg: "rounded-lg",
  xl: "rounded-xl",
  "2xl": "rounded-2xl",
}

const elevationClasses: Record<CardElevation, string> = {
  none: "shadow-none",
  sm: "shadow-sm",
  md: "shadow-md",
}

const Card = React.forwardRef<
  HTMLDivElement,
  CardProps
>(({ className, interactive = false, size = 'none', radius, elevation, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      // base surface & text
      "border bg-card text-card-foreground",
      // defaults for backward compatibility if not provided
      !radius && "rounded-lg",
      !elevation && "shadow-sm",
      // variants
      radius && radiusClasses[radius],
      elevation && elevationClasses[elevation],
      sizeClasses[size],
      interactive && "hover-card cursor-pointer",
      className
    )}
    {...props}
  />
))
Card.displayName = "Card"

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
))
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "text-2xl font-semibold leading-none tracking-tight",
      className
    )}
    {...props}
  />
))
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
))
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  />
))
CardFooter.displayName = "CardFooter"

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }
