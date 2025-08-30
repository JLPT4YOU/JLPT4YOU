"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import { useTranslations } from "@/hooks/use-translations"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const { t } = useTranslations()
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

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(theme === "light" ? "dark" : "light")}
      className="h-8 w-8 bg-background/80 border border-border/50 text-foreground hover-brightness-light focus-ring relative"
      title={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
    >
      {/* Sun icon - visible in light mode */}
      <Sun className={`h-[1.2rem] w-[1.2rem] text-foreground transition-all duration-300 ${
        theme === "dark"
          ? "rotate-90 scale-0 opacity-0"
          : "rotate-0 scale-100 opacity-100"
      }`} />

      {/* Moon icon - visible in dark mode */}
      <Moon className={`absolute h-[1.2rem] w-[1.2rem] text-foreground transition-all duration-300 ${
        theme === "dark"
          ? "rotate-0 scale-100 opacity-100"
          : "-rotate-90 scale-0 opacity-0"
      }`} />

      <span className="sr-only">
        {theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
      </span>
    </Button>
  )
}
