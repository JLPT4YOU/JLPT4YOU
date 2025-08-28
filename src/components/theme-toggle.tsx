"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import { useLanguageContext } from "@/contexts/language-context"

export function ThemeToggle() {
  const { theme, resolvedTheme, setTheme } = useTheme()
  const { t } = useLanguageContext()
  const [mounted, setMounted] = React.useState(false)

  // Ensure component is mounted before rendering to avoid hydration mismatch
  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 bg-background/80 border border-border/50 text-foreground hover-brightness-light focus-ring"
        disabled
      >
        <Sun className="h-[1.2rem] w-[1.2rem] text-foreground" />
      </Button>
    )
  }

  const isDark = resolvedTheme === "dark"

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="h-8 w-8 bg-background/80 border border-border/50 text-foreground hover-brightness-light focus-ring relative"
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
    >
      {/* Sun icon - visible in light mode */}
      <Sun className={`h-[1.2rem] w-[1.2rem] text-foreground transition-all duration-300 ${
        isDark ? "rotate-90 scale-0 opacity-0" : "rotate-0 scale-100 opacity-100"
      }`} />

      {/* Moon icon - visible in dark mode */}
      <Moon className={`absolute h-[1.2rem] w-[1.2rem] text-foreground transition-all duration-300 ${
        isDark ? "rotate-0 scale-100 opacity-100" : "-rotate-90 scale-0 opacity-0"
      }`} />

      <span className="sr-only">
        {isDark ? "Switch to light mode" : "Switch to dark mode"}
      </span>
    </Button>
  )
}
