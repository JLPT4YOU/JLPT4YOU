import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Button } from '@/components/ui/button'
import { ChevronDown, Plus, X } from 'lucide-react'
import { AdvancedColorPicker } from './advanced-color-picker'
import { ColorStorage } from '../utils/pdf-helpers'

interface ToolbarColorPickerProps {
  selectedColor: string
  onColorChange: (color: string) => void
  activeAnnotationTool: 'draw' | 'highlight' | 'eraser' | null
  isMobileDropdown?: boolean
}

export function ToolbarColorPicker({
  selectedColor,
  onColorChange,
  activeAnnotationTool,
  isMobileDropdown = false
}: ToolbarColorPickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [showAdvancedPicker, setShowAdvancedPicker] = useState(false)
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 })
  const [advancedPickerPosition, setAdvancedPickerPosition] = useState({ top: 0, left: 0 })
  const dropdownRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const addButtonRef = useRef<HTMLButtonElement>(null)

  // Default colors based on tool type (same as sidebar)
  const defaultPenColors = ['#000000', '#0066CC', '#FF0000', '#800080', '#228B22']
  const defaultHighlightColors = ['#FFF9B0', '#B0D8FF', '#FFC0CB', '#D0F0C0', '#FFD580']

  const [penColors] = useState<string[]>(defaultPenColors)
  const [highlightColors] = useState<string[]>(defaultHighlightColors)
  const [customColors, setCustomColors] = useState<string[]>(() => {
    // Load custom colors from localStorage on init
    return ColorStorage.loadCustomColors()
  })

  const currentColors = activeAnnotationTool === 'highlight' ? highlightColors : penColors

  // Get default color for current tool
  const getDefaultColor = () => {
    return activeAnnotationTool === 'highlight' ? '#FFF9B0' : '#000000'
  }

  // Always use selectedColor for display, fallback to default only if selectedColor is empty
  const displayColor = selectedColor || getDefaultColor()

  // Calculate dropdown position and close when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node) &&
          buttonRef.current && !buttonRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }

      // Close advanced picker when clicking outside
      if (showAdvancedPicker && addButtonRef.current && !addButtonRef.current.contains(event.target as Node)) {
        // Check if click is not inside the advanced picker
        const advancedPickerElement = document.querySelector('[data-advanced-picker]')
        if (!advancedPickerElement || !advancedPickerElement.contains(event.target as Node)) {
          setShowAdvancedPicker(false)
        }
      }
    }

    function calculatePosition() {
      if (buttonRef.current) {
        const rect = buttonRef.current.getBoundingClientRect()
        const dropdownHeight = 120 // Estimated dropdown height
        const spaceAbove = rect.top
        const spaceBelow = window.innerHeight - rect.bottom

        // Calculate position
        let top = rect.bottom + 4 // Default: below button
        let left = rect.left

        // If not enough space below and more space above, show above
        if (spaceBelow < dropdownHeight && spaceAbove > dropdownHeight) {
          top = rect.top - dropdownHeight - 4
        }

        // Ensure dropdown doesn't go off-screen horizontally
        const dropdownWidth = 120
        if (left + dropdownWidth > window.innerWidth) {
          left = window.innerWidth - dropdownWidth - 8
        }
        if (left < 8) {
          left = 8
        }

        setDropdownPosition({ top, left })
      }
    }

    if (isOpen || showAdvancedPicker) {
      if (isOpen) {
        calculatePosition()
      }
      document.addEventListener('mousedown', handleClickOutside)
      window.addEventListener('scroll', calculatePosition)
      window.addEventListener('resize', calculatePosition)

      return () => {
        document.removeEventListener('mousedown', handleClickOutside)
        window.removeEventListener('scroll', calculatePosition)
        window.removeEventListener('resize', calculatePosition)
      }
    }
  }, [isOpen, showAdvancedPicker])

  const handleColorSelect = (color: string) => {
    onColorChange(color)
    setIsOpen(false)

    // Save color to localStorage
    if (activeAnnotationTool && activeAnnotationTool !== 'eraser') {
      ColorStorage.saveSelectedColor(color, activeAnnotationTool)
    }
  }

  const handleAdvancedColorSelect = (color: string) => {
    addColor(color) // Use addColor to handle custom colors properly
    setShowAdvancedPicker(false)
    setIsOpen(false)
  }

  // Calculate advanced picker position - position it below the pen tool button
  const calculateAdvancedPickerPosition = () => {
    // Find the pen tool button in the toolbar
    const penToolButton = document.querySelector('[aria-label="Công cụ vẽ"]') as HTMLElement
    if (!penToolButton) return

    const rect = penToolButton.getBoundingClientRect()
    const pickerWidth = 224 // w-56 = 224px
    const pickerHeight = 200 // Estimated compact height

    // Position below pen tool, centered
    let top = rect.bottom + 8
    let left = rect.left + (rect.width / 2) - (pickerWidth / 2)

    // Adjust if picker goes off-screen horizontally
    if (left + pickerWidth > window.innerWidth) {
      left = window.innerWidth - pickerWidth - 16
    }
    if (left < 16) {
      left = 16
    }

    // If not enough space below, show above
    if (top + pickerHeight > window.innerHeight && rect.top > pickerHeight) {
      top = rect.top - pickerHeight - 8
    }

    setAdvancedPickerPosition({ top, left })
  }

  // Add new color (same logic as sidebar)
  const addColor = (newColor: string) => {
    if (!currentColors.includes(newColor) && !customColors.includes(newColor)) {
      const newCustomColors = [...customColors, newColor]
      setCustomColors(newCustomColors)
      ColorStorage.saveCustomColors(newCustomColors) // Save to localStorage
      handleColorSelect(newColor) // Auto-select the new color
    }
  }

  // Remove color (same logic as sidebar)
  const removeColor = (colorToRemove: string) => {
    const newCustomColors = customColors.filter(color => color !== colorToRemove)
    setCustomColors(newCustomColors)
    ColorStorage.saveCustomColors(newCustomColors) // Save to localStorage
  }

  // Auto-select default color when tool changes, but only if selectedColor is not valid
  useEffect(() => {
    const allValidColors = [...currentColors, ...customColors]
    if (selectedColor && !allValidColors.includes(selectedColor)) {
      onColorChange(getDefaultColor())
    } else if (!selectedColor) {
      onColorChange(getDefaultColor())
    }
  }, [activeAnnotationTool, currentColors, customColors, selectedColor, onColorChange])

  // Mobile dropdown version - show colors directly
  if (isMobileDropdown) {
    return (
      <div className="space-y-3">
        {/* Color Grid */}
        <div className="grid grid-cols-5 gap-2 justify-items-center">
          {Array.from({ length: Math.ceil((currentColors.length + customColors.length + 1) / 5) }, (_, rowIndex) => {
            const allColors = [...currentColors, ...customColors]
            const startIndex = rowIndex * 5
            const rowColors = allColors.slice(startIndex, startIndex + 5)
            const isLastRow = rowIndex === Math.floor(allColors.length / 5)
            const showAddButton = isLastRow && rowColors.length < 5

            return (
              <div key={rowIndex} className="contents">
                {Array.from({ length: 5 }, (_, colIndex) => {
                  const colorIndex = startIndex + colIndex
                  const color = allColors[colorIndex]
                  const isCustomColor = colorIndex >= currentColors.length

                  if (color) {
                    const isSelected = selectedColor === color
                    return (
                      <div key={colIndex} className="relative group">
                        <div
                          className={`w-6 h-6 rounded-full border-2 cursor-pointer transition-colors ${
                            isSelected
                              ? 'border-primary ring-1 ring-primary/50'
                              : 'border-border hover:border-accent'
                          }`}
                          style={{ backgroundColor: color }}
                          onClick={() => handleColorSelect(color)}
                        />
                        {/* Delete button for custom colors */}
                        {isCustomColor && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              removeColor(color)
                            }}
                            className="absolute -top-1 -right-1 w-4 h-4 md:w-5 md:h-5 bg-red-500 rounded-full flex items-center justify-center opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity hover:bg-red-600"
                          >
                            <X className="h-2 w-2 md:h-2.5 md:w-2.5 text-white" />
                          </button>
                        )}
                      </div>
                    )
                  } else if (colIndex === rowColors.length && showAddButton) {
                    return (
                      <div key={colIndex} className="relative">
                        <button
                          ref={addButtonRef}
                          onClick={() => {
                            calculateAdvancedPickerPosition()
                            setShowAdvancedPicker(true)
                          }}
                          className="w-6 h-6 rounded-full border-2 border-dashed border-border hover:border-accent transition-colors flex items-center justify-center"
                          title="Thêm màu tùy chỉnh"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                    )
                  } else {
                    return <div key={colIndex} className="w-8 h-8" />
                  }
                })}
              </div>
            )
          })}
        </div>

        {/* Advanced Color Picker Modal */}
        <AdvancedColorPicker
          isOpen={showAdvancedPicker}
          onClose={() => setShowAdvancedPicker(false)}
          onColorSelect={handleAdvancedColorSelect}
          initialColor={displayColor}
          position={advancedPickerPosition}
        />
      </div>
    )
  }

  // Desktop version - dropdown button
  return (
    <div className="relative" ref={dropdownRef}>
      {/* Color Preview Button */}
      <Button
        ref={buttonRef}
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="h-6 w-6 p-0 rounded transition-colors hover:bg-accent"
        title="Chọn màu"
      >
        <div className="flex items-center gap-1">
          <div
            className="w-3 h-3 rounded-full border border-border"
            style={{ backgroundColor: displayColor }}
          />
          <ChevronDown className="h-2 w-2" />
        </div>
      </Button>

      {/* Color Dropdown - Rendered as Portal */}
      {isOpen && createPortal(
        <div
          ref={dropdownRef}
          className="fixed bg-background border border-border rounded-md shadow-xl p-3 z-[9999] min-w-[140px]"
          style={{
            top: dropdownPosition.top,
            left: dropdownPosition.left,
          }}
        >
          {/* Color Grid - Same layout as sidebar */}
          <div className="space-y-2">
            {Array.from({ length: Math.ceil((currentColors.length + customColors.length + 1) / 5) }, (_, rowIndex) => {
              const allColors = [...currentColors, ...customColors]
              const startIndex = rowIndex * 5
              const rowColors = allColors.slice(startIndex, startIndex + 5)
              const isLastRow = rowIndex === Math.floor(allColors.length / 5)
              const showAddButton = isLastRow && rowColors.length < 5

              return (
                <div key={rowIndex} className="flex justify-between gap-1">
                  {Array.from({ length: 5 }, (_, colIndex) => {
                    const colorIndex = startIndex + colIndex
                    const color = allColors[colorIndex]
                    const isCustomColor = colorIndex >= currentColors.length

                    if (color) {
                      const isSelected = selectedColor === color
                      return (
                        <div key={colIndex} className="relative group">
                          <div
                            className={`w-5 h-5 rounded-full border-2 cursor-pointer transition-colors ${
                              isSelected
                                ? 'border-primary ring-1 ring-primary/50'
                                : 'border-border hover:border-accent'
                            }`}
                            style={{ backgroundColor: color }}
                            onClick={() => handleColorSelect(color)}
                          />
                          {/* Delete button for custom colors */}
                          {isCustomColor && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                removeColor(color)
                              }}
                              className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity hover:bg-red-600"
                            >
                              <X className="h-2 w-2 text-white" />
                            </button>
                          )}
                        </div>
                      )
                    } else if (colIndex === rowColors.length && showAddButton) {
                      return (
                        <div key={colIndex} className="relative">
                          <button
                            onClick={() => {
                              calculateAdvancedPickerPosition()
                              setShowAdvancedPicker(true)
                            }}
                            className="w-5 h-5 rounded-full border-2 border-dashed border-border hover:border-accent transition-colors"
                            title="Thêm màu tùy chỉnh"
                          />
                        </div>
                      )
                    } else {
                      return <div key={colIndex} className="w-5 h-5" />
                    }
                  })}
                </div>
              )
            })}
          </div>
        </div>,
        document.body
      )}

      {/* Advanced Color Picker Modal */}
      <AdvancedColorPicker
        isOpen={showAdvancedPicker}
        onClose={() => setShowAdvancedPicker(false)}
        onColorSelect={handleAdvancedColorSelect}
        initialColor={displayColor}
        position={advancedPickerPosition}
      />
    </div>
  )
}
