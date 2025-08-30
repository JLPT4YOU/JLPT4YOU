/**
 * Streaming Handlers for Chat Messages
 * Extracted from useMessageHandler for better modularity
 * Handles all streaming logic for different providers (Gemini, Groq)
 */

import { Message } from '../index';
import { getAIProviderManager } from '@/lib/ai-provider-manager';
import { ChatStateManager } from './useChatStateManager';

// Type definitions for better type safety
interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  files?: FileAttachment[];
}

interface FileAttachment {
  name: string;
  type: string;
  size: number;
  url: string;
  storageId?: string;
  isPersistent?: boolean;
}

interface FileData {
  data?: string; // base64 for inline
  uri?: string; // URI for uploaded files
  mimeType: string;
  name?: string;
}

interface ProviderOptions {
  model: string;
  temperature: number;
  maxTokens?: number;
  topP?: number;
  enableThinking?: boolean;
  enableGoogleSearch?: boolean;
  enableUrlContext?: boolean;
  enableCodeExecution?: boolean;
  enableTools?: boolean;
}

interface AIService {
  streamMessageWithFilesAndThinking: (
    chatHistory: ChatMessage[],
    fileData: FileData[],
    onThoughtChunk: (chunk: string) => void,
    onAnswerChunk: (chunk: string) => void,
    options?: ProviderOptions
  ) => Promise<{ thoughtsTokenCount?: number; outputTokenCount?: number }>;
  streamMessageWithFiles: (
    chatHistory: ChatMessage[],
    fileData: FileData[],
    onChunk: (chunk: string) => void,
    options?: ProviderOptions
  ) => Promise<void>;
  streamMessage: (
    chatHistory: ChatMessage[],
    onChunk: (chunk: string) => void,
    options?: ProviderOptions
  ) => Promise<void>;
}

export interface StreamingHandlers {
  handleGeminiWithFiles: (
    chatId: string,
    aiMessage: Message,
    chatHistory: ChatMessage[],
    fileData: FileData[],
    options: ProviderOptions,
    supportsThinkingMode: boolean,
    chatStateManager: ChatStateManager
  ) => Promise<void>;

  handleGeminiThinking: (
    chatId: string,
    aiMessage: Message,
    chatHistory: ChatMessage[],
    options: ProviderOptions,
    chatStateManager: ChatStateManager
  ) => Promise<void>;

  handleRegularStreaming: (
    chatId: string,
    aiMessage: Message,
    chatHistory: ChatMessage[],
    options: ProviderOptions,
    currentService: AIService,
    chatStateManager: ChatStateManager
  ) => Promise<void>;
}

