import { createClient } from '@/utils/supabase/client';
import { 
  generateRedeemCode, 
  cleanRedeemCode, 
  formatRedeemCode,
  validateRedeemCode,
  generateBatchRedeemCodes 
} from '@/utils/redeem-utils';

export interface RedeemCode {
  id: string;
  code: string;
  premium_days: number;
  status: 'active' | 'redeemed' | 'expired';
  created_at: string;
  created_by: string;
  redeemed_at?: string;
  redeemed_by?: string;
  expires_at?: string;
  description?: string;
  metadata?: any;
}

export interface RedeemHistory {
  id: string;
  code_id: string;
  user_id: string;
  action: string;
  premium_days_added: number;
  created_at: string;
  metadata?: any;
}

export interface CreateRedeemCodeParams {
  premium_days: number;
  description?: string;
  expires_at?: string;
  count?: number; // For batch creation
}

export interface RedeemCodeResult {
  success: boolean;
  error?: string;
  message?: string;
  premium_days_added?: number;
  new_expiry?: string;
}

class RedeemService {
  private supabase = createClient();

  /**
   * Create a single redeem code (Admin only)
   */
  async createRedeemCode(params: CreateRedeemCodeParams): Promise<{ success: boolean; data?: RedeemCode; error?: string }> {
    try {
      // Get current user
      const { data: { user } } = await this.supabase.auth.getUser();
      if (!user) {
        return { success: false, error: 'User not authenticated' };
      }

      // Check if user is admin
      const { data: userData, error: userError } = await this.supabase
        .from('users')
        .select('role')
        .eq('id', user.id as any)
        .single();

      if (userError || (userData as any)?.role !== 'Admin') {
        return { success: false, error: 'Only admins can create redeem codes' };
      }

      // Generate unique code
      let code = cleanRedeemCode(generateRedeemCode());
      let attempts = 0;
      const maxAttempts = 10;

      // Ensure code is unique
      while (attempts < maxAttempts) {
        const { data: existing } = await this.supabase
          .from('redeem_codes')
          .select('id')
          .eq('code', code as any)
          .single();

        if (!existing) break;
        
        code = cleanRedeemCode(generateRedeemCode());
        attempts++;
      }

      if (attempts >= maxAttempts) {
        return { success: false, error: 'Could not generate unique code' };
      }

      // Create the code
      const { data, error } = await this.supabase
        .from('redeem_codes')
        .insert({
          code,
          premium_days: params.premium_days,
          description: params.description,
          expires_at: params.expires_at,
          created_by: user.id,
          status: 'active'
        } as any)
        .select()
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data: data as any };
    } catch (error) {
      console.error('Error creating redeem code:', error);
      return { success: false, error: 'Failed to create redeem code' };
    }
  }

  /**
   * Create multiple redeem codes (Admin only)
   */
  async createBatchRedeemCodes(params: CreateRedeemCodeParams): Promise<{ success: boolean; data?: RedeemCode[]; error?: string }> {
    try {
      const count = params.count || 1;
      
      // Get current user
      const { data: { user } } = await this.supabase.auth.getUser();
      if (!user) {
        return { success: false, error: 'User not authenticated' };
      }

      // Check if user is admin
      const { data: userData, error: userError } = await this.supabase
        .from('users')
        .select('role')
        .eq('id', user.id as any)
        .single();

      if (userError || (userData as any)?.role !== 'Admin') {
        return { success: false, error: 'Only admins can create redeem codes' };
      }

      // Generate unique codes
      const codes = generateBatchRedeemCodes(count);
      const cleanedCodes = codes.map(code => cleanRedeemCode(code));

      // Check for existing codes
      const { data: existing } = await this.supabase
        .from('redeem_codes')
        .select('code')
        .in('code', cleanedCodes as any);

      const existingCodes = existing?.map((r: any) => r.code) || [];
      const uniqueCodes = cleanedCodes.filter(code => !existingCodes.includes(code));

      if (uniqueCodes.length === 0) {
        return { success: false, error: 'Could not generate unique codes' };
      }

      // Create batch insert data
      const insertData = uniqueCodes.map(code => ({
        code,
        premium_days: params.premium_days,
        description: params.description,
        expires_at: params.expires_at,
        created_by: user.id,
        status: 'active'
      }));

      // Bulk insert
      const { data: insertedCodes, error: insertError } = await this.supabase
        .from('redeem_codes')
        .insert(insertData as any)
        .select();

      if (insertError) {
        return { success: false, error: insertError.message };
      }

      return { success: true, data: insertedCodes as any };
    } catch (error) {
      console.error('Error creating batch redeem codes:', error);
      return { success: false, error: 'Failed to create batch redeem codes' };
    }
  }

  /**
   * Redeem a code (User)
   */
  async redeemCode(code: string): Promise<RedeemCodeResult> {
    try {
      // Validate code format
      if (!validateRedeemCode(code)) {
        return { success: false, error: 'Invalid code format' };
      }

      // Get current user
      const { data: { user } } = await this.supabase.auth.getUser();
      if (!user) {
        return { success: false, error: 'User not authenticated' };
      }

      // Clean the code
      const cleanCode = cleanRedeemCode(code);

      // Call the database function
      const { data, error } = await this.supabase
        .rpc('redeem_code', {
          p_code: cleanCode,
          p_user_id: user.id
        });

      if (error) {
        return { success: false, error: error.message };
      }

      return data as RedeemCodeResult;
    } catch (error) {
      console.error('Error redeeming code:', error);
      return { success: false, error: 'Failed to redeem code' };
    }
  }

  /**
   * Get all redeem codes (Admin only)
   */
  async getRedeemCodes(status?: 'active' | 'redeemed' | 'expired'): Promise<{ success: boolean; data?: RedeemCode[]; error?: string }> {
    try {
      let query = this.supabase
        .from('redeem_codes')
        .select('*')
        .order('created_at', { ascending: false });

      if (status) {
        query = query.eq('status', status as any);
      }

      const { data, error } = await query;

      if (error) {
        return { success: false, error: error.message };
      }

      // Format codes for display
      const formattedData = data?.map(code => ({
        ...(code as any),
        code: (code as any).code
      }));

      return { success: true, data: formattedData as any };
    } catch (error) {
      console.error('Error fetching redeem codes:', error);
      return { success: false, error: 'Failed to fetch redeem codes' };
    }
  }

  /**
   * Get redeem history for a user
   */
  async getUserRedeemHistory(userId?: string): Promise<{ success: boolean; data?: RedeemHistory[]; error?: string }> {
    try {
      const { data: { user } } = await this.supabase.auth.getUser();
      if (!user) {
        return { success: false, error: 'User not authenticated' };
      }

      const targetUserId = userId || user.id;

      const { data, error } = await this.supabase
        .from('redeem_history')
        .select(`
          *,
          redeem_codes (
            code,
            premium_days,
            description
          )
        `)
        .eq('user_id', targetUserId as any)
        .order('created_at', { ascending: false });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data: (data as any) || [] };
    } catch (error) {
      console.error('Error fetching redeem history:', error);
      return { success: false, error: 'Failed to fetch redeem history' };
    }
  }

  /**
   * Delete a redeem code (Admin only)
   */
  async deleteRedeemCode(codeId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await this.supabase
        .from('redeem_codes')
        .delete()
        .eq('id', codeId as any);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Error deleting redeem code:', error);
      return { success: false, error: 'Failed to delete redeem code' };
    }
  }

  /**
   * Update redeem code status (Admin only)
   */
  async updateRedeemCodeStatus(codeId: string, status: 'active' | 'expired'): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await this.supabase
        .from('redeem_codes')
        .update({ status } as any)
        .eq('id', codeId as any);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Error updating redeem code status:', error);
      return { success: false, error: 'Failed to update redeem code status' };
    }
  }
}

export const redeemService = new RedeemService();
