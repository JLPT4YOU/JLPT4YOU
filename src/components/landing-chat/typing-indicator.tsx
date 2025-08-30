"use client"

import { motion } from "framer-motion"
import { TranslationData } from "@/lib/i18n"
import { useTranslation } from "@/lib/use-translation"

interface TypingIndicatorProps {
  translations: TranslationData
  className?: string
}

export function TypingIndicator({ translations, className = "" }: TypingIndicatorProps) {
  const { t } = useTranslation(translations)

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="flex items-center gap-1">
        {[0, 1, 2].map((index) => (
          <motion.div
            key={index}
            className="w-2 h-2 bg-muted-foreground rounded-full"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.5, 1, 0.5],
            }}
            transition={{
              duration: 1,
              repeat: Infinity,
              delay: index * 0.2,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>
      <span className="text-sm text-muted-foreground">{t('landingChat.interface.typing')}</span>
    </div>
  )
}
