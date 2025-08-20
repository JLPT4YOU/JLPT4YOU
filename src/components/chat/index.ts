export { ChatInterface } from './ChatInterface';
export { ChatSidebar } from './ChatSidebar';
export { MessageBubble } from './MessageBubble';
export { InputArea } from './InputArea';

export { ChatSettings } from './ChatSettings';

// Types
export interface FileAttachment {
  name: string;
  type: string;
  size: number;
  url: string; // Object URL for preview or data URL for persistent images
  storageId?: string; // ID for persistent storage (IndexedDB)
  isPersistent?: boolean; // Flag to indicate if image is stored persistently
}

export interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
  type?: 'text' | 'code' | 'markdown';
  status?: 'sending' | 'sent' | 'error';
  files?: FileAttachment[];
  // Thinking mode data
  thinking?: {
    thoughtSummary?: string;
    thinkingTimeSeconds?: number;
    isThinkingComplete?: boolean;
  };
}

export interface Chat {
  id: string;
  title: string;
  lastMessage?: string;
  timestamp: Date;
  messages: Message[];
  isActive?: boolean;
}

// Error handling types
export interface ChatError {
  message: string;
  type: 'network' | 'api' | 'validation' | 'storage' | 'unknown';
  retryable: boolean;
  timestamp: Date;
}

// LocalStorage data types
export interface StoredChat {
  id: string;
  title: string;
  lastMessage?: string;
  timestamp: string; // ISO string format
  messages: StoredMessage[];
  isActive?: boolean;
}

export interface StoredMessage {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: string; // ISO string format
  type?: 'text' | 'code' | 'markdown';
  status?: 'sending' | 'sent' | 'error';
  files?: FileAttachment[];
  // Thinking mode data
  thinking?: {
    thoughtSummary?: string;
    thinkingTimeSeconds?: number;
    isThinkingComplete?: boolean;
  };
}

