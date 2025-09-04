import { useRef, useCallback } from 'react';
import { Chat, Message, chatUtils } from '../index';

interface StreamingState {
  fullResponse: string;
  fullThoughts: string;
  pendingUpdate: boolean;
}

interface UseStreamingResponseProps {
  chatId: string;
  setChats: React.Dispatch<React.SetStateAction<Chat[]>>;
}

interface UseStreamingResponseReturn {
  createStreamingMessage: () => Message;
  handleStreamChunk: (chunk: string, messageId: string) => void;
  handleThoughtChunk: (chunk: string, messageId: string) => void;
  handleAnswerChunk: (chunk: string, messageId: string, thinkingStartTime?: number) => void;
  resetStreamingState: () => void;
  getStreamingState: () => StreamingState;
}

/**
 * Custom hook for managing streaming AI responses with thinking mode support
 * Handles throttled updates, thinking/answer separation, and requestAnimationFrame optimization
 */
export const useStreamingResponse = ({
  chatId,
  setChats
}: UseStreamingResponseProps): UseStreamingResponseReturn => {
  
  // Streaming state
  const streamingState = useRef<StreamingState>({
    fullResponse: '',
    fullThoughts: '',
    pendingUpdate: false
  });

  // Create initial streaming message
  const createStreamingMessage = useCallback((): Message => {
    const aiMessage = chatUtils.createMessage('', 'assistant', 'text', undefined, {
      thoughtSummary: '',
      isThinkingComplete: false
    });
    
    // Set status to 'sending' to trigger dots animation immediately
    aiMessage.status = 'sending';

    // Add initial message to chat
    setChats(prev => prev.map(chat => {
      if (chat.id !== chatId) return chat;
      return {
        ...chat,
        messages: [...chat.messages, aiMessage],
        timestamp: new Date()
      };
    }));

    return aiMessage;
  }, [chatId, setChats]);

  // Handle regular streaming chunks
  const handleStreamChunk = useCallback((
    chunk: string,
    messageId: string
  ) => {
    const state = streamingState.current;

    // Handle regular streaming chunks
    state.fullResponse += chunk;

    // Throttle updates to avoid too frequent re-renders
    if (!state.pendingUpdate) {
      state.pendingUpdate = true;

      requestAnimationFrame(() => {
        setChats(prev => prev.map(chat => {
          if (chat.id !== chatId) return chat;

          return {
            ...chat,
            messages: chat.messages.map(msg =>
              msg.id === messageId
                ? { 
                    ...msg, 
                    content: state.fullResponse,
                    // Update status to 'sent' when content starts arriving
                    status: state.fullResponse ? 'sent' : 'sending'
                  }
                : msg
            ),
            lastMessage: state.fullResponse,
            timestamp: new Date()
          };
        }));

        state.pendingUpdate = false;
      });
    }
  }, [chatId, setChats]);

  // Handle thought chunks (for Gemini thinking mode)
  const handleThoughtChunk = useCallback((chunk: string, messageId: string) => {
    const state = streamingState.current;
    state.fullThoughts += chunk;

    if (!state.pendingUpdate) {
      state.pendingUpdate = true;
      requestAnimationFrame(() => {
        setChats(prev => prev.map(chat => {
          if (chat.id !== chatId) return chat;

          return {
            ...chat,
            messages: chat.messages.map(msg =>
              msg.id === messageId
                ? {
                    ...msg,
                    thinking: {
                      ...msg.thinking,
                      thoughtSummary: state.fullThoughts,
                      isThinkingComplete: false
                    }
                  }
                : msg
            ),
            timestamp: new Date()
          };
        }));
        state.pendingUpdate = false;
      });
    }
  }, [chatId, setChats]);

  // Handle answer chunks (for Gemini thinking mode)
  const handleAnswerChunk = useCallback((
    chunk: string, 
    messageId: string, 
    thinkingStartTime?: number
  ) => {
    const state = streamingState.current;
    state.fullResponse += chunk;

    if (!state.pendingUpdate) {
      state.pendingUpdate = true;
      requestAnimationFrame(() => {
        const thinkingTimeSeconds = thinkingStartTime 
          ? Math.round((Date.now() - thinkingStartTime) / 1000)
          : 0;

        setChats(prev => prev.map(chat => {
          if (chat.id !== chatId) return chat;

          return {
            ...chat,
            messages: chat.messages.map(msg =>
              msg.id === messageId
                ? {
                    ...msg,
                    content: state.fullResponse,
                    // Update status to 'sent' when content arrives
                    status: state.fullResponse ? 'sent' : 'sending',
                    thinking: {
                      ...msg.thinking,
                      thoughtSummary: state.fullThoughts,
                      thinkingTimeSeconds,
                      isThinkingComplete: true
                    }
                  }
                : msg
            ),
            lastMessage: state.fullResponse,
            timestamp: new Date()
          };
        }));
        state.pendingUpdate = false;
      });
    }
  }, [chatId, setChats]);

  // Reset streaming state
  const resetStreamingState = useCallback(() => {
    streamingState.current = {
      fullResponse: '',
      fullThoughts: '',
      pendingUpdate: false
    };
  }, []);

  // Get current streaming state (for debugging)
  const getStreamingState = useCallback(() => {
    return { ...streamingState.current };
  }, []);

  return {
    createStreamingMessage,
    handleStreamChunk,
    handleThoughtChunk,
    handleAnswerChunk,
    resetStreamingState,
    getStreamingState
  };
};
