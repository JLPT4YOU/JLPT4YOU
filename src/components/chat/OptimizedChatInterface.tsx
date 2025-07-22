/**
 * Optimized Chat Interface Component
 * Uses context to reduce prop drilling and improve composition
 */

import React, { useRef, useEffect } from 'react';
import { MessageBubble } from './MessageBubble';
import { InputArea } from './InputArea';

import { cn } from '@/lib/utils';
import { useTranslations } from '@/hooks/use-translations';
import { GraduationCap } from 'lucide-react';
import { useChatState, useChatOperations } from '@/contexts/chat-context';
import { useModelState } from '@/contexts/model-context';

export interface OptimizedChatInterfaceProps {
  className?: string;
}

export const OptimizedChatInterface: React.FC<OptimizedChatInterfaceProps> = ({
  className
}) => {
  // Context hooks
  const { currentChat, isLoading } = useChatState();
  const { sendMessage, processMultiplePDFs } = useChatOperations();
  const { selectedModel, enableThinking, currentModelCapabilities } = useModelState();
  
  // Dependencies
  const { t } = useTranslations();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [currentChat?.messages]);

  const messages = currentChat?.messages || [];

  return (
    <div className={cn("flex flex-col h-full bg-background", className)}>
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto">
        <div className="app-container py-6">
          {messages.length === 0 ? (
            /* Empty State */
            <div className="flex flex-col items-center justify-center h-full text-center py-12">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <GraduationCap className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">
                {t ? t('chat.welcome.title') : 'Welcome to iRIN'}
              </h3>
              <p className="text-muted-foreground max-w-md">
                {t ? t('chat.welcome.description') : 'Start a conversation by typing a message below. I can help you with learning, coding, analysis, and more!'}
              </p>
              
              {/* Model Info */}
              <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground mb-2">
                  {t ? t('chat.currentModel') : 'Current Model'}
                </p>
                <p className="font-medium">{selectedModel}</p>
                
                {/* Quick capabilities overview */}
                <div className="flex gap-2 mt-2">
                  {currentModelCapabilities.supportsThinking && (
                    <span className="text-xs bg-blue-500/10 text-blue-600 px-2 py-1 rounded">
                      Thinking
                    </span>
                  )}
                  {currentModelCapabilities.supportsGoogleSearch && (
                    <span className="text-xs bg-green-500/10 text-green-600 px-2 py-1 rounded">
                      Search
                    </span>
                  )}
                  {currentModelCapabilities.supportsCodeExecution && (
                    <span className="text-xs bg-purple-500/10 text-purple-600 px-2 py-1 rounded">
                      Code
                    </span>
                  )}
                </div>
              </div>
            </div>
          ) : (
            /* Messages List */
            <div className="space-y-6">
              {messages.map((message) => (
                <MessageBubble
                  key={message.id}
                  message={message}
                />
              ))}
              

              
              {/* Scroll anchor */}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </div>

      {/* Input Area */}
      <div className="border-t bg-background/95 backdrop-blur-sm">
        <div className="app-container py-4">
          <InputArea
            onSendMessage={sendMessage}
            onProcessMultiplePDFs={processMultiplePDFs}
            disabled={isLoading}
            selectedModel={selectedModel}
            enableThinking={enableThinking}
            modelCapabilities={currentModelCapabilities}
          />
        </div>
      </div>
    </div>
  );
};

/**
 * Chat Interface with Context Wrapper
 * Provides both context and component in one
 */
export interface ChatInterfaceWithContextProps {
  // Chat state
  chats: any[];
  currentChatId: string | undefined;
  isLoading: boolean;
  
  // Chat operations
  onSendMessage: (content: string, files?: File[]) => Promise<void>;
  onProcessMultiplePDFs: (prompt: string, files: File[]) => Promise<void>;
  
  // Model state
  selectedModel: string;
  availableModels: any[];
  enableThinking: boolean;
  onToggleThinking: () => void;
  
  // UI
  className?: string;
}

export const ChatInterfaceWithContext: React.FC<ChatInterfaceWithContextProps> = ({
  chats,
  currentChatId,
  isLoading,
  onSendMessage,
  onProcessMultiplePDFs,
  selectedModel,
  availableModels,
  enableThinking,
  onToggleThinking,
  className
}) => {
  // This would be implemented with actual context providers
  // For now, it's a placeholder showing the pattern
  
  return (
    <div className={cn("h-full", className)}>
      {/* This would wrap with ChatProvider and ModelProvider */}
      <OptimizedChatInterface />
    </div>
  );
};
