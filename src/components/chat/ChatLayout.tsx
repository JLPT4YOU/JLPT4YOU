"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Buffer } from 'buffer';
import { ChatSidebar } from './ChatSidebar';
import { ChatInterface } from './ChatInterface';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Chat, StoredChat, StoredMessage, Message, chatUtils, chatStorage } from './index';
import { Menu, User, Home, Settings } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import { useTranslations } from '@/hooks/use-translations';
import { UnifiedSettings } from './UnifiedSettings';
import { getAIProviderManager, type ProviderType } from '@/lib/ai-provider-manager';
import { getGeminiService, UseGeminiServiceOptions } from '@/lib/gemini-service';
import { getAvailableModels, GEMINI_MODELS, getModelInfo } from '@/lib/gemini-config';

import { createAIMessage } from '@/lib/ai-service';
import { createChatError, SafeLocalStorage, safeJsonParse, safeJsonStringify } from '@/lib/chat-error-handler';
import { detectUrls, detectCodeKeywords } from '@/lib/chat-utils';
import { supportsThinking, supportsGoogleSearch, supportsCodeExecution, supportsUrlContext, shouldAutoEnableThinking } from '@/lib/model-utils';
import { useScreenSize } from '@/hooks/use-screen-size';
import { useErrorHandler } from '@/hooks/use-error-handler';

import { ErrorNotification } from './ErrorNotification';
import { HeaderModelSelector } from './HeaderModelSelector';
import { ProviderSelector } from './ProviderSelector';
import { MultiProviderApiKeyModal } from '@/components/multi-provider-api-key-modal';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';


interface ChatLayoutProps {
  className?: string;
}

