"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Chat } from './index';
import { Edit, MessageSquare, Trash2, GraduationCap, PanelLeft, Edit3, Check, X } from 'lucide-react';
import { useTranslations } from '@/hooks/use-translations';
import { formatChatPreview } from '@/lib/markdown-utils';

interface ChatSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  chats?: Chat[];
  currentChatId?: string;
  onNewChat?: () => void;
  onSelectChat?: (chatId: string) => void;
  onDeleteChat?: (chatId: string) => void;
  onEditChatTitle?: (chatId: string, newTitle: string) => void;
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
  onEditChatTitle,
  isLargeScreen = false
}) => {
  const { t } = useTranslations();
  const [hoveredChatId, setHoveredChatId] = useState<string | null>(null);
  const [editingChatId, setEditingChatId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState<string>('');

  // Handle start editing title
  const handleStartEditTitle = (chatId: string, currentTitle: string) => {
    setEditingChatId(chatId);
    setEditingTitle(currentTitle);
  };

  // Handle save title
  const handleSaveTitle = () => {
    if (editingChatId && editingTitle.trim() && onEditChatTitle) {
      onEditChatTitle(editingChatId, editingTitle.trim());
    }
    setEditingChatId(null);
    setEditingTitle('');
  };

  // Handle cancel editing
  const handleCancelEdit = () => {
    setEditingChatId(null);
    setEditingTitle('');
  };

  // Handle key press in edit input
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSaveTitle();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCancelEdit();
    }
  };

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
        "fixed inset-y-0 left-0 z-50 w-80 bg-sidebar",
        "flex flex-col h-full",
        "transform transition-transform duration-300 ease-in-out",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        {/* Header */}
        <div className="p-4 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <GraduationCap className="w-4 h-4 text-primary" />
            </div>
            <div className="leading-tight">
              <h2 className="text-lg font-semibold text-sidebar-foreground leading-tight">
                iRIN Sensei
              </h2>
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
            <PanelLeft className="w-4 h-4" />
          </Button>
        </div>

        {/* New Chat Button */}
        <div className="p-4 flex-shrink-0">
          <Button
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm justify-start"
            onClick={onNewChat}
          >
            <Edit className="w-4 h-4 mr-2" />
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
                    "group relative flex flex-col gap-1 p-3 rounded-xl cursor-pointer transition-all duration-200",
                    "hover:bg-sidebar-accent hover:shadow-sm",
                    currentChatId === chat.id
                      ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm"
                      : "text-sidebar-foreground hover:text-sidebar-accent-foreground"
                  )}
                  onClick={() => onSelectChat?.(chat.id)}
                  onMouseEnter={() => setHoveredChatId(chat.id)}
                  onMouseLeave={() => setHoveredChatId(null)}
                >
                  {/* Chat Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      {/* Title - Editable or Display */}
                      {editingChatId === chat.id ? (
                        <div className="flex items-center gap-1 flex-1">
                          <input
                            type="text"
                            value={editingTitle}
                            onChange={(e) => setEditingTitle(e.target.value)}
                            onKeyDown={handleKeyPress}
                            onBlur={handleSaveTitle}
                            className="flex-1 text-sm font-medium bg-transparent border-b border-primary focus:outline-none focus:border-primary"
                            autoFocus
                            onClick={(e) => e.stopPropagation()}
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSaveTitle();
                            }}
                            className="h-5 w-5 text-green-600 hover:text-green-700 hover:bg-green-100"
                          >
                            <Check className="w-3 h-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCancelEdit();
                            }}
                            className="h-5 w-5 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      ) : (
                        <>
                          <h3 className="text-sm font-medium truncate">
                            {chat.title.replace(/["']/g, '')}
                          </h3>
                          {/* Action Buttons */}
                          {(hoveredChatId === chat.id || currentChatId === chat.id) && (
                            <div className="flex items-center gap-1">
                              {/* Edit Title Button */}
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleStartEditTitle(chat.id, chat.title);
                                }}
                                className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-primary hover:bg-primary/10"
                                title={t ? t('chat.editTitle') : 'Edit title'}
                              >
                                <Edit3 className="w-3 h-3" />
                              </Button>
                              {/* Delete Button */}
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onDeleteChat?.(chat.id);
                                }}
                                className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                title={t ? t('chat.deleteChat') : 'Delete chat'}
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                    {/* Message Preview with Markdown Stripping */}
                    {chat.lastMessage && (
                      <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed mt-1">
                        {formatChatPreview(chat.lastMessage)}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>


      </div>
    </>
  );
}; 