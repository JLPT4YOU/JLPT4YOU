"use client"

import { useState } from "react"
import { ChevronDown, Globe } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Language,
  LANGUAGE_METADATA,
  SUPPORTED_LANGUAGES
} from "@/lib/i18n/"
import { useTranslations } from "@/hooks/use-translations"
import { useScrollPreservation } from "@/lib/use-scroll-preservation"

interface LanguageSwitcherProps {
  className?: string
  variant?: "default" | "compact"
}

export function LanguageSwitcher({
  className = "",
  variant = "default"
}: LanguageSwitcherProps) {
  const { language, switchLanguage, isAuthenticated } = useTranslations()
  const { saveScrollPosition } = useScrollPreservation()
  const [isOpen, setIsOpen] = useState(false)

  const currentLangData = LANGUAGE_METADATA[language]

  const handleLanguageChange = (language: Language) => {
    // Lưu vị trí scroll trước khi chuyển ngôn ngữ
    saveScrollPosition()
    switchLanguage(language)
    setIsOpen(false)
  }

  if (variant === "compact") {
    return (
      <div className={`relative ${className}`}>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsOpen(!isOpen)}
          className="h-8 w-8 p-0 bg-background/80 border border-border/50 text-foreground hover-brightness-light focus-ring"
        >
          <Globe className="h-4 w-4 text-foreground" />
        </Button>

        {isOpen && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-[110]"
              onClick={() => setIsOpen(false)}
            />

            {/* Dropdown */}
            <div className="absolute right-0 top-full mt-2 z-[120] min-w-[120px] bg-background border border-border rounded-lg shadow-lg py-1">
              {SUPPORTED_LANGUAGES.map((lang) => {
                const langData = LANGUAGE_METADATA[lang]
                const isActive = lang === language
                
                return (
                  <button
                    key={lang}
                    onClick={() => handleLanguageChange(lang)}
                    className={`
                      w-full px-3 py-2 text-left text-sm text-foreground hover-interactive focus-ring
                      ${isActive ? 'bg-muted/30 font-medium' : ''}
                    `}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-base">{langData.flag}</span>
                      <span>{langData.nativeName}</span>
                    </div>
                  </button>
                )
              })}
            </div>
          </>
        )}
      </div>
    )
  }

  return (
    <div className={`relative ${className}`}>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="h-9 px-3 gap-2 hover-muted focus-ring"
      >
        <span className="text-base">{currentLangData.flag}</span>
        <span className="hidden sm:inline text-sm text-foreground">{currentLangData.nativeName}</span>
        <ChevronDown className={`h-3 w-3 transition-transform text-foreground ${isOpen ? 'rotate-180' : ''}`} />
      </Button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-[110]"
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown */}
          <div className="absolute right-0 top-full mt-2 z-[120] min-w-[160px] bg-background border border-border rounded-lg shadow-lg py-1">
            {SUPPORTED_LANGUAGES.map((lang) => {
              const langData = LANGUAGE_METADATA[lang]
              const isActive = lang === language
              
              return (
                <button
                  key={lang}
                  onClick={() => handleLanguageChange(lang)}
                  className={`
                    w-full px-4 py-3 text-left text-foreground hover-interactive focus-ring
                    ${isActive ? 'bg-muted/30' : ''}
                  `}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{langData.flag}</span>
                    <div>
                      <div className={`text-sm ${isActive ? 'font-medium' : ''}`}>
                        {langData.nativeName}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {langData.name}
                      </div>
                    </div>
                    {isActive && (
                      <div className="ml-auto w-2 h-2 bg-primary rounded-full" />
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