export const ChatLayout: React.FC<ChatLayoutProps> = ({ className }) => {
  // Custom hooks
  const { isLargeScreen } = useScreenSize();
  const { handleError, clearError, currentError } = useErrorHandler();

  // Local state
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [chats, setChats] = useState<Chat[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | undefined>(undefined);
  const [showSettings, setShowSettings] = useState(false);
  const [settingsDefaultTab, setSettingsDefaultTab] = useState("general");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState<string>(GEMINI_MODELS.FLASH_2_0);
  const [currentProvider, setCurrentProvider] = useState<ProviderType>('gemini');
  const [enableThinking, setEnableThinking] = useState(false);
  const [lastFailedMessage, setLastFailedMessage] = useState<string | null>(null);
  const [showApiKeySetup, setShowApiKeySetup] = useState(false);


  // AI Provider Manager
  const aiProviderManager = useRef(getAIProviderManager());

  // Helper function to get provider color based on category (monochrome system)
  const getProviderColor = (providerType: ProviderType, category?: string) => {
    if (providerType === 'gemini') {
      switch (category) {
        case 'multimodal': return 'provider-primary';
        case 'tts': return 'provider-secondary';
        default: return 'provider-accent';
      }
    }
    return 'provider-secondary';
  };

  // Helper function to format models for UI
  const formatModelsForUI = (providerModels: any[], providerType: ProviderType) => {
    return providerModels.map(model => ({
      id: model.id,
      name: model.name,
      description: model.description,
      color: getProviderColor(providerType, model.category),
      provider: providerType === 'gemini' ? 'Google Gemini' : 'Groq (Llama)',
      category: model.category || 'text',
      supportsStreaming: model.supportsStreaming,
      supportsFiles: model.supportsFiles || false,
      supportsTTS: model.supportsTTS || false
    }));
  };

  // Refs for cleanup and user intent tracking
  const errorTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const userClosedSidebarRef = useRef<boolean>(false); // Track if user manually closed sidebar

  // Set initial sidebar state based on screen size and load settings (run only once on mount)
  useEffect(() => {
    // Set sidebar state based on screen size
    setIsSidebarOpen(isLargeScreen);

    // Load thinking mode setting
    const savedThinking = SafeLocalStorage.get('enable_thinking');
    if (savedThinking !== null) {
      setEnableThinking(savedThinking === 'true');
    }

    // Load current provider and update models
    const currentProviderType = aiProviderManager.current.getCurrentProvider();
    setCurrentProvider(currentProviderType);

    // Update models based on current provider
    const providerModels = aiProviderManager.current.getProviderModels(currentProviderType);
    const formattedModels = formatModelsForUI(providerModels, currentProviderType);
    setAiModels(formattedModels);

    // Load chat history from localStorage
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
  }, []); // Only run on mount - removed selectedModel dependency to prevent sidebar auto-opening

  // Handle screen size changes separately to avoid interfering with user's sidebar state
  useEffect(() => {
    // Only auto-open sidebar when screen becomes large AND user hasn't manually closed it
    if (isLargeScreen && !userClosedSidebarRef.current) {
      setIsSidebarOpen(true);
    }
    // Reset user closed flag when screen becomes small (mobile behavior)
    if (!isLargeScreen) {
      userClosedSidebarRef.current = false;
    }
  }, [isLargeScreen]); // Only depend on screen size changes, not sidebar state

  // Handle thinking mode when model changes
  useEffect(() => {
    if (shouldAutoEnableThinking(selectedModel)) {
      // PRO_2_5 auto-enables thinking
      setEnableThinking(true);
      SafeLocalStorage.set('enable_thinking', 'true');
    } else if (supportsThinking(selectedModel)) {
      // Other 2.5 models default to OFF (reset to OFF when switching)
      setEnableThinking(false);
      SafeLocalStorage.set('enable_thinking', 'false');
    } else {
      // Non-thinking models disable thinking
      setEnableThinking(false);
      SafeLocalStorage.set('enable_thinking', 'false');
    }
  }, [selectedModel]); // Only depend on selectedModel to trigger on model change

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

  // Cleanup effect for memory leaks
  useEffect(() => {
    return () => {
      // Clear timeout on unmount
      if (errorTimeoutRef.current) {
        clearTimeout(errorTimeoutRef.current);
      }

      // Abort any ongoing requests
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Auth, navigation, and translations
  const { user } = useAuth();
  const router = useRouter();
  const { t } = useTranslations();

  // Available models state (will be updated based on current provider)
  const [aiModels, setAiModels] = useState(() => {
    // Initialize with Gemini models (default provider)
    return getAvailableModels().map(model => ({
      id: model.id,
      name: model.name,
      description: model.description,
      color: getProviderColor('gemini', model.category),
      provider: 'Google Gemini',
      category: model.category,
      supportsStreaming: model.supportsStreaming,
      supportsFiles: model.supportsFiles,
      supportsTTS: model.supportsTTS
    }));
  });

  const currentChat = chats.find(chat => chat.id === currentChatId);

  const handleNewChat = () => {
    // Don't create and save chat immediately
    // Just clear current chat ID to start fresh
    // Chat will be created when user actually sends first message
    setCurrentChatId(undefined);
    setIsSidebarOpen(false);
  };

  const handleSelectChat = (chatId: string) => {
    setCurrentChatId(chatId);
    setIsSidebarOpen(false);
  };

  const handleDeleteChat = async (chatId: string) => {
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
  };

  // Get localized programming keywords for code detection
  const getLocalizedKeywords = (): string[] => {
    return t ? (t('chat.keywords.programming') as string[]) || [] : [];
  };

  const handleProcessMultiplePDFs = async (prompt: string, files: File[]) => {
    if (!prompt.trim() || files.length === 0) return;

    setIsLoading(true);

    try {
      console.log(`Processing ${files.length} PDFs with prompt:`, prompt);

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
    } finally {
      setIsLoading(false);
    }
  };

  // Handle message editing
  const handleEditMessage = async (messageId: string, newContent: string, files?: File[]) => {
    if (!currentChatId) return;

    try {
      setIsLoading(true);

      // Find the message to edit and its index
      const currentChat = chats.find(chat => chat.id === currentChatId);
      if (!currentChat) return;

      const messageIndex = currentChat.messages.findIndex(msg => msg.id === messageId);
      if (messageIndex === -1) return;

      // Create updated message
      const updatedMessage: Message = {
        ...currentChat.messages[messageIndex],
        content: newContent,
        files: files ? files.map(file => ({
          name: file.name,
          size: file.size,
          type: file.type,
          url: URL.createObjectURL(file)
        })) : undefined,
        timestamp: new Date()
      };

      // Remove all messages after the edited message (including AI responses)
      const messagesUpToEdit = currentChat.messages.slice(0, messageIndex);
      const updatedMessages = [...messagesUpToEdit, updatedMessage];

      // Update chat with new message history
      setChats(prev => prev.map(chat => {
        if (chat.id !== currentChatId) return chat;
        return {
          ...chat,
          messages: updatedMessages,
          lastMessage: newContent,
          timestamp: new Date()
        };
      }));

      // Trigger new AI response with the edited message
      await generateAIResponse(currentChatId, updatedMessages);

    } catch (error) {
      console.error('Error editing message:', error);
      handleError(error instanceof Error ? error : new Error('Failed to edit message'));
    } finally {
      setIsLoading(false);
    }
  };

  // Generate AI response (extracted from handleSendMessage for reuse)
  const generateAIResponse = async (chatId: string, messages: Message[]) => {
    // Create AI message placeholder
    const aiMessage = chatUtils.createMessage('', 'assistant', 'text');

    // Add AI message to chat
    setChats(prev => prev.map(chat => {
      if (chat.id !== chatId) return chat;
      return {
        ...chat,
        messages: [...messages, aiMessage],
        timestamp: new Date()
      };
    }));

    try {
      // Get current AI service from provider manager
      const currentService = aiProviderManager.current.getCurrentService();
      const currentProviderType = aiProviderManager.current.getCurrentProvider();

      // Validate that selectedModel belongs to current provider
      const currentProviderModels = aiProviderManager.current.getProviderModels(currentProviderType);
      const isValidModel = currentProviderModels.some(model => model.id === selectedModel);

      if (!isValidModel && currentProviderModels.length > 0) {
        setSelectedModel(currentProviderModels[0].id);
      }

      const modelToUse = isValidModel ? selectedModel : (currentProviderModels[0]?.id || selectedModel);

      // Prepare chat history for AI
      const chatHistory = messages.map(msg => ({
        role: msg.role,
        content: msg.content,
        files: msg.files
      }));

      // Create options based on current provider
      let options: any = {
        model: modelToUse,
        temperature: 0.8
      };

      if (currentProviderType === 'gemini') {
        // Gemini-specific options
        // Detect code keywords in the last user message
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

      // Stream AI response
      let fullResponse = '';
      let pendingUpdate = false;

      // State for thinking mode
      let isThinkingActive = false;
      let thinkingContent = '';
      let answerContent = '';

      await currentService.streamMessage(
        chatHistory,
        (chunk: string) => {
          // Handle Groq thinking signals
          if (chunk === '__GROQ_THINKING_START__') {
            isThinkingActive = true;
            thinkingContent = '';
            fullResponse = `**🤔 Quá trình suy nghĩ:**\n\n**💡 Câu trả lời:**\n`;

          } else if (chunk.startsWith('__GROQ_THINKING_CONTENT__')) {
            const content = chunk.replace('__GROQ_THINKING_CONTENT__', '');
            thinkingContent += content;
            fullResponse = `**🤔 Quá trình suy nghĩ:**\n${thinkingContent}\n\n**💡 Câu trả lời:**\n${answerContent}`;

          } else if (chunk === '__GROQ_THINKING_END__') {
            isThinkingActive = false;
            fullResponse = `**🤔 Quá trình suy nghĩ:**\n${thinkingContent}\n\n**💡 Câu trả lời:**\n`;

          } else {
            // Regular content (answer)
            if (isThinkingActive) {
              return;
            } else {
              answerContent += chunk;
              if (thinkingContent) {
                fullResponse = `**🤔 Quá trình suy nghĩ:**\n${thinkingContent}\n\n**💡 Câu trả lời:**\n${answerContent}`;
              } else {
                fullResponse += chunk;
              }
            }
          }

          // Throttle updates to avoid too frequent re-renders
          if (!pendingUpdate) {
            pendingUpdate = true;

            requestAnimationFrame(() => {
              setChats(prev => prev.map(chat => {
                if (chat.id !== chatId) return chat;

                return {
                  ...chat,
                  messages: chat.messages.map(msg =>
                    msg.id === aiMessage.id
                      ? { ...msg, content: fullResponse }
                      : msg
                  ),
                  lastMessage: fullResponse,
                  timestamp: new Date()
                };
              }));

              pendingUpdate = false;
            });
          }
        },
        options
      );

    } catch (error) {
      console.error('Error generating AI response:', error);
      handleError(error instanceof Error ? error : new Error('Failed to generate AI response'));
    }
  };

  const handleSendMessage = async (content: string, files?: File[]) => {
    let chatId = currentChatId;
    let userMessage = chatUtils.createMessage(content, 'user', 'text', files);

    // Create new chat if none exists
    if (!chatId) {
      const newChat = chatUtils.createNewChat();
      newChat.title = t ? t('chat.generatingTitle') : 'Generating title...'; // Temporary title
      newChat.messages = [userMessage];
      newChat.lastMessage = content;
      newChat.timestamp = new Date();
      chatId = newChat.id;

      setChats(prev => [newChat, ...prev]);
      setCurrentChatId(chatId);
      setIsSidebarOpen(false);

      // Store images persistently after chat creation
      if (files && files.length > 0) {
        try {
          const persistentUserMessage = await chatUtils.storeImagesPersistently(userMessage, chatId);
          if (persistentUserMessage !== userMessage) {
            // Update the message with persistent image data
            setChats(prev => prev.map(chat =>
              chat.id === chatId
                ? {
                    ...chat,
                    messages: chat.messages.map(msg =>
                      msg.id === userMessage.id ? persistentUserMessage : msg
                    )
                  }
                : chat
            ));
            userMessage = persistentUserMessage; // Update reference for AI processing
          }
        } catch (error) {
          // Silent error - images will remain as temporary URLs
        }
      }

      // Generate AI title in background using current provider
      console.log('Starting to generate title for:', content.slice(0, 50));
      aiProviderManager.current.generateChatTitle(content).then((aiTitle: string) => {
        console.log('Generated title:', aiTitle);
        setChats(prev => prev.map(chat =>
          chat.id === chatId
            ? { ...chat, title: aiTitle }
            : chat
        ));
      }).catch((error: Error) => {
        console.error('Failed to generate title:', error);
        // Fallback to truncated content
        const fallbackTitle = content.slice(0, 30) + (content.length > 30 ? '...' : '');
        console.log('Using fallback title:', fallbackTitle);
        setChats(prev => prev.map(chat =>
          chat.id === chatId
            ? { ...chat, title: fallbackTitle }
            : chat
        ));
      });
    } else {
      // Check if this is the first message in an existing empty chat
      const currentChat = chats.find(chat => chat.id === chatId);
      const isFirstMessage = !currentChat?.messages || currentChat.messages.length === 0;

      const newChatTitles = [
        t ? t('chat.newChatTitle') : 'New Chat',
        'Cuộc trò chuyện mới', // Legacy Vietnamese
        'New Chat', // Legacy English
        '新しいチャット' // Legacy Japanese
      ];

      if (isFirstMessage && newChatTitles.includes(currentChat?.title || '')) {
        // Generate AI title for first message in empty chat using current provider
        console.log('Generating title for first message in existing chat:', content.slice(0, 50));
        aiProviderManager.current.generateChatTitle(content).then((aiTitle: string) => {
          console.log('Generated title for existing chat:', aiTitle);
          setChats(prev => prev.map(chat =>
            chat.id === chatId
              ? { ...chat, title: aiTitle }
              : chat
          ));
        }).catch((error: Error) => {
          console.error('Failed to generate title for existing chat:', error);
          const fallbackTitle = content.slice(0, 30) + (content.length > 30 ? '...' : '');
          setChats(prev => prev.map(chat =>
            chat.id === chatId
              ? { ...chat, title: fallbackTitle }
              : chat
          ));
        });
      }
      // Update existing chat with user message (check for duplicates)
      setChats(prev => prev.map(chat =>
        chat.id === chatId
          ? {
              ...chat,
              messages: chat.messages.some(msg => msg.id === userMessage.id)
                ? chat.messages
                : [...chat.messages, userMessage],
              lastMessage: content,
              timestamp: new Date()
            }
          : chat
      ));

      // Store images persistently for existing chat
      if (files && files.length > 0) {
        try {
          const persistentUserMessage = await chatUtils.storeImagesPersistently(userMessage, chatId);
          if (persistentUserMessage !== userMessage) {
            // Update the message with persistent image data
            setChats(prev => prev.map(chat =>
              chat.id === chatId
                ? {
                    ...chat,
                    messages: chat.messages.map(msg =>
                      msg.id === userMessage.id ? persistentUserMessage : msg
                    )
                  }
                : chat
            ));
            userMessage = persistentUserMessage; // Update reference for AI processing
          }
        } catch (error) {
          // Silent error - images will remain as temporary URLs
        }
      }
    }

    // Get AI response using Gemini service
    setIsLoading(true);

    try {
      // Get current AI service from provider manager
      const currentService = aiProviderManager.current.getCurrentService();
      const currentProviderType = aiProviderManager.current.getCurrentProvider();

      // Validate that selectedModel belongs to current provider
      const currentProviderModels = aiProviderManager.current.getProviderModels(currentProviderType);
      const isValidModel = currentProviderModels.some(model => model.id === selectedModel);

      if (!isValidModel && currentProviderModels.length > 0) {
        setSelectedModel(currentProviderModels[0].id);
      }

      const modelToUse = isValidModel ? selectedModel : (currentProviderModels[0]?.id || selectedModel);

      // Prepare chat history for AI
      const currentChat = chats.find(chat => chat.id === chatId);
      const chatHistory = currentChat?.messages.map(msg =>
        createAIMessage(msg.content, msg.role as 'user' | 'assistant')
      ) || [];

      // Add current user message to history
      chatHistory.push(createAIMessage(content, 'user'));

      // Detect URLs and code keywords in the message
      const detectedUrls = detectUrls(content);
      const hasUrls = detectedUrls.length > 0;
      const hasCodeKeywords = detectCodeKeywords(content, getLocalizedKeywords());
      const modelSupportsUrlContext = supportsUrlContext(modelToUse);
      const modelSupportsCodeExecution = supportsCodeExecution(modelToUse);

      // Create options based on current provider
      let options: any = {
        model: modelToUse,
        temperature: 0.8
      };

      // Add provider-specific options
      if (currentProviderType === 'gemini') {
        // Gemini-specific options
        const geminiOptions = {
          ...options,
          enableThinking: enableThinking && supportsThinking(modelToUse),
          enableGoogleSearch: supportsGoogleSearch(modelToUse),
          enableUrlContext: hasUrls && modelSupportsUrlContext,
          enableCodeExecution: hasCodeKeywords && modelSupportsCodeExecution,
          enableTools: true
        };

        // Add thinkingConfig for models that support thinking
        if (supportsThinking(modelToUse)) {
          (geminiOptions as UseGeminiServiceOptions).thinkingConfig = {
            thinkingBudget: enableThinking ? -1 : 0,
            includeThoughts: enableThinking
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

      // Handle AI response with streaming support
      if (files && files.length > 0) {
        // Check if current provider supports files
        const supportsFiles = aiProviderManager.current.supportsFeature('files');
        if (!supportsFiles) {
          throw new Error(`Provider hiện tại không hỗ trợ file upload. Vui lòng chuyển sang Gemini để upload file.`);
        }

        // Only Gemini supports files currently, so use Gemini service directly
        const geminiService = getGeminiService();

        // Check if model supports files
        const modelInfo = getModelInfo(modelToUse);
        if (!modelInfo?.supportsFiles) {
          throw new Error(`Model ${modelToUse} không hỗ trợ file upload. Vui lòng chọn model khác.`);
        }

        // Convert files to base64 for inline data (simpler approach)
        const fileData = await Promise.all(
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

        // Use streaming with thinking for file uploads
        const thinkingStartTime = Date.now();
        const aiMessage = chatUtils.createMessage('', 'assistant', 'text', undefined, {
          thoughtSummary: '',
          isThinkingComplete: false
        });

        // Add initial AI message to chat
        setChats(prev => prev.map(chat =>
          chat.id === chatId
            ? {
                ...chat,
                messages: [...chat.messages, aiMessage],
                timestamp: new Date()
              }
            : chat
        ));

        let fullThoughts = '';
        let fullAnswer = '';
        let pendingUpdate = false;

        // Check if model supports thinking
        const supportsThinking = modelInfo?.supportsThinking || false;

        if (supportsThinking && enableThinking) {
          // Use thinking-aware streaming for files
          await geminiService.streamMessageWithFilesAndThinking(
            chatHistory,
            fileData,
            (thoughtChunk: string) => {
              // Handle thought chunks
              fullThoughts += thoughtChunk;

              if (!pendingUpdate) {
                pendingUpdate = true;
                requestAnimationFrame(() => {
                  setChats(prev => prev.map(chat => {
                    if (chat.id !== chatId) return chat;

                    return {
                      ...chat,
                      messages: chat.messages.map(msg =>
                        msg.id === aiMessage.id
                          ? {
                              ...msg,
                              thinking: {
                                ...msg.thinking,
                                thoughtSummary: fullThoughts,
                                isThinkingComplete: false
                              }
                            }
                          : msg
                      ),
                      timestamp: new Date()
                    };
                  }));
                  pendingUpdate = false;
                });
              }
            },
            (answerChunk: string) => {
              // Handle answer chunks
              fullAnswer += answerChunk;

              if (!pendingUpdate) {
                pendingUpdate = true;
                requestAnimationFrame(() => {
                  setChats(prev => prev.map(chat => {
                    if (chat.id !== chatId) return chat;

                    return {
                      ...chat,
                      messages: chat.messages.map(msg =>
                        msg.id === aiMessage.id
                          ? {
                              ...msg,
                              content: fullAnswer,
                              thinking: {
                                ...msg.thinking,
                                thoughtSummary: fullThoughts,
                                isThinkingComplete: true,
                                thinkingTimeSeconds: Math.round((Date.now() - thinkingStartTime) / 1000)
                              }
                            }
                          : msg
                      ),
                      lastMessage: fullAnswer,
                      timestamp: new Date()
                    };
                  }));
                  pendingUpdate = false;
                });
              }
            },
            options
          );
        } else {
          // Fallback to regular streaming for files without thinking
          await geminiService.streamMessageWithFiles(
            chatHistory,
            fileData,
            (chunk: string) => {
              fullAnswer += chunk;

              if (!pendingUpdate) {
                pendingUpdate = true;
                requestAnimationFrame(() => {
                  setChats(prev => prev.map(chat => {
                    if (chat.id !== chatId) return chat;

                    return {
                      ...chat,
                      messages: chat.messages.map(msg =>
                        msg.id === aiMessage.id
                          ? { ...msg, content: fullAnswer }
                          : msg
                      ),
                      lastMessage: fullAnswer,
                      timestamp: new Date()
                    };
                  }));
                  pendingUpdate = false;
                });
              }
            },
            options
          );
        }
      } else {
        // Use streaming for text-only messages
        const thinkingStartTime = Date.now();
        const aiMessage = chatUtils.createMessage('', 'assistant', 'text', undefined, {
          thoughtSummary: '',
          isThinkingComplete: false
        });
        let fullResponse = '';
        let fullThoughts = '';

        // Add empty AI message that will be updated incrementally
        setChats(prev => prev.map(chat =>
          chat.id === chatId
            ? {
                ...chat,
                messages: [...chat.messages, aiMessage],
                lastMessage: '',
                timestamp: new Date()
              }
            : chat
        ));

        // Throttle updates to improve performance
        let pendingUpdate = false;

        // Check if current provider and model supports thinking
        const currentProviderType = aiProviderManager.current.getCurrentProvider();
        const supportsThinkingFeature = aiProviderManager.current.supportsFeature('thinking');
        const modelInfo = currentProviderType === 'gemini' ? getModelInfo(selectedModel) : null;
        const supportsThinking = supportsThinkingFeature && modelInfo?.supportsThinking && enableThinking;

        if (supportsThinking && currentProviderType === 'gemini') {
          // Use thinking-aware streaming (Gemini only)
          const geminiService = getGeminiService();
          await geminiService.streamMessageWithThinking(
            chatHistory,
            (thoughtChunk: string) => {
              // Handle thought chunks
              fullThoughts += thoughtChunk;

              if (!pendingUpdate) {
                pendingUpdate = true;
                requestAnimationFrame(() => {
                  setChats(prev => prev.map(chat => {
                    if (chat.id !== chatId) return chat;

                    return {
                      ...chat,
                      messages: chat.messages.map(msg =>
                        msg.id === aiMessage.id
                          ? {
                              ...msg,
                              thinking: {
                                ...msg.thinking,
                                thoughtSummary: fullThoughts,
                                isThinkingComplete: false
                              }
                            }
                          : msg
                      ),
                      timestamp: new Date()
                    };
                  }));
                  pendingUpdate = false;
                });
              }
            },
            (answerChunk: string) => {
              // Handle answer chunks
              fullResponse += answerChunk;

              if (!pendingUpdate) {
                pendingUpdate = true;
                requestAnimationFrame(() => {
                  const thinkingTimeSeconds = Math.round((Date.now() - thinkingStartTime) / 1000);

                  setChats(prev => prev.map(chat => {
                    if (chat.id !== chatId) return chat;

                    return {
                      ...chat,
                      messages: chat.messages.map(msg =>
                        msg.id === aiMessage.id
                          ? {
                              ...msg,
                              content: fullResponse,
                              thinking: {
                                ...msg.thinking,
                                thoughtSummary: fullThoughts,
                                thinkingTimeSeconds,
                                isThinkingComplete: true
                              }
                            }
                          : msg
                      ),
                      lastMessage: fullResponse,
                      timestamp: new Date()
                    };
                  }));
                  pendingUpdate = false;
                });
              }
            },
            options
          );

          // Thinking streaming completed - time already calculated above
        } else {
          // Use regular streaming for all providers
          // State for thinking mode
          let isThinkingActive = false;
          let thinkingContent = '';
          let answerContent = '';

          await currentService.streamMessage(
            chatHistory,
            (chunk: string) => {
              // Handle Groq thinking signals
              if (chunk === '__GROQ_THINKING_START__') {
                isThinkingActive = true;
                thinkingContent = '';
                // Show thinking box immediately
                fullResponse = `**🤔 Quá trình suy nghĩ:**\n\n**💡 Câu trả lời:**\n`;

              } else if (chunk.startsWith('__GROQ_THINKING_CONTENT__')) {
                const content = chunk.replace('__GROQ_THINKING_CONTENT__', '');
                thinkingContent += content;
                // Update thinking content in real-time
                fullResponse = `**🤔 Quá trình suy nghĩ:**\n${thinkingContent}\n\n**💡 Câu trả lời:**\n${answerContent}`;

              } else if (chunk === '__GROQ_THINKING_END__') {
                isThinkingActive = false;
                // Keep thinking content but start answer
                fullResponse = `**🤔 Quá trình suy nghĩ:**\n${thinkingContent}\n\n**💡 Câu trả lời:**\n`;

              } else {
                // Regular content (answer)
                if (isThinkingActive) {
                  // Still thinking, don't add to answer yet
                  return;
                } else {
                  answerContent += chunk;
                  if (thinkingContent) {
                    // Has thinking content, format properly
                    fullResponse = `**🤔 Quá trình suy nghĩ:**\n${thinkingContent}\n\n**💡 Câu trả lời:**\n${answerContent}`;
                  } else {
                    // No thinking content, just answer
                    fullResponse += chunk;
                  }
                }
              }

              // Throttle updates to avoid too frequent re-renders
              if (!pendingUpdate) {
                pendingUpdate = true;

                // Use requestAnimationFrame for smooth updates
                requestAnimationFrame(() => {
                  setChats(prev => prev.map(chat => {
                    if (chat.id !== chatId) return chat;

                    return {
                      ...chat,
                      messages: chat.messages.map(msg =>
                        msg.id === aiMessage.id
                          ? { ...msg, content: fullResponse }
                          : msg
                      ),
                      lastMessage: fullResponse,
                      timestamp: new Date()
                    };
                  }));

                  pendingUpdate = false;
                });
              }
            },
            options
          );
        }
      }
    } catch (error) {
      console.error('Gemini Service Error:', error);

      // Check if this is an API key error
      if (error instanceof Error && error.message === 'API_KEY_REQUIRED') {
        setShowApiKeySetup(true);
        setIsLoading(false);
        return;
      }

      // Create standardized error
      const chatError = createChatError(error, 'api', {
        retryable: true,
        fallbackMessage: t ? t('chat.errors.geminiConnection') : 'Sorry, an error occurred while connecting to Gemini AI. Please try again later.'
      });

      let errorText = chatError.message;

      // Add model suggestion for quota errors
      if (chatError.type === 'api' && chatError.message.includes('quota')) {
        const currentModelInfo = getModelInfo(selectedModel);
        const modelName = currentModelInfo?.name || selectedModel;
        errorText += ` Bạn có thể thử đổi sang model khác thay vì ${modelName}.`;
      }

      // Store the failed message for retry functionality
      setLastFailedMessage(content);

      // Handle error with retry functionality
      handleError(error, 'api', () => {
        if (content) {
          handleSendMessage(content, files);
        }
      });

      // Remove the user message that failed to get a response
      setChats(prev => prev.map(chat =>
        chat.id === chatId
          ? {
              ...chat,
              messages: chat.messages.slice(0, -1), // Remove the last user message
              lastMessage: chat.messages.length > 1 ? chat.messages[chat.messages.length - 2].content : '',
              timestamp: new Date()
            }
          : chat
      ));
    } finally {
      setIsLoading(false);
    }
  };

  // Handle navigation
  const handleGoHome = () => {
    router.push('/home');
  };

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

  const handleClearHistory = async () => {
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
  };

  return (
    <div className={cn("h-screen bg-background", className)}>
      {/* Error Notification */}
      {currentError && (
        <ErrorNotification
          error={currentError}
          onRetry={lastFailedMessage ? () => handleSendMessage(lastFailedMessage) : undefined}
          onDismiss={() => {
            clearError();
            setLastFailedMessage(null);
          }}
          showRetry={!!lastFailedMessage}
        />
      )}

      {/* Sidebar */}
      <ChatSidebar
        isOpen={isSidebarOpen}
        onToggle={() => {
          const newState = !isSidebarOpen;
          setIsSidebarOpen(newState);
          // Track user intent: if closing on large screen, mark as user-closed
          if (!newState && isLargeScreen) {
            userClosedSidebarRef.current = true;
          }
        }}
        chats={chats}
        currentChatId={currentChatId}
        onNewChat={handleNewChat}
        onSelectChat={handleSelectChat}
        onDeleteChat={handleDeleteChat}
        isLargeScreen={isLargeScreen}
      />

      {/* Main Chat Area - Responsive margin for sidebar */}
      <div className={cn(
        "h-full flex flex-col transition-all duration-300 ease-in-out",
        // On mobile: no margin (overlay mode)
        // On desktop (lg+): add left margin when sidebar is open
        isSidebarOpen ? "lg:ml-80" : "lg:ml-0"
      )}>
        {/* Modern Header - Clean and minimal */}
        <div className="flex items-center justify-between px-6 py-6 border-b border-border bg-background/95 backdrop-blur-sm">
          <div className="flex items-center gap-4">
            {/* Menu Button - Only show when sidebar is closed on desktop, always show on mobile */}
            {(!isSidebarOpen || !isLargeScreen) && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  const newState = !isSidebarOpen;
                  setIsSidebarOpen(newState);
                  // Track user intent: if closing on large screen, mark as user-closed
                  if (!newState && isLargeScreen) {
                    userClosedSidebarRef.current = true;
                  }
                }}
                className="text-foreground hover:bg-accent transition-opacity duration-300"
              >
                <Menu className="w-5 h-5" />
              </Button>
            )}
            {/* Provider Selection */}
            <ProviderSelector
              onProviderChange={(provider) => {
                // Switch provider in manager first
                aiProviderManager.current.switchProvider(provider);
                setCurrentProvider(provider);

                // Update available models based on provider
                const providerModels = aiProviderManager.current.getProviderModels(provider);
                const formattedModels = formatModelsForUI(providerModels, provider);
                setAiModels(formattedModels);

                // Reset to first available model
                if (formattedModels.length > 0) {
                  setSelectedModel(formattedModels[0].id);
                }
              }}
              onConfigureProvider={() => {
                // Show settings modal with API tab focused
                setSettingsDefaultTab("api");
                setShowSettings(true);
              }}
            />

            {/* Model Selection Dropdown */}
            <HeaderModelSelector
              selectedModel={selectedModel}
              availableModels={aiModels}
              onModelChange={setSelectedModel}
            />
          </div>

          {/* User Dropdown */}
          {user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                  <User className="h-5 w-5" />
                  <span className="sr-only">User menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                {/* User Info */}
                <div className="flex items-center justify-start gap-3 p-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex flex-col space-y-1 leading-none">
                    <p className="font-medium text-sm">{user.name}</p>
                    <p className="text-xs text-muted-foreground truncate max-w-[180px]">
                      {user.email}
                    </p>
                  </div>
                </div>
                <DropdownMenuSeparator />

                {/* Navigation Items */}
                <DropdownMenuItem onClick={handleGoHome}>
                  <Home className="mr-2 h-4 w-4" />
                  {t ? t('chat.navigation.home') : 'Home'}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setShowSettings(true)}>
                  <Settings className="mr-2 h-4 w-4" />
                  {t ? t('chat.navigation.settings') : 'Settings'}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {/* Chat Interface */}
        <div className="flex-1 bg-background overflow-hidden">
          <ChatInterface
            className="h-full"
            messages={currentChat?.messages || []}
            onSendMessage={handleSendMessage}
            onProcessMultiplePDFs={handleProcessMultiplePDFs}
            onStopGeneration={handleStopGeneration}
            isLoading={isLoading}
            selectedModel={selectedModel}
            enableThinking={enableThinking}
            currentProvider={currentProvider}
            onEditMessage={handleEditMessage}
            onToggleThinking={() => {
              const newThinkingState = !enableThinking;
              setEnableThinking(newThinkingState);
              // Save to localStorage for persistence
              SafeLocalStorage.set('enable_thinking', newThinkingState.toString());
            }}
          />
        </div>

        {/* Unified Settings Modal */}
        <UnifiedSettings
          isOpen={showSettings}
          onOpenChange={(open) => {
            setShowSettings(open);
            if (!open) {
              setSettingsDefaultTab("general"); // Reset to general tab when closing
            }
          }}
          onClearHistory={handleClearHistory}
          selectedModel={selectedModel}
          onModelChange={setSelectedModel}
          defaultTab={settingsDefaultTab}
        />

        {/* Multi-Provider API Key Setup Modal */}
        <MultiProviderApiKeyModal
          isOpen={showApiKeySetup}
          onClose={() => setShowApiKeySetup(false)}
          defaultProvider={currentProvider}
        />
      </div>
    </div>
  );
};
