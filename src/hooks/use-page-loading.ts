"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { usePathname } from "next/navigation"

interface UsePageLoadingOptions {
  minLoadingTime?: number
  maxLoadingTime?: number
  enableRouteChangeLoading?: boolean
}

export function usePageLoading({
  minLoadingTime = 800,
  maxLoadingTime = 3000,
  enableRouteChangeLoading = true
}: UsePageLoadingOptions = {}) {
  const [isLoading, setIsLoading] = useState(false)
  const [loadingProgress, setLoadingProgress] = useState(0)
  const pathname = usePathname()
  const router = useRouter()

  // Track route changes
  useEffect(() => {
    if (!enableRouteChangeLoading) return

    let progressInterval: NodeJS.Timeout
    let minTimeTimeout: NodeJS.Timeout
    let maxTimeTimeout: NodeJS.Timeout

    const startLoading = () => {
      setIsLoading(true)
      setLoadingProgress(0)

      // Simulate loading progress
      progressInterval = setInterval(() => {
        setLoadingProgress(prev => {
          if (prev >= 90) return prev
          return prev + Math.random() * 15
        })
      }, 100)

      // Minimum loading time
      minTimeTimeout = setTimeout(() => {
        setLoadingProgress(100)
        setTimeout(() => {
          setIsLoading(false)
          setLoadingProgress(0)
        }, 200)
      }, minLoadingTime)

      // Maximum loading time (fallback)
      maxTimeTimeout = setTimeout(() => {
        setLoadingProgress(100)
        setTimeout(() => {
          setIsLoading(false)
          setLoadingProgress(0)
        }, 200)
      }, maxLoadingTime)
    }

    const stopLoading = () => {
      clearInterval(progressInterval)
      clearTimeout(minTimeTimeout)
      clearTimeout(maxTimeTimeout)
      
      setLoadingProgress(100)
      setTimeout(() => {
        setIsLoading(false)
        setLoadingProgress(0)
      }, 200)
    }

    // Listen for route changes
    const handleRouteChangeStart = () => startLoading()
    const handleRouteChangeComplete = () => stopLoading()

    // For Next.js App Router, we need to detect navigation differently
    // This is a simplified approach - in production you might want to use
    // a more sophisticated method to detect route changes

    return () => {
      clearInterval(progressInterval)
      clearTimeout(minTimeTimeout)
      clearTimeout(maxTimeTimeout)
    }
  }, [pathname, enableRouteChangeLoading, minLoadingTime, maxLoadingTime])

  // Manual loading control
  const startLoading = () => {
    setIsLoading(true)
    setLoadingProgress(0)

    const progressInterval = setInterval(() => {
      setLoadingProgress(prev => {
        if (prev >= 90) return prev
        return prev + Math.random() * 10
      })
    }, 100)

    setTimeout(() => {
      clearInterval(progressInterval)
      setLoadingProgress(100)
      setTimeout(() => {
        setIsLoading(false)
        setLoadingProgress(0)
      }, 200)
    }, minLoadingTime)
  }

  const stopLoading = () => {
    setLoadingProgress(100)
    setTimeout(() => {
      setIsLoading(false)
      setLoadingProgress(0)
    }, 200)
  }

  // Enhanced navigation with loading
  const navigateWithLoading = (href: string) => {
    startLoading()
    router.push(href)
  }

  return {
    isLoading,
    loadingProgress,
    startLoading,
    stopLoading,
    navigateWithLoading
  }
}
