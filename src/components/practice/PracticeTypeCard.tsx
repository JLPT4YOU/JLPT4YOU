"use client"

import Link from 'next/link'
import { LucideIcon } from 'lucide-react'

interface PracticeTypeCardProps {
  href: string
  title: string
  description: string
  Icon: LucideIcon
  level: string
  ariaLabel?: string
}

export function PracticeTypeCard({
  href,
  title,
  description,
  Icon,
  level,
  ariaLabel
}: PracticeTypeCardProps) {
  const defaultAriaLabel = `${title} ${level.toUpperCase()}`
  
  return (
    <Link
      href={href}
      className="block w-full max-w-[360px] h-full group focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-2xl"
      aria-label={ariaLabel || defaultAriaLabel}
    >
      <article className="bg-muted/10 rounded-2xl p-6 md:p-8 text-center transition-all duration-200 hover:bg-muted/30 border border-border/20 group-hover:scale-105 h-full flex flex-col justify-center min-h-[260px]">
        <div className="w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4 group-hover:scale-105 transition-transform duration-200 bg-primary/10 group-hover:bg-primary/20">
          <Icon className="w-8 h-8 text-primary" />
        </div>
        <h2 className="font-semibold text-foreground mb-2 text-xl">{title}</h2>
        <p className="text-muted-foreground text-sm">{description}</p>
      </article>
    </Link>
  )
}
