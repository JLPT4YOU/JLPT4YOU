"use client"

import {
  GraduationCap,
  CheckCircle,
  Users,
  Trophy,
  BookOpen,
  Brain,
  Lightbulb,
  Target,
  Award,
  Zap,
  Sparkles,
  Library,
  Heart,
  Smile
} from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import { TranslationData, createTranslationFunction } from "@/lib/i18n"

interface AuthLayoutProps {
  children: React.ReactNode
  title: string
  subtitle: string
  translations: TranslationData
  languageSwitcher?: React.ReactNode
}

// Brand Side Background Pattern Component
const BrandSidePattern = () => (
  <div className="absolute inset-0 opacity-15">
    {/* Top Row */}
    <div className="absolute top-8 left-8">
      <BookOpen className="h-6 w-6 text-foreground" />
    </div>
    <div className="absolute top-12 right-16">
      <Brain className="h-5 w-5 text-foreground" />
    </div>
    <div className="absolute top-20 left-1/3">
      <Lightbulb className="h-4 w-4 text-foreground" />
    </div>
    <div className="absolute top-6 right-1/4">
      <Target className="h-8 w-8 text-foreground" />
    </div>

    {/* Middle Section */}
    <div className="absolute top-1/3 left-12">
      <Award className="h-7 w-7 text-foreground" />
    </div>
    <div className="absolute top-1/3 right-20">
      <Zap className="h-5 w-5 text-foreground" />
    </div>
    <div className="absolute top-1/2 left-1/4">
      <Sparkles className="h-6 w-6 text-foreground" />
    </div>
    <div className="absolute top-1/2 right-1/3">
      <GraduationCap className="h-8 w-8 text-foreground" />
    </div>
    <div className="absolute top-2/5 left-2/3">
      <Users className="h-5 w-5 text-foreground" />
    </div>

    {/* Bottom Section */}
    <div className="absolute bottom-32 left-16">
      <Trophy className="h-7 w-7 text-foreground" />
    </div>
    <div className="absolute bottom-24 right-12">
      <CheckCircle className="h-4 w-4 text-foreground" />
    </div>
    <div className="absolute bottom-16 left-1/3">
      <BookOpen className="h-5 w-5 text-foreground" />
    </div>
    <div className="absolute bottom-40 right-1/4">
      <Brain className="h-6 w-6 text-foreground" />
    </div>
    <div className="absolute bottom-8 left-1/2">
      <Lightbulb className="h-8 w-8 text-foreground" />
    </div>

    {/* Additional scattered icons for more density */}
    <div className="absolute top-1/4 right-8">
      <Target className="h-4 w-4 text-foreground" />
    </div>
    <div className="absolute top-3/4 left-8">
      <Award className="h-5 w-5 text-foreground" />
    </div>
    <div className="absolute bottom-1/3 right-1/2">
      <Zap className="h-6 w-6 text-foreground" />
    </div>
    <div className="absolute top-1/6 left-3/4">
      <Sparkles className="h-4 w-4 text-foreground" />
    </div>
    <div className="absolute top-5/6 right-1/3">
      <Brain className="h-8 w-8 text-foreground" />
    </div>
    <div className="absolute top-1/8 right-1/2">
      <Lightbulb className="h-5 w-5 text-foreground" />
    </div>
    <div className="absolute bottom-1/6 left-1/4">
      <Users className="h-6 w-6 text-foreground" />
    </div>
    <div className="absolute top-7/8 right-3/4">
      <CheckCircle className="h-4 w-4 text-foreground" />
    </div>
    <div className="absolute top-3/8 left-1/6">
      <Trophy className="h-5 w-5 text-foreground" />
    </div>
    <div className="absolute bottom-3/8 right-1/6">
      <BookOpen className="h-8 w-8 text-foreground" />
    </div>
  </div>
)