// Utility functions for chat session management
export const chatUtils = {
  // Generate unique ID for messages and chats
  generateId: (): string => {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  },

  // Create a new chat session
  createNewChat: (): Chat => {
    return {
      id: chatUtils.generateId(),
      title: 'New Chat',
      timestamp: new Date(),
      messages: [],
      isActive: true
    };
  },

  // Create a new message
  createMessage: (
    content: string,
    role: 'user' | 'assistant',
    type: 'text' | 'code' | 'markdown' = 'text',
    files?: File[],
    thinking?: {
      thoughtSummary?: string;
      thinkingTimeSeconds?: number;
      isThinkingComplete?: boolean;
    }
  ): Message => {
    return {
      id: chatUtils.generateId(),
      content,
      role,
      timestamp: new Date(),
      type,
      status: role === 'user' ? 'sending' : 'sent',
      files: files?.map(file => {
        try {
          return {
            name: file.name,
            type: file.type,
            size: file.size,
            url: URL.createObjectURL(file),
            isPersistent: false // Initially not persistent, will be updated after storage
          };
        } catch (error) {
          if (process.env.NODE_ENV === 'development') {
            if (process.env.NODE_ENV === 'development') {
              console.error('Error creating object URL:', error);
            }
          }
          return {
            name: file.name,
            type: file.type,
            size: file.size,
            url: '',
            isPersistent: false
          };
        }
      }),
      thinking
    };
  },

  // Create a message with persistent file attachments
  createMessageWithPersistentFiles: (
    content: string,
    role: 'user' | 'assistant',
    type: 'text' | 'code' | 'markdown' = 'text',
    fileAttachments?: FileAttachment[],
    thinking?: {
      thoughtSummary?: string;
      thinkingTimeSeconds?: number;
      isThinkingComplete?: boolean;
    }
  ): Message => {
    return {
      id: chatUtils.generateId(),
      content,
      role,
      timestamp: new Date(),
      type,
      status: role === 'user' ? 'sending' : 'sent',
      files: fileAttachments,
      thinking
    };
  },

  // Generate chat title from first user message
  generateChatTitle: (firstMessage: string): string => {
    const maxLength = 30;
    if (firstMessage.length <= maxLength) {
      return firstMessage;
    }
    return firstMessage.substring(0, maxLength).trim() + '...';
  },

  // Update message status
  updateMessageStatus: (message: Message, status: 'sending' | 'sent' | 'error'): Message => {
    return { ...message, status };
  },

  // Store files persistently and update file attachments (images + other files)
  storeImagesPersistently: async (
    message: Message,
    chatId: string
  ): Promise<Message> => {
    if (!message.files || message.files.length === 0) {
      return message;
    }

    const updatedFiles: FileAttachment[] = [];

    for (const file of message.files) {
      // Handle blob URLs for any file type
      if (file.url && file.url.startsWith('blob:') && !file.isPersistent) {
        try {
          // Convert blob URL back to File object
          const response = await fetch(file.url);
          if (!response.ok) {
            throw new Error(`Failed to fetch blob: ${response.status}`);
          }

          const blob = await response.blob();
          const fileObj = new File([blob], file.name, { type: file.type });

          // For images, store in IndexedDB
          if (file.type && file.type.startsWith('image/')) {
            const { imageStorage } = await import('@/lib/image-storage');
            const storageId = await imageStorage.storeImage(fileObj, chatId);
            const dataUrl = await imageStorage.getImageDataUrl(storageId);

            if (!dataUrl) {
              throw new Error('Failed to retrieve stored image data URL');
            }

            // Clean up temporary blob URL
            URL.revokeObjectURL(file.url);

            updatedFiles.push({
              ...file,
              url: dataUrl,
              storageId,
              isPersistent: true
            });
          } else {
            // For non-image files (PDFs, etc.), convert to data URL
            const reader = new FileReader();
            const dataUrl = await new Promise<string>((resolve, reject) => {
              reader.onload = () => resolve(reader.result as string);
              reader.onerror = () => reject(reader.error);
              reader.readAsDataURL(fileObj);
            });

            // Clean up temporary blob URL
            URL.revokeObjectURL(file.url);

            updatedFiles.push({
              ...file,
              url: dataUrl,
              isPersistent: true // Mark as persistent (data URL)
            });
          }
        } catch (error) {
          if (process.env.NODE_ENV === 'development') {
            if (process.env.NODE_ENV === 'development') {
              console.warn(`Failed to store file ${file.name}:`, error);
            }
          }
          // Keep original file attachment if storage fails
          updatedFiles.push({
            ...file,
            url: file.url || '',
            isPersistent: false
          });
        }
      } else {
        // Already persistent files or non-blob URLs
        updatedFiles.push(file);
      }
    }

    return {
      ...message,
      files: updatedFiles
    };
  },

  // Restore persistent images when loading from storage
  restorePersistentImages: async (message: Message): Promise<Message> => {
    if (!message.files || message.files.length === 0) {
      return message;
    }

    try {
      const { imageStorage } = await import('@/lib/image-storage');
      const updatedFiles: FileAttachment[] = [];

      for (const file of message.files) {
        if (file.storageId && file.isPersistent) {
          try {
            const dataUrl = await imageStorage.getImageDataUrl(file.storageId);
            if (dataUrl) {
              updatedFiles.push({
                ...file,
                url: dataUrl
              });
            } else {
              // If persistent image not found, mark as unavailable but keep file info
              if (process.env.NODE_ENV === 'development') {
                if (process.env.NODE_ENV === 'development') {
                  console.warn(`Persistent image not found for storageId: ${file.storageId}`);
                }
              }
              updatedFiles.push({
                ...file,
                url: '', // Clear invalid URL
                isPersistent: false // Mark as no longer persistent
              });
            }
          } catch (error) {
            if (process.env.NODE_ENV === 'development') {
              if (process.env.NODE_ENV === 'development') {
                console.warn(`Failed to restore persistent image ${file.storageId}:`, error);
              }
            }
            // Keep file info but clear invalid URL
            updatedFiles.push({
              ...file,
              url: '',
              isPersistent: false
            });
          }
        } else if (file.url && file.url.startsWith('blob:')) {
          // Handle blob URLs that might be invalid after page reload
          try {
            // Test if blob URL is still valid
            const response = await fetch(file.url);
            if (response.ok) {
              updatedFiles.push(file);
            } else {
              throw new Error('Blob URL no longer valid');
            }
          } catch {
            // Blob URL is invalid, clear it
            if (process.env.NODE_ENV === 'development') {
              if (process.env.NODE_ENV === 'development') {
                console.warn(`Invalid blob URL detected: ${file.url}`);
              }
            }
            updatedFiles.push({
              ...file,
              url: ''
            });
          }
        } else {
          // Regular files or data URLs
          updatedFiles.push(file);
        }
      }

      return {
        ...message,
        files: updatedFiles
      };
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        if (process.env.NODE_ENV === 'development') {
          console.error('Failed to restore persistent images:', error);
        }
      }
      // Return original message if restoration completely fails
      return message;
    }
  }
};

