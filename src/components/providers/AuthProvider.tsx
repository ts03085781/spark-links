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
      console.log('Auth state changed:', event, session?.user?.email)
      
      if (event === 'SIGNED_IN' && session?.user) {
        // 用戶登入，獲取完整資料
        setLoading(true)
        try {
          const { data: userData, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .single()

          if (error) {
            console.error('Error fetching user data after sign in:', error)
            console.log('Error details:', error.message, error.code)
            
            // 如果是找不到用戶記錄，嘗試建立
            if (error.code === 'PGRST116') {
              console.log('User profile not found, creating...')
              try {
                const { data: newUser, error: createError } = await supabase
                  .from('users')
                  .insert({
                    id: session.user.id,
                    email: session.user.email!,
                    name: session.user.user_metadata?.name || '',
                    skills: [],
                    experience_description: '',
                    work_mode: 'fulltime',
                    partner_description: '',
                    location_preference: 'remote',
                    is_public: false,
                  })
                  .select()
                  .single()
                
                if (!createError && newUser) {
                  console.log('User profile created successfully')
                  setUser(newUser)
                  return
                }
              } catch (createError) {
                console.error('Failed to create user profile:', createError)
              }
            }
            
            setUser(null)
            return
          }

          if (userData) {
            console.log('User data loaded:', userData.name, userData.email)
            setUser(userData)
          } else {
            console.log('No user data found')
            setUser(null)
          }
        } catch (error) {
          console.error('Error fetching user data:', error)
          setUser(null)
        }
      } else if (event === 'SIGNED_OUT') {
        // 用戶登出
        console.log('User signed out')
        setUser(null)
      } else if (session?.user) {
        // 其他事件但用戶還在，檢查用戶資料
        try {
          const { data: userData, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .single()

          if (!error && userData) {
            setUser(userData)
          }
        } catch (error) {
          console.error('Error checking user data:', error)
        }
      } else {
        // 沒有 session
        setUser(null)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [setUser, setLoading])

  return <>{children}</>
}