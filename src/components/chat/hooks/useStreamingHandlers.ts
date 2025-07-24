/**
 * Streaming Handlers for Chat Messages
 * Extracted from useMessageHandler for better modularity
 * Handles all streaming logic for different providers (Gemini, Groq)
 */

import { Message } from '../index';
import { getGeminiService } from '@/lib/gemini-service';
import { ChatStateManager } from './useChatStateManager';
import { FileProcessor } from './useFileProcessor';

export interface StreamingHandlers {
  handleGeminiWithFiles: (
    chatId: string,
    aiMessage: Message,
    chatHistory: any[],
    fileData: any[],
    options: any,
    supportsThinkingMode: boolean,
    chatStateManager: ChatStateManager
  ) => Promise<void>;
  
  handleGeminiThinking: (
    chatId: string,
    aiMessage: Message,
    chatHistory: any[],
    options: any,
    chatStateManager: ChatStateManager
  ) => Promise<void>;
  
  handleRegularStreaming: (
    chatId: string,
    aiMessage: Message,
    chatHistory: any[],
    options: any,
    currentService: any,
    chatStateManager: ChatStateManager
  ) => Promise<void>;
}

export const createStreamingHandlers = (): StreamingHandlers => {
  
  // Handle Gemini streaming with files
  const handleGeminiWithFiles = async (
    chatId: string,
    aiMessage: Message,
    chatHistory: any[],
    fileData: any[],
    options: any,
    supportsThinkingMode: boolean,
    chatStateManager: ChatStateManager
  ) => {
    const geminiService = getGeminiService();
    const thinkingStartTime = Date.now();
    let fullThoughts = '';
    let fullResponse = '';
    let pendingUpdate = false;

    if (supportsThinkingMode) {
      // Use thinking-aware streaming with files
      await geminiService.streamMessageWithFilesAndThinking(
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
      await geminiService.streamMessageWithFiles(
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
    chatHistory: any[],
    options: any,
    chatStateManager: ChatStateManager
  ) => {
    const geminiService = getGeminiService();
    const thinkingStartTime = Date.now();
    let fullThoughts = '';
    let fullResponse = '';
    let pendingUpdate = false;

    await geminiService.streamMessageWithThinking(
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
    chatHistory: any[],
    options: any,
    currentService: any,
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
