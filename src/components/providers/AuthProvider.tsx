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

    // 監聽認證狀態變化
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        // 用戶登入，獲取完整資料
        try {
          const { data: userData, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .single()

          if (error || !userData) {
            setUser(null)
            return
          }

          setUser(userData)
        } catch (error) {
          console.error('Error fetching user data:', error)
          setUser(null)
        }
      } else {
        // 用戶登出
        setUser(null)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [setUser, setLoading])

  return <>{children}</>
}