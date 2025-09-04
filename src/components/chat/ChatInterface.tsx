"use client";

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { MessageBubble } from './MessageBubble';
import { InputArea } from './InputArea';
import { MessagePulsingDot } from './ThreeDots';

import { cn, debounce } from '@/lib/utils';
import { useTranslations } from '@/hooks/use-translations';
import { GraduationCap, ChevronDown } from 'lucide-react';
import { Message } from './index';
import { Button } from '@/components/ui/button';
import { getAIProviderManager } from '@/lib/ai-provider-manager';

interface ChatInterfaceProps {
  className?: string;
  messages?: Message[];
  onSendMessage?: (message: string, files?: File[]) => void;
  onProcessMultiplePDFs?: (prompt: string, files: File[]) => void;
  onStopGeneration?: () => void;
  isLoading?: boolean;
  selectedModel?: string;
  enableThinking?: boolean;
  onToggleThinking?: () => void;
  currentProvider?: 'gemini' | 'groq';
  onEditMessage?: (messageId: string, newContent: string, files?: File[]) => void;
  // Advanced features for GPT-OSS models
  reasoningEffort?: 'low' | 'medium' | 'high';
  onReasoningEffortChange?: (effort: 'low' | 'medium' | 'high') => void;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({
  className,
  messages = [],
  onSendMessage,
  onProcessMultiplePDFs,
  onStopGeneration,
  isLoading = false,
  selectedModel,
  enableThinking = false,
  onToggleThinking,
  currentProvider = 'gemini',
  onEditMessage,
  reasoningEffort = 'medium',
  onReasoningEffortChange
}) => {
  const { t } = useTranslations();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const isUserAtBottomRef = useRef(true);



  const [showScrollButton, setShowScrollButton] = useState(false);

  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    const container = messagesContainerRef.current;
    if (container) {
      try {
        container.scrollTo({ top: container.scrollHeight, behavior });
      } catch {
        // Fallback for older browsers
        container.scrollTop = container.scrollHeight;
      }
    } else {
      messagesEndRef.current?.scrollIntoView({ behavior });
    }
  };

  // Check if user is at bottom of chat - show button when NOT at bottom
  const checkScrollPosition = useCallback(() => {
    const container = messagesContainerRef.current;
    if (!container) return;
    const { scrollTop, scrollHeight, clientHeight } = container;
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 50; // 50px threshold for more sensitive detection
    isUserAtBottomRef.current = isAtBottom;
    // Show button when NOT at bottom AND there are messages
    setShowScrollButton(!isAtBottom && messages.length > 0);
  }, [messages.length]);

  useEffect(() => {
    // Auto-scroll only if user is already near the bottom
    if (isUserAtBottomRef.current) {
      // Use instant scroll during streaming to avoid jitter from repeated smooth animations
      scrollToBottom('auto');
    }
    // Re-evaluate scroll button visibility on content changes
    checkScrollPosition();
  }, [messages, checkScrollPosition]);

  // Add scroll listener to detect when user scrolls up (debounced)
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const handleScroll = debounce(() => {
      checkScrollPosition();
    }, 50);

    container.addEventListener('scroll', handleScroll as EventListener);
    // Initial check
    checkScrollPosition();

