"use client"

import { motion } from "framer-motion"
import { useEffect, useState } from "react"
import { GraduationCap } from "lucide-react"

interface SimpleTetrisAnimationProps {
  isVisible: boolean
}

export function SimpleTetrisAnimation({ isVisible }: SimpleTetrisAnimationProps) {
  const [animationStarted, setAnimationStarted] = useState(false)
  const letters = ['J', 'L', 'P', 'T', '4', 'Y', 'O', 'U']
  
  useEffect(() => {
    if (isVisible && !animationStarted) {
      setAnimationStarted(true)
    }
  }, [isVisible, animationStarted])

  if (!animationStarted) {
    return (
      <div className="relative flex items-center justify-center h-32 w-full max-w-2xl mx-auto">
        {/* Empty space - no placeholder text */}
      </div>
    )
  }

  return (
    <div className="relative flex items-center justify-center h-32 w-full max-w-2xl mx-auto">
      <div className="flex items-center justify-center space-x-0">
        {/* Graduation Cap Icon */}
        <motion.div
          className="flex items-center justify-center"
          initial={{
            y: -300,
            opacity: 0,
            rotate: Math.random() * 180 - 90,
            scale: 0.2,
          }}
          animate={{
            y: 0,
            opacity: 1,
            rotate: 0,
            scale: 1,
          }}
          transition={{
            duration: 1.5,
            delay: -0.2, // Start before the letters
            ease: [0.25, 0.46, 0.45, 0.94],
            type: "spring",
            stiffness: 120,
            damping: 12,
          }}
          whileHover={{
            scale: 1.15,
            y: -5,
            transition: { duration: 0.2 }
          }}
        >
          <GraduationCap className="w-12 h-12 md:w-14 md:h-14 lg:w-16 lg:h-16 text-primary mr-1" />
        </motion.div>

        {letters.map((letter, index) => (
          <motion.div
            key={letter}
            className={`text-4xl md:text-5xl lg:text-6xl font-black tracking-tight ${
              index % 2 === 0 ? 'text-foreground' : 'text-primary'
            }`}
            initial={{
              y: -300,
              opacity: 0,
              rotate: Math.random() * 180 - 90,
              scale: 0.2,
            }}
            animate={{
              y: 0,
              opacity: 1,
              rotate: 0,
              scale: 1,
            }}
            transition={{
              duration: 1.5,
              delay: index * 0.25, // Sequential letter drops
              ease: [0.25, 0.46, 0.45, 0.94],
              type: "spring",
              stiffness: 120,
              damping: 12,
            }}
            whileHover={{
              scale: 1.15,
              y: -5,
              transition: { duration: 0.2 }
            }}
          >
            {letter}
          </motion.div>
        ))}
      </div>
      
      {/* Clean animation - no shadow overlay */}
    </div>
  )
}
