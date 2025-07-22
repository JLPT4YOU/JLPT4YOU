# 🚀 Hướng dẫn Code Giao diện ChatGPT Hiện đại

## 📋 Mục lục
- [Tổng quan](#tổng-quan)
- [Cấu trúc dự án](#cấu-trúc-dự-án)
- [Components chính](#components-chính)
- [State Management](#state-management)
- [Styling & UI](#styling--ui)
- [Tính năng nâng cao](#tính-năng-nâng-cao)
- [Performance](#performance)
- [Deployment](#deployment)

---

## 🎯 Tổng quan

Giao diện ChatGPT hiện đại bao gồm các thành phần chính:
- **Sidebar**: Quản lý cuộc trò chuyện và cài đặt
- **Chat Area**: Khu vực hiển thị tin nhắn
- **Input Area**: Ô nhập tin nhắn với các tính năng nâng cao
- **Header**: Thanh tiêu đề và điều khiển

---

## 📁 Cấu trúc dự án

```
src/
├── components/
│   ├── chat/
│   │   ├── ChatInterface.tsx
│   │   ├── MessageBubble.tsx
│   │   ├── CodeBlock.tsx
│   │   ├── InputArea.tsx
│   │   └── TypingIndicator.tsx
│   ├── sidebar/
│   │   ├── Sidebar.tsx
│   │   ├── ChatHistory.tsx
│   │   ├── ModelSelector.tsx
│   │   └── Settings.tsx
│   └── ui/
│       ├── Button.tsx
│       ├── Input.tsx
│       └── Dropdown.tsx
├── hooks/
│   ├── useChat.ts
│   ├── useChatHistory.ts
│   └── useTypingIndicator.ts
├── stores/
│   └── chatStore.ts
├── types/
│   └── chat.ts
└── utils/
    ├── markdown.ts
    └── codeHighlight.ts
```

---

## 🧩 Components chính

### 1. ChatInterface.tsx - Component chính

```typescript
// src/components/chat/ChatInterface.tsx
import React, { useState, useRef, useEffect } from 'react';
import { MessageBubble } from './MessageBubble';
import { InputArea } from './InputArea';
import { TypingIndicator } from './TypingIndicator';
import { useChat } from '@/hooks/useChat';

interface ChatInterfaceProps {
  className?: string;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ className }) => {
  const { messages, sendMessage, isLoading } = useChat();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message, index) => (
          <MessageBubble key={index} message={message} />
        ))}
        {isLoading && <TypingIndicator />}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t border-gray-200 p-4">
        <InputArea onSendMessage={sendMessage} disabled={isLoading} />
      </div>
    </div>
  );
};
```

### 2. MessageBubble.tsx - Hiển thị tin nhắn

```typescript
// src/components/chat/MessageBubble.tsx
import React from 'react';
import { CodeBlock } from './CodeBlock';
import { MarkdownRenderer } from './MarkdownRenderer';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
  type?: 'text' | 'code' | 'markdown';
}

interface MessageBubbleProps {
  message: Message;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const isUser = message.role === 'user';

  return (
    <div className={cn(
      'flex gap-3 max-w-4xl',
      isUser ? 'justify-end' : 'justify-start'
    )}>
      {/* Avatar */}
      <div className={cn(
        'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium',
        isUser 
          ? 'bg-blue-500 text-white' 
          : 'bg-gray-200 text-gray-700'
      )}>
        {isUser ? 'U' : 'AI'}
      </div>

      {/* Message Content */}
      <div className={cn(
        'flex-1 max-w-3xl rounded-lg p-4',
        isUser 
          ? 'bg-blue-500 text-white' 
          : 'bg-gray-100 text-gray-900'
      )}>
        {message.type === 'code' ? (
          <CodeBlock code={message.content} language="javascript" />
        ) : message.type === 'markdown' ? (
          <MarkdownRenderer content={message.content} />
        ) : (
          <p className="whitespace-pre-wrap">{message.content}</p>
        )}
      </div>
    </div>
  );
};
```

### 3. InputArea.tsx - Ô nhập tin nhắn

```typescript
// src/components/chat/InputArea.tsx
import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Send, Mic, Paperclip, Smile } from 'lucide-react';

interface InputAreaProps {
  onSendMessage: (message: string) => void;
  disabled?: boolean;
}

export const InputArea: React.FC<InputAreaProps> = ({ 
  onSendMessage, 
  disabled = false 
}) => {
  const [input, setInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !disabled) {
      onSendMessage(input.trim());
      setInput('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [input]);

  return (
    <form onSubmit={handleSubmit} className="flex items-end gap-2">
      {/* File Upload */}
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="p-2"
        disabled={disabled}
      >
        <Paperclip className="w-4 h-4" />
      </Button>

      {/* Text Input */}
      <div className="flex-1 relative">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Nhập tin nhắn..."
          className="w-full resize-none rounded-lg border border-gray-300 p-3 pr-12 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          rows={1}
          maxRows={6}
          disabled={disabled}
        />
        
        {/* Emoji & Voice buttons */}
        <div className="absolute right-2 bottom-2 flex gap-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="p-1 h-6 w-6"
            disabled={disabled}
          >
            <Smile className="w-3 h-3" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="p-1 h-6 w-6"
            disabled={disabled}
          >
            <Mic className="w-3 h-3" />
          </Button>
        </div>
      </div>

      {/* Send Button */}
      <Button
        type="submit"
        disabled={!input.trim() || disabled}
        className="p-3"
      >
        <Send className="w-4 h-4" />
      </Button>
    </form>
  );
};
```

### 4. Sidebar.tsx - Thanh bên

```typescript
// src/components/sidebar/Sidebar.tsx
import React, { useState } from 'react';
import { ChatHistory } from './ChatHistory';
import { ModelSelector } from './ModelSelector';
import { Settings } from './Settings';
import { Button } from '@/components/ui/button';
import { Plus, Settings as SettingsIcon } from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onToggle }) => {
  const [activeTab, setActiveTab] = useState<'chats' | 'settings'>('chats');

  return (
    <div className={`
      fixed inset-y-0 left-0 z-50 w-80 bg-white border-r border-gray-200 
      transform transition-transform duration-300 ease-in-out
      ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      lg:relative lg:translate-x-0
    `}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold">ChatGPT</h2>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setActiveTab('settings')}
        >
          <SettingsIcon className="w-4 h-4" />
        </Button>
      </div>

      {/* New Chat Button */}
      <div className="p-4">
        <Button className="w-full" onClick={() => {/* Handle new chat */}}>
          <Plus className="w-4 h-4 mr-2" />
          New Chat
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'chats' ? (
          <ChatHistory />
        ) : (
          <Settings />
        )}
      </div>

      {/* Model Selector */}
      <div className="p-4 border-t border-gray-200">
        <ModelSelector />
      </div>
    </div>
  );
};
```

---

## 🗃️ State Management

### 1. Chat Store (Zustand)

```typescript
// src/stores/chatStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
  type?: 'text' | 'code' | 'markdown';
}

interface Chat {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
}

interface ChatStore {
  // State
  chats: Chat[];
  currentChatId: string | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  createChat: () => void;
  deleteChat: (chatId: string) => void;
  addMessage: (chatId: string, message: Omit<Message, 'id' | 'timestamp'>) => void;
  setCurrentChat: (chatId: string) => void;
  clearError: () => void;
}

export const useChatStore = create<ChatStore>()(
  persist(
    (set, get) => ({
      // Initial state
      chats: [],
      currentChatId: null,
      isLoading: false,
      error: null,

      // Actions
      createChat: () => {
        const newChat: Chat = {
          id: Date.now().toString(),
          title: 'New Chat',
          messages: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        set((state) => ({
          chats: [newChat, ...state.chats],
          currentChatId: newChat.id,
        }));
      },

      deleteChat: (chatId: string) => {
        set((state) => ({
          chats: state.chats.filter((chat) => chat.id !== chatId),
          currentChatId: state.currentChatId === chatId ? null : state.currentChatId,
        }));
      },

      addMessage: (chatId: string, message: Omit<Message, 'id' | 'timestamp'>) => {
        const newMessage: Message = {
          ...message,
          id: Date.now().toString(),
          timestamp: new Date(),
        };

        set((state) => ({
          chats: state.chats.map((chat) =>
            chat.id === chatId
              ? {
                  ...chat,
                  messages: [...chat.messages, newMessage],
                  updatedAt: new Date(),
                }
              : chat
          ),
        }));
      },

      setCurrentChat: (chatId: string) => {
        set({ currentChatId: chatId });
      },

      clearError: () => {
        set({ error: null });
      },
    }),
    {
      name: 'chat-storage',
      partialize: (state) => ({ chats: state.chats }),
    }
  )
);
```

### 2. Custom Hooks

```typescript
// src/hooks/useChat.ts
import { useCallback } from 'react';
import { useChatStore } from '@/stores/chatStore';

export const useChat = () => {
  const {
    chats,
    currentChatId,
    isLoading,
    error,
    addMessage,
    createChat,
    clearError,
  } = useChatStore();

  const currentChat = chats.find((chat) => chat.id === currentChatId);

  const sendMessage = useCallback(
    async (content: string) => {
      if (!currentChatId) {
        createChat();
        return;
      }

      // Add user message
      addMessage(currentChatId, {
        content,
        role: 'user',
        type: 'text',
      });

      // TODO: Call AI API here
      // For now, simulate AI response
      setTimeout(() => {
        addMessage(currentChatId, {
          content: 'This is a simulated AI response.',
          role: 'assistant',
          type: 'text',
        });
      }, 1000);
    },
    [currentChatId, addMessage, createChat]
  );

  return {
    messages: currentChat?.messages || [],
    sendMessage,
    isLoading,
    error,
    clearError,
  };
};
```

---

## 🎨 Styling & UI

### 1. Tailwind CSS Configuration

```javascript
// tailwind.config.js
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        chat: {
          user: '#3b82f6',
          assistant: '#f3f4f6',
          border: '#e5e7eb',
        },
      },
      animation: {
        'typing': 'typing 1.5s infinite',
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
      },
      keyframes: {
        typing: {
          '0%, 100%': { opacity: 1 },
          '50%': { opacity: 0.3 },
        },
        fadeIn: {
          '0%': { opacity: 0 },
          '100%': { opacity: 1 },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: 0 },
          '100%': { transform: 'translateY(0)', opacity: 1 },
        },
      },
    },
  },
  plugins: [],
};
```

### 2. Typing Indicator

```typescript
// src/components/chat/TypingIndicator.tsx
import React from 'react';

export const TypingIndicator: React.FC = () => {
  return (
    <div className="flex items-center gap-2 p-4">
      <div className="flex gap-1">
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-typing" />
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-typing" style={{ animationDelay: '0.2s' }} />
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-typing" style={{ animationDelay: '0.4s' }} />
      </div>
      <span className="text-sm text-gray-500">AI đang gõ...</span>
    </div>
  );
};
```

---

## ⚡ Tính năng nâng cao

### 1. Code Block với Syntax Highlighting

```typescript
// src/components/chat/CodeBlock.tsx
import React from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { tomorrow } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Copy, Check } from 'lucide-react';
import { useState } from 'react';

interface CodeBlockProps {
  code: string;
  language?: string;
}

export const CodeBlock: React.FC<CodeBlockProps> = ({ 
  code, 
  language = 'javascript' 
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group">
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={handleCopy}
          className="p-2 bg-gray-800 text-white rounded hover:bg-gray-700"
        >
          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
        </button>
      </div>
      
      <SyntaxHighlighter
        language={language}
        style={tomorrow}
        customStyle={{
          margin: 0,
          borderRadius: '8px',
          fontSize: '14px',
        }}
      >
        {code}
      </SyntaxHighlighter>
    </div>
  );
};
```

### 2. Markdown Renderer

```typescript
// src/components/chat/MarkdownRenderer.tsx
import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { tomorrow } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface MarkdownRendererProps {
  content: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        code({ node, inline, className, children, ...props }) {
          const match = /language-(\w+)/.exec(className || '');
          return !inline && match ? (
            <SyntaxHighlighter
              style={tomorrow}
              language={match[1]}
              PreTag="div"
              {...props}
            >
              {String(children).replace(/\n$/, '')}
            </SyntaxHighlighter>
          ) : (
            <code className={className} {...props}>
              {children}
            </code>
          );
        },
      }}
      className="prose prose-sm max-w-none"
    >
      {content}
    </ReactMarkdown>
  );
};
```

### 3. File Upload

```typescript
// src/components/chat/FileUpload.tsx
import React, { useRef } from 'react';
import { Upload, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  onFileRemove: (fileId: string) => void;
  selectedFiles: Array<{ id: string; file: File }>;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  onFileSelect,
  onFileRemove,
  selectedFiles,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      onFileSelect(files[0]);
    }
  };

  return (
    <div className="space-y-2">
      <input
        ref={fileInputRef}
        type="file"
        onChange={handleFileSelect}
        className="hidden"
        accept=".txt,.pdf,.doc,.docx,.jpg,.jpeg,.png"
      />
      
      <Button
        type="button"
        variant="outline"
        onClick={() => fileInputRef.current?.click()}
        className="w-full"
      >
        <Upload className="w-4 h-4 mr-2" />
        Tải file lên
      </Button>

      {selectedFiles.length > 0 && (
        <div className="space-y-1">
          {selectedFiles.map(({ id, file }) => (
            <div key={id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
              <span className="text-sm truncate">{file.name}</span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onFileRemove(id)}
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
```

---

## 🚀 Performance

### 1. Virtual Scrolling cho Chat dài

```typescript
// src/components/chat/VirtualizedChat.tsx
import React from 'react';
import { FixedSizeList as List } from 'react-window';
import { MessageBubble } from './MessageBubble';

interface VirtualizedChatProps {
  messages: Message[];
  height: number;
}

export const VirtualizedChat: React.FC<VirtualizedChatProps> = ({
  messages,
  height,
}) => {
  const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => (
    <div style={style}>
      <MessageBubble message={messages[index]} />
    </div>
  );

  return (
    <List
      height={height}
      itemCount={messages.length}
      itemSize={100} // Approximate height of each message
      width="100%"
    >
      {Row}
    </List>
  );
};
```

### 2. Lazy Loading

```typescript
// src/components/chat/LazyMessageBubble.tsx
import React, { Suspense } from 'react';

const MessageBubble = React.lazy(() => import('./MessageBubble'));

interface LazyMessageBubbleProps {
  message: Message;
}

export const LazyMessageBubble: React.FC<LazyMessageBubbleProps> = ({ message }) => {
  return (
    <Suspense fallback={<div className="animate-pulse h-20 bg-gray-200 rounded" />}>
      <MessageBubble message={message} />
    </Suspense>
  );
};
```

---

## 📦 Dependencies cần thiết

```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "next": "^14.0.0",
    "typescript": "^5.0.0",
    "tailwindcss": "^3.3.0",
    "zustand": "^4.4.0",
    "react-markdown": "^9.0.0",
    "remark-gfm": "^4.0.0",
    "react-syntax-highlighter": "^15.5.0",
    "lucide-react": "^0.294.0",
    "clsx": "^2.0.0",
    "class-variance-authority": "^0.7.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "@types/react-syntax-highlighter": "^15.5.0",
    "autoprefixer": "^10.4.0",
    "postcss": "^8.4.0"
  }
}
```

---

## 🎯 Kết luận

Đây là hướng dẫn cơ bản để tạo giao diện ChatGPT hiện đại. Bạn có thể:

1. **Bắt đầu với components cơ bản** (ChatInterface, MessageBubble, InputArea)
2. **Thêm state management** với Zustand
3. **Nâng cấp UI** với animations và micro-interactions
4. **Tối ưu performance** với virtual scrolling và lazy loading
5. **Thêm tính năng nâng cao** như file upload, voice chat, code execution

Hãy bắt đầu từ những components đơn giản và dần dần phát triển thành một ứng dụng hoàn chỉnh!

---

## 📚 Tài liệu tham khảo

- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Zustand](https://github.com/pmndrs/zustand)
- [React Markdown](https://github.com/remarkjs/react-markdown)
- [Lucide React Icons](https://lucide.dev) 