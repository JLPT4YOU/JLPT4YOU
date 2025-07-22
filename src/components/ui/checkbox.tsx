"use client"

import * as React from "react"
import * as CheckboxPrimitive from "@radix-ui/react-checkbox"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"

const Checkbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>
>(({ className, ...props }, ref) => (
  <CheckboxPrimitive.Root
    ref={ref}
    className={cn(
      // Base styles
      "peer h-4 w-4 shrink-0 rounded-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
      // Light mode: black border and background, white check
      "border-foreground bg-background",
      // Dark mode: white border and background, black check
      "dark:border-background dark:bg-foreground",
      // Checked state
      "data-[state=checked]:bg-foreground data-[state=checked]:border-foreground",
      "dark:data-[state=checked]:bg-background dark:data-[state=checked]:border-background",
      className
    )}
    {...props}
  >
    <CheckboxPrimitive.Indicator
      className={cn(
        "flex items-center justify-center",
        // Light mode: white check on black background
        "text-background",
        // Dark mode: black check on white background
        "dark:text-foreground"
      )}
    >
      <Check className="h-4 w-4" />
    </CheckboxPrimitive.Indicator>
  </CheckboxPrimitive.Root>
))
Checkbox.displayName = CheckboxPrimitive.Root.displayName

export { Checkbox }
