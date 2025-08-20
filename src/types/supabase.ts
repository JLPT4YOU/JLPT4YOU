export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          name?: string
          role?: string
          created_at: string
          updated_at: string
          subscription_expires_at?: string
          balance?: number
        }
        Insert: {
          id?: string
          email: string
          name?: string
          role?: string
          created_at?: string
          updated_at?: string
          subscription_expires_at?: string
          balance?: number
        }
        Update: {
          id?: string
          email?: string
          name?: string
          role?: string
          created_at?: string
          updated_at?: string
          subscription_expires_at?: string
          balance?: number
        }
      }
      coupon_usage: {
        Row: {
          id: string
          user_id: string
          coupon_code: string
          amount_discounted: number
          order_id?: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          coupon_code: string
          amount_discounted: number
          order_id?: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          coupon_code?: string
          amount_discounted?: number
          order_id?: string
          created_at?: string
        }
      }
      transactions: {
        Row: {
          id: string
          user_id: string
          type: string
          amount: number
          description?: string
          status: string
          metadata?: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: string
          amount: number
          description?: string
          status?: string
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          type?: string
          amount?: number
          description?: string
          status?: string
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
      }
      coupons: {
        Row: {
          id: string
          code: string
          description?: string
          discount_type: string
          discount_value: number
          min_purchase_amount: number
          max_discount_amount?: number
          usage_limit?: number
          usage_count: number
          valid_from: string
          valid_until?: string
          is_active: boolean
          created_at: string
          updated_at: string
          created_by?: string
        }
        Insert: {
          id?: string
          code: string
          description?: string
          discount_type: string
          discount_value: number
          min_purchase_amount?: number
          max_discount_amount?: number
          usage_limit?: number
          usage_count?: number
          valid_from?: string
          valid_until?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
          created_by?: string
        }
        Update: {
          id?: string
          code?: string
          description?: string
          discount_type?: string
          discount_value?: number
          min_purchase_amount?: number
          max_discount_amount?: number
          usage_limit?: number
          usage_count?: number
          valid_from?: string
          valid_until?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
          created_by?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

export type User = Database['public']['Tables']['users']['Row']
export type UserUpdate = Database['public']['Tables']['users']['Update']