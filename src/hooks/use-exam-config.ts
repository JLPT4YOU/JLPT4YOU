"use client"

import { useSearchParams } from "next/navigation"
import { useMemo } from "react"

export interface ExamConfig {
  timeMode: 'default' | 'unlimited' | 'custom'
  customTime?: string
  sections: string[]
  getTimeLimit: (defaultTime: number) => number
  createResultsParams: (examType: string, level: string, subType?: string) => URLSearchParams
}

/**
 * Custom hook to extract and manage common exam configuration from URL search parameters
 * Handles timeMode, customTime, sections parsing and provides utility functions
 */
export function useExamConfig(): ExamConfig {
  const searchParams = useSearchParams()

  const config = useMemo(() => {
    // Extract URL parameters
    const timeMode = (searchParams.get('timeMode') || 'default') as 'default' | 'unlimited' | 'custom'
    const customTime = searchParams.get('customTime') || undefined
    const sections = searchParams.get('sections')?.split(',').filter(Boolean) || []

    // Utility function to calculate time limit based on mode
    const getTimeLimit = (defaultTime: number): number => {
      if (timeMode === 'unlimited') {
        return 999 // Very large number for unlimited time
      }
      if (timeMode === 'custom' && customTime) {
        const parsed = parseInt(customTime)
        return isNaN(parsed) ? defaultTime : parsed
      }
      return defaultTime
    }

    // Utility function to create URL params for results page
    const createResultsParams = (examType: string, level: string, subType?: string): URLSearchParams => {
      const params = new URLSearchParams({
        type: examType,
        level: level,
        timeMode: timeMode,
        customTime: customTime || ''
      })

      if (sections.length > 0) {
        params.set('sections', sections.join(','))
      }

      if (subType) {
        params.set('subType', subType)
      }

      return params
    }

    return {
      timeMode,
      customTime,
      sections,
      getTimeLimit,
      createResultsParams
    }
  }, [searchParams])

  return config
}
