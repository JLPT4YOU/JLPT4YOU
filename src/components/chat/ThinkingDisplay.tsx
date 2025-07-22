"use client";

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { ChevronDown, ChevronRight, Brain, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MarkdownRenderer } from './MarkdownRenderer';

interface ThinkingDisplayProps {
  thoughtSummary?: string;
  thinkingTimeSeconds?: number;
  isThinkingComplete?: boolean;
  isStreaming?: boolean;
  className?: string;
}

export const ThinkingDisplay: React.FC<ThinkingDisplayProps> = ({
  thoughtSummary,
  thinkingTimeSeconds,
  isThinkingComplete = true,
  isStreaming = false,
  className
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Don't render if no thinking data
  if (!thoughtSummary && !isStreaming) {
    return null;
  }

  const hasThinkingTime = thinkingTimeSeconds !== undefined && thinkingTimeSeconds > 0;

  return (
    <div className={cn(
      "border border-border rounded-lg bg-muted/30 dark:bg-muted/20",
      "mb-3 overflow-hidden transition-all duration-200",
      className
    )}>
      {/* Header */}
      <Button
        variant="ghost"
        onClick={() => setIsExpanded(!isExpanded)}
        className={cn(
          "group w-full justify-between p-3 h-auto font-normal",
          "hover:bg-muted/50 dark:hover:bg-muted/30",
          "text-foreground hover:text-foreground"
        )}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <Brain className="w-4 h-4 flex-shrink-0" />
          <span className="text-sm font-medium truncate">
            {isStreaming && !isThinkingComplete ? 'Đang suy nghĩ...' : 'Quá trình suy nghĩ'}
          </span>

          {/* Progress indicator for streaming */}
          {isStreaming && !isThinkingComplete && (
            <div className="flex items-center gap-1 ml-2 flex-shrink-0">
              <div className="w-1 h-1 bg-foreground/60 rounded-full animate-pulse" />
              <div className="w-1 h-1 bg-foreground/60 rounded-full animate-pulse delay-75" />
              <div className="w-1 h-1 bg-foreground/60 rounded-full animate-pulse delay-150" />
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 flex-shrink-0 ml-2">
          {/* Thinking time */}
          {hasThinkingTime && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground group-hover:text-foreground whitespace-nowrap">
              <Clock className="w-3 h-3" />
              <span>{thinkingTimeSeconds}s</span>
            </div>
          )}

          {/* Expand/Collapse icon */}
          {isExpanded ? (
            <ChevronDown className="w-4 h-4 flex-shrink-0" />
          ) : (
            <ChevronRight className="w-4 h-4 flex-shrink-0" />
          )}
        </div>
      </Button>

      {/* Content */}
      {isExpanded && (
        <div className="px-3 pb-3 border-t border-border/30">
          <div className="pt-3">
            {thoughtSummary ? (
              <div className="prose prose-sm max-w-none dark:prose-invert">
                <MarkdownRenderer
                  content={thoughtSummary}
                  className="text-foreground"
                />
              </div>
            ) : isStreaming ? (
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <Clock className="w-4 h-4 animate-spin" />
                <span>Đang phân tích và suy luận...</span>
              </div>
            ) : (
              <p className="text-muted-foreground text-sm italic">
                Không có dữ liệu suy nghĩ
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// Memoized component for performance
export const MemoizedThinkingDisplay = React.memo(ThinkingDisplay, (prevProps, nextProps) => {
  return (
    prevProps.thoughtSummary === nextProps.thoughtSummary &&
    prevProps.thinkingTimeSeconds === nextProps.thinkingTimeSeconds &&
    prevProps.isThinkingComplete === nextProps.isThinkingComplete &&
    prevProps.isStreaming === nextProps.isStreaming
  );
});

MemoizedThinkingDisplay.displayName = 'MemoizedThinkingDisplay';

/**
 * Parse thinking content from Groq message
 */
export function parseGroqThinkingFromMessage(content: string): {
  hasThinking: boolean;
  thinkingContent: string;
  answer: string;
} {
  // Check for Groq thinking markers
  const thinkingMarkers = [
    // Format: **🤔 Quá trình suy nghĩ:**\n...\n**💡 Câu trả lời:**\n...
    /\*\*🤔 Quá trình suy nghĩ:\*\*([\s\S]*?)\*\*💡 Câu trả lời:\*\*/,
    // Format: <think>...</think>
    /<think>([\s\S]*?)<\/think>/gi
  ];

  for (const marker of thinkingMarkers) {
    const match = content.match(marker);
    if (match) {
      const thinkingContent = match[1]?.trim() || '';
      let answer = content.replace(marker, '').trim();

      // Clean up answer by removing any remaining thinking markers
      answer = answer.replace(/\*\*💡 Câu trả lời:\*\*/g, '').trim();

      return {
        hasThinking: true,
        thinkingContent,
        answer
      };
    }
  }

  return {
    hasThinking: false,
    thinkingContent: '',
    answer: content
  };
}

/**
 * Groq Thinking Display Component
 */
interface GroqThinkingDisplayProps {
  content: string;
  className?: string;
}

export const GroqThinkingDisplay: React.FC<GroqThinkingDisplayProps> = ({
  content,
  className
}) => {
  const [isExpanded, setIsExpanded] = useState(true); // Start expanded during thinking
  const { hasThinking, thinkingContent, answer } = parseGroqThinkingFromMessage(content);

  // Auto-collapse after thinking is complete and answer starts
  React.useEffect(() => {
    if (hasThinking && answer.trim()) {
      // If we have both thinking and answer, auto-collapse after a short delay
      const timer = setTimeout(() => {
        setIsExpanded(false);
      }, 2000); // 2 second delay to let user see the thinking completed

      return () => clearTimeout(timer);
    }
  }, [hasThinking, answer]);

  if (!hasThinking) {
    return (
      <div className={cn("whitespace-pre-wrap", className)}>
        <MarkdownRenderer content={content} />
      </div>
    );
  }

  return (
    <div className={cn("space-y-3", className)}>
      {/* Thinking Section - Match Gemini Style */}
      <div className={cn(
        "border border-border rounded-lg bg-muted/30 dark:bg-muted/20",
        "mb-3 overflow-hidden transition-all duration-200"
      )}>
        {/* Header - Match Gemini Style */}
        <Button
          variant="ghost"
          onClick={() => setIsExpanded(!isExpanded)}
          className={cn(
            "group w-full justify-between p-3 h-auto font-normal",
            "hover:bg-muted/50 dark:hover:bg-muted/30",
            "text-foreground hover:text-foreground"
          )}
        >
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <Brain className="w-4 h-4 flex-shrink-0" />
            <span className="text-sm font-medium truncate">
              Quá trình suy nghĩ
            </span>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0 ml-2">
            {/* Expand/Collapse icon */}
            {isExpanded ? (
              <ChevronDown className="w-4 h-4 flex-shrink-0" />
            ) : (
              <ChevronRight className="w-4 h-4 flex-shrink-0" />
            )}
          </div>
        </Button>

        {/* Content - Match Gemini Style */}
        {isExpanded && (
          <div className="px-3 pb-3 border-t border-border/30">
            <div className="pt-3">
              <div className="prose prose-sm max-w-none dark:prose-invert">
                <MarkdownRenderer
                  content={thinkingContent}
                  className="text-foreground"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Answer Section - Clean without extra styling */}
      <div className="text-gray-900 dark:text-gray-100">
        <MarkdownRenderer content={answer} />
      </div>
    </div>
  );
};
