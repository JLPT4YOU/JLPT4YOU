import { useState, useEffect, useCallback, useMemo } from 'react';
import { Chat, StoredChat, StoredMessage, chatStorage, Message } from '../index';
import { safeJsonStringify } from '@/lib/chat-error-handler';
import { UserStorage } from '@/lib/user-storage';
import { useAuth } from '@/contexts/auth-context';

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
  updateChatMessages: (chatId: string, updater: (messages: Message[]) => Message[]) => void;
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
  // Dependencies
  const { user } = useAuth();

  // State
  const [chats, setChats] = useState<Chat[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | undefined>(undefined);
  const [isStorageLoaded, setIsStorageLoaded] = useState(false);

  // Computed - memoized for performance
  const currentChat = useMemo(() => {
    return chats.find(chat => chat.id === currentChatId);
  }, [chats, currentChatId]);

  // Load user-scoped chat history on mount and when user changes
  useEffect(() => {
    if (!user?.id) {
      // Clear data when no user
      setChats([]);
      setCurrentChatId(undefined);
      setIsStorageLoaded(true);
      return;
    }

    // Ensure UserStorage is set for current user (defensive programming)
    UserStorage.setCurrentUser(user.id);

    // Load user-scoped data
    const userChats = UserStorage.getJSON('chat_history');
    const userCurrentChatId = UserStorage.getItem('current_chat_id');

    if (userChats && Array.isArray(userChats)) {
      // Convert timestamp strings back to Date objects
      const chatsWithDates: Chat[] = userChats.map((chat: StoredChat) => ({
        ...chat,
        timestamp: new Date(chat.timestamp),
        messages: chat.messages.map((msg: StoredMessage) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }))
      }));
      setChats(chatsWithDates);

      if (userCurrentChatId && chatsWithDates.find((chat: Chat) => chat.id === userCurrentChatId)) {
        setCurrentChatId(userCurrentChatId);
      }
    } else {
      // No data or corrupted data
      setChats([]);
      setCurrentChatId(undefined);
    }

    setIsStorageLoaded(true);
  }, [user?.id]);

  // Save chats to user-scoped storage whenever chats change
  useEffect(() => {
    if (chats.length > 0 && user?.id && isStorageLoaded) {
      const serialized = safeJsonStringify(chats);
      if (serialized) {
        UserStorage.setItem('chat_history', serialized);
      }
    }
  }, [chats, user?.id, isStorageLoaded]);

  // Save current chat ID to user-scoped storage whenever it changes
  useEffect(() => {
    if (user?.id && isStorageLoaded) {
      if (currentChatId) {
        UserStorage.setItem('current_chat_id', currentChatId);
      } else {
        UserStorage.removeItem('current_chat_id');
      }
    }
  }, [currentChatId, user?.id, isStorageLoaded]);

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
    } catch {
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
    } catch {
      // Silent error - some data may remain
    }

    // Clear state
    setChats([]);
    setCurrentChatId(undefined);

    // Clear user-scoped storage
    if (user?.id) {
      UserStorage.removeItem('chat_history');
      UserStorage.removeItem('current_chat_id');
    }
  }, [user?.id]);

  // Utility to update chat messages
  const updateChatMessages = useCallback((chatId: string, updater: (messages: Message[]) => Message[]) => {
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
