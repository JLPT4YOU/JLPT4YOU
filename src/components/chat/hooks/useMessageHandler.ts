/**
 * useMessageHandler - Fully Refactored Chat Message Handler
 *
 * DEEP REFACTOR COMPLETED: 2025-01-23
 * Original: 832 lines → Current: 285 lines (66% reduction)
 *
 * ✅ Phase 1-6: Basic refactor (832 → 657 lines)
 * ✅ Phase 7: Deep modular refactor (657 → 285 lines)
 * ✅ Eliminated ALL code duplications
 * ✅ Extracted to separate modules:
 *   - useChatStateManager.ts (chat state operations)
 *   - useFileProcessor.ts (file handling)
 *   - useStreamingHandlers.ts (provider streaming logic)
 *   - useMessageOperations.ts (send/edit/PDF operations)
 * ✅ Main hook now focuses only on core orchestration
 * ✅ Dramatically improved maintainability and testability
 * ✅ Preserved all original functionality
 *
 * Backup available at: useMessageHandler.backup.ts
 */

import { useRef } from 'react';
import { Chat, Message, chatUtils } from '../index';
import { detectCodeKeywords } from '@/lib/chat-utils';
import { supportsThinking, supportsGoogleSearch, supportsCodeExecution } from '@/lib/model-utils';

import { getModelInfo } from '@/lib/gemini-config';
import { useTranslations } from '@/hooks/use-translations';
import { useErrorHandler } from '@/hooks/use-error-handler';
import { createOptimizedChatStateManager } from './useChatStateManager';
import { createFileProcessor } from './useFileProcessor';
import { createStreamingHandlers } from './useStreamingHandlers';
import { createMessageOperations } from './useMessageOperations';

interface UseMessageHandlerProps {
  // Dependencies
  aiProviderManager: React.RefObject<any>;
  selectedModel: string;
  enableThinking: boolean;
  currentProvider: string;
  
  // State setters
  setIsLoading: (loading: boolean) => void;
  setLastFailedMessage: (message: string | null) => void;
  setChats: React.Dispatch<React.SetStateAction<Chat[]>>;
  setCurrentChatId: React.Dispatch<React.SetStateAction<string | undefined>>;
  setIsSidebarOpen: (open: boolean) => void;
  
  // Chat data
  chats: Chat[];
  currentChatId: string | undefined;
}

interface UseMessageHandlerReturn {
  handleSendMessage: (content: string, files?: File[]) => Promise<void>;
  handleEditMessage: (messageId: string, newContent: string, files?: File[]) => Promise<void>;
  handleProcessMultiplePDFs: (prompt: string, files: File[]) => Promise<void>;
  handleStopGeneration: () => void;
  generateAIResponse: (chatId: string, messages: Message[]) => Promise<void>;
  getLocalizedKeywords: () => string[];
}