    return () => {
      container.removeEventListener('scroll', handleScroll as EventListener);
    };
  }, [messages.length, checkScrollPosition]);

  const handleSendMessage = (content: string, files?: File[]) => {
    if (onSendMessage) {
      onSendMessage(content, files);
    }
  };

  // Determine if we're in empty state (no messages and not loading)
  const isEmptyState = messages.length === 0 && !isLoading;

  // Empty State Layout: Centered welcome + input below
  if (isEmptyState) {
    return (
      <div className={cn(
        "flex flex-col h-full bg-background",
        className
      )}>
        {/* Centered Welcome Content - Positioned Higher with Animation */}
        <div className="flex-1 flex flex-col items-center justify-center app-container -mt-16">
          <div className="text-center space-y-6 max-w-md mx-auto animate-in fade-in-50 slide-in-from-top-6 duration-700 ease-out">
            {/* Welcome Icon */}
            <div className="w-20 h-20 mx-auto bg-primary/10 rounded-2xl flex items-center justify-center animate-in zoom-in-50 duration-500 delay-200 ease-out">
              <GraduationCap className="w-10 h-10 text-primary" />
            </div>

            {/* Welcome Content */}
            <div className="space-y-3 animate-in fade-in-50 slide-in-from-bottom-4 duration-600 delay-300 ease-out">
              <h3 className="text-xl font-semibold text-foreground">
                {t ? t('chat.welcomeTitle') : 'Welcome to iRIN'}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {t ? t('chat.welcomeMessage') : 'Your AI teacher for JLPT learning. Ask me anything about Japanese language, grammar, vocabulary, or exam preparation!'}
              </p>
            </div>
          </div>

          {/* Input Area Below Welcome - Centered with Animation */}
          <div className="w-full max-w-4xl mx-auto mt-8 animate-in slide-in-from-top-4 duration-500 ease-out">
            <InputArea
              onSendMessage={handleSendMessage}
              onProcessMultiplePDFs={onProcessMultiplePDFs}
              onStopGeneration={onStopGeneration}
              disabled={isLoading}
              isGenerating={isLoading}
              enableThinking={enableThinking}
              onToggleThinking={onToggleThinking}
              selectedModel={selectedModel}
              currentProvider={currentProvider}
              reasoningEffort={reasoningEffort}
              onReasoningEffortChange={onReasoningEffortChange}
            />
          </div>
        </div>
      </div>
    );
  }

  // Active Conversation Layout: Messages + sticky bottom input
  return (
    <div className={cn(
      "flex flex-col h-full bg-background",
      className
    )}>
      {/* Scrollable Messages Container */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto scrollbar-thin"
      >
        {messages.length > 0 && (
          <div className="app-section space-y-2 px-3 sm:px-6 lg:px-8">
            <div className="space-y-1">
              {messages.map((message, index) => {
                // Check if there are subsequent messages after this one
                const hasSubsequentMessages = index < messages.length - 1;

                return (
                  <div key={message.id || index} className="animate-message-in">
                    <MessageBubble
                      message={message}
                      currentProvider={currentProvider}
                      isAIGenerating={isLoading}
                      hasSubsequentMessages={hasSubsequentMessages}
                      onEditMessage={onEditMessage}
                      selectedModel={selectedModel}
                      enableThinking={enableThinking}
                      onToggleThinking={onToggleThinking}
                    />
                  </div>
                );
              })}

              {/* Show pulsing dot when loading and last message is from user AND no AI message being generated */}
              {isLoading && messages.length > 0 &&
               messages[messages.length - 1]?.role === 'user' &&
               !messages.some(msg => msg.role === 'assistant' && msg.status === 'sending') && (
                <div className="animate-message-in">
                  <MessagePulsingDot />
                </div>
              )}
            </div>

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Scroll to Bottom Button - Fixed position close to input area */}
      {showScrollButton && (
        <div className="relative">
          <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 z-10">
            <Button
              onClick={() => scrollToBottom('smooth')}
              size="sm"
              className={cn(
                "scroll-to-bottom-button h-10 w-10 p-0"
              )}
              variant="outline"
              title={t ? t('chat.scrollToBottom') : 'Scroll to bottom'}
            >
              <ChevronDown className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Fixed Input Area - Sticky Bottom with Slide Animation */}
      <div className="animate-in slide-in-from-bottom-4 duration-500 ease-out">
        <InputArea
          onSendMessage={handleSendMessage}
          onProcessMultiplePDFs={onProcessMultiplePDFs}
          onStopGeneration={onStopGeneration}
          disabled={isLoading}
          isGenerating={isLoading}
          enableThinking={enableThinking}
          onToggleThinking={onToggleThinking}
          selectedModel={selectedModel}
          currentProvider={currentProvider}
          reasoningEffort={reasoningEffort}
          onReasoningEffortChange={onReasoningEffortChange}
        />
      </div>
    </div>
  );
};