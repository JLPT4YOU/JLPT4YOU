import { useCallback } from 'react'
import { AnnotationTool, UsePDFAnnotationReturn } from '../types'

interface UsePDFAnnotationProps {
  activeAnnotationTool: AnnotationTool
  setActiveAnnotationTool: (tool: AnnotationTool) => void
}

export function usePDFAnnotation({
  activeAnnotationTool,
  setActiveAnnotationTool,
}: UsePDFAnnotationProps): UsePDFAnnotationReturn {
  const handleHighlight = useCallback(() => {
    // Toggle behavior: if already highlight, turn off; otherwise set to highlight
    setActiveAnnotationTool(activeAnnotationTool === 'highlight' ? null : 'highlight')
  }, [activeAnnotationTool, setActiveAnnotationTool])

  const handleDraw = useCallback(() => {
    // Toggle behavior: if already draw, turn off; otherwise set to draw
    setActiveAnnotationTool(activeAnnotationTool === 'draw' ? null : 'draw')
  }, [activeAnnotationTool, setActiveAnnotationTool])

  const handleEraser = useCallback(() => {
    // Toggle behavior: if already eraser, turn off; otherwise set to eraser
    setActiveAnnotationTool(activeAnnotationTool === 'eraser' ? null : 'eraser')
  }, [activeAnnotationTool, setActiveAnnotationTool])

  return {
    handleHighlight,
    handleDraw,
    handleEraser,
  }
}
