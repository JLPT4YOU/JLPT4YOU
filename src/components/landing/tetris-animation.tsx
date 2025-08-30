"use client"

import { motion } from "framer-motion"
import { useEffect, useState } from "react"

// Improved Tetris block shapes for clear letter formation
const TETRIS_BLOCKS = {
  J: [
    { x: 1, y: 0, color: 'bg-primary' },
    { x: 1, y: 1, color: 'bg-primary' },
    { x: 1, y: 2, color: 'bg-primary' },
    { x: 1, y: 3, color: 'bg-primary' },
    { x: 0, y: 3, color: 'bg-primary' },
  ],
  L: [
    { x: 0, y: 0, color: 'bg-foreground' },
    { x: 0, y: 1, color: 'bg-foreground' },
    { x: 0, y: 2, color: 'bg-foreground' },
    { x: 0, y: 3, color: 'bg-foreground' },
    { x: 1, y: 3, color: 'bg-foreground' },
  ],
  P: [
    { x: 0, y: 0, color: 'bg-primary' },
    { x: 0, y: 1, color: 'bg-primary' },
    { x: 0, y: 2, color: 'bg-primary' },
    { x: 0, y: 3, color: 'bg-primary' },
    { x: 1, y: 0, color: 'bg-primary' },
    { x: 1, y: 1, color: 'bg-primary' },
  ],
  T: [
    { x: -1, y: 0, color: 'bg-foreground' },
    { x: 0, y: 0, color: 'bg-foreground' },
    { x: 1, y: 0, color: 'bg-foreground' },
    { x: 0, y: 1, color: 'bg-foreground' },
    { x: 0, y: 2, color: 'bg-foreground' },
    { x: 0, y: 3, color: 'bg-foreground' },
  ],
  '4': [
    { x: 0, y: 0, color: 'bg-primary' },
    { x: 0, y: 1, color: 'bg-primary' },
    { x: 1, y: 0, color: 'bg-primary' },
    { x: 1, y: 1, color: 'bg-primary' },
    { x: 1, y: 2, color: 'bg-primary' },
    { x: 1, y: 3, color: 'bg-primary' },
    { x: -1, y: 1, color: 'bg-primary' },
  ],
  Y: [
    { x: -1, y: 0, color: 'bg-foreground' },
    { x: 1, y: 0, color: 'bg-foreground' },
    { x: -1, y: 1, color: 'bg-foreground' },
    { x: 1, y: 1, color: 'bg-foreground' },
    { x: 0, y: 2, color: 'bg-foreground' },
    { x: 0, y: 3, color: 'bg-foreground' },
  ],
  O: [
    { x: -1, y: 0, color: 'bg-primary' },
    { x: 0, y: 0, color: 'bg-primary' },
    { x: 1, y: 0, color: 'bg-primary' },
    { x: -1, y: 1, color: 'bg-primary' },
    { x: 1, y: 1, color: 'bg-primary' },
    { x: -1, y: 2, color: 'bg-primary' },
    { x: 1, y: 2, color: 'bg-primary' },
    { x: -1, y: 3, color: 'bg-primary' },
    { x: 0, y: 3, color: 'bg-primary' },
    { x: 1, y: 3, color: 'bg-primary' },
  ],
  U: [
    { x: -1, y: 0, color: 'bg-foreground' },
    { x: 1, y: 0, color: 'bg-foreground' },
    { x: -1, y: 1, color: 'bg-foreground' },
    { x: 1, y: 1, color: 'bg-foreground' },
    { x: -1, y: 2, color: 'bg-foreground' },
    { x: 1, y: 2, color: 'bg-foreground' },
    { x: -1, y: 3, color: 'bg-foreground' },
    { x: 0, y: 3, color: 'bg-foreground' },
    { x: 1, y: 3, color: 'bg-foreground' },
  ],
}

interface TetrisBlockProps {
  block: { x: number; y: number; color: string }
  letterIndex: number
  blockIndex: number
  baseX: number
  baseY: number
}

function TetrisBlock({ block, letterIndex, blockIndex, baseX, baseY }: TetrisBlockProps) {
  const blockSize = 18 // Larger size for better visibility

  return (
    <motion.div
      className={`absolute w-[18px] h-[18px] ${block.color} border border-background/50 rounded-[2px]`}
      style={{
        left: (baseX + block.x) * blockSize,
        top: (baseY + block.y) * blockSize,
        boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
      }}
      initial={{
        y: -500, // Start from way above
        opacity: 0,
        rotate: Math.random() * 180 - 90,
        scale: 0.5,
      }}
      animate={{
        y: 0, // Land at final position
        opacity: 1,
        rotate: 0,
        scale: 1,
      }}
      transition={{
        duration: 1.8,
        delay: letterIndex * 0.5 + blockIndex * 0.1, // Sequential letter drops
        ease: [0.25, 0.46, 0.45, 0.94],
        opacity: {
          duration: 0.3,
          delay: letterIndex * 0.5 + blockIndex * 0.1 + 1.5,
        }
      }}
      whileHover={{
        scale: 1.1,
        transition: { duration: 0.2 }
      }}
    />
  )
}

interface TetrisAnimationProps {
  isVisible: boolean
}

export function TetrisAnimation({ isVisible }: TetrisAnimationProps) {
  const [animationStarted, setAnimationStarted] = useState(false)
  const letters = ['J', 'L', 'P', 'T', '4', 'Y', 'O', 'U'] as const

  useEffect(() => {
    if (isVisible && !animationStarted) {
      setAnimationStarted(true)
    }
  }, [isVisible, animationStarted])

  if (!animationStarted) {
    return (
      <div className="relative flex items-center justify-center h-40 w-full max-w-2xl mx-auto">
        <div className="text-4xl md:text-5xl lg:text-6xl font-bold text-muted-foreground/20 tracking-wider">
          JLPT4YOU
        </div>
      </div>
    )
  }

  return (
    <div className="relative flex items-center justify-center h-40 w-full max-w-2xl mx-auto overflow-visible">
      {letters.map((letter, letterIndex) => {
        const blocks = TETRIS_BLOCKS[letter]
        const baseX = letterIndex * 6 - (letters.length * 6) / 2 // Better spacing for readability
        const baseY = 2 // Base position

        return (
          <div key={letter} className="relative">
            {blocks.map((block, blockIndex) => (
              <TetrisBlock
                key={`${letter}-${blockIndex}`}
                block={block}
                letterIndex={letterIndex}
                blockIndex={blockIndex}
                baseX={baseX}
                baseY={baseY}
              />
            ))}
          </div>
        )
      })}

      {/* Debug info */}
      <div className="absolute -bottom-8 left-0 right-0 flex justify-center space-x-4 text-xs text-muted-foreground/50">
        {letters.map((letter) => (
          <span key={letter} className="font-mono">
            {letter}
          </span>
        ))}
      </div>
    </div>
  )
}
