"use client"

import { useEffect, useState, useRef } from "react"
import { usePathname } from "next/navigation"
import { AnimatePresence, motion } from "framer-motion"
import { LoadingScreen } from "@/components/ui/loading-screen"

interface PageTransitionWrapperProps {
  children: React.ReactNode
  enableTransitions?: boolean
  loadingDuration?: number
}

export function PageTransitionWrapper({
  children,
  enableTransitions = true,
  loadingDuration = 1000
}: PageTransitionWrapperProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [previousPathname, setPreviousPathname] = useState<string | null>(null)
  const [isInitialLoad, setIsInitialLoad] = useState(true)
  const pathname = usePathname()
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (!enableTransitions) return

    // Skip loading on initial page load
    if (isInitialLoad) {
      setPreviousPathname(pathname)
      setIsInitialLoad(false)
      return
    }

    // Only show loading if pathname actually changed
    if (previousPathname !== pathname) {
      setIsLoading(true)
      setPreviousPathname(pathname)

      // Clear any existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [pathname, previousPathname, enableTransitions, isInitialLoad])

  const handleLoadingComplete = () => {
    setIsLoading(false)
  }

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  return (
    <>
      <AnimatePresence mode="wait">
        {isLoading && (
          <LoadingScreen
            key="loading"
            isVisible={isLoading}
            onComplete={handleLoadingComplete}
            duration={loadingDuration}
          />
        )}
      </AnimatePresence>

      {/* Main content with smooth transition */}
      <motion.div
        key={pathname}
        initial={{ opacity: 0 }}
        animate={{ opacity: isLoading ? 0 : 1 }}
        transition={{
          duration: 0.3,
          ease: "easeInOut"
        }}
        className={isLoading ? "pointer-events-none" : ""}
      >
        {children}
      </motion.div>
    </>
  )
}
