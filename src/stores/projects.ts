import { create } from 'zustand'
import { createClient } from '@/lib/supabase/browser'
import { Project, ProjectFilters } from '@/types'

interface ProjectsState {
  projects: Project[]
  currentProject: Project | null
  isLoading: boolean
  filters: ProjectFilters
  pagination: {
    page: number
    limit: number
    total: number
    hasNext: boolean
    hasPrev: boolean
  }
  
  // Actions
  setProjects: (projects: Project[]) => void
  setCurrentProject: (project: Project | null) => void
  setLoading: (loading: boolean) => void
  setFilters: (filters: ProjectFilters) => void
  setPagination: (pagination: Partial<ProjectsState['pagination']>) => void
  
  // API Actions
  fetchProjects: (filters?: ProjectFilters, page?: number) => Promise<void>
  fetchProject: (id: string) => Promise<void>
  createProject: (projectData: Project) => Promise<{ error?: string }>
  updateProject: (id: string, projectData: Project) => Promise<{ error?: string }>
  deleteProject: (id: string) => Promise<{ error?: string }>
  searchProjects: (keyword: string) => Promise<void>
}

export const useProjectsStore = create<ProjectsState>((set, get) => ({
  projects: [],
  currentProject: null,
  isLoading: false,
  filters: {},
  pagination: {
    page: 1,
    limit: 12,
    total: 0,
    hasNext: false,
    hasPrev: false,
  },
  
  setProjects: (projects) => set({ projects }),
  setCurrentProject: (project) => set({ currentProject: project }),
  setLoading: (loading) => set({ isLoading: loading }),
  setFilters: (filters) => set({ filters }),
  setPagination: (pagination) => set({ 
    pagination: { ...get().pagination, ...pagination } 
  }),
  
  // 獲取專案列表
  fetchProjects: async (filters = {}, page = 1) => {
    const supabase = createClient()
    set({ isLoading: true })
    
    try {
      const { limit } = get().pagination
      const from = (page - 1) * limit
      const to = from + limit - 1
      
      let query = supabase
        .from('projects')
        .select(`
          *,
          creator:users!creator_id(*),
          team_members:project_members(
            *,
            user:users(*)
          ),
          applications(*)
        `, { count: 'exact' })
        .eq('is_public', true)
        .eq('is_recruiting', true)
        .range(from, to)
        .order('created_at', { ascending: false })
      
      // 應用篩選條件
      if (filters.keyword) {
        query = query.or(`title.ilike.%${filters.keyword}%,description.ilike.%${filters.keyword}%`)
      }
      
      if (filters.skills && filters.skills.length > 0) {
        query = query.overlaps('required_skills', filters.skills)
      }
      
      if (filters.required_roles && filters.required_roles.length > 0) {
        query = query.overlaps('required_roles', filters.required_roles)
      }
      
      if (filters.project_stage && filters.project_stage.length > 0) {
        query = query.in('project_stage', filters.project_stage)
      }
      
      const { data, error, count } = await query
      
      if (error) {
        console.error('Error fetching projects:', error)
        set({ isLoading: false })
        return
      }
      
      set({
        projects: data || [],
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
      console.error('Error fetching projects:', error)
      set({ isLoading: false })
    }
  },
  
  // 獲取單個專案
  fetchProject: async (id: string) => {
    const supabase = createClient()
    set({ isLoading: true })
    
    try {
      const { data, error } = await supabase
        .from('projects')
        .select(`
          *,
          creator:users!creator_id(*),
          team_members:project_members(
            *,
            user:users(*)
          ),
          applications(
            *,
            applicant:users(*)
          )
        `)
        .eq('id', id)
        .single()
      
      if (error) {
        console.error('Error fetching project:', error)
        set({ isLoading: false })
        return
      }
      
      set({ currentProject: data, isLoading: false })
    } catch (error) {
      console.error('Error fetching project:', error)
      set({ isLoading: false })
    }
  },
  
  // 建立專案
  createProject: async (projectData: Project) => {
    const supabase = createClient()
    
    try {
      const { error } = await supabase
        .from('projects')
        .insert(projectData as never)
        .select()
        .single()
      
      if (error) {
        return { error: error.message }
      }
      
      // 重新獲取專案列表
      get().fetchProjects(get().filters, get().pagination.page)
      
      return {}
    } catch (error) {
      console.log('Error creating project:', error)
      return { error: '建立專案失敗，請稍後再試' }
    }
  },
  
  // 更新專案
  updateProject: async (id: string, projectData: Project) => {
    const supabase = createClient()
    
    try {
      const { data, error } = await supabase
        .from('projects')
        .update(projectData as never)
        .eq('id', id)
        .select()
        .single()
      
      if (error) {
        return { error: error.message }
      }
      
      // 更新當前專案
      if (get().currentProject?.id === id) {
        set({ currentProject: data })
      }
      
      // 更新專案列表
      const projects = get().projects.map(p => 
        p.id === id ? { ...p, ...(data as Project) } : p
      )
      set({ projects })
      
      return {}
    } catch (error) {
      console.error('Error updating project:', error)
      return { error: '更新專案失敗，請稍後再試' }
    }
  },
  
  // 刪除專案
  deleteProject: async (id: string) => {
    const supabase = createClient()
    
    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', id)
      
      if (error) {
        return { error: error.message }
      }
      
      // 從列表中移除
      const projects = get().projects.filter(p => p.id !== id)
      set({ projects })
      
      // 如果是當前專案，清除
      if (get().currentProject?.id === id) {
        set({ currentProject: null })
      }
      
      return {}
    } catch (error) {
      console.error('Error deleting project:', error)
      return { error: '刪除專案失敗，請稍後再試' }
    }
  },
  
  // 搜尋專案
  searchProjects: async (keyword: string) => {
    const filters = { ...get().filters, keyword }
    await get().fetchProjects(filters, 1)
  },
}))