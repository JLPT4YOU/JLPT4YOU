"use client"

import React, { createContext, useContext, useState, useCallback } from "react"

import { useTranslations } from '@/hooks/use-translations'
interface LoadingContextType {
  isGlobalLoading: boolean
  startGlobalLoading: () => void
  stopGlobalLoading: () => void
  setLoadingMessage: (message: string) => void
  loadingMessage: string
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined)

interface LoadingProviderProps {
  children: React.ReactNode
}

export function LoadingProvider({ children }: LoadingProviderProps) {
  const [isGlobalLoading, setIsGlobalLoading] = useState(false)
  const { t } = useTranslations()
  const [loadingMessage, setLoadingMessage] = useState(t('common.loading'))

  const startGlobalLoading = useCallback(() => {
    setIsGlobalLoading(true)
  }, [])

  const stopGlobalLoading = useCallback(() => {
    setIsGlobalLoading(false)
  }, [])

  const updateLoadingMessage = useCallback((message: string) => {
    setLoadingMessage(message)
  }, [])

  const value = {
    isGlobalLoading,
    startGlobalLoading,
    stopGlobalLoading,
    setLoadingMessage: updateLoadingMessage,
    loadingMessage
  }

  return (
    <LoadingContext.Provider value={value}>
      {children}
    </LoadingContext.Provider>
  )
}

export function useLoading() {
  const context = useContext(LoadingContext)
  if (context === undefined) {
    throw new Error("useLoading must be used within a LoadingProvider")
  }
  return context
}

// Hook for easy loading management with automatic cleanup
export function useLoadingState() {
  const { startGlobalLoading, stopGlobalLoading, setLoadingMessage } = useLoading()

  const withLoading = useCallback(
    async <T,>(
      asyncFn: () => Promise<T>,
      message: string = "Đang tải..."
    ): Promise<T> => {
      try {
        setLoadingMessage(message)
        startGlobalLoading()
        const result = await asyncFn()
        return result
      } finally {
        stopGlobalLoading()
      }
    },
    [startGlobalLoading, stopGlobalLoading, setLoadingMessage]
  )

  return {
    withLoading,
    startLoading: startGlobalLoading,
    stopLoading: stopGlobalLoading,
    setMessage: setLoadingMessage
  }
}
