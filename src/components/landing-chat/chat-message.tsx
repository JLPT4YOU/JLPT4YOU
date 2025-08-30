"use client"

import { motion } from "framer-motion"
import { MarkdownRenderer } from "@/components/chat/MarkdownRenderer"

export interface ChatMessage {
  id: string
  content: string
  sender: 'user' | 'ai'
  timestamp: Date
}

interface ChatMessageProps {
  message: ChatMessage
  isLast?: boolean
  className?: string
}

export function ChatMessageComponent({ message, isLast = false, className = "" }: ChatMessageProps) {
  const isUser = message.sender === 'user'

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`flex ${isUser ? 'justify-end' : 'justify-start'} ${className}`}
      role="article"
      aria-label={`Message from ${isUser ? 'you' : 'AI assistant'}`}
    >
      {/* Message Bubble */}
      <div className={`
        max-w-[80%] text-sm md:text-base font-normal leading-relaxed
        ${isUser
          ? 'bg-muted rounded-2xl px-3 py-2 text-muted-foreground rounded-br-md'
          : 'text-foreground w-full max-w-none'
        }
      `}>
        <MarkdownRenderer 
          content={message.content} 
          className="chat-message-content"
        />
      </div>
    </motion.div>
  )
}
