/**
 * Optimized Chat Sidebar Component
 * Performance optimized with React.memo, useMemo, useCallback
 */

import React, { useState, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Chat } from './index';
import { Plus, MessageSquare, Trash2, GraduationCap, Menu } from 'lucide-react';
import { useTranslations } from '@/hooks/use-translations';
import { truncateText } from '@/lib/chat-utils';

interface OptimizedChatSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  chats?: Chat[];
  currentChatId?: string;
  onNewChat?: () => void;
  onSelectChat?: (chatId: string) => void;
  onDeleteChat?: (chatId: string) => void;
  isLargeScreen?: boolean;
}

// Memoized Chat Item Component
interface ChatItemProps {
  chat: Chat;
  isActive: boolean;
  onSelect: (chatId: string) => void;
  onDelete: (chatId: string) => void;
}

const ChatItem = React.memo<ChatItemProps>(({ chat, isActive, onSelect, onDelete }) => {
  const { t } = useTranslations();
  const [showDeleteButton, setShowDeleteButton] = useState(false);

  // Memoized handlers
  const handleSelect = useCallback(() => {
    onSelect(chat.id);
  }, [chat.id, onSelect]);

  const handleDelete = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(chat.id);
  }, [chat.id, onDelete]);

  const handleMouseEnter = useCallback(() => {
    setShowDeleteButton(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setShowDeleteButton(false);
  }, []);

  // Memoized computed values
  const truncatedTitle = useMemo(() => truncateText(chat.title, 30), [chat.title]);
  const truncatedLastMessage = useMemo(() => 
    chat.lastMessage ? truncateText(chat.lastMessage, 50) : '', 
    [chat.lastMessage]
  );

  const formattedTime = useMemo(() => {
    const now = new Date();
    const messageTime = new Date(chat.timestamp);
    const diffInHours = (now.getTime() - messageTime.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return messageTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 24 * 7) {
      return messageTime.toLocaleDateString([], { weekday: 'short' });
    } else {
      return messageTime.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  }, [chat.timestamp]);

  const itemClasses = useMemo(() => cn(
    "w-full p-3 text-left rounded-lg transition-all duration-200 group relative",
    "hover:bg-accent/50 focus:bg-accent/50 focus:outline-none",
    isActive ? "bg-accent border-l-2 border-primary" : "hover:bg-muted/50"
  ), [isActive]);

  return (
    <button
      onClick={handleSelect}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={itemClasses}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <MessageSquare className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            <h3 className={cn(
              "font-medium text-sm truncate",
              isActive ? "text-primary" : "text-foreground"
            )}>
              {truncatedTitle}
            </h3>
          </div>
          
          {truncatedLastMessage && (
            <p className="text-xs text-muted-foreground truncate pl-6">
              {truncatedLastMessage}
            </p>
          )}
          
          <p className="text-xs text-muted-foreground mt-1 pl-6">
            {formattedTime}
          </p>
        </div>

        {/* Delete Button */}
        {showDeleteButton && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDelete}
            className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/10 hover:text-destructive"
            title={t ? t('chat.deleteChat') : 'Delete chat'}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        )}
      </div>
    </button>
  );
});

ChatItem.displayName = 'ChatItem';

// Main Sidebar Component
const OptimizedChatSidebarComponent: React.FC<OptimizedChatSidebarProps> = ({
  isOpen,
  onToggle,
  chats = [],
  currentChatId,
  onNewChat,
  onSelectChat,
  onDeleteChat,
  isLargeScreen = false
}) => {
  const { t } = useTranslations();

  // Memoized handlers
  const handleNewChat = useCallback(() => {
    onNewChat?.();
  }, [onNewChat]);

  const handleSelectChat = useCallback((chatId: string) => {
    onSelectChat?.(chatId);
  }, [onSelectChat]);

  const handleDeleteChat = useCallback((chatId: string) => {
    onDeleteChat?.(chatId);
  }, [onDeleteChat]);

  // Memoized computed values
  const sidebarClasses = useMemo(() => cn(
    "fixed inset-y-0 left-0 z-50 w-80 bg-background border-r transform transition-transform duration-300 ease-in-out",
    "lg:relative lg:translate-x-0",
    isOpen ? "translate-x-0" : "-translate-x-full"
  ), [isOpen]);

  const sortedChats = useMemo(() => 
    [...chats].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()),
    [chats]
  );

  const hasChats = chats.length > 0;

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && !isLargeScreen && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <div className={sidebarClasses}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center gap-2">
              <GraduationCap className="w-6 h-6 text-primary" />
              <h2 className="font-semibold text-lg">iRIN Sensei</h2>
            </div>
            
            {!isLargeScreen && (
              <Button variant="ghost" size="sm" onClick={onToggle}>
                <Menu className="w-4 h-4" />
              </Button>
            )}
          </div>

          {/* New Chat Button */}
          <div className="p-4">
            <Button
              onClick={handleNewChat}
              className="w-full justify-start gap-2"
              variant="outline"
            >
              <Plus className="w-4 h-4" />
              {t ? t('chat.newChat') : 'New Chat'}
            </Button>
          </div>

          {/* Chat List */}
          <div className="flex-1 overflow-y-auto px-4 pb-4">
            {hasChats ? (
              <div className="space-y-2">
                {sortedChats.map((chat) => (
                  <ChatItem
                    key={chat.id}
                    chat={chat}
                    isActive={chat.id === currentChatId}
                    onSelect={handleSelectChat}
                    onDelete={handleDeleteChat}
                  />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center py-8">
                <MessageSquare className="w-12 h-12 text-muted-foreground mb-4" />
                <h3 className="font-medium text-sm mb-2">
                  {t ? t('chat.noChats') : 'No chats yet'}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {t ? t('chat.startFirstChat') : 'Start your first conversation'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

// Memoized export with custom comparison
export const OptimizedChatSidebar = React.memo(OptimizedChatSidebarComponent, (prevProps, nextProps) => {
  return (
    prevProps.isOpen === nextProps.isOpen &&
    prevProps.currentChatId === nextProps.currentChatId &&
    prevProps.isLargeScreen === nextProps.isLargeScreen &&
    prevProps.chats?.length === nextProps.chats?.length &&
    prevProps.chats?.every((chat, index) => 
      chat.id === nextProps.chats?.[index]?.id &&
      chat.title === nextProps.chats?.[index]?.title &&
      chat.lastMessage === nextProps.chats?.[index]?.lastMessage &&
      chat.timestamp.getTime() === nextProps.chats?.[index]?.timestamp.getTime()
    )
  );
});
