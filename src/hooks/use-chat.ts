/**
 * Custom hook for managing chat state and operations
 * Centralizes all chat-related logic for better maintainability
 */

import { useState, useCallback, useEffect } from 'react';
import { Chat, StoredChat, StoredMessage, Message, chatUtils } from '@/components/chat/index';
import { useLocalStorage } from './use-local-storage';
import { useErrorHandler } from './use-error-handler';
// getGeminiService import removed - not used
import { getAvailableModels, GEMINI_MODELS, supportsThinking } from '@/lib/gemini-config';
import { shouldAutoEnableThinking } from '@/lib/model-utils';
// createAIMessage import removed - not used
import { useTranslations } from './use-translations';

export interface UseChatOptions {
  autoSaveToStorage?: boolean;
  maxChats?: number;
}

export interface UseChatReturn {
  // Chat state
  chats: Chat[];
  currentChatId: string | undefined;
  currentChat: Chat | undefined;
  isLoading: boolean;
  
  // Chat operations
  createNewChat: () => void;
  selectChat: (chatId: string) => void;
  deleteChat: (chatId: string) => void;
  clearAllChats: () => void;
  
  // Message operations
  sendMessage: (content: string, files?: File[]) => Promise<void>;
  processMultiplePDFs: (prompt: string, files: File[]) => Promise<void>;
  
  // Model management
  selectedModel: string;
  setSelectedModel: (model: string) => void;
  availableModels: Array<{
    id: string;
    name: string;
    description: string;
    category: string;
    supportsStreaming: boolean;
    supportsFiles: boolean;
    supportsTTS: boolean;
  }>;
  
  // Settings
  enableThinking: boolean;
  setEnableThinking: (enabled: boolean) => void;
  
  // Error handling
  error: string | null;
  clearError: () => void;
  retryLastMessage: () => void;
}

/**
 * Main chat management hook
 */
