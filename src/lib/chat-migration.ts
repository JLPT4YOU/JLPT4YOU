/**
 * Chat Data Migration Utility
 * Migrates chat data from global localStorage to user-scoped storage
 */

import { UserStorage } from '@/lib/user-storage';

export interface MigrationResult {
  success: boolean;
  migratedChats: number;
  migratedSettings: number;
  errors: string[];
  backupCreated: boolean;
}

export interface LegacyChatData {
  chats?: any[];
  currentChatId?: string;
  selectedModel?: string;
  enableThinking?: boolean;
  aiLanguage?: string;
  aiCustomLanguage?: string;
}

/**
 * Create backup of current localStorage data
 */
export function createBackup(): LegacyChatData {
  const backup: LegacyChatData = {};
  
  try {
    // Backup chat data
    const chatHistory = localStorage.getItem('chat_history');
    if (chatHistory) {
      backup.chats = JSON.parse(chatHistory);
    }
    
    const irinChatSessions = localStorage.getItem('irin-chat-sessions');
    if (irinChatSessions && !backup.chats) {
      backup.chats = JSON.parse(irinChatSessions);
    }
    
    // Backup other settings
    backup.currentChatId = localStorage.getItem('current_chat_id') || undefined;
    backup.selectedModel = localStorage.getItem('selected_model') || undefined;
    backup.enableThinking = localStorage.getItem('enable_thinking') === 'true';
    backup.aiLanguage = localStorage.getItem('ai_language') || undefined;
    backup.aiCustomLanguage = localStorage.getItem('ai_custom_language') || undefined;
    
    // Save backup to localStorage with timestamp
    const backupKey = `chat_backup_${Date.now()}`;
    localStorage.setItem(backupKey, JSON.stringify(backup));
    
    if (process.env.NODE_ENV === 'development') {
      if (process.env.NODE_ENV === 'development') {
        if (process.env.NODE_ENV === 'development') {

        }
      }
    }
    return backup;
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      if (process.env.NODE_ENV === 'development') {
        if (process.env.NODE_ENV === 'development') {
          console.error('❌ Failed to create backup:', error);
        }
      }
    }
    return backup;
  }
}

/**
 * Restore data from backup
 */
export function restoreFromBackup(backupKey: string): boolean {
  try {
    const backupData = localStorage.getItem(backupKey);
    if (!backupData) {
      if (process.env.NODE_ENV === 'development') {
      if (process.env.NODE_ENV === 'development') {
        if (process.env.NODE_ENV === 'development') {
          console.error('❌ Backup not found:', backupKey);
        }
      }
    }
      return false;
    }

    const backup: LegacyChatData = JSON.parse(backupData);

    // Restore to global localStorage
    if (backup.chats) {
      localStorage.setItem('chat_history', JSON.stringify(backup.chats));
    }
    if (backup.currentChatId) {
      localStorage.setItem('current_chat_id', backup.currentChatId);
    }
    if (backup.selectedModel) {
      localStorage.setItem('selected_model', backup.selectedModel);
    }
    if (backup.enableThinking !== undefined) {
      localStorage.setItem('enable_thinking', backup.enableThinking.toString());
    }
    if (backup.aiLanguage) {
      localStorage.setItem('ai_language', backup.aiLanguage);
    }
    if (backup.aiCustomLanguage) {
      localStorage.setItem('ai_custom_language', backup.aiCustomLanguage);
    }

    if (process.env.NODE_ENV === 'development') {
      if (process.env.NODE_ENV === 'development') {
        if (process.env.NODE_ENV === 'development') {

        }
      }
    }
    return true;
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      if (process.env.NODE_ENV === 'development') {
        if (process.env.NODE_ENV === 'development') {
          console.error('❌ Failed to restore from backup:', error);
        }
      }
    }
    return false;
  }
}

/**
 * Migrate chat data to user-scoped storage
 */
