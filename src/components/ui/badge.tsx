import * as React from "react"
import { cn } from "@/lib/utils"

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'destructive' | 'outline'
}

function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  const variantClasses = {
    default: "border-transparent bg-primary text-primary-foreground hover-primary",
    secondary: "border-transparent bg-secondary text-secondary-foreground hover-secondary",
    destructive: "border-transparent bg-destructive text-destructive-foreground hover-destructive",
    outline: "text-foreground border-border hover-brightness-light"
  }

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-weight-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
        variantClasses[variant],
        className
      )}
      {...props}
    />
  )
}

export { Badge }
