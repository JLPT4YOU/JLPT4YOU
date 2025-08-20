"use client";

import React from 'react';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { useErrorHandler } from '@/hooks/use-error-handler';

// Components
import { ChatSidebar } from './ChatSidebar';
import { ChatInterface } from './ChatInterface';
import { ChatLayoutHeader } from './ChatLayoutHeader';
import { ErrorNotification } from './ErrorNotification';
import { UnifiedSettings } from './UnifiedSettings';
import { MultiProviderApiKeyModal } from '@/components/multi-provider-api-key-modal';

// Custom hooks
import { useAIProvider } from './hooks/useAIProvider';
import { useChatManager } from './hooks/useChatManager';
import { useUIState } from './hooks/useUIState';
import { useAdvancedFeatures } from './hooks/useAdvancedFeatures';
import { useMessageHandler } from './hooks/useMessageHandler';


interface ChatLayoutProps {
  className?: string;
}

export const ChatLayout: React.FC<ChatLayoutProps> = ({ className }) => {
  const router = useRouter();
  const { handleError, clearError, currentError } = useErrorHandler();

  // Custom hooks for different concerns
  const aiProvider = useAIProvider();
  const chatManager = useChatManager();
  const uiState = useUIState(aiProvider.selectedModel);
  const advancedFeatures = useAdvancedFeatures(aiProvider.selectedModel);

  // Message handler with all dependencies
  const messageHandler = useMessageHandler({
    aiProviderManager: aiProvider.aiProviderManager,
    selectedModel: aiProvider.selectedModel,
    enableThinking: uiState.enableThinking,
    currentProvider: aiProvider.currentProvider,
    setIsLoading: uiState.setIsLoading,
    setLastFailedMessage: uiState.setLastFailedMessage,
    setChats: chatManager.setChats,
    setCurrentChatId: chatManager.setCurrentChatId,
    setIsSidebarOpen: uiState.setIsSidebarOpen,
    chats: chatManager.chats,
    currentChatId: chatManager.currentChatId,
    // Advanced features for Groq
    advancedFeatures
  });

  // Navigation handlers
  const handleGoHome = () => {
    router.push('/home');
  };

  const handleShowSettings = () => {
    uiState.setSettingsDefaultTab("general");
    uiState.setShowSettings(true);
  };

  const handleConfigureProvider = () => {
    uiState.setSettingsDefaultTab("api");
    uiState.setShowSettings(true);
  };

  // Wrapper function for handleNewChat to also close sidebar
  const handleNewChatWithSidebarClose = () => {
    chatManager.handleNewChat();
    uiState.setIsSidebarOpen(false);
  };

  // Wrapper function for handleSelectChat to also close sidebar on mobile
  const handleSelectChatWithSidebarClose = (chatId: string) => {
    chatManager.handleSelectChat(chatId);
    // Close sidebar on mobile after selecting chat
    if (!uiState.isLargeScreen) {
      uiState.setIsSidebarOpen(false);
    }
  };

  return (
    <div className={cn("h-screen bg-background", className)}>
      {/* Error Notification */}
      {currentError && (
        <ErrorNotification
          error={currentError}
          onRetry={uiState.lastFailedMessage ? () => messageHandler.handleSendMessage(uiState.lastFailedMessage!) : undefined}
          onDismiss={() => {
            clearError();
            uiState.setLastFailedMessage(null);
          }}
          showRetry={!!uiState.lastFailedMessage}
        />
      )}

      {/* Sidebar */}
      <ChatSidebar
        isOpen={uiState.isSidebarOpen}
        onToggle={uiState.handleSidebarToggle}
        chats={chatManager.chats}
        currentChatId={chatManager.currentChatId}
        onNewChat={handleNewChatWithSidebarClose}
        onSelectChat={handleSelectChatWithSidebarClose}
        onDeleteChat={chatManager.handleDeleteChat}
        onEditChatTitle={chatManager.updateChatTitle}
        isLargeScreen={uiState.isLargeScreen}
      />

      {/* Main Chat Area - Responsive margin for sidebar */}
      <div className={cn(
        "h-full flex flex-col transition-all duration-300 ease-in-out",
        // On mobile: no margin (overlay mode)
        // On desktop (lg+): add left margin when sidebar is open
        uiState.isSidebarOpen ? "lg:ml-80" : "lg:ml-0"
      )}>
        {/* Header */}
        <ChatLayoutHeader
          isSidebarOpen={uiState.isSidebarOpen}
          isLargeScreen={uiState.isLargeScreen}
          onSidebarToggle={uiState.handleSidebarToggle}
          currentProvider={aiProvider.currentProvider}
          selectedModel={aiProvider.selectedModel}
          aiModels={aiProvider.aiModels}
          onProviderChange={aiProvider.switchProvider}
          onModelChange={aiProvider.setSelectedModel}
          onConfigureProvider={handleConfigureProvider}
          onNewChat={handleNewChatWithSidebarClose}
          onGoHome={handleGoHome}
          onShowSettings={handleShowSettings}
        />

        {/* Chat Interface */}
        <div className="flex-1 bg-background overflow-hidden">
          <ChatInterface
            className="h-full"
            messages={chatManager.currentChat?.messages || []}
            onSendMessage={messageHandler.handleSendMessage}
            onProcessMultiplePDFs={messageHandler.handleProcessMultiplePDFs}
            onStopGeneration={messageHandler.handleStopGeneration}
            isLoading={uiState.isLoading}
            selectedModel={aiProvider.selectedModel}
            enableThinking={uiState.enableThinking}
            currentProvider={aiProvider.currentProvider}
            onEditMessage={messageHandler.handleEditMessage}
            onToggleThinking={uiState.handleToggleThinking}
            reasoningEffort={advancedFeatures.reasoningEffort}
            onReasoningEffortChange={advancedFeatures.handleReasoningEffortChange}
          />
        </div>

        {/* Unified Settings Modal */}
        <UnifiedSettings
          isOpen={uiState.showSettings}
          onOpenChange={(open) => {
            uiState.setShowSettings(open);
            if (!open) {
              uiState.setSettingsDefaultTab("general"); // Reset to general tab when closing
            }
          }}
          onClearHistory={chatManager.handleClearHistory}
          defaultTab={uiState.settingsDefaultTab}
        />

        {/* Multi-Provider API Key Setup Modal */}
        <MultiProviderApiKeyModal
          isOpen={uiState.showApiKeySetup}
          onClose={() => uiState.setShowApiKeySetup(false)}
          defaultProvider={aiProvider.currentProvider}
        />
      </div>
    </div>
  );
};