export function migrateChatDataToUserScope(userId: string): MigrationResult {
  const result: MigrationResult = {
    success: false,
    migratedChats: 0,
    migratedSettings: 0,
    errors: [],
    backupCreated: false
  };
  
  try {
    // Create backup first
    const backup = createBackup();
    result.backupCreated = Object.keys(backup).length > 0;
    
    // Set current user for UserStorage
    UserStorage.setCurrentUser(userId);
    
    // Migrate chat history with image cleanup
    const chatHistory = localStorage.getItem('chat_history');
    const irinChatSessions = localStorage.getItem('irin-chat-sessions');

    if (chatHistory) {
      try {
        const chats = JSON.parse(chatHistory);
        if (Array.isArray(chats) && chats.length > 0) {
          // Clean up invalid blob URLs in chat data
          const cleanedChats = chats.map(chat => ({
            ...chat,
            messages: chat.messages?.map((msg: any) => ({
              ...msg,
              files: msg.files?.map((file: any) => {
                // Clear blob URLs as they won't work after migration
                if (file.url && file.url.startsWith('blob:')) {
                  if (process.env.NODE_ENV === 'development') {
                    if (process.env.NODE_ENV === 'development') {
                      if (process.env.NODE_ENV === 'development') {
                        console.warn(`Clearing invalid blob URL during migration: ${file.url}`);
                      }
                    }
                  }
                  return {
                    ...file,
                    url: file.isPersistent ? file.url : '' // Keep persistent images, clear blob URLs
                  };
                }
                return file;
              }) || []
            })) || []
          }));

          UserStorage.setJSON('chat_history', cleanedChats);
          result.migratedChats = cleanedChats.length;
          if (process.env.NODE_ENV === 'development') {
            if (process.env.NODE_ENV === 'development') {
              if (process.env.NODE_ENV === 'development') {

              }
            }
          }
        }
      } catch (error) {
        result.errors.push(`Failed to migrate chat_history: ${error}`);
      }
    } else if (irinChatSessions) {
      try {
        const chats = JSON.parse(irinChatSessions);
        if (Array.isArray(chats) && chats.length > 0) {
          // Clean up invalid blob URLs in chat data
          const cleanedChats = chats.map(chat => ({
            ...chat,
            messages: chat.messages?.map((msg: any) => ({
              ...msg,
              files: msg.files?.map((file: any) => {
                // Clear blob URLs as they won't work after migration
                if (file.url && file.url.startsWith('blob:')) {
                  if (process.env.NODE_ENV === 'development') {
                    if (process.env.NODE_ENV === 'development') {
                      console.warn(`Clearing invalid blob URL during migration: ${file.url}`);
                    }
                  }
                  return {
                    ...file,
                    url: file.isPersistent ? file.url : '' // Keep persistent images, clear blob URLs
                  };
                }
                return file;
              }) || []
            })) || []
          }));

          UserStorage.setJSON('chat_history', cleanedChats);
          result.migratedChats = cleanedChats.length;
          if (process.env.NODE_ENV === 'development') {
            if (process.env.NODE_ENV === 'development') {

            }
          }
        }
      } catch (error) {
        result.errors.push(`Failed to migrate irin-chat-sessions: ${error}`);
      }
    }
    
    // Migrate other settings
    const settingsToMigrate = [
      'current_chat_id',
      'selected_model', 
      'enable_thinking',
      'ai_language',
      'ai_custom_language'
    ];
    
    settingsToMigrate.forEach(key => {
      const value = localStorage.getItem(key);
      if (value !== null) {
        try {
          UserStorage.setItem(key, value);
          result.migratedSettings++;
          if (process.env.NODE_ENV === 'development') {
            if (process.env.NODE_ENV === 'development') {

            }
          }
        } catch (error) {
          result.errors.push(`Failed to migrate ${key}: ${error}`);
        }
      }
    });
    
    result.success = result.errors.length === 0;
    
    if (result.success) {
      if (process.env.NODE_ENV === 'development') {
        if (process.env.NODE_ENV === 'development') {

        }
      }
      if (process.env.NODE_ENV === 'development') {
        if (process.env.NODE_ENV === 'development') {

        }
      }
    } else {
      if (process.env.NODE_ENV === 'development') {
        if (process.env.NODE_ENV === 'development') {
          console.warn('⚠️ Migration completed with errors:', result.errors);
        }
      }
    }
    
    return result;
  } catch (error) {
    result.errors.push(`Migration failed: ${error}`);
    if (process.env.NODE_ENV === 'development') {
      if (process.env.NODE_ENV === 'development') {
        console.error('❌ Chat data migration failed:', error);
      }
    }
    return result;
  }
}

/**
 * Clear legacy chat data from global localStorage
 */
export function clearLegacyChatData(): void {
  const keysToRemove = [
    'chat_history',
    'current_chat_id', 
    'selected_model',
    'enable_thinking',
    'ai_language',
    'ai_custom_language',
    'irin-chat-sessions'
  ];
  
  keysToRemove.forEach(key => {
    localStorage.removeItem(key);
    if (process.env.NODE_ENV === 'development') {
      if (process.env.NODE_ENV === 'development') {

      }
    }
  });
  
  if (process.env.NODE_ENV === 'development') {
  
    if (process.env.NODE_ENV === 'development') {
  

  
    }
  
  }
}

/**
 * Check if migration is needed
 */
export function isMigrationNeeded(): boolean {
  const hasLegacyData = 
    localStorage.getItem('chat_history') !== null ||
    localStorage.getItem('irin-chat-sessions') !== null ||
    localStorage.getItem('current_chat_id') !== null ||
    localStorage.getItem('selected_model') !== null ||
    localStorage.getItem('ai_language') !== null;
    
  return hasLegacyData;
}

/**
 * Get list of available backups
 */
export function getAvailableBackups(): string[] {
  const backups: string[] = [];
  
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith('chat_backup_')) {
      backups.push(key);
    }
  }
  
  return backups.sort().reverse(); // Most recent first
}

/**
 * Auto-migrate on user login if needed
 */
export function autoMigrateOnLogin(userId: string): MigrationResult | null {
  if (!isMigrationNeeded()) {
    if (process.env.NODE_ENV === 'development') {
      if (process.env.NODE_ENV === 'development') {

      }
    }
    return null;
  }
  
  if (process.env.NODE_ENV === 'development') {
  
    if (process.env.NODE_ENV === 'development') {
  

  
    }
  
  }
  const result = migrateChatDataToUserScope(userId);
  
  if (result.success) {
    // Clear legacy data after successful migration
    clearLegacyChatData();
    if (process.env.NODE_ENV === 'development') {
      if (process.env.NODE_ENV === 'development') {

      }
    }
  } else {
    if (process.env.NODE_ENV === 'development') {
      if (process.env.NODE_ENV === 'development') {
        console.warn('⚠️ Auto-migration failed, keeping legacy data for manual recovery');
      }
    }
  }
  
  return result;
}
