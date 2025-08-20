export type NotificationType = 
  | 'top_up_success' 
  | 'premium_upgrade' 
  | 'redeem_code' 
  | 'admin_message' 
  | 'system';

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  content: string;
  metadata?: Record<string, any>;
  is_read: boolean;
  is_important: boolean;
  created_at: string;
  read_at?: string;
  expires_at?: string;
}

export interface NotificationMetadata {
  // For top_up_success
  amount?: number;
  transaction_id?: string;
  
  // For premium_upgrade
  plan_type?: 'monthly' | 'yearly';
  expires_at?: string;
  
  // For redeem_code
  code?: string;
  reward_type?: string;
  reward_value?: any;
  
  // For admin_message
  priority?: 'low' | 'normal' | 'high';
  category?: string;
}

export interface CreateNotificationDto {
  user_id: string;
  type: NotificationType;
  title: string;
  content: string;
  metadata?: NotificationMetadata;
  is_important?: boolean;
  expires_at?: string;
}
