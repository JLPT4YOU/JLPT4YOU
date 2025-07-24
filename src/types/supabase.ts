/**
 * Supabase Database Types
 * Auto-generated types for database schema
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
id: string
          email: string
          name: string | null
          avatar_icon: string | null
          role: 'Free' | 'Premium' | 'Admin'
          subscription_expires_at: string | null
          password_updated_at: string | null
          created_at: string
          updated_at: string
          is_active: boolean
          metadata: any
        }
        Insert: {
id: string
          email: string
          name?: string | null
          avatar_icon?: string | null
          role?: 'Free' | 'Premium' | 'Admin'
          subscription_expires_at?: string | null
          password_updated_at?: string | null
          created_at?: string
          updated_at?: string
          is_active?: boolean
          metadata?: any
        }
        Update: {
id?: string
          email?: string
          name?: string | null
          avatar_icon?: string | null
          role?: 'Free' | 'Premium' | 'Admin'
          subscription_expires_at?: string | null
          password_updated_at?: string | null
          created_at?: string
          updated_at?: string
          is_active?: boolean
          metadata?: any
        }
        Relationships: []
      }
      exam_results: {
        Row: {
          id: string
          user_id: string
          exam_type: 'JLPT' | 'CHALLENGE' | 'DRIVING'
          exam_level: string
          exam_mode: 'practice' | 'challenge' | 'official'
          score: number
          total_questions: number
          correct_answers: number
          time_spent: number
          answers: Json
          created_at: string
          metadata: Json | null
        }
        Insert: {
          id?: string
          user_id: string
          exam_type: 'JLPT' | 'CHALLENGE' | 'DRIVING'
          exam_level: string
          exam_mode: 'practice' | 'challenge' | 'official'
          score: number
          total_questions: number
          correct_answers: number
          time_spent: number
          answers: Json
          created_at?: string
          metadata?: Json | null
        }
        Update: {
          id?: string
          user_id?: string
          exam_type?: 'JLPT' | 'CHALLENGE' | 'DRIVING'
          exam_level?: string
          exam_mode?: 'practice' | 'challenge' | 'official'
          score?: number
          total_questions?: number
          correct_answers?: number
          time_spent?: number
          answers?: Json
          created_at?: string
          metadata?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "exam_results_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      user_progress: {
        Row: {
          id: string
          user_id: string
          jlpt_n5_progress: number
          jlpt_n4_progress: number
          jlpt_n3_progress: number
          jlpt_n2_progress: number
          jlpt_n1_progress: number
          challenge_streak: number
          total_study_time: number
          last_activity: string
          achievements: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          jlpt_n5_progress?: number
          jlpt_n4_progress?: number
          jlpt_n3_progress?: number
          jlpt_n2_progress?: number
          jlpt_n1_progress?: number
          challenge_streak?: number
          total_study_time?: number
          last_activity?: string
          achievements?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          jlpt_n5_progress?: number
          jlpt_n4_progress?: number
          jlpt_n3_progress?: number
          jlpt_n2_progress?: number
          jlpt_n1_progress?: number
          challenge_streak?: number
          total_study_time?: number
          last_activity?: string
          achievements?: Json | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      user_role: 'Free' | 'Premium' | 'Admin'
      exam_type: 'JLPT' | 'CHALLENGE' | 'DRIVING'
      exam_mode: 'practice' | 'challenge' | 'official'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// Helper types for easier usage
export type User = Database['public']['Tables']['users']['Row']
export type UserInsert = Database['public']['Tables']['users']['Insert']
export type UserUpdate = Database['public']['Tables']['users']['Update']

export type ExamResult = Database['public']['Tables']['exam_results']['Row']
export type ExamResultInsert = Database['public']['Tables']['exam_results']['Insert']
export type ExamResultUpdate = Database['public']['Tables']['exam_results']['Update']

export type UserProgress = Database['public']['Tables']['user_progress']['Row']
export type UserProgressInsert = Database['public']['Tables']['user_progress']['Insert']
export type UserProgressUpdate = Database['public']['Tables']['user_progress']['Update']

// Enum types
export type UserRole = Database['public']['Enums']['user_role']
export type ExamType = Database['public']['Enums']['exam_type']
export type ExamMode = Database['public']['Enums']['exam_mode']
