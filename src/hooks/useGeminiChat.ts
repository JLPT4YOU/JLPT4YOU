/**
 * React Hook for Gemini Chat Integration
 * Provides easy-to-use interface for chat functionality with streaming support
 */

import { useState, useCallback, useRef } from 'react';
import { GeminiService, getGeminiService } from '@/lib/gemini-service-unified';
import { AIMessage } from '@/lib/ai-config';
import { createAIMessage } from '@/lib/ai-shared-utils';

export interface UseGeminiChatOptions {
  apiKey?: string;
  onError?: (error: Error) => void;
  onStreamStart?: () => void;
  onStreamEnd?: () => void;
}

export interface ChatState {
  messages: AIMessage[];
  isLoading: boolean;
  isStreaming: boolean;
  error: string | null;
  currentResponse: string;
}

export interface UseGeminiChatReturn {
  // State
  messages: AIMessage[];
  isLoading: boolean;
  isStreaming: boolean;
  error: string | null;
  currentResponse: string;

  // Actions
  sendMessage: (content: string) => Promise<void>;
  sendMessageWithFiles: (content: string, files: File[]) => Promise<void>;
  streamMessage: (content: string) => Promise<void>;
  cancelStream: () => void;
  clearMessages: () => void;
  clearError: () => void;

  // Utilities
  addMessage: (message: AIMessage) => void;
  updateLastMessage: (content: string) => void;
}

export function useGeminiChat(options: UseGeminiChatOptions = {}): UseGeminiChatReturn {
  const [state, setState] = useState<ChatState>({
    messages: [],
    isLoading: false,
    isStreaming: false,
    error: null,
    currentResponse: '',
  });

  const geminiService = useRef(getGeminiService(options.apiKey));
  const abortControllerRef = useRef<AbortController | null>(null);

  const updateState = useCallback((updates: Partial<ChatState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  const handleError = useCallback((error: Error) => {
    console.error('Gemini chat error:', error);
    updateState({ 
      error: error.message, 
      isLoading: false, 
      isStreaming: false 
    });
    options.onError?.(error);
  }, [options, updateState]);

  const addMessage = useCallback((message: AIMessage) => {
    setState(prev => ({
      ...prev,
      messages: [...prev.messages, message],
    }));
  }, []);

  const updateLastMessage = useCallback((content: string) => {
    setState(prev => {
      const messages = [...prev.messages];
      if (messages.length > 0) {
        messages[messages.length - 1] = {
          ...messages[messages.length - 1],
          content,
        };
      }
      return { ...prev, messages };
    });
  }, []);

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim()) return;

    try {
      updateState({ isLoading: true, error: null });
      
      const userMessage = createAIMessage(content, 'user');
      addMessage(userMessage);

      const response = await geminiService.current.sendMessage(
        [...state.messages, userMessage]
      );

      const assistantMessage = createAIMessage(response, 'assistant');
      addMessage(assistantMessage);

    } catch (error) {
      handleError(error as Error);
    } finally {
      updateState({ isLoading: false });
    }
  }, [state.messages, addMessage, updateState, handleError]);

  const streamMessage = useCallback(async (content: string) => {
    if (!content.trim()) return;

    try {
      updateState({
        isStreaming: true,
        error: null,
        currentResponse: ''
      });

      options.onStreamStart?.();

      const userMessage = createAIMessage(content, 'user');
      addMessage(userMessage);

      // Add empty assistant message that will be updated
      const assistantMessage = createAIMessage('', 'assistant');
      addMessage(assistantMessage);

      let fullResponse = '';

      const handleChunk = (chunk: string) => {
        fullResponse += chunk;
        updateState({ currentResponse: fullResponse });
        updateLastMessage(fullResponse);
      };

      const controller = new AbortController();
      abortControllerRef.current = controller;

      await geminiService.current.streamMessage(
        [...state.messages, userMessage],
        handleChunk
      );

    } catch (error) {
      // Ignore AbortError as a normal cancel
      if ((error as any)?.name !== 'AbortError') {
        handleError(error as Error);
      }
    } finally {
      abortControllerRef.current = null;
      updateState({
        isStreaming: false,
        currentResponse: ''
      });
      options.onStreamEnd?.();
    }
  }, [state.messages, options, updateState, addMessage, updateLastMessage, handleError]);

  const sendMessageWithFiles = useCallback(async (content: string, files: File[]) => {
    if (!content.trim() && files.length === 0) return;

    try {
      updateState({ isLoading: true, error: null });

      const userMessage = createAIMessage(content, 'user');
      addMessage(userMessage);

      // Convert files to base64
      const fileData = await Promise.all(
        files.map(async (file) => {
          const base64 = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
              const result = reader.result as string;
              // Remove data:mime/type;base64, prefix
              const base64Data = result.split(',')[1];
              resolve(base64Data);
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
          });

          return {
            data: base64,
            mimeType: file.type
          };
        })
      );

      // Note: File uploads should be handled through the server API
      // For now, send message without files
      const response = await geminiService.current.sendMessage(
        [...state.messages, userMessage]
      );

      const assistantMessage = createAIMessage(response, 'assistant');
      addMessage(assistantMessage);

    } catch (error) {
      handleError(error as Error);
    } finally {
      updateState({ isLoading: false });
    }
  }, [state.messages, options, updateState, addMessage, handleError]);

  const clearMessages = useCallback(() => {
    updateState({
      messages: [],
      error: null,
      currentResponse: ''
    });
  }, [updateState]);

  const clearError = useCallback(() => {
    updateState({ error: null });
  }, [updateState]);

  const cancelStream = useCallback(() => {
    try {
      abortControllerRef.current?.abort();
    } catch {}
    abortControllerRef.current = null;
    updateState({ isStreaming: false });
  }, [updateState]);

  return {
    // State
    messages: state.messages,
    isLoading: state.isLoading,
    isStreaming: state.isStreaming,
    error: state.error,
    currentResponse: state.currentResponse,

    // Actions
    sendMessage,
    sendMessageWithFiles,
    streamMessage,
    cancelStream,
    clearMessages,
    clearError,

    // Utilities
    addMessage,
    updateLastMessage,
  };
}
