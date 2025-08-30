/**
 * Chat Context
 * Provides centralized chat state management to reduce prop drilling
 */

import React, { createContext, useContext, ReactNode } from 'react';
import { Chat, Message } from '@/components/chat/index';

export interface ChatContextValue {
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
  
  // UI state
  isSidebarOpen: boolean;
  setIsSidebarOpen: (open: boolean) => void;
  showSettings: boolean;
  setShowSettings: (show: boolean) => void;
}

const ChatContext = createContext<ChatContextValue | undefined>(undefined);

export interface ChatProviderProps {
  children: ReactNode;
  value: ChatContextValue;
}

/**
 * Chat Context Provider
 */
export const ChatProvider: React.FC<ChatProviderProps> = ({ children, value }) => {
  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
};

/**
 * Hook to use chat context
 */
export const useChatContext = (): ChatContextValue => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChatContext must be used within a ChatProvider');
  }
  return context;
};

/**
 * Hook to use chat operations only
 */
export const useChatOperations = () => {
  const context = useChatContext();
  return {
    createNewChat: context.createNewChat,
    selectChat: context.selectChat,
    deleteChat: context.deleteChat,
    clearAllChats: context.clearAllChats,
    sendMessage: context.sendMessage,
    processMultiplePDFs: context.processMultiplePDFs,
  };
};

/**
 * Hook to use chat state only
 */
export const useChatState = () => {
  const context = useChatContext();
  return {
    chats: context.chats,
    currentChatId: context.currentChatId,
    currentChat: context.currentChat,
    isLoading: context.isLoading,
  };
};

/**
 * Hook to use UI state only
 */
export const useChatUI = () => {
  const context = useChatContext();
  return {
    isSidebarOpen: context.isSidebarOpen,
    setIsSidebarOpen: context.setIsSidebarOpen,
    showSettings: context.showSettings,
    setShowSettings: context.setShowSettings,
  };
};