// User-scoped storage persistence helpers
export const chatStorage = {
  STORAGE_KEY: 'irin-chat-sessions', // Legacy key for backward compatibility

  // Save chats to user-scoped storage
  saveChats: async (chats: Chat[]): Promise<void> => {
    try {
      const { UserStorage } = await import('@/lib/user-storage');
      const serializedChats = JSON.stringify(chats.map(chat => ({
        ...chat,
        timestamp: chat.timestamp.toISOString(),
        messages: chat.messages.map(msg => ({
          ...msg,
          timestamp: msg.timestamp.toISOString()
        }))
      })));
      UserStorage.setItem('chat_history', serializedChats);
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        if (process.env.NODE_ENV === 'development') {
          console.error('Failed to save chats to user storage:', error);
        }
      }
    }
  },

  // Load chats from user-scoped storage
  loadChats: async (): Promise<Chat[]> => {
    try {
      const { UserStorage } = await import('@/lib/user-storage');
      const stored = UserStorage.getItem('chat_history');
      if (!stored) return [];

      const parsed = JSON.parse(stored);
      return parsed.map((chat: any) => ({
        ...chat,
        timestamp: new Date(chat.timestamp),
        messages: chat.messages.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }))
      }));
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        if (process.env.NODE_ENV === 'development') {
          console.error('Failed to load chats from user storage:', error);
        }
      }
      return [];
    }
  },

  // Clear all chats from user-scoped storage
  clearChats: async (): Promise<void> => {
    try {
      const { UserStorage } = await import('@/lib/user-storage');
      UserStorage.removeItem('chat_history');
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        if (process.env.NODE_ENV === 'development') {
          console.error('Failed to clear chats from user storage:', error);
        }
      }
    }
  },

  // Save single chat
  saveChat: (chat: Chat, allChats: Chat[]): void => {
    const updatedChats = allChats.map(c => c.id === chat.id ? chat : c);
    if (!allChats.find(c => c.id === chat.id)) {
      updatedChats.push(chat);
    }
    chatStorage.saveChats(updatedChats);
  },

  // Delete single chat
  deleteChat: (chatId: string, allChats: Chat[]): Chat[] => {
    const updatedChats = allChats.filter(c => c.id !== chatId);
    chatStorage.saveChats(updatedChats);

    // Clean up persistent images for this chat
    import('@/lib/image-storage').then(({ imageStorage }) => {
      imageStorage.deleteImagesByChat(chatId).catch(console.error);
    });

    return updatedChats;
  },

  // Clear all chats and their associated images
  clearAllChats: async (): Promise<void> => {
    try {
      const { UserStorage } = await import('@/lib/user-storage');

      // Clear user-scoped storage
      UserStorage.removeItem('chat_history');
      UserStorage.removeItem('current_chat_id');

      // Also clear legacy storage for backward compatibility
      localStorage.removeItem(chatStorage.STORAGE_KEY);

      // Clean up all persistent images
      const { imageStorage } = await import('@/lib/image-storage');
      const stats = await imageStorage.getStorageStats();
      if (stats.totalImages > 0) {
        // Clear all images by cleaning up old images with 0 days threshold
        await imageStorage.cleanupOldImages(0);
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        if (process.env.NODE_ENV === 'development') {
          console.error('Failed to clear chats and images:', error);
        }
      }
    }
  }
}; 