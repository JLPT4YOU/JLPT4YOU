/**
 * Chat State Management Utility
 * Centralizes all setChats operations to eliminate code duplication
 * Extracted from useMessageHandler to improve maintainability
 */

import { Chat, Message } from '../index';

export interface ChatStateManager {
  // Core chat operations
  addMessageToChat: (chatId: string, message: Message) => void;
  updateChatMessages: (chatId: string, messages: Message[]) => void;
  updateChatTitle: (chatId: string, title: string) => void;

  // Message-specific operations
  updateMessageContent: (chatId: string, messageId: string, content: string) => void;
  updateMessageThinking: (
    chatId: string,
    messageId: string,
    thinking: {
      thoughtSummary?: string;
      thinkingTimeSeconds?: number;
      isThinkingComplete?: boolean;
    }
  ) => void;

  // Batch operations for performance
  updateMessageWithThinking: (
    chatId: string,
    messageId: string,
    content: string,
    thinking: {
      thoughtSummary?: string;
      thinkingTimeSeconds?: number;
      isThinkingComplete?: boolean;
    }
  ) => void;

  // Chat creation and management
  createNewChat: (chat: Chat) => void;
  addChatToList: (chat: Chat) => void;
}

export const createChatStateManager = (
  setChats: React.Dispatch<React.SetStateAction<Chat[]>>
): ChatStateManager => {

  // Helper function to update a specific chat
  const updateChat = (chatId: string, updater: (chat: Chat) => Chat) => {
    setChats(prev => prev.map(chat => {
      if (chat.id !== chatId) return chat;
      return updater(chat);
    }));
  };

  // Helper function to update a specific message in a chat
  const updateMessageInChat = (
    chatId: string,
    messageId: string,
    messageUpdater: (message: Message) => Message
  ) => {
    updateChat(chatId, chat => ({
      ...chat,
      messages: chat.messages.map(msg =>
        msg.id === messageId ? messageUpdater(msg) : msg
      ),
      timestamp: new Date()
    }));
  };

  const addMessageToChat = (chatId: string, message: Message) => {
    updateChat(chatId, chat => ({
      ...chat,
      messages: [...chat.messages, message],
      lastMessage: message.content,
      timestamp: new Date()
    }));
  };

  const updateChatMessages = (chatId: string, messages: Message[]) => {
    updateChat(chatId, chat => ({
      ...chat,
      messages,
      lastMessage: messages[messages.length - 1]?.content || chat.lastMessage,
      timestamp: new Date()
    }));
  };

  const updateChatTitle = (chatId: string, title: string) => {
    updateChat(chatId, chat => ({
      ...chat,
      title,
      timestamp: new Date()
    }));
  };

  const updateMessageContent = (chatId: string, messageId: string, content: string) => {
    updateMessageInChat(chatId, messageId, msg => ({
      ...msg,
      content
    }));

    // Also update lastMessage if this is the last message
    updateChat(chatId, chat => ({
      ...chat,
      lastMessage: content,
      timestamp: new Date()
    }));
  };

  const updateMessageThinking = (
    chatId: string,
    messageId: string,
    thinking: {
      thoughtSummary?: string;
      thinkingTimeSeconds?: number;
      isThinkingComplete?: boolean;
    }
  ) => {
    updateMessageInChat(chatId, messageId, msg => ({
      ...msg,
      thinking: { ...msg.thinking, ...thinking }
    }));
  };

  const updateMessageWithThinking = (
    chatId: string,
    messageId: string,
    content: string,
    thinking: {
      thoughtSummary?: string;
      thinkingTimeSeconds?: number;
      isThinkingComplete?: boolean;
    }
  ) => {
    updateChat(chatId, chat => ({
      ...chat,
      messages: chat.messages.map(msg =>
        msg.id === messageId
          ? {
              ...msg,
              content,
              thinking: { ...msg.thinking, ...thinking }
            }
          : msg
      ),
      lastMessage: content,
      timestamp: new Date()
    }));
  };

  const createNewChat = (chat: Chat) => {
    setChats(prev => [chat, ...prev]);
  };

  const addChatToList = (chat: Chat) => {
    setChats(prev => [chat, ...prev]);
  };

  return {
    addMessageToChat,
    updateChatMessages,
    updateChatTitle,
    updateMessageContent,
    updateMessageThinking,
    updateMessageWithThinking,
    createNewChat,
    addChatToList
  };
};

// Performance optimization: Use requestAnimationFrame for batched updates
export const createOptimizedChatStateManager = (
  setChats: React.Dispatch<React.SetStateAction<Chat[]>>
): ChatStateManager => {
  const baseManager = createChatStateManager(setChats);
  const pendingUpdates = new Map<string, () => void>();
  let updateScheduled = false;

  const scheduleUpdate = (key: string, updateFn: () => void) => {
    pendingUpdates.set(key, updateFn);

    if (!updateScheduled) {
      updateScheduled = true;
      requestAnimationFrame(() => {
        // Execute all pending updates
        pendingUpdates.forEach(fn => fn());
        pendingUpdates.clear();
        updateScheduled = false;
      });
    }
  };

  // Wrap methods that need optimization
  const updateMessageContent = (chatId: string, messageId: string, content: string) => {
    scheduleUpdate(`${chatId}-${messageId}-content`, () => {
      baseManager.updateMessageContent(chatId, messageId, content);
    });
  };

  const updateMessageThinking = (
    chatId: string,
    messageId: string,
    thinking: {
      thoughtSummary?: string;
      thinkingTimeSeconds?: number;
      isThinkingComplete?: boolean;
    }
  ) => {
    scheduleUpdate(`${chatId}-${messageId}-thinking`, () => {
      baseManager.updateMessageThinking(chatId, messageId, thinking);
    });
  };

  const updateMessageWithThinking = (
    chatId: string,
    messageId: string,
    content: string,
    thinking: {
      thoughtSummary?: string;
      thinkingTimeSeconds?: number;
      isThinkingComplete?: boolean;
    }
  ) => {
    scheduleUpdate(`${chatId}-${messageId}-both`, () => {
      baseManager.updateMessageWithThinking(chatId, messageId, content, thinking);
    });
  };

  return {
    ...baseManager,
    updateMessageContent,
    updateMessageThinking,
    updateMessageWithThinking
  };
};
