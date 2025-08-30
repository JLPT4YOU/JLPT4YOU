import React from 'react'
import Link from 'next/link'
import { LucideIcon } from 'lucide-react'

interface PracticeCardProps {
  href: string
  icon: LucideIcon
  title: string
  description: string
  ariaLabel: string
  iconColorClass: string
  iconBgClass: string
  iconBgHoverClass: string
}

export function PracticeCard({
  href,
  icon: Icon,
  title,
  description,
  ariaLabel,
  iconColorClass,
  iconBgClass,
  iconBgHoverClass
}: PracticeCardProps) {
  return (
    <Link
      href={href}
      className="block w-full max-w-[320px] group focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-2xl"
      aria-label={ariaLabel}
    >
      <article className="bg-muted/10 rounded-2xl p-6 md:p-8 text-center transition-all duration-200 hover:bg-muted/30 border border-border/20 group-hover:scale-105 h-[200px] flex flex-col justify-center">
        <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4 group-hover:scale-105 transition-transform duration-200 ${iconBgClass} ${iconBgHoverClass}`}>
          <Icon className={`w-8 h-8 ${iconColorClass}`} />
        </div>
        <h2 className="font-semibold text-foreground mb-2 text-xl">{title}</h2>
        <p className="text-muted-foreground text-sm leading-relaxed">{description}</p>
      </article>
    </Link>
  )
}
