"use client"

import { motion } from "framer-motion"
import { GraduationCap } from "lucide-react"
import { useEffect, useState } from "react"

interface LoadingScreenProps {
  isVisible: boolean
  onComplete?: () => void
  duration?: number
  message?: string
}

export function LoadingScreen({
  isVisible,
  onComplete,
  duration = 2000,
  message = "Đang tải..."
}: LoadingScreenProps) {
  const [showContent, setShowContent] = useState(false)
  
  useEffect(() => {
    if (isVisible) {
      setShowContent(true)
      const timer = setTimeout(() => {
        onComplete?.()
      }, duration)
      
      return () => clearTimeout(timer)
    } else {
      setShowContent(false)
    }
  }, [isVisible, duration, onComplete])

  if (!showContent) return null

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-background"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex flex-col items-center space-y-8">
        {/* Graduation Cap Icon with Animation */}
        <motion.div
          className="relative"
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{
            duration: 0.8,
            ease: [0.25, 0.46, 0.45, 0.94],
            delay: 0.2
          }}
        >
          <motion.div
            className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-primary/10 flex items-center justify-center"
            animate={{
              scale: [1, 1.1, 1],
              rotate: [0, 5, -5, 0]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            <GraduationCap className="w-8 h-8 md:w-10 md:h-10 text-primary" />
          </motion.div>
          
          {/* Floating particles around the icon */}
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 bg-primary/30 rounded-full"
              style={{
                left: `${50 + 30 * Math.cos((i * Math.PI * 2) / 6)}%`,
                top: `${50 + 30 * Math.sin((i * Math.PI * 2) / 6)}%`,
              }}
              animate={{
                y: [-10, 10, -10],
                opacity: [0.3, 0.8, 0.3],
                scale: [0.8, 1.2, 0.8]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                delay: i * 0.2,
                ease: "easeInOut"
              }}
            />
          ))}
        </motion.div>

        {/* JLPT4YOU Text with Wave Animation */}
        <div className="flex items-center space-x-1">
          {"JLPT4YOU".split("").map((letter, index) => (
            <motion.span
              key={index}
              className="text-3xl md:text-4xl lg:text-5xl font-black text-foreground"
              initial={{ 
                y: 50, 
                opacity: 0,
                rotateX: -90
              }}
              animate={{ 
                y: [50, -10, 0], 
                opacity: 1,
                rotateX: 0
              }}
              transition={{
                duration: 0.6,
                delay: 0.8 + index * 0.1,
                ease: [0.25, 0.46, 0.45, 0.94]
              }}
              style={{
                transformOrigin: "center bottom"
              }}
            >
              {letter}
            </motion.span>
          ))}
        </div>

        {/* Loading Progress Bar */}
        <motion.div
          className="w-48 md:w-64 h-1 bg-muted rounded-full overflow-hidden"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1.5, duration: 0.3 }}
        >
          <motion.div
            className="h-full bg-gradient-to-r from-primary to-primary/60 rounded-full"
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{
              duration: duration / 1000 - 0.5,
              delay: 1.5,
              ease: "easeInOut"
            }}
          />
        </motion.div>

        {/* Loading Text */}
        <motion.p
          className="text-sm md:text-base text-muted-foreground font-medium"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 0.7, 1] }}
          transition={{
            duration: 1.5,
            delay: 1.8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          {message}
        </motion.p>
      </div>
    </motion.div>
  )
}
