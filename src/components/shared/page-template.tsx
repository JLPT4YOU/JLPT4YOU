'use client'

import React from 'react'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'

interface Breadcrumb {
  label: string
  href: string
}

interface PageTemplateProps {
  title: string
  description?: string
  breadcrumbs?: Breadcrumb[]
  children: React.ReactNode
}

export function PageTemplate({ 
  title, 
  description, 
  breadcrumbs,
  children 
}: PageTemplateProps) {
  return (
    <div className="min-h-screen bg-background">
      {/* Breadcrumbs */}
      {breadcrumbs && breadcrumbs.length > 0 && (
        <div className="border-b">
          <div className="container mx-auto px-4 py-3">
            <nav className="flex items-center space-x-1 text-sm text-muted-foreground">
              {breadcrumbs.map((crumb, index) => (
                <React.Fragment key={index}>
                  {index > 0 && <ChevronRight className="h-4 w-4" />}
                  {index === breadcrumbs.length - 1 ? (
                    <span className="text-foreground font-medium">{crumb.label}</span>
                  ) : (
                    <Link 
                      href={crumb.href}
                      className="hover:text-foreground transition-colors"
                    >
                      {crumb.label}
                    </Link>
                  )}
                </React.Fragment>
              ))}
            </nav>
          </div>
        </div>
      )}
      
      {/* Header */}
      <div className="border-b bg-muted/50">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
          {description && (
            <p className="mt-2 text-muted-foreground">{description}</p>
          )}
        </div>
      </div>
      
      {/* Content */}
      <main>{children}</main>
    </div>
  )
}
