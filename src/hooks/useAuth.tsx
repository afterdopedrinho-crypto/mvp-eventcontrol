"use client"

import { useState, useEffect, createContext, useContext } from 'react'
import { supabase } from '@/lib/supabase'

interface User {
  id: string
  email: string
  name: string
  is_master?: boolean
}

interface AuthContextType {
  user: User | null
  loading: boolean
  signOut: () => Promise<void>
  saveUserData: (data: any) => Promise<void>
  loadUserData: () => Promise<any>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Verificar se há usuário logado
    const checkUser = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        
        if (session?.user) {
          // Buscar dados do usuário
          const { data: userData } = await supabase
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .single()

          if (userData) {
            setUser({
              id: userData.id,
              email: userData.email,
              name: userData.name,
              is_master: userData.is_master
            })
          }
        }
      } catch (error) {
        console.error('Erro ao verificar usuário:', error)
      } finally {
        setLoading(false)
      }
    }

    checkUser()

    // Escutar mudanças na autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          const { data: userData } = await supabase
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .single()

          if (userData) {
            setUser({
              id: userData.id,
              email: userData.email,
              name: userData.name,
              is_master: userData.is_master
            })
          }
        } else if (event === 'SIGNED_OUT') {
          setUser(null)
        }
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const signOut = async () => {
    try {
      await supabase.auth.signOut()
      setUser(null)
    } catch (error) {
      console.error('Erro ao fazer logout:', error)
    }
  }

  const saveUserData = async (data: any) => {
    if (!user) return

    try {
      const { error } = await supabase
        .from('user_data')
        .upsert({
          user_id: user.id,
          ...data
        })

      if (error) {
        console.error('Erro ao salvar dados:', error)
        // Fallback para localStorage se Supabase falhar
        Object.keys(data).forEach(key => {
          localStorage.setItem(`eventcontrol-${key}`, JSON.stringify(data[key]))
        })
      }
    } catch (error) {
      console.error('Erro ao salvar dados:', error)
      // Fallback para localStorage
      Object.keys(data).forEach(key => {
        localStorage.setItem(`eventcontrol-${key}`, JSON.stringify(data[key]))
      })
    }
  }

  const loadUserData = async () => {
    if (!user) return null

    try {
      const { data, error } = await supabase
        .from('user_data')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (error || !data) {
        // Fallback para localStorage
        return {
          events: JSON.parse(localStorage.getItem('eventcontrol-events') || '[]'),
          products: JSON.parse(localStorage.getItem('eventcontrol-products') || '[]'),
          sales: JSON.parse(localStorage.getItem('eventcontrol-sales') || '[]'),
          expenses: JSON.parse(localStorage.getItem('eventcontrol-expenses') || '[]'),
          expense_categories: JSON.parse(localStorage.getItem('eventcontrol-expensecategories') || '[]'),
          revenues: JSON.parse(localStorage.getItem('eventcontrol-revenues') || '[]'),
          notifications: JSON.parse(localStorage.getItem('eventcontrol-notifications') || '[]'),
          templates: JSON.parse(localStorage.getItem('eventcontrol-templates') || '[]'),
          ticket_info: JSON.parse(localStorage.getItem('eventcontrol-ticketinfo') || '{"currentTicketPrice": 50, "ticketsSold": 0, "eventTotalCost": 15000}')
        }
      }

      return {
        events: data.events || [],
        products: data.products || [],
        sales: data.sales || [],
        expenses: data.expenses || [],
        expense_categories: data.expense_categories || [],
        revenues: data.revenues || [],
        notifications: data.notifications || [],
        templates: data.templates || [],
        ticket_info: data.ticket_info || { currentTicketPrice: 50, ticketsSold: 0, eventTotalCost: 15000 }
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
      // Fallback para localStorage
      return {
        events: JSON.parse(localStorage.getItem('eventcontrol-events') || '[]'),
        products: JSON.parse(localStorage.getItem('eventcontrol-products') || '[]'),
        sales: JSON.parse(localStorage.getItem('eventcontrol-sales') || '[]'),
        expenses: JSON.parse(localStorage.getItem('eventcontrol-expenses') || '[]'),
        expense_categories: JSON.parse(localStorage.getItem('eventcontrol-expensecategories') || '[]'),
        revenues: JSON.parse(localStorage.getItem('eventcontrol-revenues') || '[]'),
        notifications: JSON.parse(localStorage.getItem('eventcontrol-notifications') || '[]'),
        templates: JSON.parse(localStorage.getItem('eventcontrol-templates') || '[]'),
        ticket_info: JSON.parse(localStorage.getItem('eventcontrol-ticketinfo') || '{"currentTicketPrice": 50, "ticketsSold": 0, "eventTotalCost": 15000}')
      }
    }
  }

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      signOut,
      saveUserData,
      loadUserData
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}