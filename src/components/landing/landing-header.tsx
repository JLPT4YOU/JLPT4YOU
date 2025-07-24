"use client"

import { GraduationCap } from "lucide-react"
import { useRouter } from "next/navigation"
import { ThemeToggle } from "@/components/theme-toggle"
import { Button } from "@/components/ui/button"
import { LanguageSwitcher } from "@/components/language-switcher"
import { useEffect, useState } from "react"
import { TranslationData, getLocalizedPath } from "@/lib/i18n"
import { useTranslation } from "@/lib/use-translation"

interface LandingHeaderProps {
  translations: TranslationData
}

export function LandingHeader({ translations }: LandingHeaderProps) {
  const router = useRouter()
  const [isScrolled, setIsScrolled] = useState(false)
  const { t, currentLanguage } = useTranslation(translations)

  // Handle scroll effect for sticky header
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        width: '100%',
        backgroundColor: isScrolled ? 'rgba(var(--background), 0.95)' : 'transparent'
      }}
      className={`
        transition-all duration-300
        ${isScrolled
          ? 'border-b border-border backdrop-blur-md'
          : ''
        }
      `}
    >
      <div className="app-container app-py-md">
        <div className="app-content">
          <div className="flex h-12 items-center justify-between">
            {/* Logo và tên ứng dụng */}
            <div
              className="flex items-center app-gap-sm hover-opacity focus-ring rounded-md cursor-pointer"
              onClick={() => router.push(getLocalizedPath('landing', currentLanguage))}
            >
              <div className="flex items-center justify-center w-8 h-8 rounded-md bg-muted">
                <GraduationCap className="h-5 w-5 text-foreground" />
              </div>
              <h1 className="text-xl font-bold text-foreground">{t('header.logo')}</h1>
            </div>

            {/* Navigation và Actions */}
            <div className="flex items-center app-gap-sm">
              {/* Navigation Menu - Desktop */}
              <nav className="hidden lg:flex items-center app-gap-md">
                <a
                  href="#features"
                  className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  {t('footer.links.product.features')}
                </a>
                <a
                  href="#ai-demo-section"
                  className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  {t('footer.links.product.aiDemo')}
                </a>
                <a
                  href="#pricing"
                  className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  {t('footer.links.product.pricing')}
                </a>
                <a
                  href="#why-choose-us"
                  className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  {t('whyChooseUs.title')}
                </a>
              </nav>

              {/* Language Switcher */}
              <LanguageSwitcher translations={translations} variant="compact" />

              {/* Theme Toggle */}
              <ThemeToggle />

              {/* CTA Buttons */}
              <div className="hidden md:flex items-center app-gap-xs">
                <Button
                  variant="ghost"
                  onClick={() => router.push(getLocalizedPath('login', currentLanguage))}
                  className="bg-muted/10 text-sm"
                >
                  {t('header.login')}
                </Button>
                <Button
                  onClick={() => router.push(getLocalizedPath('register', currentLanguage))}
                  className="bg-primary text-sm"
                >
                  {t('hero.ctaButton')}
                </Button>
              </div>

              {/* Mobile CTA */}
              <div className="md:hidden flex items-center app-gap-xs">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.push(getLocalizedPath('login', currentLanguage))}
                  className="bg-muted/10 text-xs px-3"
                >
                  {t('header.login')}
                </Button>
                <Button
                  size="sm"
                  onClick={() => router.push(getLocalizedPath('register', currentLanguage))}
                  className="bg-primary text-xs px-3"
                >
                  {t('header.register')}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
