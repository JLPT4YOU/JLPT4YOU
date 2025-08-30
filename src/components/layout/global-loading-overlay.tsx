"use client"

import { useLoading } from "@/contexts/loading-context"
import { LoadingScreen } from "@/components/ui/loading-screen"
import { AnimatePresence } from "framer-motion"

export function GlobalLoadingOverlay() {
  const { isGlobalLoading, loadingMessage } = useLoading()

  return (
    <AnimatePresence>
      {isGlobalLoading && (
        <LoadingScreen
          key="global-loading"
          isVisible={isGlobalLoading}
          message={loadingMessage}
          duration={2000}
        />
      )}
    </AnimatePresence>
  )
}
