'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { useAuthStore } from '@/stores/auth'
import { ProjectForm } from '@/components/projects/ProjectForm'
import { createClient } from '@/lib/supabase/browser'
import { ProjectForm as ProjectFormData } from '@/types'
import { toast } from 'sonner'

export default function CreateProjectPage() {
  const { user } = useAuthStore()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (data: ProjectFormData) => {
    if (!user) return

    setIsLoading(true)
    try {
      const supabase = createClient()
      
      // 創建項目
      const { data: project, error } = await supabase
        .from('projects')
        .insert({
          creator_id: user.id,
          title: data.title,
          description: data.description,
          target_team_size: data.target_team_size,
          required_roles: data.required_roles,
          required_skills: data.required_skills,
          project_stage: data.project_stage,
          is_public: data.is_public,
        })
        .select()
        .single()

      if (error) {
        console.error('創建專案失敗:', error)
        toast.error('創建專案失敗', {
          description: '請檢查網路連線或稍後再試',
        })
        return
      }

      toast.success('專案創建成功！', {
        description: '您的專案已成功創建，現在可以開始招募團隊成員',
      })

      // 導向專案詳情頁
      router.push(`/projects/${project.id}`)
    } catch (error) {
      console.error('創建專案時發生錯誤:', error)
      toast.error('系統錯誤', {
        description: '發生未預期的錯誤，請稍後再試',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    router.back()
  }

  return (
    <ProtectedRoute>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">創建新專案</h1>
          <p className="text-muted-foreground">
            發布您的創業專案，招募志同道合的創業夥伴
          </p>
        </div>
        
        <ProjectForm
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isLoading={isLoading}
        />
      </div>
    </ProtectedRoute>
  )
}