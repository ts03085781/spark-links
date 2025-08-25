import { create } from 'zustand'
import { createClient } from '@/lib/supabase'
import { Application, Invitation } from '@/types'

interface ApplicationsState {
  applications: Application[]
  invitations: Invitation[]
  sentApplications: Application[]
  sentInvitations: Invitation[]
  isLoading: boolean
  
  // Actions
  setApplications: (applications: Application[]) => void
  setInvitations: (invitations: Invitation[]) => void
  setSentApplications: (applications: Application[]) => void
  setSentInvitations: (invitations: Invitation[]) => void
  setLoading: (loading: boolean) => void
  
  // API Actions - 申請相關
  fetchReceivedApplications: () => Promise<void>
  fetchSentApplications: () => Promise<void>
  createApplication: (projectId: string, message: string) => Promise<{ error?: string }>
  respondToApplication: (applicationId: string, status: 'accepted' | 'rejected', message?: string) => Promise<{ error?: string }>
  
  // API Actions - 邀請相關
  fetchReceivedInvitations: () => Promise<void>
  fetchSentInvitations: () => Promise<void>
  createInvitation: (projectId: string, inviteeId: string, message: string) => Promise<{ error?: string }>
  respondToInvitation: (invitationId: string, status: 'accepted' | 'rejected', message?: string) => Promise<{ error?: string }>
}

