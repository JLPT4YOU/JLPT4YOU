/**
 * PDF Watermark Component
 * Displays "JLPT4YOU" watermark over PDF content
 */

import { useEffect, useState } from 'react'

interface PDFWatermarkProps {
  scale?: number
  pageWidth?: number
  pageHeight?: number
  className?: string
}

export function PDFWatermark({ 
  scale = 1, 
  pageWidth = 600, 
  pageHeight = 800,
  className = '' 
}: PDFWatermarkProps) {
  const [watermarkStyle, setWatermarkStyle] = useState<React.CSSProperties>({})

  useEffect(() => {
    // Calculate watermark size based on PDF scale and dimensions
    const baseFontSize = Math.min(pageWidth, pageHeight) * 0.06 * scale
    const fontSize = Math.max(20, Math.min(baseFontSize, 80))

    setWatermarkStyle({
      fontSize: `${fontSize}px`,
      opacity: Math.max(0.05, Math.min(0.12, 0.08 / Math.sqrt(scale))), // Better opacity scaling
    })
  }, [scale, pageWidth, pageHeight])

  return (
    <>
      {/* Main watermark */}
      <div 
        className={`pdf-watermark ${className}`}
        style={watermarkStyle}
      />
      
      {/* Removed background patterns - only text watermarks */}
      
      {/* Text watermarks at different positions */}
      <div className="absolute inset-0 pointer-events-none z-[8]">
        {/* Center watermark */}
        <div
          className="absolute"
          style={{
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%) rotate(-45deg)',
            fontSize: `${Math.max(24, 50 * scale)}px`,
            fontWeight: 'bold',
            color: `rgba(0, 0, 0, ${Math.max(0.06, Math.min(0.12, 0.08 / Math.sqrt(scale)))})`,
            fontFamily: 'Arial, sans-serif',
            letterSpacing: `${3 * scale}px`,
            whiteSpace: 'nowrap',
            textTransform: 'uppercase',
            userSelect: 'none',
            textShadow: '1px 1px 2px rgba(255, 255, 255, 0.3)',
          }}
        >
          JLPT4YOU
        </div>
        
        {/* Top-left watermark */}
        <div
          className="absolute"
          style={{
            top: '25%',
            left: '25%',
            transform: 'translate(-50%, -50%) rotate(-45deg)',
            fontSize: `${Math.max(18, 35 * scale)}px`,
            fontWeight: 'bold',
            color: `rgba(0, 0, 0, ${Math.max(0.04, Math.min(0.08, 0.05 / Math.sqrt(scale)))})`,
            fontFamily: 'Arial, sans-serif',
            letterSpacing: `${2 * scale}px`,
            whiteSpace: 'nowrap',
            textTransform: 'uppercase',
            userSelect: 'none',
            textShadow: '1px 1px 1px rgba(255, 255, 255, 0.2)',
          }}
        >
          JLPT4YOU
        </div>

        {/* Bottom-right watermark */}
        <div
          className="absolute"
          style={{
            top: '75%',
            left: '75%',
            transform: 'translate(-50%, -50%) rotate(-45deg)',
            fontSize: `${Math.max(18, 35 * scale)}px`,
            fontWeight: 'bold',
            color: `rgba(0, 0, 0, ${Math.max(0.04, Math.min(0.08, 0.05 / Math.sqrt(scale)))})`,
            fontFamily: 'Arial, sans-serif',
            letterSpacing: `${2 * scale}px`,
            whiteSpace: 'nowrap',
            textTransform: 'uppercase',
            userSelect: 'none',
            textShadow: '1px 1px 1px rgba(255, 255, 255, 0.2)',
          }}
        >
          JLPT4YOU
        </div>
        
        {/* Additional corner watermarks for zoom coverage */}
        <div
          className="absolute"
          style={{
            top: '15%',
            left: '75%',
            transform: 'translate(-50%, -50%) rotate(-45deg)',
            fontSize: `${Math.max(14, 24 * scale)}px`,
            fontWeight: 'bold',
            color: `rgba(0, 0, 0, ${Math.max(0.02, Math.min(0.05, 0.03 / Math.sqrt(scale)))})`,
            fontFamily: 'Arial, sans-serif',
            letterSpacing: `${1 * scale}px`,
            whiteSpace: 'nowrap',
            textTransform: 'uppercase',
            userSelect: 'none',
          }}
        >
          JLPT4YOU
        </div>
        
        <div
          className="absolute"
          style={{
            top: '85%',
            left: '25%',
            transform: 'translate(-50%, -50%) rotate(-45deg)',
            fontSize: `${Math.max(14, 24 * scale)}px`,
            fontWeight: 'bold',
            color: `rgba(0, 0, 0, ${Math.max(0.02, Math.min(0.05, 0.03 / Math.sqrt(scale)))})`,
            fontFamily: 'Arial, sans-serif',
            letterSpacing: `${1 * scale}px`,
            whiteSpace: 'nowrap',
            textTransform: 'uppercase',
            userSelect: 'none',
          }}
        >
          JLPT4YOU
        </div>
      </div>
    </>
  )
}

export default PDFWatermark
