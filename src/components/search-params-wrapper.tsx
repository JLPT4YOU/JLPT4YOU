"use client"

import { Suspense, ReactNode } from "react"

interface SearchParamsWrapperProps {
  children: ReactNode
  fallback?: ReactNode
}

export function SearchParamsWrapper({ 
  children, 
  fallback = <div className="min-h-screen bg-background animate-pulse" />
}: SearchParamsWrapperProps) {
  return (
    <Suspense fallback={fallback}>
      {children}
    </Suspense>
  )
}