export const useApplicationsStore = create<ApplicationsState>((set, get) => ({
  applications: [],
  invitations: [],
  sentApplications: [],
  sentInvitations: [],
  isLoading: false,
  
  setApplications: (applications) => set({ applications }),
  setInvitations: (invitations) => set({ invitations }),
  setSentApplications: (applications) => set({ sentApplications: applications }),
  setSentInvitations: (invitations) => set({ sentInvitations: invitations }),
  setLoading: (loading) => set({ isLoading: loading }),
  
  fetchReceivedApplications: async () => {
    const supabase = createClient()
    set({ isLoading: true })
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      
      const { data, error } = await supabase
        .from('applications')
        .select(`
          *,
          project:projects!project_id(*),
          applicant:users!applicant_id(*)
        `)
        .eq('project.creator_id', user.id)
        .order('created_at', { ascending: false })
      
      if (error) {
        console.error('Error fetching received applications:', error)
        set({ isLoading: false })
        return
      }
      
      set({ applications: data || [], isLoading: false })
    } catch (error) {
      console.error('Error fetching received applications:', error)
      set({ isLoading: false })
    }
  },
  
  fetchSentApplications: async () => {
    const supabase = createClient()
    set({ isLoading: true })
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      
      const { data, error } = await supabase
        .from('applications')
        .select(`
          *,
          project:projects!project_id(
            *,
            creator:users!creator_id(*)
          )
        `)
        .eq('applicant_id', user.id)
        .order('created_at', { ascending: false })
      
      if (error) {
        console.error('Error fetching sent applications:', error)
        set({ isLoading: false })
        return
      }
      
      set({ sentApplications: data || [], isLoading: false })
    } catch (error) {
      console.error('Error fetching sent applications:', error)
      set({ isLoading: false })
    }
  },
  
  createApplication: async (projectId: string, message: string) => {
    const supabase = createClient()
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return { error: '請先登入' }
      
      // 檢查是否已經申請過
      const { data: existingApplication } = await supabase
        .from('applications')
        .select('id')
        .eq('project_id', projectId)
        .eq('applicant_id', user.id)
        .single()
      
      if (existingApplication) {
        return { error: '您已經申請過此專案' }
      }
      
      const { data, error } = await supabase
        .from('applications')
        .insert({
          project_id: projectId,
          applicant_id: user.id,
          message,
          status: 'pending',
        })
        .select()
        .single()
      
      if (error) {
        return { error: error.message }
      }
      
      // 重新獲取已發送的申請
      get().fetchSentApplications()
      
      return {}
    } catch (error) {
      return { error: '提交申請失敗，請稍後再試' }
    }
  },
  
  respondToApplication: async (applicationId: string, status: 'accepted' | 'rejected', message?: string) => {
    const supabase = createClient()
    
    try {
      const { data, error } = await supabase
        .from('applications')
        .update({
          status,
          response_message: message,
        })
        .eq('id', applicationId)
        .select()
        .single()
      
      if (error) {
        return { error: error.message }
      }
      
      // 如果接受申請，將申請者加入專案團隊
      if (status === 'accepted' && data) {
        const { error: memberError } = await supabase
          .from('project_members')
          .insert({
            project_id: data.project_id,
            user_id: data.applicant_id,
            role: 'member',
          })
        
        if (memberError) {
          console.error('Error adding member to project:', memberError)
        }
      }
      
      // 更新本地狀態
      const applications = get().applications.map(app => 
        app.id === applicationId ? { ...app, ...data } : app
      )
      set({ applications })
      
      return {}
    } catch (error) {
      return { error: '回覆申請失敗，請稍後再試' }
    }
  },
  
  fetchReceivedInvitations: async () => {
    const supabase = createClient()
    set({ isLoading: true })
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      
      const { data, error } = await supabase
        .from('invitations')
        .select(`
          *,
          project:projects!project_id(*),
          inviter:users!inviter_id(*)
        `)
        .eq('invitee_id', user.id)
        .order('created_at', { ascending: false })
      
      if (error) {
        console.error('Error fetching received invitations:', error)
        set({ isLoading: false })
        return
      }
      
      set({ invitations: data || [], isLoading: false })
    } catch (error) {
      console.error('Error fetching received invitations:', error)
      set({ isLoading: false })
    }
  },
  
  fetchSentInvitations: async () => {
    const supabase = createClient()
    set({ isLoading: true })
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      
      const { data, error } = await supabase
        .from('invitations')
        .select(`
          *,
          project:projects!project_id(*),
          invitee:users!invitee_id(*)
        `)
        .eq('inviter_id', user.id)
        .order('created_at', { ascending: false })
      
      if (error) {
        console.error('Error fetching sent invitations:', error)
        set({ isLoading: false })
        return
      }
      
      set({ sentInvitations: data || [], isLoading: false })
    } catch (error) {
      console.error('Error fetching sent invitations:', error)
      set({ isLoading: false })
    }
  },
  
  createInvitation: async (projectId: string, inviteeId: string, message: string) => {
    const supabase = createClient()
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return { error: '請先登入' }
      
      // 檢查是否已經邀請過
      const { data: existingInvitation } = await supabase
        .from('invitations')
        .select('id')
        .eq('project_id', projectId)
        .eq('invitee_id', inviteeId)
        .single()
      
      if (existingInvitation) {
        return { error: '您已經邀請過此用戶' }
      }
      
      const { data, error } = await supabase
        .from('invitations')
        .insert({
          project_id: projectId,
          inviter_id: user.id,
          invitee_id: inviteeId,
          message,
          status: 'pending',
        })
        .select()
        .single()
      
      if (error) {
        return { error: error.message }
      }
      
      // 重新獲取已發送的邀請
      get().fetchSentInvitations()
      
      return {}
    } catch (error) {
      return { error: '發送邀請失敗，請稍後再試' }
    }
  },
  
  respondToInvitation: async (invitationId: string, status: 'accepted' | 'rejected', message?: string) => {
    const supabase = createClient()
    
    try {
      const { data, error } = await supabase
        .from('invitations')
        .update({
          status,
          response_message: message,
        })
        .eq('id', invitationId)
        .select()
        .single()
      
      if (error) {
        return { error: error.message }
      }
      
      // 如果接受邀請，將用戶加入專案團隊
      if (status === 'accepted' && data) {
        const { error: memberError } = await supabase
          .from('project_members')
          .insert({
            project_id: data.project_id,
            user_id: data.invitee_id,
            role: 'member',
          })
        
        if (memberError) {
          console.error('Error adding member to project:', memberError)
        }
      }
      
      // 更新本地狀態
      const invitations = get().invitations.map(inv => 
        inv.id === invitationId ? { ...inv, ...data } : inv
      )
      set({ invitations })
      
      return {}
    } catch (error) {
      return { error: '回覆邀請失敗，請稍後再試' }
    }
  },
}))