import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null

// Types for our database
export interface Database {
  public: {
    Tables: {
      classes: {
        Row: {
          id: string
          name: string
          color: string
          is_archived: boolean
          user_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          color: string
          is_archived?: boolean
          user_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          color?: string
          is_archived?: boolean
          user_id?: string
          created_at?: string
          updated_at?: string
        }
      }
      assignments: {
        Row: {
          id: string
          title: string
          class_id: string
          due_at: string
          estimated_duration_min: number
          is_important: boolean
          is_urgent: boolean
          status: 'not_started' | 'in_progress' | 'almost_done' | 'completed' | 'overdue'
          notes: string | null
          progress_pct: number
          user_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          class_id: string
          due_at: string
          estimated_duration_min?: number
          is_important?: boolean
          is_urgent?: boolean
          status?: 'not_started' | 'in_progress' | 'almost_done' | 'completed' | 'overdue'
          notes?: string | null
          progress_pct?: number
          user_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          class_id?: string
          due_at?: string
          estimated_duration_min?: number
          is_important?: boolean
          is_urgent?: boolean
          status?: 'not_started' | 'in_progress' | 'almost_done' | 'completed' | 'overdue'
          notes?: string | null
          progress_pct?: number
          user_id?: string
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}