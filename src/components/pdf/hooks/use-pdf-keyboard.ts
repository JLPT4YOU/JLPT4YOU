import { useEffect, useCallback } from 'react'
import { PDF_CONFIG } from '../config/pdf-config'

interface UsePDFKeyboardProps {
  // Navigation
  onPrevPage?: () => void
  onNextPage?: () => void
  onZoomIn?: () => void
  onZoomOut?: () => void
  onRotate?: () => void
  
  // Annotation tools
  onDraw?: () => void
  onHighlight?: () => void
  onEraser?: () => void
  onUndo?: () => void
  onRedo?: () => void
  onClearAll?: () => void
  
  // State
  canUndo?: boolean
  canRedo?: boolean
  isEnabled?: boolean
}

export function usePDFKeyboard({
  onPrevPage,
  onNextPage,
  onZoomIn,
  onZoomOut,
  onRotate,
  onDraw,
  onHighlight,
  onEraser,
  onUndo,
  onRedo,
  onClearAll,
  canUndo = false,
  canRedo = false,
  isEnabled = true
}: UsePDFKeyboardProps) {
  
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!isEnabled) return
    
    // Don't handle if user is typing in an input
    if (event.target instanceof HTMLInputElement || 
        event.target instanceof HTMLTextAreaElement ||
        event.target instanceof HTMLSelectElement) {
      return
    }
    
    // Check for modifier keys
    const isCtrl = event.ctrlKey || event.metaKey
    const isShift = event.shiftKey
    const isAlt = event.altKey
    
    // Handle keyboard shortcuts
    switch (event.key.toLowerCase()) {
      // Navigation
      case 'arrowleft':
      case 'pageup':
        if (!isCtrl && !isShift && !isAlt) {
          event.preventDefault()
          onPrevPage?.()
        }
        break
        
      case 'arrowright':
      case 'pagedown':
        if (!isCtrl && !isShift && !isAlt) {
          event.preventDefault()
          onNextPage?.()
        }
        break
        
      // Zoom
      case '=':
      case '+':
        if (isCtrl) {
          event.preventDefault()
          onZoomIn?.()
        }
        break
        
      case '-':
        if (isCtrl) {
          event.preventDefault()
          onZoomOut?.()
        }
        break
        
      case '0':
        if (isCtrl) {
          event.preventDefault()
          // Reset zoom to 100% - could add this functionality
        }
        break
        
      // Rotation
      case 'r':
        if (isCtrl && isShift) {
          event.preventDefault()
          onRotate?.()
        }
        break
        
      // Annotation tools
      case 'd':
        if (isCtrl && isShift) {
          event.preventDefault()
          onDraw?.()
        }
        break
        
      case 'h':
        if (isCtrl && isShift) {
          event.preventDefault()
          onHighlight?.()
        }
        break
        
      case 'e':
        if (isCtrl && isShift) {
          event.preventDefault()
          onEraser?.()
        }
        break
        
      // Undo/Redo
      case 'z':
        if (isCtrl && !isShift && canUndo) {
          event.preventDefault()
          onUndo?.()
        } else if (isCtrl && isShift && canRedo) {
          event.preventDefault()
          onRedo?.()
        }
        break
        
      case 'y':
        if (isCtrl && canRedo) {
          event.preventDefault()
          onRedo?.()
        }
        break
        
      // Clear all
      case 'delete':
      case 'backspace':
        if (isCtrl && isShift) {
          event.preventDefault()
          onClearAll?.()
        }
        break
        
      // Help - could show keyboard shortcuts modal
      case 'f1':
      case '?':
        if (!isCtrl && !isShift && !isAlt) {
          event.preventDefault()
          // Could show help modal in future
        }
        break
    }
  }, [
    isEnabled,
    onPrevPage,
    onNextPage,
    onZoomIn,
    onZoomOut,
    onRotate,
    onDraw,
    onHighlight,
    onEraser,
    onUndo,
    onRedo,
    onClearAll,
    canUndo,
    canRedo
  ])
  
  useEffect(() => {
    if (!isEnabled) return
    
    document.addEventListener('keydown', handleKeyDown)
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [handleKeyDown, isEnabled])
  
  // Return keyboard shortcuts info for help
  const getKeyboardShortcuts = useCallback(() => {
    return {
      navigation: {
        'Arrow Left / Page Up': 'Trang trước',
        'Arrow Right / Page Down': 'Trang sau',
      },
      zoom: {
        'Ctrl + Plus': 'Phóng to',
        'Ctrl + Minus': 'Thu nhỏ',
        'Ctrl + 0': 'Reset zoom (100%)',
      },
      annotation: {
        'Ctrl + Shift + D': 'Công cụ vẽ',
        'Ctrl + Shift + H': 'Công cụ tô sáng',
        'Ctrl + Shift + E': 'Công cụ xóa',
      },
      editing: {
        'Ctrl + Z': 'Hoàn tác',
        'Ctrl + Shift + Z / Ctrl + Y': 'Làm lại',
        'Ctrl + Shift + Delete': 'Xóa tất cả',
      },
      other: {
        'Ctrl + Shift + R': 'Xoay trang',
        'F1 / ?': 'Hiển thị phím tắt',
      }
    }
  }, [])
  
  return {
    getKeyboardShortcuts
  }
}
