import { useCallback } from 'react'
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
    setScale(Math.min(maxZoom, scale + increment))
  }, [scale, setScale, isMobileView])

  const zoomOut = useCallback(() => {
    // Mobile-specific zoom logic - smaller increments for better control
    const increment = isMobileView ? 0.15 : 0.2
    // Mobile minimum scale should fit content properly
    const minZoom = isMobileView ? 0.3 : 0.5
    setScale(Math.max(minZoom, scale - increment))
  }, [scale, setScale, isMobileView])

  const zoomByDelta = useCallback((delta: number) => {
    const zoomFactor = delta > 0 ? 0.1 : -0.1
    const minZoom = isMobileView ? 0.3 : 0.5
    const maxZoom = isMobileView ? 2.5 : 3.0
    setScale(Math.max(minZoom, Math.min(maxZoom, scale + zoomFactor)))
  }, [scale, setScale, isMobileView])

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
      
      setScale(clampedScale)
    }
  }, [containerWidth, pageWidth, setScale, isMobileView])

  return {
    goToPrevPage,
    goToNextPage,
    zoomIn,
    zoomOut,
    zoomByDelta,
    rotate,
    fitToWidth,
  }
}