// Form Side Background Pattern Component
const FormSidePattern = () => (
  <div className="absolute inset-0 opacity-12">
    {/* Subtle pattern for form side with different icons */}
    <div className="absolute top-16 right-8">
      <Sparkles className="h-4 w-4 text-foreground" />
    </div>
    <div className="absolute top-1/4 left-8">
      <Brain className="h-5 w-5 text-foreground" />
    </div>
    <div className="absolute top-1/3 right-12">
      <Lightbulb className="h-6 w-6 text-foreground" />
    </div>
    <div className="absolute top-1/2 left-12">
      <Target className="h-4 w-4 text-foreground" />
    </div>
    <div className="absolute top-2/3 right-16">
      <Award className="h-5 w-5 text-foreground" />
    </div>
    <div className="absolute bottom-1/4 left-16">
      <Zap className="h-6 w-6 text-foreground" />
    </div>
    <div className="absolute bottom-16 right-8">
      <BookOpen className="h-4 w-4 text-foreground" />
    </div>
    <div className="absolute top-3/4 left-1/3">
      <Users className="h-5 w-5 text-foreground" />
    </div>
    <div className="absolute bottom-1/3 right-1/3">
      <Trophy className="h-4 w-4 text-foreground" />
    </div>
    <div className="absolute top-1/6 left-1/2">
      <CheckCircle className="h-6 w-6 text-foreground" />
    </div>
    {/* Additional form side icons for better coverage */}
    <div className="absolute top-1/8 right-1/4">
      <GraduationCap className="h-4 w-4 text-foreground" />
    </div>
    <div className="absolute bottom-1/8 left-1/4">
      <Sparkles className="h-8 w-8 text-foreground" />
    </div>
    <div className="absolute top-7/8 right-1/2">
      <Brain className="h-5 w-5 text-foreground" />
    </div>
    <div className="absolute top-3/8 right-1/6">
      <Lightbulb className="h-4 w-4 text-foreground" />
    </div>
    <div className="absolute bottom-3/8 left-1/6">
      <Target className="h-6 w-6 text-foreground" />
    </div>
    <div className="absolute top-5/8 left-3/4">
      <Award className="h-5 w-5 text-foreground" />
    </div>
  </div>
)

// Mobile Background Pattern Component
const MobilePattern = () => (
  <div className="absolute inset-0 opacity-10 lg:hidden">
    {/* Top area - avoid form header */}
    <div className="absolute top-4 left-4">
      <BookOpen className="h-4 w-4 text-foreground" />
    </div>
    <div className="absolute top-6 right-6">
      <Brain className="h-4 w-4 text-foreground" />
    </div>
    <div className="absolute top-12 left-1/3">
      <Lightbulb className="h-3 w-3 text-foreground" />
    </div>

    {/* Side areas - avoid center form */}
    <div className="absolute top-1/4 left-2">
      <Target className="h-5 w-5 text-foreground" />
    </div>
    <div className="absolute top-1/4 right-2">
      <Award className="h-4 w-4 text-foreground" />
    </div>
    <div className="absolute top-1/3 left-4">
      <Zap className="h-3 w-3 text-foreground" />
    </div>
    <div className="absolute top-1/3 right-4">
      <Sparkles className="h-4 w-4 text-foreground" />
    </div>

    {/* Middle side areas */}
    <div className="absolute top-1/2 left-2">
      <Users className="h-4 w-4 text-foreground" />
    </div>
    <div className="absolute top-1/2 right-2">
      <Trophy className="h-5 w-5 text-foreground" />
    </div>
    <div className="absolute top-3/5 left-4">
      <GraduationCap className="h-3 w-3 text-foreground" />
    </div>
    <div className="absolute top-3/5 right-4">
      <CheckCircle className="h-4 w-4 text-foreground" />
    </div>

    {/* Bottom area - avoid form footer */}
    <div className="absolute bottom-16 left-4">
      <Brain className="h-4 w-4 text-foreground" />
    </div>
    <div className="absolute bottom-12 right-6">
      <Lightbulb className="h-5 w-5 text-foreground" />
    </div>
    <div className="absolute bottom-8 left-1/4">
      <Award className="h-3 w-3 text-foreground" />
    </div>
    <div className="absolute bottom-6 right-1/4">
      <Sparkles className="h-4 w-4 text-foreground" />
    </div>
  </div>
)

