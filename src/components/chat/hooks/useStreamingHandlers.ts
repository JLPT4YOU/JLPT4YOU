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
  getFinalReasoning?: (
    chatHistory: ChatMessage[],
    options?: ProviderOptions
  ) => Promise<string | undefined>;
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
    chatStateManager: ChatStateManager,
    files?: FileData[]
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

  // Handle regular streaming (including Groq thinking signals and Gemini native thinking JSONL)
  const handleRegularStreaming = async (
    chatId: string,
    aiMessage: Message,
    chatHistory: ChatMessage[],
    options: ProviderOptions,
    currentService: AIService,
    chatStateManager: ChatStateManager,
    files?: FileData[]
  ) => {
    let fullResponse = '';
    let cleanedResponse = ''; // Store the cleaned response without think tags
    let pendingUpdate = false;
    let thinkingContent = '';
    let jsonBuffer = '';
    let isThinkingActive = false;
    let isReasoningComplete = false; // Track if we received complete reasoning
    let hasReceivedContent = false; // Track if we started receiving content after thinking
    const thinkingStartTime = Date.now();
    
    // Helper function to extract and clean think/thinking tags (supports partial streaming)
    const extractAndCleanThinkTags = (text: string): { cleaned: string, thinking: string } => {
      let cleaned = text;
      const thinkingParts: string[] = [];

      // 1) Extract all complete <think>/<thinking>... </...> segments first
      const completePattern = /<(?:think|thinking)>([\s\S]*?)<\/(?:think|thinking)>/g;
      cleaned = cleaned.replace(completePattern, (_match, inner: string) => {
        thinkingParts.push((inner || '').trim());
        return '';
      }).trim();

      // 2) Handle unmatched opening tag (partial segment while streaming)
      const lastOpenThink = Math.max(cleaned.lastIndexOf('<think>'), cleaned.lastIndexOf('<thinking>'));
      const lastCloseThink = Math.max(cleaned.lastIndexOf('</think>'), cleaned.lastIndexOf('</thinking>'));
      if (lastOpenThink !== -1 && (lastCloseThink === -1 || lastOpenThink > lastCloseThink)) {
        const openTag = cleaned.startsWith('<thinking>', lastOpenThink) ? '<thinking>' : '<think>';
        const contentAfterOpen = cleaned.slice(lastOpenThink + openTag.length);
        if (contentAfterOpen.trim().length > 0) {
          thinkingParts.push(contentAfterOpen.trim());
        }
        cleaned = cleaned.slice(0, lastOpenThink).trim();
      }

      return { cleaned, thinking: thinkingParts.join('\n\n') };
    };

    // Immediately signal that thinking is in progress if enabled
    if (isThinkingActive) {
      chatStateManager.updateMessageThinking(chatId, aiMessage.id, {
        thoughtSummary: '',
        isThinkingComplete: false,
      });
    }

    // Pass files if available - the service will handle them appropriately
    const streamOptions = files && files.length > 0 ? { ...options, files } : options;
    await currentService.streamMessage(
      chatHistory,
      (chunk: string) => {
        jsonBuffer += chunk;
        const lines = jsonBuffer.split('\n');
        jsonBuffer = lines.pop() || ''; // Keep the last partial line

        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const data = JSON.parse(line);

            // Handle different message types from streaming
            if (data.type === 'status' && data.content) {
              // Status message (e.g., "Thinking...")
              isThinkingActive = true;
              thinkingContent = data.content;
            }
            if (data.type === 'reasoning' && data.content) {
              // Full reasoning content (for backward compatibility)
              isThinkingActive = true;
              thinkingContent = data.content;
              isReasoningComplete = true; // Mark reasoning as complete
              
              // Immediately update UI to show reasoning is complete
              chatStateManager.updateMessageWithThinking(chatId, aiMessage.id, fullResponse, {
                thoughtSummary: thinkingContent,
                isThinkingComplete: true,
              });
            }
            if (data.type === 'reasoning_complete') {
              // Signal that reasoning streaming is complete
              isReasoningComplete = true;
            }
            if (data.type === 'thought' && data.content) {
              // Incremental thinking chunks
              isThinkingActive = true;
              thinkingContent += data.content;
            }
            if (data.type === 'content' && data.content) {
              // Regular content chunks
              fullResponse += data.content;
              
              // Extract and clean think tags immediately from new content
              const { cleaned, thinking } = extractAndCleanThinkTags(fullResponse);
              if (thinking) {
                isThinkingActive = true;
                thinkingContent = thinking;
                cleanedResponse = cleaned;
              } else {
                cleanedResponse = fullResponse;
              }
              
              // If we were thinking and now receiving content, mark thinking as complete
              if (isThinkingActive && !hasReceivedContent && !isReasoningComplete) {
                hasReceivedContent = true;
                isReasoningComplete = true;
              }
            }
            if (data.type === 'done') {
              // Stream completion signal
              continue;
            }

            // Fallback for Gemini's specific structure
            const parts = data?.candidates?.[0]?.content?.parts || [];
            if (Array.isArray(parts) && parts.length > 0) {
              for (const part of parts) {
                if (part.thought && part.text) {
                  isThinkingActive = true;
                  thinkingContent += part.text;
                }
                if (!part.thought && part.text) {
                  fullResponse += part.text;
                }
              }
            }
          } catch (e) {
            // If not JSON, treat as raw content for backward compatibility
            fullResponse += line;
            
            // Extract and clean think tags from raw content
            const { cleaned, thinking } = extractAndCleanThinkTags(fullResponse);
            if (thinking) {
              isThinkingActive = true;
              thinkingContent = thinking;
              cleanedResponse = cleaned;
            } else {
              cleanedResponse = fullResponse;
            }
          }
        }

        // Throttled UI update
        if (!pendingUpdate) {
          pendingUpdate = true;
          requestAnimationFrame(() => {
            // Always use cleaned response or extract think tags if needed
            let responseToShow = cleanedResponse || fullResponse;
            
            // Double-check for any remaining think/thinking tags
            if (responseToShow.includes('<think') || responseToShow.includes('<thinking')) {
              const { cleaned, thinking } = extractAndCleanThinkTags(responseToShow);
              responseToShow = cleaned;
              
              // Update thinking if extracted
              if (thinking && thinking !== thinkingContent) {
                isThinkingActive = true;
                thinkingContent = thinking;
                isReasoningComplete = true;
              }
            }
            
            if (isThinkingActive) {
              chatStateManager.updateMessageWithThinking(chatId, aiMessage.id, responseToShow, {
                thoughtSummary: thinkingContent,
                isThinkingComplete: isReasoningComplete,
              });
            } else {
              chatStateManager.updateMessageContent(chatId, aiMessage.id, responseToShow);
            }
            pendingUpdate = false;
          });
        }
      },
      streamOptions
    );

    // Finalize: After stream, check for final reasoning data (for Groq OpenAI models)
    const finalReasoning = await currentService.getFinalReasoning?.(chatHistory);
    const thinkingTimeSeconds = Math.round((Date.now() - thinkingStartTime) / 1000);

    // Use cleaned response if available, otherwise clean the full response
    let finalResponse = cleanedResponse || fullResponse;
    
    // Final safety check to ensure no think/thinking tags remain
    if (finalResponse.includes('<think') || finalResponse.includes('<thinking')) {
      const { cleaned, thinking } = extractAndCleanThinkTags(finalResponse);
      finalResponse = cleaned;
      if (thinking && !thinkingContent) {
        thinkingContent = thinking;
      }
    }
    
    // Update final message with cleaned content
    chatStateManager.updateMessageWithThinking(chatId, aiMessage.id, finalResponse, {
      thoughtSummary: finalReasoning || thinkingContent,
      thinkingTimeSeconds,
      isThinkingComplete: true,
    });
  };

  return {
    handleGeminiWithFiles,
    handleGeminiThinking,
    handleRegularStreaming
  };
};
