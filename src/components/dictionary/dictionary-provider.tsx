"use client"

import { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/contexts/auth-context-simple'
import { usePathname } from 'next/navigation'
import { Search } from 'lucide-react'
import { DictionaryPopup } from './popup'

interface SelectionMagnifierProps {
  children: React.ReactNode
}

/**
 * Dictionary Provider - Provides text selection and dictionary lookup functionality
 * Only active for authenticated users on non-auth pages
 */
export function DictionaryProvider({ children }: SelectionMagnifierProps) {
  const { user } = useAuth()
  const pathname = usePathname()
  const [selectedText, setSelectedText] = useState('')
  const [showMagnifier, setShowMagnifier] = useState(false)
  const [showPopup, setShowPopup] = useState(false)
  const [magnifierPosition, setMagnifierPosition] = useState({ x: 0, y: 0 })
  const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null)
  const magnifierRef = useRef<HTMLButtonElement>(null)

  // Check if dictionary should be active
  const isDictionaryActive = () => {
    // Only for authenticated users
    if (!user) return false

    // Not on auth pages
    if (pathname.startsWith('/auth/')) return false

    // Not on landing pages
    if (pathname.includes('/landing')) return false

    // Not on demo pages (already has its own dictionary)
    if (pathname.startsWith('/demo/')) return false

    return true
  }

  useEffect(() => {
    if (!isDictionaryActive()) return

    const handleSelectionChange = () => {
      const selection = window.getSelection()
      if (!selection || selection.rangeCount === 0) {
        setShowMagnifier(false)
        return
      }

      const range = selection.getRangeAt(0)
      const text = range.toString().trim()

      // Only show for Japanese text (contains hiragana, katakana, or kanji)
      const japaneseRegex = /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/
      if (!text || text.length < 1 || !japaneseRegex.test(text)) {
        setShowMagnifier(false)
        return
      }

      // Get selection position
      const rect = range.getBoundingClientRect()
      if (rect.width === 0 && rect.height === 0) {
        setShowMagnifier(false)
        return
      }

      setSelectedText(text)
      setAnchorRect(rect)
      
      // Position magnifier button
      const x = rect.left + rect.width / 2
      const y = rect.top - 40 // Above the selection
      
      setMagnifierPosition({ x, y })
      setShowMagnifier(true)
    }

    const handleMouseUp = () => {
      // Small delay to allow selection to be processed
      setTimeout(handleSelectionChange, 10)
    }

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Element
      
      // Don't hide if clicking on magnifier button
      if (magnifierRef.current?.contains(target)) {
        return
      }
      
      // Hide magnifier if clicking outside selection
      if (showMagnifier && !target.closest('.selection-area')) {
        setShowMagnifier(false)
      }
    }

    // Add event listeners
    document.addEventListener('selectionchange', handleSelectionChange)
    document.addEventListener('mouseup', handleMouseUp)
    document.addEventListener('click', handleClickOutside)

    return () => {
      document.removeEventListener('selectionchange', handleSelectionChange)
      document.removeEventListener('mouseup', handleMouseUp)
      document.removeEventListener('click', handleClickOutside)
    }
  }, [showMagnifier, isDictionaryActive, user, pathname])

  const handleMagnifierClick = () => {
    setShowPopup(true)
    setShowMagnifier(false)
  }

  const handleClosePopup = () => {
    setShowPopup(false)
    setSelectedText('')
    setAnchorRect(null)
    
    // Clear selection
    const selection = window.getSelection()
    if (selection) {
      selection.removeAllRanges()
    }
  }

  return (
    <>
      {children}
      
      {/* Selection Magnifier Button */}
      {isDictionaryActive() && showMagnifier && (
        <button
          ref={magnifierRef}
          onClick={handleMagnifierClick}
          className="fixed z-[9999] bg-foreground hover:bg-foreground/90 text-background rounded-full p-2 shadow-lg transition-all duration-200 transform hover:scale-110 border border-border"
          style={{
            left: `${magnifierPosition.x}px`,
            top: `${magnifierPosition.y}px`,
            transform: 'translateX(-50%)'
          }}
          title="Tra cứu"
        >
          <Search size={16} />
        </button>
      )}

      {/* Dictionary Popup */}
      {isDictionaryActive() && showPopup && selectedText && anchorRect && (
        <DictionaryPopup
          query={selectedText}
          anchorRect={anchorRect}
          onClose={handleClosePopup}
        />
      )}
    </>
  )
}