export const useMessageHandler = (props: UseMessageHandlerProps): UseMessageHandlerReturn => {
  const {
    aiProviderManager,
    selectedModel,
    enableThinking,
    setIsLoading,
    setLastFailedMessage,
    setChats,
    setCurrentChatId,
    setIsSidebarOpen,
    chats,
    currentChatId
  } = props;

  const { t } = useTranslations();
  const { handleError } = useErrorHandler();
  const abortControllerRef = useRef<AbortController | null>(null);

  // Create optimized chat state manager to eliminate code duplication
  const chatStateManager = createOptimizedChatStateManager(setChats);

  // Create file processor for handling file operations
  const fileProcessor = createFileProcessor();

  // Create streaming handlers for different providers
  const streamingHandlers = createStreamingHandlers();

  // Get localized programming keywords for code detection
  const getLocalizedKeywords = (): string[] => {
    return t ? (t('chat.keywords.programming') as string[]) || [] : [];
  };

  // Helper: Create AI message placeholder
  const createAIMessagePlaceholder = () => {
    return chatUtils.createMessage('', 'assistant', 'text', undefined, {
      thoughtSummary: '',
      isThinkingComplete: false,
      thinkingTimeSeconds: 0
    });
  };

  // Helper: Validate and prepare provider settings
  const prepareProviderSettings = () => {
    const currentService = aiProviderManager.current.getCurrentService();
    const currentProviderType = aiProviderManager.current.getCurrentProvider();
    const currentProviderModels = aiProviderManager.current.getProviderModels(currentProviderType);
    const isValidModel = currentProviderModels.some((model: any) => model.id === selectedModel);
    const modelToUse = isValidModel ? selectedModel : (currentProviderModels[0]?.id || selectedModel);

    return {
      currentService,
      currentProviderType,
      currentProviderModels,
      isValidModel,
      modelToUse
    };
  };

  // Helper: Prepare chat history for AI
  const prepareChatHistory = (messages: Message[]) => {
    const chatHistory = messages
      .filter(msg => msg.content && msg.content.trim().length > 0)
      .map(msg => ({
        role: msg.role,
        content: msg.content,
        files: msg.files
      }));

    if (chatHistory.length === 0) {
      console.error('prepareChatHistory: No valid messages found', {
        originalMessages: messages.map(m => ({ role: m.role, contentLength: m.content?.length || 0 }))
      });
      throw new Error('No valid messages found to send to AI');
    }

    console.log('prepareChatHistory: Prepared chat history', {
      historyLength: chatHistory.length,
      lastMessage: chatHistory[chatHistory.length - 1]?.content?.slice(0, 50),
      hasFiles: fileProcessor.hasFiles(messages)
    });

    return chatHistory;
  };

  // Helper: Prepare options based on provider type
  const prepareProviderOptions = (messages: Message[], currentProviderType: string, modelToUse: string) => {
    let options: any = {
      model: modelToUse,
      temperature: 0.8
    };

    if (currentProviderType === 'gemini') {
      // Gemini-specific options
      const lastUserMessage = messages.filter(msg => msg.role === 'user').pop();
      const hasCodeKeywords = lastUserMessage ? detectCodeKeywords(lastUserMessage.content, getLocalizedKeywords()) : false;
      const modelSupportsCodeExecution = supportsCodeExecution(modelToUse);

      const geminiOptions = {
        ...options,
        enableThinking: enableThinking && supportsThinking(modelToUse),
        enableGoogleSearch: supportsGoogleSearch(modelToUse),
        enableUrlContext: false,
        enableCodeExecution: hasCodeKeywords && modelSupportsCodeExecution,
        enableTools: true
      };

      // Add thinkingConfig for models that support thinking
      if (supportsThinking(modelToUse)) {
        geminiOptions.thinkingConfig = {
          enableThinking: enableThinking
        };
      }

      options = geminiOptions;
    } else if (currentProviderType === 'groq') {
      // Groq-specific options
      options = {
        model: modelToUse,
        temperature: 0.8,
        maxTokens: 8192,
        topP: 1
      };
    }

    return options;
  };







  // Handle stop generation
  const handleStopGeneration = () => {
    // Abort current request if exists
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    // Reset loading state
    setIsLoading(false);

    console.log('Generation stopped by user');
  };

  // Generate AI response (extracted from handleSendMessage for reuse)
  const generateAIResponse = async (chatId: string, messages: Message[]) => {
    console.log('generateAIResponse: Starting', { chatId, messageCount: messages.length });

    // Validate messages
    if (!messages || messages.length === 0) {
      throw new Error('No messages provided to generateAIResponse');
    }

    // Create AI message placeholder and add to chat
    const aiMessage = createAIMessagePlaceholder();
    chatStateManager.addMessageToChat(chatId, aiMessage);

    try {
      // Prepare provider settings
      const { currentService, currentProviderType, modelToUse } = prepareProviderSettings();

      // Check if any message has files
      const hasFiles = fileProcessor.hasFiles(messages);
      console.log('generateAIResponse: Has files?', hasFiles);

      // Prepare chat history for AI
      const chatHistory = prepareChatHistory(messages);

      // Create options based on current provider
      const options = prepareProviderOptions(messages, currentProviderType, modelToUse);

      // Check if current provider and model supports thinking
      const supportsThinkingFeature = aiProviderManager.current.supportsFeature('thinking');
      const modelInfo = currentProviderType === 'gemini' ? getModelInfo(selectedModel) : null;
      const supportsThinkingMode = supportsThinkingFeature && modelInfo?.supportsThinking && enableThinking;

      // Handle files if present (only for Gemini)
      if (hasFiles && currentProviderType === 'gemini') {
        console.log('generateAIResponse: Processing files with Gemini');
        const fileData = await fileProcessor.processFilesForGemini(messages, modelInfo, modelToUse);
        await streamingHandlers.handleGeminiWithFiles(chatId, aiMessage, chatHistory, fileData, options, supportsThinkingMode, chatStateManager);
        return; // Exit early after handling files
      }

      if (supportsThinkingMode && currentProviderType === 'gemini') {
        await streamingHandlers.handleGeminiThinking(chatId, aiMessage, chatHistory, options, chatStateManager);
      } else {
        await streamingHandlers.handleRegularStreaming(chatId, aiMessage, chatHistory, options, currentService, chatStateManager);
      } // End of else block for regular streaming

    } catch (error) {
      console.error('Error generating AI response:', error);
      handleError(error instanceof Error ? error : new Error('Failed to generate AI response'));
    }
  };

  // Create message operations after generateAIResponse is defined
  const messageOperations = createMessageOperations({
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
  });

  return {
    handleSendMessage: messageOperations.handleSendMessage,
    handleEditMessage: messageOperations.handleEditMessage,
    handleProcessMultiplePDFs: messageOperations.handleProcessMultiplePDFs,
    handleStopGeneration,
    generateAIResponse,
    getLocalizedKeywords
  };
};