export function useChat(options: UseChatOptions = {}): UseChatReturn {
  const { autoSaveToStorage = true, maxChats = 50 } = options;
  
  // Dependencies
  const { t } = useTranslations();
  const { handleError, clearError, currentError } = useErrorHandler();
  
  // Local storage for persistence
  const { value: storedChats, setValue: setStoredChats } = useLocalStorage<StoredChat[]>('chat_history', {
    defaultValue: [],
    validator: (data): data is StoredChat[] => Array.isArray(data)
  });
  
  const { value: currentChatId, setValue: setCurrentChatId } = useLocalStorage<string | undefined>('current_chat_id', {
    defaultValue: undefined
  });
  
  const { value: selectedModel, setValue: setSelectedModel } = useLocalStorage<string>('selected_model', {
    defaultValue: GEMINI_MODELS.FLASH_2_0
  });
  
  const { value: enableThinking, setValue: setEnableThinking } = useLocalStorage<boolean>('enable_thinking', {
    defaultValue: false
  });
  
  // Local state
  const [chats, setChats] = useState<Chat[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastFailedMessage, setLastFailedMessage] = useState<string | null>(null);

  // Convert stored chats to runtime chats and restore persistent images
  useEffect(() => {
    if (storedChats.length > 0) {
      const restoreChatsWithImages = async () => {
        const convertedChats: Chat[] = await Promise.all(
          storedChats.map(async (storedChat: StoredChat) => {
            const restoredMessages = await Promise.all(
              storedChat.messages.map(async (msg: StoredMessage) => {
                const message: Message = {
                  ...msg,
                  timestamp: new Date(msg.timestamp)
                };

                // Restore persistent images if any
                return await chatUtils.restorePersistentImages(message);
              })
            );

            return {
              ...storedChat,
              timestamp: new Date(storedChat.timestamp),
              messages: restoredMessages
            };
          })
        );

        setChats(convertedChats);
      };

      restoreChatsWithImages().catch(() => {
        // Silent error - chats will load without persistent images
      });
    }
  }, [storedChats]);

  // Auto-save chats to storage
  useEffect(() => {
    if (autoSaveToStorage && chats.length > 0) {
      const storableChats: StoredChat[] = chats.map(chat => ({
        ...chat,
        timestamp: chat.timestamp.toISOString(),
        messages: chat.messages.map(msg => ({
          ...msg,
          timestamp: msg.timestamp.toISOString()
        }))
      }));
      setStoredChats(storableChats);
    }
  }, [chats, autoSaveToStorage, setStoredChats]);

  // Auto-enable thinking only for PRO_2_5 model, others default to OFF
  useEffect(() => {
    if (shouldAutoEnableThinking(selectedModel)) {
      // PRO_2_5 auto-enables thinking
      if (!enableThinking) {
        setEnableThinking(true);
      }
    } else if (supportsThinking(selectedModel)) {
      // Other 2.5 models default to OFF
      if (enableThinking) {
        setEnableThinking(false);
      }
    }
  }, [selectedModel, enableThinking, setEnableThinking]);

  // Get available models
  const availableModels = getAvailableModels().map(model => ({
    id: model.id,
    name: model.name,
    description: model.description,
    category: model.category,
    supportsStreaming: model.supportsStreaming,
    supportsFiles: model.supportsFiles,
    supportsTTS: false // Removed from GeminiModelInfo
  }));

  // Get current chat
  const currentChat = chats.find(chat => chat.id === currentChatId);

  // Create new chat
  const createNewChat = useCallback(() => {
    // Don't create and save chat immediately
    // Just clear current chat ID to start fresh
    // Chat will be created when user actually sends first message
    setCurrentChatId(undefined);
  }, [setCurrentChatId]);

  // Select chat
  const selectChat = useCallback((chatId: string) => {
    setCurrentChatId(chatId);
  }, [setCurrentChatId]);

  // Delete chat
  const deleteChat = useCallback(async (chatId: string) => {
    // Clean up persistent images for this chat
    try {
      const { imageStorage } = await import('@/lib/image-storage');
      await imageStorage.deleteImagesByChat(chatId);
    } catch (error) {
      // Silent error - images may remain in storage
    }

    setChats(prev => prev.filter(chat => chat.id !== chatId));

    if (currentChatId === chatId) {
      const remainingChats = chats.filter(chat => chat.id !== chatId);
      const nextChat = remainingChats.length > 0 ? remainingChats[0] : undefined;
      setCurrentChatId(nextChat?.id);
    }
  }, [currentChatId, chats, setCurrentChatId]);

  // Clear all chats
  const clearAllChats = useCallback(async () => {
    // Clean up all persistent images
    try {
      const { imageStorage } = await import('@/lib/image-storage');
      const stats = await imageStorage.getStorageStats();
      if (stats.totalImages > 0) {
        await imageStorage.cleanupOldImages(0); // Clean all images
      }
    } catch (error) {
      // Silent error - images may remain in storage
    }

    setChats([]);
    setCurrentChatId(undefined);
  }, [setCurrentChatId]);

  // Detect URLs in message content
  const detectUrls = useCallback((text: string): string[] => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const matches = text.match(urlRegex);
    return matches || [];
  }, []);

  // Check if model supports URL context
  const supportsUrlContext = useCallback((modelId: string): boolean => {
    return modelId.includes('2.5') || modelId.includes('2.0');
  }, []);

  // Detect code-related keywords
  const detectCodeKeywords = useCallback((text: string): boolean => {
    const baseKeywords = [
      'code', 'python', 'javascript', 'java', 'c++', 'c#', 'go', 'rust', 'php',
      'calculate', 'compute', 'algorithm', 'function', 'script', 'program',
      'sum of', 'factorial', 'fibonacci', 'prime numbers', 'sort', 'search',
      'data analysis', 'plot', 'graph', 'chart', 'visualization',
      'math', 'mathematics', 'equation', 'formula', 'solve'
    ];

    // Get localized programming keywords
    const localizedKeywords = t ? (t('chat.keywords.programming') as string[]) || [] : [];
    const allKeywords = [...baseKeywords, ...localizedKeywords];

    const lowerText = text.toLowerCase();
    return allKeywords.some(keyword => lowerText.includes(keyword));
  }, [t]);

  return {
    // State
    chats,
    currentChatId,
    currentChat,
    isLoading,
    
    // Operations
    createNewChat,
    selectChat,
    deleteChat,
    clearAllChats,
    
    // Message operations (to be implemented)
    sendMessage: async () => {}, // Placeholder
    processMultiplePDFs: async () => {}, // Placeholder
    
    // Model management
    selectedModel,
    setSelectedModel,
    availableModels,
    
    // Settings
    enableThinking,
    setEnableThinking,
    
    // Error handling
    error: currentError?.message || null,
    clearError,
    retryLastMessage: () => {
      if (lastFailedMessage) {
        // Will implement retry logic
      }
    }
  };
}
