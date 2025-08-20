"use client"

import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ArrowUp, GraduationCap, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ChatMessageComponent, ChatMessage } from "./chat-message"
import { TypingIndicator } from "./typing-indicator"
import { TranslationData } from "@/lib/i18n"
import { useTranslation } from "@/lib/use-translation"

interface ChatInterfaceProps {
  isOpen: boolean
  onClose: () => void
  translations: TranslationData
  className?: string
}

export function ChatInterface({ isOpen, onClose, translations, className = "" }: ChatInterfaceProps) {
  const { t } = useTranslation(translations)

  // Initial messages với translation
  const initialMessages: ChatMessage[] = [
    {
      id: '1',
      content: t('landingChat.interface.welcomeMessage'),
      sender: 'ai',
      timestamp: new Date()
    }
  ]

  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages)
  const [inputValue, setInputValue] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [shouldFocusAfterResponse, setShouldFocusAfterResponse] = useState(false)
  const [isRateLimited, setIsRateLimited] = useState(false)
  const [rateLimitMessage, setRateLimitMessage] = useState("")
  const [retryAfter, setRetryAfter] = useState<number | null>(null)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Helper function to format time remaining
  const formatTimeRemaining = (timestamp: number): string => {
    const now = Date.now()
    const diff = Math.max(0, timestamp - now)
    const minutes = Math.floor(diff / 60000)
    const seconds = Math.floor((diff % 60000) / 1000)

    if (minutes > 0) {
      return `${minutes} phút ${seconds} giây`
    }
    return `${seconds} giây`
  }

  // Helper function to handle rate limit errors
  const handleRateLimitError = (error: any) => {


    if (error.code === 'IP_BLOCKED' && error.blockUntil) {
      const minutes = Math.ceil((error.blockUntil - Date.now()) / 60000)
      const message = t('landingChat.interface.spamBlockError').replace('{minutes}', minutes.toString())
      setRateLimitMessage(message)
      setRetryAfter(error.blockUntil)
    } else if (error.retryAfter) {
      const timeStr = formatTimeRemaining(error.retryAfter)
      const message = t('landingChat.interface.rateLimitError').replace('{time}', timeStr)
      setRateLimitMessage(message)
      setRetryAfter(error.retryAfter)
    } else {
      setRateLimitMessage(t('landingChat.interface.errorMessage'))
    }

    setIsRateLimited(true)
  }

  // Auto scroll to bottom when new message
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages, isTyping])

  // Focus textarea when opened
  useEffect(() => {
    if (isOpen && textareaRef.current) {
      setTimeout(() => textareaRef.current?.focus(), 300)
    }
  }, [isOpen])

  // Auto-focus textarea after AI finishes responding
  useEffect(() => {
    if (!isTyping && shouldFocusAfterResponse && textareaRef.current && isOpen) {
      // Small delay to ensure DOM updates are complete
      setTimeout(() => {
        textareaRef.current?.focus()
        setShouldFocusAfterResponse(false) // Reset flag after focusing
      }, 100)
    }
  }, [isTyping, shouldFocusAfterResponse, isOpen])

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = 'auto'
      const scrollHeight = textarea.scrollHeight
      const lineHeight = parseInt(window.getComputedStyle(textarea).lineHeight)
      const maxHeight = lineHeight * 4 // 4 lines max
      textarea.style.height = Math.min(scrollHeight, maxHeight) + 'px'
    }
  }, [inputValue])

  // Handle rate limit countdown
  useEffect(() => {
    if (!retryAfter) return

    const interval = setInterval(() => {
      const now = Date.now()
      if (now >= retryAfter) {
        setIsRateLimited(false)
        setRateLimitMessage("")
        setRetryAfter(null)
        clearInterval(interval)
      } else {
        // Update countdown message
        const timeStr = formatTimeRemaining(retryAfter)
        const baseMessage = rateLimitMessage.includes('phút')
          ? t('landingChat.interface.spamBlockError')
          : t('landingChat.interface.rateLimitError')

        if (baseMessage.includes('{minutes}')) {
          const minutes = Math.ceil((retryAfter - now) / 60000)
          setRateLimitMessage(baseMessage.replace('{minutes}', minutes.toString()))
        } else {
          setRateLimitMessage(baseMessage.replace('{time}', timeStr))
        }
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [retryAfter, rateLimitMessage, t])

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      content: inputValue.trim(),
      sender: 'user',
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputValue("")
    setIsTyping(true)
    setShouldFocusAfterResponse(true) // Set flag to focus after AI responds

    // Create AI message placeholder for streaming
    const aiMessageId = (Date.now() + 1).toString()
    const aiMessage: ChatMessage = {
      id: aiMessageId,
      content: '',
      sender: 'ai',
      timestamp: new Date()
    }
    
    setMessages(prev => [...prev, aiMessage])

    try {
      // Call streaming API
      const response = await fetch('/api/landing-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [
            ...messages.map(msg => ({
              role: msg.sender === 'user' ? 'user' : 'assistant',
              content: msg.content
            })),
            { role: 'user', content: userMessage.content }
          ],
          language: typeof window !== 'undefined' ? 
            window.location.pathname.split('/')[1] || 'vn' : 'vn',
          stream: true
        }),
      })

      if (!response.ok) {
        if (response.status === 429) {
          // Handle rate limiting
          const errorData = await response.json()
          handleRateLimitError(errorData)

          // Remove the AI message placeholder since we won't get a response
          setMessages(prev => prev.filter(msg => msg.id !== aiMessageId))
          return
        }
        throw new Error('Failed to get response')
      }

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      
      if (!reader) {
        throw new Error('No response body')
      }

      let buffer = ''
      
      while (true) {
        const { done, value } = await reader.read()
        
        if (done) break
        
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        
        // Keep the last incomplete line in buffer
        buffer = lines.pop() || ''
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6))
              
              if (data.error) {
                throw new Error(data.error)
              }
              
              if (data.content) {
                // Update AI message content with streaming data
                setMessages(prev => prev.map(msg => 
                  msg.id === aiMessageId 
                    ? { ...msg, content: msg.content + data.content }
                    : msg
                ))
              }
              
              if (data.isComplete) {
                setIsTyping(false)
                break
              }
            } catch (parseError) {
              console.error('Error parsing streaming data:', parseError)
            }
          }
        }
      }
      
    } catch (error) {
      // Only log errors in development
      if (process.env.NODE_ENV === 'development') {
        console.error('Chat error:', error)
      }

      // Update AI message with error content
      const errorContent = t('landingChat.interface.errorMessage') || 'Xin lỗi, hiện tại tôi không thể trả lời. Vui lòng thử lại sau!'
      
      setMessages(prev => prev.map(msg => 
        msg.id === aiMessageId 
          ? { ...msg, content: errorContent }
          : msg
      ))
    } finally {
      setIsTyping(false)
    }
  }




  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop for mobile */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/20 z-40 md:hidden"
            onClick={onClose}
          />

          {/* Chat Interface */}
          <motion.div
            initial={{
              opacity: 0,
              scale: 0.8,
              x: 100,
              y: 100
            }}
            animate={{
              opacity: 1,
              scale: 1,
              x: 0,
              y: 0
            }}
            exit={{
              opacity: 0,
              scale: 0.8,
              x: 100,
              y: 100
            }}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 30
            }}
            className={`
              fixed z-50 bg-background rounded-2xl shadow-2xl border border-border
              md:bottom-6 md:right-6 md:w-96 md:h-[500px]
              bottom-4 right-4 w-[calc(100%-2rem)] h-[calc(100%-2rem)] max-w-sm max-h-[600px]
              md:top-auto md:left-auto
              flex flex-col overflow-hidden
              ${className}
            `}
            id="chat-interface"
            role="dialog"
            aria-modal="true"
            aria-labelledby="chat-title"
            aria-describedby="chat-description"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 bg-muted/30">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                  <GraduationCap className="w-5 h-5 text-primary-foreground" />
                </div>
                <div>
                  <h3 id="chat-title" className="text-lg font-bold text-foreground">{t('landingChat.interface.title')}</h3>
                  <p id="chat-description" className="text-xs text-muted-foreground">{t('landingChat.interface.subtitle')}</p>
                </div>
              </div>

              {/* Close Button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="w-8 h-8 p-0 hover:bg-muted focus:outline-none focus:ring-0 focus-visible:ring-0"
                aria-label="Đóng chat"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-hidden flex flex-col">
                  <div
                    className="flex-1 overflow-y-auto p-4 space-y-4"
                    role="log"
                    aria-live="polite"
                    aria-label="Chat messages"
                  >
                    {messages.map((message) => (
                      <ChatMessageComponent
                        key={message.id}
                        message={message}
                      />
                    ))}

                    {isTyping && (
                      <TypingIndicator className="" translations={translations} />
                    )}

                    <div ref={messagesEndRef} />
                  </div>

                  {/* Rate Limit Warning */}
                  {isRateLimited && rateLimitMessage && (
                    <div className="px-4 py-2 bg-destructive/10 border-t border-destructive/20">
                      <p className="text-sm text-destructive font-medium">
                        {rateLimitMessage}
                      </p>
                    </div>
                  )}

                  {/* Input Area */}
                  <div className="p-4 bg-background">
                    <form onSubmit={(e) => { e.preventDefault(); if (!isRateLimited) handleSendMessage(); }}>
                      <div className="relative">
                        <textarea
                          ref={textareaRef}
                          value={inputValue}
                          onChange={(e) => setInputValue(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey && !isRateLimited) {
                              e.preventDefault()
                              handleSendMessage()
                            }
                          }}
                          placeholder={isRateLimited
                            ? t('landingChat.interface.inputDisabled')
                            : t('landingChat.interface.placeholder')
                          }
                          className={`w-full resize-none pr-12 border-0 focus-none bg-input rounded-md px-3 py-2 text-sm leading-relaxed overflow-y-auto text-foreground placeholder:text-muted-foreground ${
                            isRateLimited ? 'opacity-50 cursor-not-allowed' : ''
                          }`}
                          style={{ minHeight: '2.5rem' }}
                          disabled={isTyping || isRateLimited}
                          aria-label={isRateLimited
                            ? t('landingChat.interface.inputDisabled')
                            : t('landingChat.interface.placeholder')
                          }
                          maxLength={500}
                          rows={2}
                        />
                        <Button
                          type="submit"
                          onClick={handleSendMessage}
                          disabled={!inputValue.trim() || isTyping || isRateLimited}
                          size="sm"
                          className={`absolute right-2 bottom-2 w-8 h-8 p-0 rounded-full bg-primary hover:bg-primary/90 focus:outline-none focus:ring-0 focus-visible:ring-0 ${
                            isRateLimited ? 'opacity-50 cursor-not-allowed' : ''
                          }`}
                          aria-label="Send message"
                        >
                          <ArrowUp className="w-4 h-4" />
                        </Button>
                      </div>
                    </form>
                  </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

