'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { useAuthStore } from '@/stores/auth'
import { createClient } from '@/lib/supabase/browser'
import { Project, ProjectForm as ProjectFormData } from '@/types'
import { ProjectForm } from '@/components/projects/ProjectForm'
import { Button } from '@/components/ui/button'
import { PageLoading } from '@/components/ui/loading'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

export default function EditProjectPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuthStore()
  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const projectId = params.id as string

  const loadProject = async () => {
    if (!user) return

    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .eq('creator_id', user.id) // 只允許創建者編輯
        .single()

      if (error) {
        console.error('載入專案失敗:', error)
        toast.error('載入失敗', {
          description: '找不到指定的專案或您沒有編輯權限',
        })
        router.push('/projects/manage')
        return
      }

      setProject(data)
    } catch (error) {
      console.error('載入專案時發生錯誤:', error)
      toast.error('系統錯誤', {
        description: '發生未預期的錯誤，請稍後再試',
      })
      router.push('/projects/manage')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (data: ProjectFormData) => {
    if (!user || !project) return

    setIsSubmitting(true)
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('projects')
        .update({
          title: data.title,
          description: data.description,
          target_team_size: data.target_team_size,
          required_roles: data.required_roles,
          required_skills: data.required_skills,
          project_stage: data.project_stage,
          is_public: data.is_public,
        })
        .eq('id', project.id)
        .eq('creator_id', user.id)

      if (error) {
        console.error('更新專案失敗:', error)
        toast.error('更新失敗', {
          description: '請檢查網路連線或稍後再試',
        })
        return
      }

      toast.success('專案更新成功！', {
        description: '您的專案資訊已成功更新',
      })

      // 導向專案詳情頁
      router.push(`/projects/${project.id}`)
    } catch (error) {
      console.error('更新專案時發生錯誤:', error)
      toast.error('系統錯誤', {
        description: '發生未預期的錯誤，請稍後再試',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    router.back()
  }

  useEffect(() => {
    if (projectId && user) {
      loadProject()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, user])

  if (loading) {
    return (
      <ProtectedRoute>
        <PageLoading />
      </ProtectedRoute>
    )
  }

  if (!project) {
    return (
      <ProtectedRoute>
        <div className="text-center py-12">
          <p className="text-muted-foreground">專案不存在或您沒有編輯權限</p>
          <Button asChild className="mt-4">
            <Link href="/projects/manage">返回我創建的專案</Link>
          </Button>
        </div>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <div className="space-y-6">
        {/* 返回按鈕 */}
        <Button variant="ghost" asChild className="gap-2">
          <Link href={`/projects/${project.id}`}>
            <ArrowLeft className="h-4 w-4" />
            返回專案詳情
          </Link>
        </Button>

        <div>
          <h1 className="text-3xl font-bold">編輯專案</h1>
          <p className="text-muted-foreground">
            修改「{project.title}」的資訊和設定
          </p>
        </div>
        
        <ProjectForm
          initialData={{
            title: project.title,
            description: project.description,
            target_team_size: project.target_team_size,
            required_roles: project.required_roles,
            required_skills: project.required_skills,
            project_stage: project.project_stage,
            is_public: project.is_public,
          }}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isLoading={isSubmitting}
          submitButtonText="更新專案"
        />
      </div>
    </ProtectedRoute>
  )
}