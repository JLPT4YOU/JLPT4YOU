"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Chat } from './index';
import { Plus, MessageSquare, Trash2, GraduationCap, Menu } from 'lucide-react';
import { useTranslations } from '@/hooks/use-translations';

interface ChatSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  chats?: Chat[];
  currentChatId?: string;
  onNewChat?: () => void;
  onSelectChat?: (chatId: string) => void;
  onDeleteChat?: (chatId: string) => void;
  isLargeScreen?: boolean;
}

export const ChatSidebar: React.FC<ChatSidebarProps> = ({
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
  const [hoveredChatId, setHoveredChatId] = useState<string | null>(null);

  return (
    <>
      {/* Mobile Overlay - Only show on mobile when sidebar is open */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 lg:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar - Fixed position on all screen sizes for proper layout */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-50 w-80 bg-sidebar border-r border-sidebar-border shadow-lg",
        "flex flex-col h-full",
        "transform transition-transform duration-300 ease-in-out",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-sidebar-border flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <GraduationCap className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-sidebar-foreground">
                iRIN Sensei
              </h2>
              <p className="text-xs text-muted-foreground">
                {t ? t('chat.aiAssistant') : 'AI Assistant'}
              </p>
            </div>
          </div>
          {/* Toggle Button - Show on mobile always, on desktop only when sidebar is open */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggle}
            className={`text-sidebar-foreground hover:bg-sidebar-accent transition-opacity duration-300 flex items-center justify-center w-10 h-10 p-0 m-0 rounded-md ${
              isLargeScreen ? 'block' : 'lg:hidden'
            }`}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0',
              margin: '0'
            }}
            title={isLargeScreen ? 'Close sidebar' : 'Close'}
          >
            <Menu className="w-4 h-4" />
          </Button>
        </div>

        {/* New Chat Button */}
        <div className="p-4 border-b border-sidebar-border flex-shrink-0">
          <Button
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm justify-start"
            onClick={onNewChat}
          >
            <Plus className="w-4 h-4 mr-2" />
            {t ? t('chat.newChat') : 'New Chat'}
          </Button>
        </div>

        {/* Chat History */}
        <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-muted min-h-0">
          {chats.length === 0 ? (
            <div className="p-6 text-center">
              <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-muted flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">
                {t ? t('chat.noConversations') : 'No conversations yet'}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {t ? t('chat.startNewChat') : 'Start a new chat to begin'}
              </p>
            </div>
          ) : (
            <div className="p-3 space-y-2">
              {chats.map((chat) => (
                <div
                  key={chat.id}
                  className={cn(
                    "group relative flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all duration-200",
                    "hover:bg-sidebar-accent hover:shadow-sm",
                    currentChatId === chat.id
                      ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm border border-sidebar-border/50"
                      : "text-sidebar-foreground hover:text-sidebar-accent-foreground"
                  )}
                  onClick={() => onSelectChat?.(chat.id)}
                  onMouseEnter={() => setHoveredChatId(chat.id)}
                  onMouseLeave={() => setHoveredChatId(null)}
                >
                  {/* Chat Icon */}
                  <div className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors",
                    currentChatId === chat.id
                      ? "bg-primary/10 text-primary"
                      : "bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary"
                  )}>
                    <MessageSquare className="w-4 h-4" />
                  </div>

                  {/* Chat Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-medium truncate">
                        {chat.title}
                      </h3>
                      {/* Delete Button */}
                      {(hoveredChatId === chat.id || currentChatId === chat.id) && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteChat?.(chat.id);
                          }}
                          className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                    {chat.lastMessage && (
                      <p className="text-xs text-muted-foreground truncate mt-1">
                        {chat.lastMessage}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-700 flex-shrink-0">
          <div className="text-xs text-gray-400 text-center">
            JLPT4You AI Assistant
          </div>
        </div>
      </div>
    </>
  );
}; 