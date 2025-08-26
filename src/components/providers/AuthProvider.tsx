'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/browser'
import { useAuthStore } from '@/stores/auth'

interface AuthProviderProps {
  children: React.ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const { setUser, setLoading } = useAuthStore()

  useEffect(() => {
    const supabase = createClient()

    // 獲取初始用戶狀態
    const getInitialUser = async () => {
      setLoading(true)
      
      try {
        const { data: { user: authUser }, error } = await supabase.auth.getUser()
        
        if (error || !authUser) {
          setUser(null)
          return
        }

        // 獲取用戶完整資料
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('id', authUser.id)
          .single()

        if (userError || !userData) {
          setUser(null)
          return
        }

        setUser(userData)
      } catch (error) {
        console.error('Error getting initial user:', error)
        setUser(null)
      }
    }

    getInitialUser()

  }, [setUser, setLoading])

  return <>{children}</>
}