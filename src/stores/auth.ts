import { create } from 'zustand'
import { createClient } from '@/lib/supabase/browser'
import { User } from '@/types'

interface AuthState {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  
  // Actions
  setUser: (user: User | null) => void
  setLoading: (loading: boolean) => void
  login: (email: string, password: string) => Promise<{ error?: string }>
  register: (email: string, password: string, name: string) => Promise<{ error?: string }>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,
  
  setUser: (user) => {
    set({ 
      user, 
      isAuthenticated: !!user,
      isLoading: false 
    })
  },
  
  setLoading: (loading) => set({ isLoading: loading }),
  
  login: async (email, password) => {
    const supabase = createClient()
    set({ isLoading: true })
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      
      if (error) {
        set({ isLoading: false })
        return { error: error.message }
      }
      
      if (data.user) {
        // 獲取用戶完整資料
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('id', data.user.id)
          .single()
          
        if (userError) {
          set({ isLoading: false })
          return { error: userError.message }
        }
        
        get().setUser(userData)
      }
      
      return {}
    } catch (error) {
      set({ isLoading: false })
      return { error: '登入失敗，請稍後再試' }
    }
  },
  
  register: async (email, password, name) => {
    const supabase = createClient()
    set({ isLoading: true })
    
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      })
      
      if (error) {
        set({ isLoading: false })
        return { error: error.message }
      }
      
      if (data.user) {
        // 建立用戶資料
        const { error: insertError } = await supabase
          .from('users')
          .insert({
            id: data.user.id,
            email: data.user.email!,
            name,
            skills: [],
            experience_description: '',
            work_mode: 'fulltime',
            partner_description: '',
            location_preference: 'remote',
            is_public: false,
          })
          
        if (insertError) {
          set({ isLoading: false })
          return { error: insertError.message }
        }
      }
      
      set({ isLoading: false })
      return {}
    } catch (error) {
      set({ isLoading: false })
      return { error: '註冊失敗，請稍後再試' }
    }
  },
  
  logout: async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    set({ 
      user: null, 
      isAuthenticated: false,
      isLoading: false 
    })
  },
  
  refreshUser: async () => {
    const supabase = createClient()
    set({ isLoading: true })
    
    try {
      const { data: { user: authUser }, error } = await supabase.auth.getUser()
      
      if (error || !authUser) {
        get().setUser(null)
        return
      }
      
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single()
        
      if (userError) {
        get().setUser(null)
        return
      }
      
      get().setUser(userData)
    } catch (error) {
      get().setUser(null)
    }
  },
}))