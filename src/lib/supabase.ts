import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Tipos para o banco de dados
export interface User {
  id: string
  email: string
  name: string
  is_master?: boolean
  created_at: string
}

export interface UserData {
  user_id: string
  events: any[]
  products: any[]
  sales: any[]
  expenses: any[]
  expense_categories: any[]
  revenues: any[]
  notifications: any[]
  templates: any[]
  ticket_info: any
  created_at: string
  updated_at: string
}