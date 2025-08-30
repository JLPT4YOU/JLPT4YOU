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
import { UserStorage } from '@/lib/user-storage';
import { useAuth } from '@/contexts/auth-context-simple';

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
  const { autoSaveToStorage = true } = options;

  // Dependencies
  const { clearError, currentError } = useErrorHandler();
  const { user } = useAuth();

  // User-scoped storage for persistence
  const [storedChats, setStoredChats] = useState<StoredChat[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | undefined>(undefined);
  const [selectedModel, setSelectedModel] = useState<string>(GEMINI_MODELS.FLASH_2_0);
  const [isStorageLoaded, setIsStorageLoaded] = useState(false);
  
  const [enableThinking, setEnableThinking] = useState<boolean>(false);

  // Local state
  const [chats, setChats] = useState<Chat[]>([]);
  const [isLoading] = useState(false);

  // Load user-scoped data on mount and when user changes
  useEffect(() => {
    if (!user?.id) {
      // Clear data when no user
      setStoredChats([]);
      setCurrentChatId(undefined);
      setSelectedModel(GEMINI_MODELS.FLASH_2_0);
      setEnableThinking(false);
      setIsStorageLoaded(true);
      return;
    }

    // Ensure UserStorage is set for current user (defensive programming)
    UserStorage.setCurrentUser(user.id);

    // Load user-scoped data
    const userChats = UserStorage.getJSON('chat_history') as StoredChat[] || [];
    const userCurrentChatId = UserStorage.getItem('current_chat_id');
    const userSelectedModel = UserStorage.getItem('selected_model') || GEMINI_MODELS.FLASH_2_0;
    const userEnableThinking = UserStorage.getItem('enable_thinking') === 'true';

    setStoredChats(Array.isArray(userChats) ? userChats : []);
    setCurrentChatId(userCurrentChatId || undefined);
    setSelectedModel(userSelectedModel);
    setEnableThinking(userEnableThinking);
    setIsStorageLoaded(true);
  }, [user?.id]);

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

  // Auto-save chats to user-scoped storage
  useEffect(() => {
    if (autoSaveToStorage && chats.length > 0 && user?.id && isStorageLoaded) {
      const storableChats: StoredChat[] = chats.map(chat => ({
        ...chat,
        timestamp: chat.timestamp.toISOString(),
        messages: chat.messages.map(msg => ({
          ...msg,
          timestamp: msg.timestamp.toISOString()
        }))
      }));
      UserStorage.setJSON('chat_history', storableChats);
      setStoredChats(storableChats);
    }
  }, [chats, autoSaveToStorage, user?.id, isStorageLoaded]);

  // Auto-save current chat ID to user-scoped storage
  useEffect(() => {
    if (user?.id && isStorageLoaded) {
      if (currentChatId) {
        UserStorage.setItem('current_chat_id', currentChatId);
      } else {
        UserStorage.removeItem('current_chat_id');
      }
    }
  }, [currentChatId, user?.id, isStorageLoaded]);

  // Auto-save selected model to user-scoped storage
  useEffect(() => {
    if (user?.id && isStorageLoaded) {
      UserStorage.setItem('selected_model', selectedModel);
    }
  }, [selectedModel, user?.id, isStorageLoaded]);

  // Auto-save thinking mode to user-scoped storage
  useEffect(() => {
    if (user?.id && isStorageLoaded) {
      UserStorage.setItem('enable_thinking', enableThinking.toString());
    }
  }, [enableThinking, user?.id, isStorageLoaded]);

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
  }, [selectedModel, enableThinking]);

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
    } catch {
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
    } catch {
      // Silent error - images may remain in storage
    }

    // Clear user-scoped storage
    if (user?.id) {
      UserStorage.removeItem('chat_history');
      UserStorage.removeItem('current_chat_id');
    }

    setChats([]);
    setCurrentChatId(undefined);
    setStoredChats([]);
  }, [user?.id]);



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
    setSelectedModel: (model: string) => setSelectedModel(model),
    availableModels,
    
    // Settings
    enableThinking,
    setEnableThinking,
    
    // Error handling
    error: currentError?.message || null,
    clearError,
    retryLastMessage: () => {
      // Will implement retry logic
    }
  };
}