// Add responsive styles for better mobile experience
const responsiveStyles = `
  /* Base font size - responsive sizing for desktop */
  #chat-interface {
    font-size: 14px !important;
    --chat-font-size: 14px !important;
  }

  /* Header text sizing */
  #chat-interface .text-lg {
    font-size: 16px !important;
  }

  #chat-interface .text-xs {
    font-size: 11px !important;
  }

  /* Chat message markdown styles */
  .chat-message-content .markdown-content {
    font-size: inherit !important;
  }
  
  .chat-message-content p,
  .chat-message-content div {
    margin-bottom: 0.5rem;
  }
  
  .chat-message-content p:last-child,
  .chat-message-content div:last-child {
    margin-bottom: 0;
  }
  
  .chat-message-content pre {
    margin: 0.5rem 0;
    font-size: 0.875em;
  }
  
  .chat-message-content ul,
  .chat-message-content ol {
    margin: 0.5rem 0;
    padding-left: 1.5rem;
  }
  
  .chat-message-content li {
    margin: 0.25rem 0;
  }
  
  .chat-message-content h1,
  .chat-message-content h2,
  .chat-message-content h3,
  .chat-message-content h4,
  .chat-message-content h5,
  .chat-message-content h6 {
    margin-top: 0.75rem;
    margin-bottom: 0.5rem;
  }
  
  .chat-message-content h1:first-child,
  .chat-message-content h2:first-child,
  .chat-message-content h3:first-child,
  .chat-message-content h4:first-child,
  .chat-message-content h5:first-child,
  .chat-message-content h6:first-child {
    margin-top: 0;
  }


  
  /* Mobile screens */
  @media (max-width: 480px) {
    #chat-interface {
      font-size: 14px !important;
      --chat-font-size: 14px !important;
      bottom: 1rem !important;
      right: 1rem !important;
      width: calc(100% - 2rem) !important;
      max-height: 70vh !important;
    }
  }

  /* Small height screens */
  @media (max-height: 600px) {
    #chat-interface {
      max-height: calc(100vh - 2rem) !important;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    #chat-interface * {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
    }
  }
`

// Inject styles
if (typeof document !== 'undefined') {
  const styleElement = document.createElement('style')
  styleElement.textContent = responsiveStyles
  document.head.appendChild(styleElement)
}
