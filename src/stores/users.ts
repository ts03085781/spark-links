import { create } from 'zustand'
import { createClient } from '@/lib/supabase/browser'
import { User, UserFilters } from '@/types'

interface UsersState {
  users: User[]
  currentUser: User | null
  isLoading: boolean
  filters: UserFilters
  pagination: {
    page: number
    limit: number
    total: number
    hasNext: boolean
    hasPrev: boolean
  }
  
  // Actions
  setUsers: (users: User[]) => void
  setCurrentUser: (user: User | null) => void
  setLoading: (loading: boolean) => void
  setFilters: (filters: UserFilters) => void
  setPagination: (pagination: Partial<UsersState['pagination']>) => void
  
  // API Actions
  fetchUsers: (filters?: UserFilters, page?: number) => Promise<void>
  fetchUser: (id: string) => Promise<void>
  updateProfile: (profileData: User) => Promise<{ error?: string }>
  searchUsers: (keyword: string) => Promise<void>
}

export const useUsersStore = create<UsersState>((set, get) => ({
  users: [],
  currentUser: null,
  isLoading: false,
  filters: {},
  pagination: {
    page: 1,
    limit: 12,
    total: 0,
    hasNext: false,
    hasPrev: false,
  },
  
  setUsers: (users) => set({ users }),
  setCurrentUser: (user) => set({ currentUser: user }),
  setLoading: (loading) => set({ isLoading: loading }),
  setFilters: (filters) => set({ filters }),
  setPagination: (pagination) => set({ 
    pagination: { ...get().pagination, ...pagination } 
  }),
  
  // 獲取用戶列表
  fetchUsers: async (filters = {}, page = 1) => {
    const supabase = createClient()
    set({ isLoading: true })
    
    try {
      const { limit } = get().pagination
      const from = (page - 1) * limit
      const to = from + limit - 1
      
      let query = supabase
        .from('users')
        .select('*', { count: 'exact' })
        .eq('is_public', true)
        .range(from, to)
        .order('created_at', { ascending: false })
      
      // 應用篩選條件
      if (filters.keyword) {
        query = query.or(`name.ilike.%${filters.keyword}%,experience_description.ilike.%${filters.keyword}%,partner_description.ilike.%${filters.keyword}%`)
      }
      
      if (filters.skills && filters.skills.length > 0) {
        query = query.overlaps('skills', filters.skills)
      }
      
      if (filters.work_mode && filters.work_mode.length > 0) {
        query = query.in('work_mode', filters.work_mode)
      }
      
      if (filters.location_preference && filters.location_preference.length > 0) {
        query = query.in('location_preference', filters.location_preference)
      }
      
      const { data, error, count } = await query
      
      if (error) {
        console.error('Error fetching users:', error)
        set({ isLoading: false })
        return
      }
      
      set({
        users: data || [],
        filters,
        pagination: {
          ...get().pagination,
          page,
          total: count || 0,
          hasNext: (count || 0) > to + 1,
          hasPrev: page > 1,
        },
        isLoading: false,
      })
    } catch (error) {
      console.error('Error fetching users:', error)
      set({ isLoading: false })
    }
  },
  
  // 獲取單個用戶
  fetchUser: async (id: string) => {
    const supabase = createClient()
    set({ isLoading: true })
    
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', id)
        .single()
      
      if (error) {
        console.error('Error fetching user:', error)
        set({ isLoading: false })
        return
      }
      
      set({ currentUser: data, isLoading: false })
    } catch (error) {
      console.error('Error fetching user:', error)
      set({ isLoading: false })
    }
  },
  
  // 更新用戶資料
  updateProfile: async (profileData) => {
    const supabase = createClient()
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        return { error: '請先登入' }
      }
      
      const { data, error } = await supabase
        .from('users')
        .update(profileData as never)
        .eq('id', user.id)
        .select()
        .single()
      
      if (error) {
        return { error: error.message }
      }
      
      // 更新當前用戶資料
      if (get().currentUser?.id === user.id) {
        set({ currentUser: data })
      }
      
      return {}
    } catch (error) {
      console.error('Error updating profile:', error)
      return { error: '更新個人資料失敗，請稍後再試' }
    }
  },
  
  // 搜尋用戶
  searchUsers: async (keyword: string) => {
    const filters = { ...get().filters, keyword }
    await get().fetchUsers(filters, 1)
  },
}))