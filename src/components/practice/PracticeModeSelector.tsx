"use client"

import Link from 'next/link'
import { LucideIcon } from 'lucide-react'

interface PracticeMode {
  type: 'flashcard' | 'quiz'
  title: string
  description: string
  icon: LucideIcon
  color: 'blue' | 'green' | 'purple'
  ariaLabel: string
}

interface PracticeModeSelector {
  titleKey: string
  subtitleKey: string
  HeaderIcon: LucideIcon
  modes: PracticeMode[]
  basePath: string
  level: string
  t: (key: string) => string
}

const colorClasses = {
  blue: {
    bg: 'bg-blue-500/10 group-hover:bg-blue-500/20',
    text: 'text-blue-500'
  },
  green: {
    bg: 'bg-green-500/10 group-hover:bg-green-500/20',
    text: 'text-green-500'
  },
  purple: {
    bg: 'bg-purple-500/10 group-hover:bg-purple-500/20',
    text: 'text-purple-500'
  }
}

export function PracticeModeSelector({
  titleKey,
  subtitleKey,
  HeaderIcon,
  modes,
  basePath,
  level,
  t
}: PracticeModeSelector) {
  return (
    <div className="min-h-screen bg-background">
      <div className="app-container app-section">
        <div className="app-content">
          <div className="max-w-4xl mx-auto app-space-2xl">
            {/* Header Section */}
            <header className="text-center app-space-lg">
              <div className="w-20 h-20 mx-auto mb-6 bg-muted/50 rounded-full flex items-center justify-center border border-border" aria-hidden="true">
                <HeaderIcon className="h-10 w-10 text-foreground" />
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-foreground">
                {t(titleKey)} {level.toUpperCase()}
              </h1>
              <p className="text-lg sm:text-xl text-muted-foreground mt-4">
                {t(subtitleKey)}
              </p>
            </header>

            {/* Selection Cards */}
            <main className="flex justify-center app-space-xl" role="main">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 md:gap-8 place-items-center w-max">
                {modes.map((mode) => {
                  const colors = colorClasses[mode.color]
                  const ModeIcon = mode.icon
                  
                  return (
                    <Link
                      key={mode.type}
                      href={`${basePath}/${mode.type}`}
                      className="block w-full max-w-[320px] group focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-2xl"
                      aria-label={mode.ariaLabel}
                    >
                      <article className="bg-muted/10 rounded-2xl p-6 md:p-8 text-center transition-all duration-200 hover:bg-muted/30 border border-border/20 group-hover:scale-105">
                        <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4 group-hover:scale-105 transition-transform duration-200 ${colors.bg}`}>
                          <ModeIcon className={`w-8 h-8 ${colors.text}`} />
                        </div>
                        <h2 className="font-semibold text-foreground mb-2 text-xl">{mode.title}</h2>
                        <p className="text-muted-foreground text-sm">{mode.description}</p>
                      </article>
                    </Link>
                  )
                })}
              </div>
            </main>
          </div>
        </div>
      </div>
    </div>
  )
}
