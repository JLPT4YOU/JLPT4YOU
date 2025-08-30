import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X, Copy, Shuffle } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface AdvancedColorPickerProps {
  isOpen: boolean
  onClose: () => void
  onColorSelect: (color: string) => void
  initialColor?: string
  position?: { top: number; left: number }
}

export function AdvancedColorPicker({
  isOpen,
  onClose,
  onColorSelect,
  initialColor = '#FF0000',
  position
}: AdvancedColorPickerProps) {
  const [selectedColor, setSelectedColor] = useState(initialColor)
  const [hue, setHue] = useState(0) // Start with red
  const [saturation, setSaturation] = useState(100)
  const [lightness, setLightness] = useState(50)
  const [hexInput, setHexInput] = useState('#FF0000')
  
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const hueRef = useRef<HTMLInputElement>(null)

  // Convert HSL to Hex
  const hslToHex = (h: number, s: number, l: number) => {
    l /= 100
    const a = s * Math.min(l, 1 - l) / 100
    const f = (n: number) => {
      const k = (n + h / 30) % 12
      const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1)
      return Math.round(255 * color).toString(16).padStart(2, '0')
    }
    return `#${f(0)}${f(8)}${f(4)}`
  }

  // Convert Hex to HSL
  const hexToHsl = (hex: string) => {
    const r = parseInt(hex.slice(1, 3), 16) / 255
    const g = parseInt(hex.slice(3, 5), 16) / 255
    const b = parseInt(hex.slice(5, 7), 16) / 255

    const max = Math.max(r, g, b)
    const min = Math.min(r, g, b)
    let h = 0, s = 0
    const l = (max + min) / 2

    if (max !== min) {
      const d = max - min
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break
        case g: h = (b - r) / d + 2; break
        case b: h = (r - g) / d + 4; break
      }
      h /= 6
    }

    return [h * 360, s * 100, l * 100]
  }

  // Update color when HSL changes
  useEffect(() => {
    const newColor = hslToHex(hue, saturation, lightness)
    setSelectedColor(newColor)
    setHexInput(newColor)
  }, [hue, saturation, lightness])

  // Draw color picker canvas
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const width = canvas.width
    const height = canvas.height

    // Clear canvas first
    ctx.clearRect(0, 0, width, height)

    // Create base hue color
    const hueColor = `hsl(${hue}, 100%, 50%)`

    // Create horizontal gradient (white to hue color)
    const horizontalGradient = ctx.createLinearGradient(0, 0, width, 0)
    horizontalGradient.addColorStop(0, '#ffffff')
    horizontalGradient.addColorStop(1, hueColor)

    ctx.fillStyle = horizontalGradient
    ctx.fillRect(0, 0, width, height)

    // Create vertical gradient (transparent to black)
    const verticalGradient = ctx.createLinearGradient(0, 0, 0, height)
    verticalGradient.addColorStop(0, 'rgba(0,0,0,0)')
    verticalGradient.addColorStop(1, 'rgba(0,0,0,1)')

    ctx.fillStyle = verticalGradient
    ctx.fillRect(0, 0, width, height)
  }, [hue, isOpen])

  // Handle canvas click
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    const newSaturation = (x / canvas.width) * 100
    const newLightness = 100 - (y / canvas.height) * 100

    setSaturation(newSaturation)
    setLightness(newLightness)
  }

  // Generate random color
  const generateRandomColor = () => {
    const newHue = Math.floor(Math.random() * 360)
    const newSaturation = Math.floor(Math.random() * 100)
    const newLightness = Math.floor(Math.random() * 100)
    
    setHue(newHue)
    setSaturation(newSaturation)
    setLightness(newLightness)
  }

  // Handle hex input change
  const handleHexChange = (value: string) => {
    setHexInput(value)
    if (/^#[0-9A-F]{6}$/i.test(value)) {
      const [h, s, l] = hexToHsl(value)
      setHue(h)
      setSaturation(s)
      setLightness(l)
    }
  }

  // Copy to clipboard
  const copyToClipboard = () => {
    navigator.clipboard.writeText(selectedColor)
  }

  if (!isOpen) return null

  return createPortal(
    <div
      data-advanced-picker
      className="fixed bg-background rounded-lg shadow-lg border border-border p-3 w-56 z-[9999]"
      style={{
        top: position?.top || 0,
        left: position?.left || 0,
      }}
    >
        {/* Header */}
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-xs font-medium text-foreground">Chọn màu</h3>
          <Button variant="ghost" size="sm" onClick={onClose} className="h-5 w-5 p-0">
            <X className="h-2.5 w-2.5" />
          </Button>
        </div>

        {/* Color Canvas */}
        <div className="relative mb-2">
          <canvas
            ref={canvasRef}
            width={200}
            height={80}
            className="w-full h-[80px] rounded cursor-crosshair border border-border"
            onClick={handleCanvasClick}
          />
          {/* Color picker dot */}
          <div
            className="absolute w-2.5 h-2.5 border-2 border-white rounded-full shadow-md pointer-events-none"
            style={{
              left: `${(saturation / 100) * 100}%`,
              top: `${100 - (lightness / 100) * 100}%`,
              transform: 'translate(-50%, -50%)'
            }}
          />
        </div>

        {/* Hue Slider */}
        <div className="mb-2">
          <input
            ref={hueRef}
            type="range"
            min="0"
            max="360"
            value={hue}
            onChange={(e) => setHue(Number(e.target.value))}
            className="w-full h-1.5 rounded appearance-none cursor-pointer hue-slider"
            style={{
              background: 'linear-gradient(to right, #ff0000 0%, #ffff00 17%, #00ff00 33%, #00ffff 50%, #0000ff 67%, #ff00ff 83%, #ff0000 100%)'
            }}
          />
        </div>

        {/* Color Preview and Hex Input */}
        <div className="flex items-center gap-1.5 mb-2">
          <div
            className="w-6 h-6 rounded-full border border-border flex-shrink-0"
            style={{ backgroundColor: selectedColor }}
          />
          <div className="flex-1">
            <input
              type="text"
              value={hexInput}
              onChange={(e) => handleHexChange(e.target.value)}
              className="w-full px-1.5 py-1 text-xs border border-border rounded bg-background text-foreground"
              placeholder="#FF0000"
            />
          </div>
          <Button variant="outline" size="sm" onClick={copyToClipboard} className="h-6 w-6 p-0">
            <Copy className="h-2.5 w-2.5" />
          </Button>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-1.5">
          <Button variant="outline" onClick={generateRandomColor} className="flex-1 h-6 text-xs px-2">
            <Shuffle className="h-2.5 w-2.5 mr-1" />
            Ngẫu nhiên
          </Button>
          <Button
            onClick={() => {
              onColorSelect(selectedColor)
              onClose()
            }}
            className="flex-1 h-6 text-xs px-2"
          >
            Chọn
          </Button>
        </div>
      </div>,
    document.body
  )
}
