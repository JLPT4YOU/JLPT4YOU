// Provider-specific streaming handlers
import { getGeminiService } from '@/lib/gemini-service';
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
  streamMessageWithThinking?: (
    chatHistory: ChatMessage[],
    onThoughtChunk: (chunk: string) => void,
    onAnswerChunk: (chunk: string) => void,
    options?: ProviderOptions
  ) => Promise<{ thoughtsTokenCount?: number; outputTokenCount?: number }>;
}

export interface StreamingHandlers {
  handleGeminiWithFiles: (
    chatId: string,
    messageId: string,
    chatHistory: ChatMessage[],
    fileData: FileData[],
    options: ProviderOptions,
    supportsThinking: boolean,
    stateManager: ChatStateManager
  ) => Promise<void>;

  handleGeminiThinking: (
    chatId: string,
    messageId: string,
    chatHistory: ChatMessage[],
    options: ProviderOptions,
    stateManager: ChatStateManager
  ) => Promise<void>;

  handleRegularStreaming: (
    chatId: string,
    messageId: string,
    chatHistory: ChatMessage[],
    options: ProviderOptions,
    currentService: AIService,
    stateManager: ChatStateManager
  ) => Promise<void>;
}

export const createProviderHandlers = (): StreamingHandlers => {
  
  const handleGeminiWithFiles = async (
    chatId: string,
    messageId: string,
    chatHistory: ChatMessage[],
    fileData: FileData[],
    options: ProviderOptions,
    supportsThinking: boolean,
    stateManager: ChatStateManager
  ) => {
    const geminiService = getGeminiService();
    const thinkingStartTime = Date.now();
    let fullThoughts = '';
    let fullResponse = '';
    let pendingUpdate = false;

    if (supportsThinking) {
      await geminiService.streamMessageWithFilesAndThinking(
        chatHistory,
        fileData,
        (thoughtChunk: string) => {
          fullThoughts += thoughtChunk;
          
          if (!pendingUpdate) {
            pendingUpdate = true;
            requestAnimationFrame(() => {
              stateManager.updateMessageThinking(chatId, messageId, {
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
              
              stateManager.updateMessageContent(chatId, messageId, fullResponse);
              stateManager.updateMessageThinking(chatId, messageId, {
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
      await geminiService.streamMessageWithFiles(
        chatHistory,
        fileData,
        (chunk: string) => {
          fullResponse += chunk;
          
          if (!pendingUpdate) {
            pendingUpdate = true;
            requestAnimationFrame(() => {
              stateManager.updateMessageContent(chatId, messageId, fullResponse);
              pendingUpdate = false;
            });
          }
        },
        options
      );
    }
  };

  const handleGeminiThinking = async (
    chatId: string,
    messageId: string,
    chatHistory: ChatMessage[],
    options: ProviderOptions,
    stateManager: ChatStateManager
  ) => {
    const geminiService = getGeminiService();
    const thinkingStartTime = Date.now();
    let fullThoughts = '';
    let fullResponse = '';
    let pendingUpdate = false;

    // Initialize thinking display
    stateManager.updateMessageThinking(chatId, messageId, {
      thoughtSummary: '',
      isThinkingComplete: false
    });

    await geminiService.streamMessageWithThinking(
      chatHistory,
      (thoughtChunk: string) => {
        fullThoughts += thoughtChunk;
        
        if (!pendingUpdate) {
          pendingUpdate = true;
          requestAnimationFrame(() => {
            stateManager.updateMessageThinking(chatId, messageId, {
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
            
            stateManager.updateMessageContent(chatId, messageId, fullResponse);
            stateManager.updateMessageThinking(chatId, messageId, {
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

  const handleRegularStreaming = async (
    chatId: string,
    messageId: string,
    chatHistory: ChatMessage[],
    options: ProviderOptions,
    currentService: AIService,
    stateManager: ChatStateManager
  ) => {
    let fullResponse = '';
    let pendingUpdate = false;
    
    // Groq thinking state
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
          return;
        } else if (chunk.startsWith('__GROQ_THINKING_CONTENT__')) {
          const content = chunk.replace('__GROQ_THINKING_CONTENT__', '');
          thinkingContent += content;
          
          if (!pendingUpdate) {
            pendingUpdate = true;
            requestAnimationFrame(() => {
              stateManager.updateMessageThinking(chatId, messageId, {
                thoughtSummary: thinkingContent,
                isThinkingComplete: false
              });
              pendingUpdate = false;
            });
          }
          return;
        } else if (chunk === '__GROQ_THINKING_END__') {
          isThinkingActive = false;
          return;
        } else {
          if (isThinkingActive) return;
          fullResponse += chunk;
        }

        if (!pendingUpdate) {
          pendingUpdate = true;
          requestAnimationFrame(() => {
            const thinkingTimeSeconds = Math.round((Date.now() - thinkingStartTime) / 1000);
            
            stateManager.updateMessageContent(chatId, messageId, fullResponse);
            
            if (thinkingContent) {
              stateManager.updateMessageThinking(chatId, messageId, {
                thoughtSummary: thinkingContent,
                thinkingTimeSeconds,
                isThinkingComplete: !isThinkingActive
              });
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
