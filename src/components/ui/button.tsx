import * as React from "react"
import { cn } from "@/lib/utils"

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
  size?: 'default' | 'sm' | 'lg' | 'icon'
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', ...props }, ref) => {
    return (
      <button
        className={cn(
          // Base styles with improved focus and transition
          "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm interactive-text ring-offset-background focus-ring disabled:pointer-events-none disabled:opacity-50",
          // Variant styles with improved hover effects
          {
            // Default: Primary button with consistent text/icon visibility
            "bg-primary text-primary-foreground hover-primary": variant === 'default',

            // Destructive: Red button with maintained contrast
            "bg-destructive text-destructive-foreground hover-destructive": variant === 'destructive',

            // Outline: Border button with subtle background change
            "border border-input bg-muted/20 text-foreground hover-muted": variant === 'outline',

            // Secondary: Secondary color with brightness adjustment
            "bg-secondary text-secondary-foreground hover-secondary": variant === 'secondary',

            // Ghost: Transparent button with subtle hover
            "bg-transparent text-foreground hover-ghost": variant === 'ghost',

            // Link: Text button with underline effect only
            "text-primary underline-offset-4 hover:underline bg-transparent": variant === 'link',
          },
          // Size variants
          {
            "h-10 px-4 py-2": size === 'default',
            "h-9 rounded-md px-3": size === 'sm',
            "h-11 rounded-md px-8": size === 'lg',
            "h-10 w-10": size === 'icon',
          },
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button }
