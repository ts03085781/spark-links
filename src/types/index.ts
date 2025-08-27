// 用戶相關型別
export interface User {
  id: string
  email: string
  name: string
  contact_info?: string
  skills: string[]
  experience_description: string
  work_mode: 'fulltime' | 'parttime'
  partner_description: string
  location_preference: 'remote' | 'specific_location'
  specific_location?: string
  is_public: boolean
  avatar_url?: string
  created_at: string
  updated_at: string
}

// 創業專案相關型別
export interface Project {
  id: string
  creator_id: string
  title: string
  description: string
  current_team_size: number
  target_team_size: number
  required_roles: string[]
  required_skills: string[]
  project_stage: 'idea' | 'prototype' | 'beta' | 'launched'
  is_recruiting: boolean
  is_public: boolean
  created_at: string
  updated_at: string
  
  // 關聯資料
  creator?: User
  team_members?: ProjectMember[]
  applications?: Application[]
}

// 專案成員關係
export interface ProjectMember {
  id: string
  project_id: string
  user_id: string
  role: string
  joined_at: string
  
  // 關聯資料
  user?: User
  project?: Project
}

// 申請加入專案
export interface Application {
  id: string
  project_id: string
  applicant_id: string
  message: string
  status: 'pending' | 'accepted' | 'rejected'
  response_message?: string
  created_at: string
  updated_at: string
  
  // 關聯資料
  project?: Project
  applicant?: User
}

// 邀請夥伴加入專案
export interface Invitation {
  id: string
  project_id: string
  inviter_id: string
  invitee_id: string
  message: string
  status: 'pending' | 'accepted' | 'rejected'
  response_message?: string
  created_at: string
  updated_at: string
  
  // 關聯資料
  project?: Project
  inviter?: User
  invitee?: User
}

// 私訊相關型別
export interface Conversation {
  id: string
  participants: string[]
  last_message?: Message
  created_at: string
  updated_at: string
}

export interface Message {
  id: string
  conversation_id: string
  sender_id: string
  content: string
  is_read: boolean
  created_at: string
  
  // 關聯資料
  sender?: User
}

// 篩選和搜尋相關型別
export interface ProjectFilters {
  skills?: string[]
  required_roles?: string[]
  project_stage?: Project['project_stage'][]
  keyword?: string
}

export interface UserFilters {
  skills?: string[]
  work_mode?: User['work_mode'][]
  location_preference?: User['location_preference'][]
  keyword?: string
}

// API 回應型別
export interface ApiResponse<T> {
  data: T
  error: string | null
  success: boolean
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  hasNext: boolean
  hasPrev: boolean
}

// 表單型別
export interface RegisterForm {
  email: string
  password: string
  confirmPassword: string
  name: string
}

export interface LoginForm {
  email: string
  password: string
}

export interface ProfileForm {
  name: string
  contact_info: string
  skills: string[]
  experience_description: string
  work_mode: User['work_mode']
  partner_description: string
  location_preference: User['location_preference']
  specific_location?: string
  is_public: boolean
}

export interface ProjectForm {
  title: string
  description: string
  target_team_size: number
  required_roles: string[]
  required_skills: string[]
  project_stage: Project['project_stage']
  is_public: boolean
}

export interface ApplicationForm {
  message: string
}

export interface InvitationForm {
  project_id: string
  message: string
}

// Supabase 資料庫表格型別
export interface Database {
  public: {
    Tables: {
      users: {
        Row: User
        Insert: Omit<User, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<User, 'id' | 'created_at' | 'updated_at'>>
      }
      projects: {
        Row: Project
        Insert: Omit<Project, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Project, 'id' | 'created_at' | 'updated_at'>>
      }
      project_members: {
        Row: ProjectMember
        Insert: Omit<ProjectMember, 'id' | 'joined_at'>
        Update: Partial<Omit<ProjectMember, 'id' | 'joined_at'>>
      }
      applications: {
        Row: Application
        Insert: {
          project_id: string
          applicant_id: string
          message: string
          status?: 'pending' | 'accepted' | 'rejected'
          response_message?: string
        }
        Update: Partial<{
          message: string
          status: 'pending' | 'accepted' | 'rejected'
          response_message: string
        }>
      }
      invitations: {
        Row: Invitation
        Insert: Omit<Invitation, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Invitation, 'id' | 'created_at' | 'updated_at'>>
      }
      conversations: {
        Row: Conversation
        Insert: Omit<Conversation, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Conversation, 'id' | 'created_at' | 'updated_at'>>
      }
      messages: {
        Row: Message
        Insert: Omit<Message, 'id' | 'created_at'>
        Update: Partial<Omit<Message, 'id' | 'created_at'>>
      }
    }
  }
}