'use client'

import React from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
// remarkBreaks removed to fix unnecessary line breaks in lists
import rehypeRaw from 'rehype-raw'
import { cn } from '@/lib/utils'
import ShikiCodeBlock from './ShikiCodeBlock'

interface MarkdownRendererProps {
  content: string
  className?: string
}

// CodeBlock component đã được thay thế bằng ShikiCodeBlock

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({
  content,
  className
}) => {
  // Pre-process content to fix list formatting issues
  const processedContent = content
    // Fix numbered lists where number and text are on separate lines
    .replace(/^(\d+\.)\s*\n([^\n])/gm, '$1 $2')
    // Fix bullet lists where bullet and text are on separate lines (only at start of line)
    .replace(/^(-)\s*\n([^\n])/gm, '$1 $2')
    .replace(/^\*\s*\n([^\n])/gm, '* $1')
    // Normalize multiple line breaks
    .replace(/\n\n+/g, '\n\n')
    // Ensure proper spacing after list markers (only at start of line)
    .replace(/^(\d+\.)([^\s])/gm, '$1 $2')
    .replace(/^(-)([^\s])/gm, '$1 $2')
    .replace(/^\*([a-zA-Z0-9])/gm, '* $1'); // Only fix bullet lists, not *italic*

  return (
    <div
      className={cn("markdown-content", className)}
      style={{ fontSize: 'var(--chat-font-size, 16px)' }}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw]}
        components={{
          // Code blocks and inline code - sử dụng ShikiCodeBlock
          code: ({ inline, className, children, ...props }: any) => {
            return (
              <ShikiCodeBlock
                inline={inline}
                className={className}
                {...props}
              >
                {String(children).replace(/\n$/, '')}
              </ShikiCodeBlock>
            )
          },
          
          // Headers
          h1: ({ children }) => (
            <h1 className="text-2xl font-bold mt-6 mb-4 text-foreground border-b border-border pb-2">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-xl font-semibold mt-5 mb-3 text-foreground">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-lg font-medium mt-4 mb-2 text-foreground">
              {children}
            </h3>
          ),
          h4: ({ children }) => (
            <h4 className="text-base font-medium mt-3 mb-2 text-foreground">
              {children}
            </h4>
          ),
          h5: ({ children }) => (
            <h5 className="text-sm font-medium mt-2 mb-1 text-foreground">
              {children}
            </h5>
          ),
          h6: ({ children }) => (
            <h6 className="text-xs font-medium mt-2 mb-1 text-muted-foreground">
              {children}
            </h6>
          ),

          // Paragraphs - Use div to avoid nesting issues with code blocks
          p: ({ children }) => (
            <div className="mb-4 leading-relaxed text-foreground last:mb-0">
              {children}
            </div>
          ),

          // Lists - Fixed to prevent unnecessary line breaks
          ul: ({ children }) => (
            <ul className="list-disc list-outside ml-6 mb-4 space-y-1 text-foreground">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal list-outside ml-6 mb-4 space-y-1 text-foreground">
              {children}
            </ol>
          ),
          li: ({ children, ...props }) => {
            // Ensure list item content stays inline
            return (
              <li className="leading-relaxed" {...props}>
                {Array.isArray(children)
                  ? children.map((child, index) =>
                      typeof child === 'string'
                        ? <span key={index} className="inline">{child}</span>
                        : child
                    )
                  : <span className="inline">{children}</span>
                }
              </li>
            );
          },

          // Links
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                "text-primary hover:text-primary/80 underline underline-offset-2",
                "transition-colors duration-200"
              )}
            >
              {children}
            </a>
          ),

          // Blockquotes
          blockquote: ({ children }) => (
            <blockquote className={cn(
              "border-l-4 border-primary/30 pl-4 py-2 my-4",
              "bg-muted/30 rounded-r-lg",
              "text-muted-foreground italic"
            )}>
              {children}
            </blockquote>
          ),

          // Tables
          table: ({ children }) => (
            <div className="overflow-x-auto my-4">
              <table className="min-w-full border border-border rounded-lg">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-muted/50">
              {children}
            </thead>
          ),
          tbody: ({ children }) => (
            <tbody className="divide-y divide-border">
              {children}
            </tbody>
          ),
          tr: ({ children }) => (
            <tr className="hover:bg-muted/30 transition-colors">
              {children}
            </tr>
          ),
          th: ({ children }) => (
            <th className="px-4 py-2 text-left font-medium text-foreground border-r border-border last:border-r-0">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="px-4 py-2 text-foreground border-r border-border last:border-r-0">
              {children}
            </td>
          ),

          // Horizontal rule
          hr: () => (
            <hr className="my-6 border-border" />
          ),

          // Strong and emphasis
          strong: ({ children }) => (
            <strong className="font-semibold text-foreground">
              {children}
            </strong>
          ),
          em: ({ children }) => (
            <em className="italic text-foreground">
              {children}
            </em>
          ),

          // Strikethrough
          del: ({ children }) => (
            <del className="line-through text-muted-foreground">
              {children}
            </del>
          ),
        }}
      >
        {processedContent}
      </ReactMarkdown>
    </div>
  )
}
