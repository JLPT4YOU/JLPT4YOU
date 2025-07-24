import { useCallback } from 'react';
import { Buffer } from 'buffer';
import { Chat, Message, chatUtils } from '../index';
import { getGeminiService } from '@/lib/gemini-service';
import { getModelInfo } from '@/lib/gemini-config';
import { useTranslations } from '@/hooks/use-translations';

interface FileData {
  data: string;
  mimeType: string;
  name: string;
}

interface UseFileHandlerProps {
  aiProviderManager: React.MutableRefObject<any>;
  selectedModel: string;
  setChats: React.Dispatch<React.SetStateAction<Chat[]>>;
  setCurrentChatId: React.Dispatch<React.SetStateAction<string | undefined>>;
  setIsSidebarOpen: (open: boolean) => void;
  setIsLoading: (loading: boolean) => void;
  currentChatId: string | undefined;
}

interface UseFileHandlerReturn {
  processMultiplePDFs: (prompt: string, files: File[]) => Promise<void>;
  convertFilesToBase64: (files: File[]) => Promise<FileData[]>;
  validateFileSupport: (files: File[]) => { isSupported: boolean; error?: string };
  storeImagesForChat: (message: Message, chatId: string) => Promise<Message>;
}

/**
 * Custom hook for handling file operations including PDF processing,
 * file validation, and image storage
 */
export const useFileHandler = ({
  aiProviderManager,
  selectedModel,
  setChats,
  setCurrentChatId,
  setIsSidebarOpen,
  setIsLoading,
  currentChatId
}: UseFileHandlerProps): UseFileHandlerReturn => {
  
  const { t } = useTranslations();

  // Validate if current provider and model support files
  const validateFileSupport = useCallback((files: File[]) => {
    if (!files || files.length === 0) {
      return { isSupported: true };
    }

    // Check if current provider supports files
    const supportsFiles = aiProviderManager.current.supportsFeature('files');
    if (!supportsFiles) {
      return {
        isSupported: false,
        error: 'Provider hiện tại không hỗ trợ file upload. Vui lòng chuyển sang Gemini để upload file.'
      };
    }

    // Check if model supports files (only for Gemini)
    const modelInfo = getModelInfo(selectedModel);
    if (!modelInfo?.supportsFiles) {
      return {
        isSupported: false,
        error: `Model ${selectedModel} không hỗ trợ file upload. Vui lòng chọn model khác.`
      };
    }

    return { isSupported: true };
  }, [aiProviderManager, selectedModel]);

  // Convert files to base64 format
  const convertFilesToBase64 = useCallback(async (files: File[]): Promise<FileData[]> => {
    return Promise.all(
      files.map(async (file) => {
        const arrayBuffer = await file.arrayBuffer();
        const base64 = Buffer.from(arrayBuffer).toString('base64');
        return {
          data: base64,
          mimeType: file.type,
          name: file.name
        };
      })
    );
  }, []);

  // Store images persistently for a chat
  const storeImagesForChat = useCallback(async (message: Message, chatId: string): Promise<Message> => {
    if (!message.files || message.files.length === 0) {
      return message;
    }

    try {
      const persistentMessage = await chatUtils.storeImagesPersistently(message, chatId);
      return persistentMessage;
    } catch (error) {
      console.warn('Failed to store images persistently:', error);
      return message; // Return original message if storage fails
    }
  }, []);

  // Process multiple PDFs with AI
  const processMultiplePDFs = useCallback(async (prompt: string, files: File[]) => {
    if (!prompt.trim() || files.length === 0) return;

    setIsLoading(true);

    try {
      console.log(`Processing ${files.length} PDFs with prompt:`, prompt);

      // Validate file support
      const validation = validateFileSupport(files);
      if (!validation.isSupported) {
        throw new Error(validation.error);
      }

      // Create user message
      const userMessage = chatUtils.createMessage(
        `${prompt}\n\n[Processing ${files.length} PDF files: ${files.map(f => f.name).join(', ')}]`,
        'user',
        'text'
      );

      // Create or update chat
      let chatId = currentChatId;
      if (!chatId) {
        const newChat = chatUtils.createNewChat();
        newChat.title = `PDF Analysis: ${files.length} files`;
        newChat.messages = [userMessage];
        newChat.lastMessage = prompt;
        newChat.timestamp = new Date();
        chatId = newChat.id;

        setChats(prev => [newChat, ...prev]);
        setCurrentChatId(chatId);
        setIsSidebarOpen(false);
      } else {
        setChats(prev => prev.map(chat =>
          chat.id === chatId
            ? {
                ...chat,
                messages: [...chat.messages, userMessage],
                lastMessage: prompt,
                timestamp: new Date()
              }
            : chat
        ));
      }

      // Process PDFs with Gemini
      const response = await getGeminiService().processMultipleLocalPDFs(
        prompt,
        files,
        selectedModel
      );

      // Create AI response message
      const aiMessage = chatUtils.createMessage(response, 'assistant', 'text');

      // Update chat with AI response
      setChats(prev => prev.map(chat =>
        chat.id === chatId
          ? {
              ...chat,
              messages: [...chat.messages, aiMessage],
              lastMessage: response.slice(0, 100) + (response.length > 100 ? '...' : ''),
              timestamp: new Date()
            }
          : chat
      ));

    } catch (error) {
      console.error('Error processing multiple PDFs:', error);

      const errorMessage = chatUtils.createMessage(
        t ? t('chat.errors.pdfProcessing') : 'Sorry, I encountered an error while processing the PDF files. Please try again.',
        'assistant',
        'text'
      );

      setChats(prev => prev.map(chat =>
        chat.id === currentChatId
          ? {
              ...chat,
              messages: [...chat.messages, errorMessage],
              timestamp: new Date()
            }
          : chat
      ));

      throw error; // Re-throw for parent error handling
    } finally {
      setIsLoading(false);
    }
  }, [
    validateFileSupport,
    currentChatId,
    selectedModel,
    setChats,
    setCurrentChatId,
    setIsSidebarOpen,
    setIsLoading,
    t
  ]);

  return {
    processMultiplePDFs,
    convertFilesToBase64,
    validateFileSupport,
    storeImagesForChat
  };
};
