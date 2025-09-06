"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { GraduationCap } from "lucide-react"

import { TranslationData } from "@/lib/i18n/"
import { useTranslation } from "@/lib/use-translation"

interface ChatBubbleProps {
  isOpen: boolean
  onToggle: () => void
  translations: TranslationData
  className?: string
}

export function ChatBubble({ isOpen, onToggle, translations, className = "" }: ChatBubbleProps) {
  const { t } = useTranslation(translations)
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0)
  const [showSpeechBubble, setShowSpeechBubble] = useState(false)

  // Các câu nói của iRIN theo ngôn ngữ
  const getMessages = () => {
    // Detect language từ URL hoặc translation data
    const currentLang = typeof window !== 'undefined' ?
      window.location.pathname.split('/')[1] : 'vn'

    const messages: Record<string, string[]> = {
      vn: [
        "Xin chào ! Cô là iRIN, giáo viên của JLPT4YOU.",
        "Em có thắc mắc gì về JLPT4YOU không ?",
        "Cùng cô iRIN trinh phục JLPT thôi nào !"
      ],
      en: [
        "Hello! I'm iRIN, teacher of JLPT4YOU platform.",
        "Do you have any questions about JLPT4YOU?",
        "Let's conquer JLPT together with iRIN!"
      ],
      jp: [
        "こんにちは！私はiRIN、JLPT4YOUの先生です。",
        "JLPT4YOUについて何かご質問はありますか？",
        "iRINと一緒にJLPTを攻略しましょう！"
      ]
    }

    return messages[currentLang] || messages.vn
  }

  const messages = getMessages()

  // Hiển thị speech bubble sau 3 giây và luân phiên các câu
  useEffect(() => {
    if (!isOpen) {
      const showTimer = setTimeout(() => {
        setShowSpeechBubble(true)
      }, 3000) // Hiện sau 3 giây

      const messageTimer = setInterval(() => {
        setCurrentMessageIndex((prev) => (prev + 1) % messages.length)
      }, 3000) // Đổi câu mỗi 3 giây

      return () => {
        clearTimeout(showTimer)
        clearInterval(messageTimer)
      }
    } else {
      setShowSpeechBubble(false)
    }
  }, [isOpen, messages.length])

  return (
    <>
      {/* Speech Bubble */}
      <AnimatePresence>
        {!isOpen && showSpeechBubble && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.8 }}
            transition={{ duration: 0.3 }}
            className="fixed bottom-24 right-2 z-50 max-w-lg"
          >
            <div className="bg-background border border-border rounded-2xl px-4 py-3 md:px-5 md:py-4 shadow-lg">
              <motion.p
                key={currentMessageIndex}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="text-sm md:text-sm text-foreground font-normal md:font-normal leading-relaxed"
              >
                {messages[currentMessageIndex]}
              </motion.p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Bubble Button - Ẩn khi chat đang mở */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            className={`fixed bottom-6 right-6 z-50 ${className}`}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{
              type: "spring",
              stiffness: 260,
              damping: 20,
              delay: isOpen ? 0 : 1.5 // Delay chỉ khi lần đầu hiện
            }}
          >
            <div
              onClick={onToggle}
              className="chat-bubble-button"
              role="button"
              aria-label={t('landingChat.bubble.openLabel')}
              aria-expanded={isOpen}
              aria-controls="chat-interface"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  onToggle()
                }
              }}
            >
              <GraduationCap className="w-6 h-6 text-foreground" />

              {/* Pulse Animation */}
              <motion.div
                className="absolute inset-0 rounded-full bg-foreground/20"
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.7, 0, 0.7],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
            </div>


          </motion.div>
        )}
      </AnimatePresence>

      {/* Perfect Circle Chat Bubble & Speech Bubble Styles */}
      <style jsx>{`
        /* Force perfect circle shape */
        .chat-bubble-button {
          width: 56px;
          height: 56px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          background: var(--background);
          color: var(--foreground);
          border: none;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
          cursor: pointer;
          transition: all 0.3s ease-out;
          outline: none;
          overflow: hidden;
        }

        .chat-bubble-button:hover {
          background: var(--muted);
          transform: scale(1.1);
        }

        .chat-bubble-button:focus {
          transform: scale(1.1);
          outline: none;
        }

        /* Mobile responsive for speech bubble */
        @media (max-width: 640px) {
          .fixed.bottom-24.right-2 {
            bottom: 4.5rem;
            right: 0.5rem;
            max-width: calc(100vw - 1rem);
          }
        }

        @media (max-width: 480px) {
          .fixed.bottom-24.right-2 {
            bottom: 4rem;
            max-width: calc(100vw - 0.5rem);
            right: 0.25rem;
          }
        }

        @media (max-width: 640px) {
          .fixed.bottom-6.right-6 {
            bottom: 1rem;
            right: 1rem;
          }
          .chat-bubble-button {
            width: 48px;
            height: 48px;
          }
        }

        @media (max-width: 480px) {
          .fixed.bottom-6.right-6 {
            bottom: 0.75rem;
            right: 0.75rem;
          }
          .chat-bubble-button {
            width: 44px;
            height: 44px;
          }
        }

        /* High contrast mode support */
        @media (prefers-contrast: high) {
          .chat-bubble-button {
            box-shadow: 0 10px 20px -3px rgba(0, 0, 0, 0.2), 0 4px 8px -2px rgba(0, 0, 0, 0.1);
          }
        }

        /* Reduced motion support */
        @media (prefers-reduced-motion: reduce) {
          .fixed.bottom-6.right-6 * {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
          }
        }
      `}</style>
    </>
  )
}