export const createStreamingHandlers = (): StreamingHandlers => {
  
  // Handle Gemini streaming with files
  const handleGeminiWithFiles = async (
    chatId: string,
    aiMessage: Message,
    chatHistory: ChatMessage[],
    fileData: FileData[],
    options: ProviderOptions,
    supportsThinkingMode: boolean,
    chatStateManager: ChatStateManager
  ) => {
    const aiManager = getAIProviderManager();
    const geminiService = aiManager.getProviderService('gemini');
    const thinkingStartTime = Date.now();
    let fullThoughts = '';
    let fullResponse = '';
    let pendingUpdate = false;

    if (supportsThinkingMode) {
      // Use thinking-aware streaming with files
      await (geminiService as any).streamMessageWithFilesAndThinking(
        chatHistory,
        fileData,
        (thoughtChunk: string) => {
          fullThoughts += thoughtChunk;
          if (!pendingUpdate) {
            pendingUpdate = true;
            requestAnimationFrame(() => {
              chatStateManager.updateMessageThinking(chatId, aiMessage.id, {
                thoughtSummary: fullThoughts,
                isThinkingComplete: false
              });
              pendingUpdate = false;
            });
          }
        },
        (answerChunk: string) => {
          fullResponse += answerChunk;
          if (!pendingUpdate) {
            pendingUpdate = true;
            requestAnimationFrame(() => {
              const thinkingTimeSeconds = Math.round((Date.now() - thinkingStartTime) / 1000);
              chatStateManager.updateMessageWithThinking(chatId, aiMessage.id, fullResponse, {
                thoughtSummary: fullThoughts,
                thinkingTimeSeconds,
                isThinkingComplete: true
              });
              pendingUpdate = false;
            });
          }
        },
        options
      );
    } else {
      // Use regular streaming with files (no thinking)
      await (geminiService as any).streamMessageWithFiles(
        chatHistory,
        fileData,
        (chunk: string) => {
          fullResponse += chunk;
          if (!pendingUpdate) {
            pendingUpdate = true;
            requestAnimationFrame(() => {
              chatStateManager.updateMessageContent(chatId, aiMessage.id, fullResponse);
              pendingUpdate = false;
            });
          }
        },
        options
      );
    }
  };

  // Handle Gemini thinking-aware streaming
  const handleGeminiThinking = async (
    chatId: string,
    aiMessage: Message,
    chatHistory: ChatMessage[],
    options: ProviderOptions,
    chatStateManager: ChatStateManager
  ) => {
    const aiManager = getAIProviderManager();
    const geminiService = aiManager.getProviderService('gemini');
    const thinkingStartTime = Date.now();
    let fullThoughts = '';
    let fullResponse = '';
    let pendingUpdate = false;

    await (geminiService as any).streamMessageWithThinking(
      chatHistory,
      (thoughtChunk: string) => {
        fullThoughts += thoughtChunk;
        if (!pendingUpdate) {
          pendingUpdate = true;
          requestAnimationFrame(() => {
            chatStateManager.updateMessageThinking(chatId, aiMessage.id, {
              thoughtSummary: fullThoughts,
              isThinkingComplete: false
            });
            pendingUpdate = false;
          });
        }
      },
      (answerChunk: string) => {
        fullResponse += answerChunk;
        if (!pendingUpdate) {
          pendingUpdate = true;
          requestAnimationFrame(() => {
            const thinkingTimeSeconds = Math.round((Date.now() - thinkingStartTime) / 1000);
            chatStateManager.updateMessageWithThinking(chatId, aiMessage.id, fullResponse, {
              thoughtSummary: fullThoughts,
              thinkingTimeSeconds,
              isThinkingComplete: true
            });
            pendingUpdate = false;
          });
        }
      },
      options
    );
  };

  // Handle regular streaming (including Groq thinking signals)
  const handleRegularStreaming = async (
    chatId: string,
    aiMessage: Message,
    chatHistory: ChatMessage[],
    options: ProviderOptions,
    currentService: AIService,
    chatStateManager: ChatStateManager
  ) => {
    let fullResponse = '';
    let pendingUpdate = false;
    
    // State for Groq thinking mode
    let isThinkingActive = false;
    let thinkingContent = '';
    const thinkingStartTime = Date.now();

    await currentService.streamMessage(
      chatHistory,
      (chunk: string) => {
        // Handle Groq thinking signals
        if (chunk === '__GROQ_THINKING_START__') {
          isThinkingActive = true;
          thinkingContent = '';
          
          if (!pendingUpdate) {
            pendingUpdate = true;
            requestAnimationFrame(() => {
              chatStateManager.updateMessageThinking(chatId, aiMessage.id, {
                thoughtSummary: '',
                isThinkingComplete: false
              });
              pendingUpdate = false;
            });
          }
          return;
        } else if (chunk.startsWith('__GROQ_THINKING_CONTENT__')) {
          const content = chunk.replace('__GROQ_THINKING_CONTENT__', '');
          thinkingContent += content;
          
          if (!pendingUpdate) {
            pendingUpdate = true;
            requestAnimationFrame(() => {
              chatStateManager.updateMessageThinking(chatId, aiMessage.id, {
                thoughtSummary: thinkingContent,
                isThinkingComplete: false
              });
              pendingUpdate = false;
            });
          }
          return;
        } else if (chunk === '__GROQ_THINKING_END__') {
          isThinkingActive = false;
          
          if (!pendingUpdate) {
            pendingUpdate = true;
            requestAnimationFrame(() => {
              const thinkingTimeSeconds = Math.round((Date.now() - thinkingStartTime) / 1000);
              
              if (thinkingContent) {
                chatStateManager.updateMessageThinking(chatId, aiMessage.id, {
                  thoughtSummary: thinkingContent,
                  thinkingTimeSeconds,
                  isThinkingComplete: true
                });
              }
              pendingUpdate = false;
            });
          }
          return;
        } else {
          // Regular content (answer)
          if (isThinkingActive) return;
          fullResponse += chunk;
        }

        // Throttle updates to avoid too frequent re-renders
        if (!pendingUpdate) {
          pendingUpdate = true;
          requestAnimationFrame(() => {
            const thinkingTimeSeconds = Math.round((Date.now() - thinkingStartTime) / 1000);

            if (thinkingContent) {
              chatStateManager.updateMessageWithThinking(chatId, aiMessage.id, fullResponse, {
                thoughtSummary: thinkingContent,
                thinkingTimeSeconds,
                isThinkingComplete: !isThinkingActive
              });
            } else {
              chatStateManager.updateMessageContent(chatId, aiMessage.id, fullResponse);
            }

            pendingUpdate = false;
          });
        }
      },
      options
    );
  };

  return {
    handleGeminiWithFiles,
    handleGeminiThinking,
    handleRegularStreaming
  };
};
