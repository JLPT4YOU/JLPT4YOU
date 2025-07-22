"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Bot, CheckCircle, XCircle } from "lucide-react"

// Demo Question Data - fallback for development
const fallbackDemoQuestion = {
  id: 1,
  level: "N3",
  type: "Từ vựng",
  question: "次の文の（　）に入れるのに最もよいものを、1・2・3・4から一つ選びなさい。",
  sentence: "昨日は雨が（　）降っていました。",
  furigana: "きのうはあめが（　）ふっていました。",
  options: [
    { id: "A", text: "強く", furigana: "つよく", isCorrect: true },
    { id: "B", text: "高く", furigana: "たかく", isCorrect: false },
    { id: "C", text: "早く", furigana: "はやく", isCorrect: false },
    { id: "D", text: "近く", furigana: "ちかく", isCorrect: false }
  ],
  explanation: "正解は「強く」です。雨が「強く降る」は自然な日本語表現です。「高く」は高さを表し、「早く」は速度を表し、「近く」は距離を表すため、雨の強さを表現するには適していません。「強く降る」は雨の勢いや激しさを表現する正しい使い方です。"
}

// Typewriter Hook
const useTypewriter = (text: string, speed: number = 60) => {
  const [displayText, setDisplayText] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [showCursor, setShowCursor] = useState(true)

  useEffect(() => {
    if (!text) return

    try {
      setIsTyping(true)
      setDisplayText("")
      let index = 0

      const timer = setInterval(() => {
        try {
          if (index < text.length) {
            setDisplayText(text.slice(0, index + 1))
            index++
          } else {
            setIsTyping(false)
            clearInterval(timer)
          }
        } catch (error) {
          console.error('Typewriter effect error:', error)
          setIsTyping(false)
          clearInterval(timer)
        }
      }, speed)

      return () => clearInterval(timer)
    } catch (error) {
      console.error('Typewriter initialization error:', error)
      setIsTyping(false)
    }
  }, [text, speed])

  // Cursor blinking effect
  useEffect(() => {
    const cursorTimer = setInterval(() => {
      setShowCursor(prev => !prev)
    }, 500)

    return () => clearInterval(cursorTimer)
  }, [])

  return { displayText, isTyping, showCursor }
}

import { TranslationData } from "@/lib/i18n"
import { useTranslation } from "@/lib/use-translation"

interface AIExplanationDemoProps {
  translations: TranslationData
}

// AI Explanation Demo Component
export const AIExplanationDemo = ({ translations }: AIExplanationDemoProps) => {
  const { t } = useTranslation(translations)
  const [selectedOption, setSelectedOption] = useState<string | null>(null)
  const [showExplanation, setShowExplanation] = useState(false)
  const [startTypewriter, setStartTypewriter] = useState(false)

  // Get demo question data from translations with fallback
  const demoQuestion = fallbackDemoQuestion

  const { displayText, isTyping, showCursor } = useTypewriter(
    startTypewriter ? demoQuestion.explanation : "",
    70
  )

  const handleOptionSelect = (optionId: string) => {
    setSelectedOption(optionId)
    // Chỉ hiện đúng/sai, không hiện explanation ngay
  }

  const handleShowExplanation = () => {
    setShowExplanation(true)
    setStartTypewriter(true)
  }



  const resetDemo = () => {
    setSelectedOption(null)
    setShowExplanation(false)
    setStartTypewriter(false)
  }

  return (
    <section id="ai-demo-section" className="relative bg-background py-16 md:py-20 lg:py-24">
      <div className="app-container app-section">
        <div className="app-content">
          {/* Section Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12 md:mb-16"
          >
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4">
              {t('aiDemo.title')}
            </h2>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              {t('aiDemo.subtitle')}
            </p>
          </motion.div>

          {/* Demo Question Card */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="max-w-4xl mx-auto"
          >
            <div className="bg-background rounded-2xl border border-border/50 p-6 md:p-8 shadow-lg">
              {/* Question Header */}
              <div className="flex items-center gap-3 mb-6">
                <div className="px-3 py-1 bg-muted/20 rounded-lg text-sm font-medium text-foreground">
                  {demoQuestion.level}
                </div>
                <div className="px-3 py-1 bg-muted/20 rounded-lg text-sm font-medium text-foreground">
                  {demoQuestion.type}
                </div>
              </div>

              {/* Question Text */}
              <div className="mb-6">
                <p className="text-base md:text-lg text-foreground mb-4 leading-relaxed">
                  {demoQuestion.question}
                </p>
                <div className="bg-muted/10 rounded-xl p-4">
                  <p className="text-lg md:text-xl text-foreground font-medium mb-2">
                    {demoQuestion.sentence}
                  </p>
                  <p className="text-sm md:text-base text-muted-foreground">
                    {demoQuestion.furigana}
                  </p>
                </div>
              </div>

              {/* Options */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
                {demoQuestion.options.map((option) => (
                  <motion.button
                    key={option.id}
                    onClick={() => handleOptionSelect(option.id)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`p-4 rounded-xl border-2 text-left transition-all duration-300 ${
                      selectedOption === option.id
                        ? option.isCorrect
                          ? "status-correct-outline"
                          : "status-incorrect-outline"
                        : "border-border/50 hover:border-border bg-background"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full border-2 border-current flex items-center justify-center text-sm font-medium">
                          {option.id}
                        </span>
                        {selectedOption === option.id && (
                          option.isCorrect ? (
                            <CheckCircle className="w-5 h-5 text-green-500" />
                          ) : (
                            <XCircle className="w-5 h-5 text-red-500" />
                          )
                        )}
                      </div>
                      <div>
                        <span className="text-base md:text-lg font-medium text-foreground">
                          {option.text}
                        </span>
                        <div className="text-sm text-muted-foreground">
                          {option.furigana}
                        </div>
                      </div>
                    </div>
                  </motion.button>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 mb-6">
                {selectedOption && !showExplanation && (
                  <motion.button
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    onClick={handleShowExplanation}
                    className="flex items-center justify-center gap-2 px-6 py-3 bg-foreground text-background rounded-xl font-medium hover:bg-foreground/90 transition-colors"
                  >
                    <Bot className="w-5 h-5" />
                    {t('aiDemo.buttons.showExplanation')}
                  </motion.button>
                )}

                {showExplanation && (
                  <motion.button
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    onClick={resetDemo}
                    className="px-6 py-3 border border-border rounded-xl font-medium text-foreground hover:bg-muted/10 transition-colors"
                  >
                    {t('aiDemo.buttons.tryAgain')}
                  </motion.button>
                )}
              </div>

              {/* AI Explanation */}
              <AnimatePresence>
                {showExplanation && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.5 }}
                    className="border-t border-border/50 pt-6 space-y-4"
                  >
                    {/* Text appears first */}
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: 0.2 }}
                      className="text-base md:text-lg text-foreground leading-relaxed"
                    >
                      {displayText}
                      {(isTyping || showCursor) && (
                        <span className={`inline-block w-0.5 h-5 bg-foreground ml-1 ${showCursor ? 'opacity-100' : 'opacity-0'}`} />
                      )}
                    </motion.div>

                    {/* iRIN Sensei avatar appears after text is done */}
                    <AnimatePresence>
                      {!isTyping && displayText.length > 0 && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.4, delay: 0.5 }}
                          className="flex items-start gap-3"
                        >
                          <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center flex-shrink-0">
                            <Bot className="w-5 h-5 text-foreground" />
                          </div>
                          <div className="flex-1">
                            <span className="text-sm font-medium text-foreground">{t('aiDemo.sensei')}</span>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
