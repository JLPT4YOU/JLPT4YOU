/**
 * Message Operations for Chat
 * Extracted from useMessageHandler for better modularity
 * Handles send, edit, and PDF processing operations
 */

import { Chat, Message, FileAttachment, chatUtils } from '../index';
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

export const useMessageOperations = (props: MessageOperationsProps): MessageOperations => {
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

  // Use hooks inside the hook
  const { t } = useTranslations();
  const { handleError } = useErrorHandler();

  const handleSendMessage = async (content: string, files?: File[]) => {
    // Allow file-only messages (Gemini supports file-only prompts)
    if (!content.trim() && (!files || files.length === 0)) return;

    setIsLoading(true);
    setLastFailedMessage(null);

    try {
      // For file-only send, keep an empty content but include files
      let userMessage = chatUtils.createMessage(content, 'user', 'text', files);
      let chatId = currentChatId;
      const isNewChat = !currentChatId; // Decide creation based solely on currentChatId

      // Store images persistently BEFORE adding to chat state
      if (userMessage.files && userMessage.files.length > 0) {
        // Ensure we have a chatId for persistent storage, regardless of existing chats
        if (!chatId) {
          chatId = `chat-${Date.now()}`;
        }

        try {
          userMessage = await chatUtils.storeImagesPersistently(userMessage, chatId);
          if (process.env.NODE_ENV === 'development') {
            
          }
        } catch (error) {
          if (process.env.NODE_ENV === 'development') {
            console.warn('⚠️ Failed to store images persistently:', error);
          }
        }
      }

      if (isNewChat) {
        // Create new chat (chatId already generated above if needed)
        if (!chatId) {
          chatId = `chat-${Date.now()}`;
        }

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
        if (process.env.NODE_ENV === 'development') {
          
        }
        aiProviderManager.current.generateChatTitle(content).then((aiTitle: string) => {
          if (process.env.NODE_ENV === 'development') {
            
          }
          if (chatId) {
            chatStateManager.updateChatTitle(chatId, aiTitle);
          }
        }).catch((error: Error) => {
          if (process.env.NODE_ENV === 'development') {
            console.error('Failed to generate title:', error);
          }
          // Fallback to truncated content
          const fallbackTitle = content.slice(0, 30) + (content.length > 30 ? '...' : '');
          if (process.env.NODE_ENV === 'development') {
            
          }
          if (chatId) {
            chatStateManager.updateChatTitle(chatId, fallbackTitle);
          }
        });
      } else {
        // Update existing chat with user message (images already stored above)
        if (chatId) {
          const currentChat = chats.find(chat => chat.id === chatId);
          if (currentChat && !currentChat.messages.some(msg => msg.id === userMessage.id)) {
            chatStateManager.addMessageToChat(chatId, userMessage);
          }
        }
      }

      // Generate AI response
      if (chatId) {
        // Ensure the new chat creation has been applied before streaming begins
        if (isNewChat) {
          await new Promise<void>(resolve => {
            if (typeof window !== 'undefined') {
              requestAnimationFrame(() => resolve());
            } else {
              resolve();
            }
          });
        }

        const updatedChat = chats.find(chat => chat.id === chatId);
        const messages = updatedChat ? [...updatedChat.messages, userMessage] : [userMessage];
        await generateAIResponse(chatId, messages);
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error in handleSendMessage:', error);
      }
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
      let updatedMessage = {
        ...currentChat.messages[messageIndex],
        content: newContent,
        files: (files as unknown as FileAttachment[]) || currentChat.messages[messageIndex].files,
        timestamp: new Date()
      };

      // Store images persistently if there are new files
      if (files && files.length > 0) {
        try {
          const messageWithFiles = chatUtils.createMessage(newContent, 'user', 'text', files);
          const persistentMessage = await chatUtils.storeImagesPersistently(messageWithFiles, currentChatId);
          updatedMessage = {
            ...updatedMessage,
            files: persistentMessage.files || []
          };
          if (process.env.NODE_ENV === 'development') {

          }
        } catch (error) {
          if (process.env.NODE_ENV === 'development') {
            console.warn('⚠️ Failed to store images persistently for edited message:', error);
          }
        }
      }

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
      if (process.env.NODE_ENV === 'development') {
        console.error('Error editing message:', error);
      }
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
      if (process.env.NODE_ENV === 'development') {
        console.error('Error processing PDFs:', error);
      }

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
