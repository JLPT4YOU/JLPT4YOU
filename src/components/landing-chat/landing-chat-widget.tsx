"use client"

import { useState } from "react"
import { ChatBubble } from "./chat-bubble"
import { ChatInterface } from "./chat-interface"
import { TranslationData } from "@/lib/i18n"

interface LandingChatWidgetProps {
  translations: TranslationData
  className?: string
}

/**
 * Landing Chat Widget - Tổng hợp chat bubble và interface
 * Component chính để tích hợp vào landing page
 */
export function LandingChatWidget({ translations, className = "" }: LandingChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false)

  const handleToggle = () => {
    setIsOpen(!isOpen)
  }

  const handleClose = () => {
    setIsOpen(false)
  }

  return (
    <div className={`${className}`}>
      {/* Chat Bubble */}
      <ChatBubble
        isOpen={isOpen}
        onToggle={handleToggle}
        translations={translations}
      />

      {/* Chat Interface */}
      <ChatInterface
        isOpen={isOpen}
        onClose={handleClose}
        translations={translations}
      />
    </div>
  )
}
