import { useState, useEffect, useCallback, useMemo } from 'react';
import { Chat, StoredChat, StoredMessage, chatStorage } from '../index';
import { SafeLocalStorage, safeJsonParse, safeJsonStringify } from '@/lib/chat-error-handler';

/**
 * Return type for the useChatManager hook
 */
interface UseChatManagerReturn {
  // State
  chats: Chat[];
  currentChatId: string | undefined;
  currentChat: Chat | undefined;
  
  // Actions
  setChats: React.Dispatch<React.SetStateAction<Chat[]>>;
  setCurrentChatId: React.Dispatch<React.SetStateAction<string | undefined>>;
  handleNewChat: () => void;
  handleSelectChat: (chatId: string) => void;
  handleDeleteChat: (chatId: string) => Promise<void>;
  handleClearHistory: () => Promise<void>;
  
  // Utilities
  updateChatMessages: (chatId: string, updater: (messages: any[]) => any[]) => void;
  updateChatTitle: (chatId: string, title: string) => void;
  updateChatLastMessage: (chatId: string, lastMessage: string) => void;
}

/**
 * Custom hook for managing chat state, CRUD operations, and localStorage persistence.
 *
 * This hook handles:
 * - Chat creation, selection, and deletion
 * - LocalStorage persistence for chat history
 * - Chat message updates and management
 * - Current chat state tracking
 *
 * @returns {UseChatManagerReturn} Object containing chat state and management functions
 *
 * @example
 * ```typescript
 * const chatManager = useChatManager();
 *
 * // Create a new chat
 * chatManager.handleNewChat();
 *
 * // Select an existing chat
 * chatManager.handleSelectChat('chat-id-123');
 *
 * // Delete a chat
 * await chatManager.handleDeleteChat('chat-id-123');
 *
 * // Access current chat
 * console.log(chatManager.currentChat);
 * ```
 */
export const useChatManager = (): UseChatManagerReturn => {
  // State
  const [chats, setChats] = useState<Chat[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | undefined>(undefined);
  
  // Computed - memoized for performance
  const currentChat = useMemo(() => {
    return chats.find(chat => chat.id === currentChatId);
  }, [chats, currentChatId]);

  // Load chat history from localStorage on mount
  useEffect(() => {
    const savedChats = SafeLocalStorage.get('chat_history');
    const savedCurrentChatId = SafeLocalStorage.get('current_chat_id');

    if (savedChats) {
      const parsedChats = safeJsonParse<StoredChat[]>(savedChats);
      if (parsedChats) {
        // Convert timestamp strings back to Date objects
        const chatsWithDates: Chat[] = parsedChats.map((chat: StoredChat) => ({
          ...chat,
          timestamp: new Date(chat.timestamp),
          messages: chat.messages.map((msg: StoredMessage) => ({
            ...msg,
            timestamp: new Date(msg.timestamp)
          }))
        }));
        setChats(chatsWithDates);

        if (savedCurrentChatId && chatsWithDates.find((chat: Chat) => chat.id === savedCurrentChatId)) {
          setCurrentChatId(savedCurrentChatId);
        }
      } else {
        // Clear corrupted data
        SafeLocalStorage.remove('chat_history');
        SafeLocalStorage.remove('current_chat_id');
      }
    }
  }, []);

  // Save chats to localStorage whenever chats change
  useEffect(() => {
    if (chats.length > 0) {
      const serialized = safeJsonStringify(chats);
      if (serialized) {
        SafeLocalStorage.set('chat_history', serialized);
      }
    }
  }, [chats]);

  // Save current chat ID to localStorage whenever it changes
  useEffect(() => {
    if (currentChatId) {
      SafeLocalStorage.set('current_chat_id', currentChatId);
    } else {
      SafeLocalStorage.remove('current_chat_id');
    }
  }, [currentChatId]);

  // Handle new chat
  const handleNewChat = useCallback(() => {
    // Don't create and save chat immediately
    // Just clear current chat ID to start fresh
    // Chat will be created when user actually sends first message
    setCurrentChatId(undefined);
  }, []);

  // Handle select chat
  const handleSelectChat = useCallback((chatId: string) => {
    setCurrentChatId(chatId);
  }, []);

  // Handle delete chat
  const handleDeleteChat = useCallback(async (chatId: string) => {
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
  }, [chats, currentChatId]);

  // Handle clear all history
  const handleClearHistory = useCallback(async () => {
    // Clear all chats and their associated images
    try {
      await chatStorage.clearAllChats();
    } catch (error) {
      // Silent error - some data may remain
    }

    // Clear state
    setChats([]);
    setCurrentChatId(undefined);

    // Clear localStorage
    SafeLocalStorage.remove('chat_history');
    SafeLocalStorage.remove('current_chat_id');
  }, []);

  // Utility to update chat messages
  const updateChatMessages = useCallback((chatId: string, updater: (messages: any[]) => any[]) => {
    setChats(prev => prev.map(chat => {
      if (chat.id !== chatId) return chat;
      return {
        ...chat,
        messages: updater(chat.messages),
        timestamp: new Date()
      };
    }));
  }, []);

  // Utility to update chat title
  const updateChatTitle = useCallback((chatId: string, title: string) => {
    setChats(prev => prev.map(chat =>
      chat.id === chatId
        ? { ...chat, title }
        : chat
    ));
  }, []);

  // Utility to update chat last message
  const updateChatLastMessage = useCallback((chatId: string, lastMessage: string) => {
    setChats(prev => prev.map(chat =>
      chat.id === chatId
        ? { ...chat, lastMessage, timestamp: new Date() }
        : chat
    ));
  }, []);

  return {
    // State
    chats,
    currentChatId,
    currentChat,
    
    // Actions
    setChats,
    setCurrentChatId,
    handleNewChat,
    handleSelectChat,
    handleDeleteChat,
    handleClearHistory,
    
    // Utilities
    updateChatMessages,
    updateChatTitle,
    updateChatLastMessage
  };
};
