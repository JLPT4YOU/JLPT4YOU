"use client"

import { useState, useEffect } from 'react'

export function useViewport() {
  const [isMobile, setIsMobile] = useState(false)
  const [isTablet, setIsTablet] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const checkViewport = () => {
      setIsMobile(window.innerWidth < 768)
      setIsTablet(window.innerWidth >= 768 && window.innerWidth < 1024)
    }

    // Initial check
    checkViewport()
    setMounted(true)

    // Add resize listener
    window.addEventListener('resize', checkViewport)
    return () => window.removeEventListener('resize', checkViewport)
  }, [])

  return { isMobile, isTablet, mounted }
}