export function AuthLayout({ children, title, subtitle, translations, languageSwitcher }: AuthLayoutProps) {
  const t = createTranslationFunction(translations)

  return (
    <div className="min-h-screen bg-background relative">
      {/* Mobile Controls - Theme & Language */}
      <div className="absolute top-4 right-4 z-50 flex items-center gap-2 lg:hidden">
        <ThemeToggle />
        {languageSwitcher}
      </div>
      {/* Mobile Background Pattern */}
      <MobilePattern />

      <div className="lg:grid lg:grid-cols-2 lg:min-h-screen">
        {/* Brand Side - Hidden on mobile */}
        <div className="hidden lg:flex lg:flex-col lg:justify-center lg:items-center bg-muted/20 app-p-xl relative overflow-hidden">
          {/* Brand Side Background Pattern */}
          <BrandSidePattern />

          <div className="max-w-md space-y-8 relative z-10">
            {/* Logo & Brand */}
            <div className="text-center space-y-4">
              <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-muted mx-auto">
                <GraduationCap className="h-8 w-8 text-foreground" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground">JLPT4YOU</h1>
                <p className="text-lg text-muted-foreground mt-2">
                  {t('auth.brand.tagline')}
                </p>
              </div>
            </div>

            {/* Features */}
            <div className="space-y-4">
              <div className="flex items-center app-gap-sm">
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-accent">
                  <BookOpen className="h-4 w-4 text-accent-foreground" />
                </div>
                <span className="text-sm text-foreground">
                  {t('auth.features.comprehensive')}
                </span>
              </div>

              <div className="flex items-center app-gap-sm">
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-accent">
                  <Library className="h-4 w-4 text-accent-foreground" />
                </div>
                <span className="text-sm text-foreground">
                  {t('auth.features.library')}
                </span>
              </div>

              <div className="flex items-center app-gap-sm">
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-accent">
                  <Heart className="h-4 w-4 text-accent-foreground" />
                </div>
                <span className="text-sm text-foreground">
                  {t('auth.features.sensei')}
                </span>
              </div>

              <div className="flex items-center app-gap-sm">
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-accent">
                  <Smile className="h-4 w-4 text-accent-foreground" />
                </div>
                <span className="text-sm text-foreground">
                  {t('auth.features.interface')}
                </span>
              </div>
            </div>

            {/* Testimonial */}
            <div className="text-center p-6 bg-background/80 backdrop-blur-sm rounded-2xl border border-border/50 shadow-sm">
              <p className="text-sm text-muted-foreground italic">
                &ldquo;{t('auth.brand.testimonial')}&rdquo;
              </p>
              <div className="flex items-center justify-center mt-3 app-gap-xs">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="w-1.5 h-1.5 rounded-full bg-primary/60" />
                ))}
              </div>
            </div>

            {/* Controls: Theme & Language */}
            <div className="flex justify-center items-center gap-4">
              <ThemeToggle />
              {languageSwitcher}
            </div>
          </div>
        </div>

        {/* Form Side */}
        <div className="flex flex-col justify-center min-h-screen lg:min-h-auto px-4 py-8 md:px-6 md:py-12 lg:app-p-xl relative overflow-hidden">
          {/* Form Side Background Pattern - Desktop only */}
          <div className="hidden lg:block">
            <FormSidePattern />
          </div>

          <div className="w-full max-w-md mx-auto space-y-6 md:space-y-8 relative z-10">
            {/* Form Header */}
            <div className="text-center lg:text-left space-y-2 md:space-y-3">
              <h2 className="text-2xl md:text-3xl font-bold text-foreground">{title}</h2>
              <p className="text-sm md:text-base text-muted-foreground">{subtitle}</p>
            </div>

            {/* Form Content */}
            <div className="space-y-6 md:space-y-8">
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
