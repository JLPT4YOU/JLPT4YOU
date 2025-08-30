import { useCallback, useRef } from 'react'
import { UsePDFNavigationReturn } from '../types'

interface UsePDFNavigationProps {
  pageNumber: number
  numPages: number
  scale: number
  rotation: number
  setPageNumber: (pageNumber: number) => void
  setScale: (scale: number) => void
  setRotation: (rotation: number) => void
  isMobileView?: boolean
  containerWidth?: number
  pageWidth?: number
}

export function usePDFNavigation({
  pageNumber,
  numPages,
  scale,
  rotation,
  setPageNumber,
  setScale,
  setRotation,
  isMobileView = false,
  containerWidth,
  pageWidth,
}: UsePDFNavigationProps): UsePDFNavigationReturn {
  // Debounce zoom operations to prevent excessive re-renders
  const zoomTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Immediate scale update for button clicks (responsive)
  const immediateSetScale = useCallback((newScale: number) => {
    if (zoomTimeoutRef.current) {
      clearTimeout(zoomTimeoutRef.current)
    }
    setScale(newScale)
  }, [setScale])

  // Debounced scale update for continuous events (wheel, touch)
  const debouncedSetScale = useCallback((newScale: number) => {
    if (zoomTimeoutRef.current) {
      clearTimeout(zoomTimeoutRef.current)
    }

    zoomTimeoutRef.current = setTimeout(() => {
      setScale(newScale)
    }, 16) // Reduced to 16ms (~60fps) for smoother continuous zoom
  }, [setScale])
  const goToPrevPage = useCallback(() => {
    setPageNumber(Math.max(1, pageNumber - 1))
  }, [pageNumber, setPageNumber])

  const goToNextPage = useCallback(() => {
    setPageNumber(Math.min(numPages, pageNumber + 1))
  }, [pageNumber, numPages, setPageNumber])

  const zoomIn = useCallback(() => {
    // Mobile-specific zoom logic - smaller increments for better control
    const increment = isMobileView ? 0.15 : 0.2
    const maxZoom = isMobileView ? 2.5 : 3.0
    const newScale = Math.min(maxZoom, scale + increment)
    immediateSetScale(newScale) // Use immediate for button clicks
  }, [scale, immediateSetScale, isMobileView])

  const zoomOut = useCallback(() => {
    // Mobile-specific zoom logic - smaller increments for better control
    const increment = isMobileView ? 0.15 : 0.2
    // Mobile minimum scale should fit content properly
    const minZoom = isMobileView ? 0.3 : 0.5
    const newScale = Math.max(minZoom, scale - increment)
    immediateSetScale(newScale) // Use immediate for button clicks
  }, [scale, immediateSetScale, isMobileView])

  const zoomByDelta = useCallback((delta: number) => {
    const zoomFactor = delta > 0 ? 0.1 : -0.1
    const minZoom = isMobileView ? 0.3 : 0.5
    const maxZoom = isMobileView ? 2.5 : 3.0
    const newScale = Math.max(minZoom, Math.min(maxZoom, scale + zoomFactor))
    debouncedSetScale(newScale)
  }, [scale, debouncedSetScale, isMobileView])

  const rotate = useCallback(() => {
    setRotation((rotation + 90) % 360)
  }, [rotation, setRotation])

  const fitToWidth = useCallback(() => {
    if (containerWidth && pageWidth) {
      // Calculate scale to fit page width to container width with some padding
      const padding = isMobileView ? 20 : 40
      const availableWidth = containerWidth - padding
      const newScale = availableWidth / pageWidth

      // Apply min/max zoom constraints
      const minZoom = isMobileView ? 0.3 : 0.5
      const maxZoom = isMobileView ? 2.5 : 3.0
      const clampedScale = Math.max(minZoom, Math.min(maxZoom, newScale))

      immediateSetScale(clampedScale) // Use immediate for button clicks
    }
  }, [containerWidth, pageWidth, immediateSetScale, isMobileView])

  // Cleanup timeout on unmount
  const cleanup = useCallback(() => {
    if (zoomTimeoutRef.current) {
      clearTimeout(zoomTimeoutRef.current)
    }
  }, [])

  return {
    goToPrevPage,
    goToNextPage,
    zoomIn,
    zoomOut,
    zoomByDelta,
    rotate,
    fitToWidth,
    cleanup, // Export cleanup function
    debouncedSetScale, // Export for wheel events
  }
}
