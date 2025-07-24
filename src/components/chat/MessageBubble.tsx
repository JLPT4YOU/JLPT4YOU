"use client";

import React, { useState, useCallback, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { Copy, Check, Edit3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Message } from './index';
import { copyToClipboard } from '@/lib/chat-utils';
import { MarkdownRenderer } from './MarkdownRenderer';
import { MemoizedThinkingDisplay } from './ThinkingDisplay';
import { EditableMessage } from './EditableMessage';
import { InlinePulsingDot } from './ThreeDots';

interface MessageBubbleProps {
  message: Message;
  currentProvider?: 'gemini' | 'groq';
  isAIGenerating?: boolean;
  hasSubsequentMessages?: boolean;
  onEditMessage?: (messageId: string, newContent: string, files?: File[]) => void;
  selectedModel?: string;
  enableThinking?: boolean;
  onToggleThinking?: () => void;
}

const MessageBubbleComponent: React.FC<MessageBubbleProps> = ({
  message,
  currentProvider = 'gemini',
  isAIGenerating = false,
  hasSubsequentMessages = false,
  onEditMessage,
  selectedModel,
  enableThinking = false,
  onToggleThinking
}) => {
  const [isCopied, setIsCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Memoized computed values
  const isUser = useMemo(() => message.role === 'user', [message.role]);

  // Edit handlers
  const handleEditClick = useCallback(() => {
    if (!isAIGenerating && onEditMessage) {
      setIsEditing(true);
    }
  }, [isAIGenerating, onEditMessage]);

  const handleEditSave = useCallback((newContent: string, files?: File[]) => {
    if (onEditMessage) {
      onEditMessage(message.id, newContent, files);
      setIsEditing(false);
    }
  }, [onEditMessage, message.id]);

  const handleEditCancel = useCallback(() => {
    setIsEditing(false);
  }, []);

  // Show edit button conditions
  const showEditButton = useMemo(() =>
    isUser && !isAIGenerating && onEditMessage && !isEditing,
    [isUser, isAIGenerating, onEditMessage, isEditing]
  );

  const messageClasses = useMemo(() => cn(
    'flex gap-3 sm:gap-4 max-w-4xl mx-auto py-2 sm:py-3 group',
    isUser ? 'justify-end' : 'justify-start'
  ), [isUser]);



  const contentClasses = useMemo(() => cn(
    'flex flex-col w-full',
    isUser ? 'items-end sm:max-w-2xl' : 'items-start',
    // User messages: limited width, AI responses: full width
  ), [isUser]);

  // Optimized copy handler with useCallback
  const handleCopy = useCallback(async () => {
    try {
      const success = await copyToClipboard(message.content);
      if (success) {
        setIsCopied(true);
        // Reset after 2 seconds
        setTimeout(() => {
          setIsCopied(false);
        }, 2000);
      }
    } catch (error) {
      console.error('Failed to copy text:', error);
    }
  }, [message.content]);

  return (
    <div className={messageClasses}>
      {/* Message Content Container */}
      <div className={contentClasses}>
        {/* Files Preview - Separate from message bubble */}
        {message.files && message.files.length > 0 && (
          <div className={cn(
            "mb-2 flex flex-wrap gap-2 mx-4",
            isUser ? "justify-end" : "justify-start"
          )}>
            {message.files.map((file, index) => (
              <div key={index} className="relative">
                {file.type && file.type.startsWith('image/') ? (
                  <img
                    src={file.url}
                    alt={file.name}
                    className="max-w-[250px] max-h-[200px] object-cover rounded-lg border shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => {
                      // Open image in new tab for full view
                      if (file.url) {
                        window.open(file.url, '_blank');
                      }
                    }}
                    onError={(e) => {
                      // Handle image load errors (e.g., persistent image not found)
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';

                      // Show fallback UI
                      const fallback = document.createElement('div');
                      fallback.className = 'flex items-center gap-2 px-3 py-2 bg-background rounded-lg border shadow-sm';
                      fallback.innerHTML = `
                        <div class="w-8 h-8 bg-gray-200 rounded flex items-center justify-center">
                          <span class="text-xs">🖼️</span>
                        </div>
                        <div>
                          <p class="text-xs font-medium truncate max-w-[120px]">${file.name}</p>
                          <p class="text-xs text-red-500">Image unavailable</p>
                        </div>
                      `;
                      target.parentNode?.appendChild(fallback);
                    }}
                  />
                ) : (
                  <div className="flex items-center gap-2 px-3 py-2 bg-background rounded-lg border shadow-sm">
                    <div className="w-8 h-8 bg-gray-200 rounded flex items-center justify-center">
                      <span className="text-xs">📎</span>
                    </div>
                    <div>
                      <p className="text-xs font-medium truncate max-w-[120px]">{file.name}</p>
                      <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Thinking Display - For AI messages with thinking data or when thinking is in progress */}
        {!isUser && message.thinking && (
          message.thinking.thoughtSummary ||
          (message.status === 'sending' && !message.thinking.isThinkingComplete)
        ) && (
          <MemoizedThinkingDisplay
            thoughtSummary={message.thinking.thoughtSummary}
            thinkingTimeSeconds={message.thinking.thinkingTimeSeconds}
            isThinkingComplete={message.thinking.isThinkingComplete}
            isStreaming={message.status === 'sending'}
            className="mb-2"
          />
        )}

        {/* Message Content - Edit Mode or Display Mode */}
        {isEditing ? (
          // Edit Mode
          <div className="w-full">
            <EditableMessage
              message={message}
              onSave={handleEditSave}
              onCancel={handleEditCancel}
              hasSubsequentMessages={hasSubsequentMessages}
              currentProvider={currentProvider}
              selectedModel={selectedModel}
              enableThinking={enableThinking}
              onToggleThinking={onToggleThinking}
              className="w-full"
            />
          </div>
        ) : (
          // Display Mode
          <>
            {/* Message Bubble */}
            <div className={cn(
              'rounded-2xl px-3 sm:px-4 py-2 sm:py-3',
              isUser
                ? 'rounded-br-md shadow-sm max-w-[85%] sm:max-w-full'
                : 'rounded-bl-md w-full'
            )}
            style={{
              backgroundColor: isUser ? 'var(--chat-user-bg)' : 'transparent',
              color: isUser ? 'var(--chat-user-text)' : 'var(--chat-assistant-text)'
            }}>
              {/* Message Content */}
              {isUser ? (
                // User messages: simple text rendering
                <p className="whitespace-pre-wrap leading-relaxed" style={{ fontSize: 'var(--chat-font-size, 16px)' }}>
                  {message.content}
                </p>
              ) : (
                // AI responses: rich markdown rendering or typing indicator
                message.content ? (
                  <MarkdownRenderer
                    content={message.content}
                    className="w-full"
                  />
                ) : isAIGenerating && !message.thinking?.thoughtSummary ? (
                  // Show pulsing dot only when AI is generating AND no thinking content yet
                  <InlinePulsingDot size="md" />
                ) : null
              )}
            </div>

            {/* Action Buttons - Copy and Edit */}
            <div className={cn(
              "flex items-center gap-2 mt-1 w-full",
              isUser ? "justify-end" : "justify-start pl-3 sm:pl-4"
            )}>
              {/* Edit Button - Only for user messages */}
              {showEditButton && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleEditClick}
                  className={cn(
                    "p-2 h-auto rounded hover:bg-muted/50 transition-all duration-200",
                    "opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-foreground"
                  )}
                  title="Chỉnh sửa tin nhắn"
                >
                  <Edit3 className="w-4 h-4" />
                </Button>
              )}

              {/* Copy Button */}
              <button
                onClick={handleCopy}
                className={cn(
                  "p-2 rounded hover:bg-muted/50 transition-all duration-200",
                  "opacity-0 group-hover:opacity-100",
                  isCopied ? "text-green-500 opacity-100" : "text-muted-foreground hover:text-foreground"
                )}
                title={isCopied ? "Đã copy!" : "Copy tin nhắn"}
              >
                {isCopied ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

// Memoized component for performance optimization
// Note: We need to allow re-renders when content changes for streaming
export const MessageBubble = React.memo(MessageBubbleComponent, (prevProps, nextProps) => {
  // For streaming messages, we want to re-render when content changes
  // Only skip re-render if ALL properties are exactly the same
  return (
    prevProps.message.id === nextProps.message.id &&
    prevProps.message.content === nextProps.message.content &&
    prevProps.message.role === nextProps.message.role &&
    prevProps.message.timestamp.getTime() === nextProps.message.timestamp.getTime() &&
    prevProps.message.status === nextProps.message.status &&
    prevProps.currentProvider === nextProps.currentProvider &&
    prevProps.isAIGenerating === nextProps.isAIGenerating &&
    prevProps.hasSubsequentMessages === nextProps.hasSubsequentMessages &&
    prevProps.onEditMessage === nextProps.onEditMessage &&
    JSON.stringify(prevProps.message.files) === JSON.stringify(nextProps.message.files) &&
    JSON.stringify(prevProps.message.thinking) === JSON.stringify(nextProps.message.thinking)
  );
});