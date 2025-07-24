"use client";

import React, { useState, useEffect } from 'react';
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

  // Auto-expand when thinking is in progress, auto-collapse when complete
  useEffect(() => {
    if (!isThinkingComplete) {
      // Đang thinking: tự động mở rộng để hiển thị real-time
      setIsExpanded(true);
    } else if (isThinkingComplete) {
      // Thinking hoàn tất: tự động thu gọn (bất kể isStreaming)
      setIsExpanded(false);
    }
  }, [isThinkingComplete]);

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
        onClick={() => {
          // Chỉ cho phép toggle khi thinking đã hoàn tất
          if (isThinkingComplete) {
            setIsExpanded(!isExpanded);
          }
        }}
        className={cn(
          "group w-full justify-between p-3 h-auto font-normal",
          "hover:bg-muted/50 dark:hover:bg-muted/30",
          "text-foreground hover:text-foreground",
          // Disable hover effect khi đang thinking
          !isThinkingComplete && "cursor-default hover:bg-transparent"
        )}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <Brain className="w-4 h-4 flex-shrink-0" />
          <span className="text-sm font-medium truncate">
            {!isThinkingComplete ? 'Đang suy nghĩ...' : 'Quá trình suy nghĩ'}
          </span>

          {/* Progress indicator for streaming */}
          {!isThinkingComplete && (
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

          {/* Expand/Collapse icon - Chỉ hiển thị khi có thể toggle */}
          {isThinkingComplete && (
            isExpanded ? (
              <ChevronDown className="w-4 h-4 flex-shrink-0" />
            ) : (
              <ChevronRight className="w-4 h-4 flex-shrink-0" />
            )
          )}
        </div>
      </Button>

      {/* Content - Always show when expanded */}
      {isExpanded && (
        <div className="px-3 pb-3 border-t border-border/30">
          <div className="pt-3">
            {thoughtSummary ? (
              <div className="prose prose-sm max-w-none dark:prose-invert">
                <MarkdownRenderer
                  content={thoughtSummary}
                  className="text-foreground"
                />
                {/* Show streaming indicator at the end if still thinking */}
                {!isThinkingComplete && (
                  <div className="flex items-center gap-2 text-muted-foreground text-sm mt-2 pt-2 border-t border-border/20">
                    <Clock className="w-4 h-4 animate-spin" />
                    <span>Đang tiếp tục suy nghĩ...</span>
                  </div>
                )}
              </div>
            ) : !isThinkingComplete ? (
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <Clock className="w-4 h-4 animate-spin" />
                <span>Đang phân tích và suy luận...</span>
              </div>
            ) : null}
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


