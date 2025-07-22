'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { codeToHtml } from 'shiki'
import { useTheme } from 'next-themes'
import { Copy, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface ShikiCodeBlockProps {
  children: string
  className?: string
  inline?: boolean
}

// Cache cho highlighted code để tránh re-render không cần thiết
const codeCache = new Map<string, string>()

const ShikiCodeBlock: React.FC<ShikiCodeBlockProps> = ({ 
  children, 
  className, 
  inline 
}) => {
  const { theme } = useTheme()
  const [copied, setCopied] = useState(false)
  const [highlightedHtml, setHighlightedHtml] = useState<string>('')
  const [isLoading, setIsLoading] = useState(true)
  
  // Extract language từ className (format: "language-javascript")
  const match = /language-(\w+)/.exec(className || '')
  const language = match ? match[1] : 'text'

  // Tạo cache key duy nhất
  const cacheKey = useMemo(() => {
    return `${children}-${language}-${theme}`
  }, [children, language, theme])

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(children)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy code:', err)
    }
  }

  // Highlight code với Shiki
  useEffect(() => {
    const highlightCode = async () => {
      // Kiểm tra cache trước
      if (codeCache.has(cacheKey)) {
        setHighlightedHtml(codeCache.get(cacheKey)!)
        setIsLoading(false)
        return
      }

      try {
        setIsLoading(true)

        // Sử dụng Min themes cho dark/light mode
        const currentTheme = theme === 'dark' ? 'min-dark' : 'min-light'

        const html = await codeToHtml(children, {
          lang: language || 'text',
          theme: currentTheme,
          structure: 'inline' // Sử dụng inline structure để tương thích với React
        })

        // Lưu vào cache
        codeCache.set(cacheKey, html)
        setHighlightedHtml(html)
      } catch (error) {
        console.error('Shiki highlighting error:', error)
        // Fallback về plain text với basic styling nếu có lỗi
        const fallbackHtml = `<pre style="background: var(--code-block-bg); color: var(--foreground); padding: 1rem; border-radius: var(--code-block-radius); border: 1px solid var(--code-block-border); overflow-x: auto;"><code>${children.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</code></pre>`
        setHighlightedHtml(fallbackHtml)
      } finally {
        setIsLoading(false)
      }
    }

    highlightCode()
  }, [children, language, theme, cacheKey])

  // Inline code
  if (inline) {
    return (
      <code 
        className={cn(
          "relative rounded px-1.5 py-0.5 font-mono text-sm",
          "bg-muted text-muted-foreground",
          "border border-border/50"
        )}
        style={{ fontSize: 'calc(var(--chat-font-size, 16px) * 0.875)' }}
      >
        {children}
      </code>
    )
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="relative group my-4">
        <div className={cn(
          "rounded-lg border border-border/50 bg-muted/30 p-4",
          "animate-pulse"
        )}>
          <div className="h-4 bg-muted-foreground/20 rounded w-3/4 mb-2"></div>
          <div className="h-4 bg-muted-foreground/20 rounded w-1/2"></div>
        </div>
      </div>
    )
  }

  // Block code với Shiki highlighting
  return (
    <div className="relative group my-4">
      {/* Copy button */}
      <Button
        variant="ghost"
        size="sm"
        className={cn(
          "absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100",
          "transition-opacity duration-200",
          "h-8 w-8 p-0"
        )}
        onClick={handleCopy}
      >
        {copied ? (
          <Check className="h-3 w-3 text-green-500" />
        ) : (
          <Copy className="h-3 w-3" />
        )}
      </Button>

      {/* Language label */}
      {language && language !== 'text' && (
        <div className="absolute top-2 left-3 z-10">
          <span className="text-xs text-muted-foreground bg-background/80 px-2 py-1 rounded">
            {language}
          </span>
        </div>
      )}

      {/* Shiki highlighted code */}
      <div
        className={cn(
          "shiki-code-block overflow-hidden",
          "[&_pre]:!m-0 [&_pre]:!p-0",
          "[&_pre]:!bg-transparent [&_pre]:!border-none",
          "[&_code]:block [&_code]:w-full [&_code]:min-w-full",
          "[&_.shiki]:!bg-transparent [&_.shiki]:!border-none"
        )}
        style={{
          fontSize: 'calc(var(--chat-font-size, 16px) * 0.875)',
          lineHeight: '1.5',
          background: 'var(--code-block-bg)',
          border: '1px solid var(--code-block-border)',
          borderRadius: 'var(--code-block-radius)',
          padding: language && language !== 'text' ? '2.5rem 1rem 1rem 1rem' : '1rem',
          fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
        }}
        dangerouslySetInnerHTML={{ __html: highlightedHtml }}
      />
    </div>
  )
}

export default ShikiCodeBlock
