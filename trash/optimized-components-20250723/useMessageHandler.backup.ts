// BACKUP: useMessageHandler.ts - Original 832 lines before refactor
// Date: 2025-01-23
// This file will be refactored step by step for better maintainability

import { useRef } from 'react';
import { Buffer } from 'buffer';
import { Chat, Message, chatUtils } from '../index';
import { createAIMessage } from '@/lib/ai-service';
import { createChatError } from '@/lib/chat-error-handler';
import { detectUrls, detectCodeKeywords } from '@/lib/chat-utils';
import { supportsThinking, supportsGoogleSearch, supportsCodeExecution, supportsUrlContext } from '@/lib/model-utils';
import { getGeminiService, UseGeminiServiceOptions } from '@/lib/gemini-service';
import { getModelInfo } from '@/lib/gemini-config';
import { useTranslations } from '@/hooks/use-translations';
import { useErrorHandler } from '@/hooks/use-error-handler';

interface UseMessageHandlerProps {
  // Dependencies
  aiProviderManager: React.MutableRefObject<any>;
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
    currentProvider,
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

  // Get localized programming keywords for code detection
  const getLocalizedKeywords = (): string[] => {
    return t ? (t('chat.keywords.programming') as string[]) || [] : [];
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

    // Create AI message placeholder with thinking data
    const aiMessage = chatUtils.createMessage('', 'assistant', 'text', undefined, {
      thoughtSummary: '',
      isThinkingComplete: false,
      thinkingTimeSeconds: 0
    });

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
      const isValidModel = currentProviderModels.some((model: any) => model.id === selectedModel);

      if (!isValidModel && currentProviderModels.length > 0) {
        // Model validation will be handled by parent component
      }

      const modelToUse = isValidModel ? selectedModel : (currentProviderModels[0]?.id || selectedModel);

      // Check if any message has files
      const hasFiles = messages.some(msg => msg.files && msg.files.length > 0);
      console.log('generateAIResponse: Has files?', hasFiles);

      // Prepare chat history for AI
      const chatHistory = messages
        .filter(msg => msg.content && msg.content.trim().length > 0) // Filter out empty messages
        .map(msg => ({
          role: msg.role,
          content: msg.content,
          files: msg.files
        }));

      // Ensure we have at least one message with content
      if (chatHistory.length === 0) {
        console.error('generateAIResponse: No valid messages found', {
          originalMessages: messages.map(m => ({ role: m.role, contentLength: m.content?.length || 0 }))
        });
        throw new Error('No valid messages found to send to AI');
      }

      console.log('generateAIResponse: Prepared chat history', {
        historyLength: chatHistory.length,
        lastMessage: chatHistory[chatHistory.length - 1]?.content?.slice(0, 50),
        hasFiles
      });

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

      // Check if current provider and model supports thinking
      const supportsThinkingFeature = aiProviderManager.current.supportsFeature('thinking');
      const modelInfo = currentProviderType === 'gemini' ? getModelInfo(selectedModel) : null;
      const supportsThinkingMode = supportsThinkingFeature && modelInfo?.supportsThinking && enableThinking;

      // Handle files if present (only for Gemini)
      if (hasFiles && currentProviderType === 'gemini') {
        console.log('generateAIResponse: Processing files with Gemini');

        // Check if model supports files
        if (!modelInfo?.supportsFiles) {
          throw new Error(`Model ${modelToUse} does not support file uploads`);
        }

        // Convert files to base64 format for Gemini
        const fileData = [];
        for (const message of messages) {
          if (message.files && message.files.length > 0) {
            for (const file of message.files) {
              if (file.url && file.url.startsWith('blob:')) {
                // Convert blob URL to base64
                try {
                  const response = await fetch(file.url);
                  const arrayBuffer = await response.arrayBuffer();
                  const base64 = Buffer.from(arrayBuffer).toString('base64');
                  fileData.push({
                    data: base64,
                    mimeType: file.type,
                    name: file.name
                  });
                } catch (error) {
                  console.error('Error converting file to base64:', error);
                }
              }
            }
          }
        }

        console.log('generateAIResponse: Converted files to base64', { fileCount: fileData.length });

        // Use file-specific streaming methods
        const geminiService = getGeminiService();
        const thinkingStartTime = Date.now();
        let fullThoughts = '';
        let fullResponse = '';
        let pendingUpdate = false;

        if (supportsThinkingMode) {
          // Use thinking-aware streaming with files
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
        } else {
          // Use regular streaming with files (no thinking)
          await geminiService.streamMessageWithFiles(
            chatHistory,
            fileData,
            (chunk: string) => {
              fullResponse += chunk;

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
        }

        return; // Exit early after handling files
      }

      if (supportsThinkingMode && currentProviderType === 'gemini') {
        // Use Gemini thinking-aware streaming
        const geminiService = getGeminiService();
        const thinkingStartTime = Date.now();
        let fullThoughts = '';
        let fullResponse = '';
        let pendingUpdate = false;

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
      } else {
        // Use regular streaming for all providers (including Groq thinking signals)
        let fullResponse = '';
        let pendingUpdate = false;

        // State for Groq thinking mode (using same structure as Gemini)
        let isThinkingActive = false;
        let thinkingContent = '';
        let answerContent = '';
        const thinkingStartTime = Date.now();

        await currentService.streamMessage(
          chatHistory,
          (chunk: string) => {
          // Handle Groq thinking signals
          if (chunk === '__GROQ_THINKING_START__') {
            isThinkingActive = true;
            thinkingContent = '';

            // Initialize thinking data immediately
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
                              thoughtSummary: '',
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
            return; // Don't continue to regular update

          } else if (chunk.startsWith('__GROQ_THINKING_CONTENT__')) {
            const content = chunk.replace('__GROQ_THINKING_CONTENT__', '');
            thinkingContent += content;

            // Update thinking data like Gemini (separate from content)
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
                              thoughtSummary: thinkingContent,
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
            return; // Don't continue to regular update

          } else if (chunk === '__GROQ_THINKING_END__') {
            isThinkingActive = false;

            // Immediately update thinking as complete
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
                            thinking: thinkingContent ? {
                              ...msg.thinking,
                              thoughtSummary: thinkingContent,
                              thinkingTimeSeconds,
                              isThinkingComplete: true
                            } : msg.thinking
                          }
                        : msg
                    ),
                    timestamp: new Date()
                  };
                }));
                pendingUpdate = false;
              });
            }
            return; // Don't continue to regular update

          } else {
            // Regular content (answer)
            if (isThinkingActive) {
              return; // Still thinking, don't add to answer yet
            } else {
              answerContent += chunk;
              fullResponse += chunk;
            }
          }

          // Throttle updates to avoid too frequent re-renders
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
                          thinking: thinkingContent ? {
                            ...msg.thinking,
                            thoughtSummary: thinkingContent,
                            thinkingTimeSeconds,
                            isThinkingComplete: !isThinkingActive
                          } : msg.thinking
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
      } // End of else block for regular streaming

    } catch (error) {
      console.error('Error generating AI response:', error);
      handleError(error instanceof Error ? error : new Error('Failed to generate AI response'));
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

  // Handle process multiple PDFs
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

  // Handle send message - simplified version focusing on core logic
  const handleSendMessage = async (content: string, files?: File[]) => {
    // Validate input
    if (!content || content.trim().length === 0) {
      console.warn('handleSendMessage: Empty content provided');
      return;
    }

    let chatId = currentChatId;
    let userMessage = chatUtils.createMessage(content, 'user', 'text', files);

    console.log('handleSendMessage: Sending message', { content: content.slice(0, 50), chatId, hasFiles: !!files?.length });

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

      // Generate AI title in background using current provider
      console.log('Starting to generate title for:', content.slice(0, 50));
      aiProviderManager.current.generateChatTitle(content).then((aiTitle: string) => {
        console.log('Generated title:', aiTitle);
        setChats((prev: Chat[]) => prev.map(chat =>
          chat.id === chatId
            ? { ...chat, title: aiTitle }
            : chat
        ));
      }).catch((error: Error) => {
        console.error('Failed to generate title:', error);
        // Fallback to truncated content
        const fallbackTitle = content.slice(0, 30) + (content.length > 30 ? '...' : '');
        console.log('Using fallback title:', fallbackTitle);
        setChats((prev: Chat[]) => prev.map(chat =>
          chat.id === chatId
            ? { ...chat, title: fallbackTitle }
            : chat
        ));
      });
    } else {
      // Update existing chat with user message
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
    }

    // Get AI response
    setIsLoading(true);

    try {
      // Get updated messages including the new user message
      const currentChat = chats.find(chat => chat.id === chatId);
      let allMessages = currentChat?.messages || [];

      // Ensure the user message is included in the messages array
      if (!allMessages.some(msg => msg.id === userMessage.id)) {
        allMessages = [...allMessages, userMessage];
      }

      await generateAIResponse(chatId, allMessages);
    } catch (error) {
      console.error('Error in handleSendMessage:', error);

      // Store the failed message for retry functionality
      setLastFailedMessage(content);

      // Handle error
      handleError(error instanceof Error ? error : new Error('Failed to send message'));
    } finally {
      setIsLoading(false);
    }
  };

  return {
    handleSendMessage,
    handleEditMessage,
    handleProcessMultiplePDFs,
    handleStopGeneration,
    generateAIResponse,
    getLocalizedKeywords
  };
};
