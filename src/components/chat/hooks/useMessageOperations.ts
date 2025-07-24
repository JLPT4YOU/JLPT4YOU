/**
 * Message Operations for Chat
 * Extracted from useMessageHandler for better modularity
 * Handles send, edit, and PDF processing operations
 */

import { Chat, Message, chatUtils } from '../index';
import { ChatStateManager } from './useChatStateManager';
import { FileProcessor } from './useFileProcessor';
import { useTranslations } from '@/hooks/use-translations';
import { useErrorHandler } from '@/hooks/use-error-handler';

export interface MessageOperations {
  handleSendMessage: (content: string, files?: File[]) => Promise<void>;
  handleEditMessage: (messageId: string, newContent: string, files?: File[]) => Promise<void>;
  handleProcessMultiplePDFs: (prompt: string, files: File[]) => Promise<void>;
}

interface MessageOperationsProps {
  // Dependencies
  aiProviderManager: React.RefObject<any>;
  
  // State setters
  setIsLoading: (loading: boolean) => void;
  setLastFailedMessage: (message: string | null) => void;
  setCurrentChatId: React.Dispatch<React.SetStateAction<string | undefined>>;
  setIsSidebarOpen: (open: boolean) => void;
  
  // Chat data
  chats: Chat[];
  currentChatId: string | undefined;
  
  // Utilities
  chatStateManager: ChatStateManager;
  fileProcessor: FileProcessor;
  generateAIResponse: (chatId: string, messages: Message[]) => Promise<void>;
}

export const createMessageOperations = (props: MessageOperationsProps, t: (key: string) => any, handleError: (error: Error) => void): MessageOperations => {
  const {
    aiProviderManager,
    setIsLoading,
    setLastFailedMessage,
    setCurrentChatId,
    setIsSidebarOpen,
    chats,
    currentChatId,
    chatStateManager,
    fileProcessor,
    generateAIResponse
  } = props;

  const handleSendMessage = async (content: string, files?: File[]) => {
    if (!content.trim() && (!files || files.length === 0)) return;

    setIsLoading(true);
    setLastFailedMessage(null);

    try {
      const userMessage = chatUtils.createMessage(content, 'user', 'text', files);
      let chatId = currentChatId;

      if (!chatId || chats.length === 0) {
        // Create new chat
        chatId = `chat-${Date.now()}`;
        const newChat: Chat = {
          id: chatId,
          title: content.slice(0, 30) + (content.length > 30 ? '...' : ''),
          messages: [userMessage],
          timestamp: new Date(),
          lastMessage: content
        };

        chatStateManager.createNewChat(newChat);
        setCurrentChatId(chatId);
        setIsSidebarOpen(false);

        // Generate AI title in background using current provider
        console.log('Starting to generate title for:', content.slice(0, 50));
        aiProviderManager.current.generateChatTitle(content).then((aiTitle: string) => {
          console.log('Generated title:', aiTitle);
          if (chatId) {
            chatStateManager.updateChatTitle(chatId, aiTitle);
          }
        }).catch((error: Error) => {
          console.error('Failed to generate title:', error);
          // Fallback to truncated content
          const fallbackTitle = content.slice(0, 30) + (content.length > 30 ? '...' : '');
          console.log('Using fallback title:', fallbackTitle);
          if (chatId) {
            chatStateManager.updateChatTitle(chatId, fallbackTitle);
          }
        });
      } else {
        // Update existing chat with user message
        if (chatId) {
          const currentChat = chats.find(chat => chat.id === chatId);
          if (currentChat && !currentChat.messages.some(msg => msg.id === userMessage.id)) {
            chatStateManager.addMessageToChat(chatId, userMessage);
          }
        }
      }

      // Generate AI response
      if (chatId) {
        const updatedChat = chats.find(chat => chat.id === chatId);
        const messages = updatedChat ? [...updatedChat.messages, userMessage] : [userMessage];
        await generateAIResponse(chatId, messages);
      }
    } catch (error) {
      console.error('Error in handleSendMessage:', error);
      handleError(error instanceof Error ? error : new Error('Failed to send message'));
      setLastFailedMessage(content);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditMessage = async (messageId: string, newContent: string, files?: File[]) => {
    if (!currentChatId) return;

    setIsLoading(true);
    try {
      const currentChat = chats.find(chat => chat.id === currentChatId);
      if (!currentChat) return;

      // Find the message to edit and all messages after it
      const messageIndex = currentChat.messages.findIndex(msg => msg.id === messageId);
      if (messageIndex === -1) return;

      // Create updated message
      const updatedMessage = {
        ...currentChat.messages[messageIndex],
        content: newContent,
        files: files || currentChat.messages[messageIndex].files,
        timestamp: new Date()
      };

      // Keep messages up to and including the edited message, remove AI responses after it
      const updatedMessages = [
        ...currentChat.messages.slice(0, messageIndex),
        updatedMessage
      ];

      // Update chat with new message history
      chatStateManager.updateChatMessages(currentChatId, updatedMessages);

      // Generate new AI response
      await generateAIResponse(currentChatId, updatedMessages);
    } catch (error) {
      console.error('Error editing message:', error);
      handleError(error instanceof Error ? error : new Error('Failed to edit message'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleProcessMultiplePDFs = async (prompt: string, files: File[]) => {
    setIsLoading(true);
    try {
      const userMessage = chatUtils.createMessage(prompt, 'user', 'text', files);
      let chatId = currentChatId;

      if (!chatId || chats.length === 0) {
        chatId = `chat-${Date.now()}`;
        const newChat: Chat = {
          id: chatId,
          title: 'PDF Analysis',
          messages: [userMessage],
          timestamp: new Date(),
          lastMessage: prompt
        };

        chatStateManager.createNewChat(newChat);
        setCurrentChatId(chatId);
        setIsSidebarOpen(false);
      } else {
        chatStateManager.addMessageToChat(chatId, userMessage);
      }

      // Process PDFs and generate response
      const response = await aiProviderManager.current.getCurrentService().processMultiplePDFs(prompt, files);
      
      const aiMessage = chatUtils.createMessage(response, 'assistant', 'text');
      
      // Update chat with AI response
      chatStateManager.addMessageToChat(chatId, aiMessage);

    } catch (error) {
      console.error('Error processing PDFs:', error);
      
      const errorMessage = chatUtils.createMessage(
        'Sorry, I encountered an error while processing the PDFs. Please try again.',
        'assistant',
        'text'
      );
      
      if (currentChatId) {
        chatStateManager.addMessageToChat(currentChatId, errorMessage);
      }
      
      handleError(error instanceof Error ? error : new Error('Failed to process PDFs'));
    } finally {
      setIsLoading(false);
    }
  };

  return {
    handleSendMessage,
    handleEditMessage,
    handleProcessMultiplePDFs
  };
};
