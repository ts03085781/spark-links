'use client'

import { useState, useEffect } from 'react'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { useAuthStore } from '@/stores/auth'
import { createClient } from '@/lib/supabase/browser'
import { Project } from '@/types'
import { ProjectCard } from '@/components/projects/ProjectCard'
import { Button } from '@/components/ui/button'
import { PageLoading } from '@/components/ui/loading'
import { Plus, FolderOpen } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

export default function ManageProjectsPage() {
  const { user } = useAuthStore()
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)

  const loadMyProjects = async () => {
    if (!user) return

    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('projects')
        .select(`
          *,
          creator:users!creator_id(
            id,
            name,
            avatar_url
          )
        `)
        .eq('creator_id', user.id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('載入我創建的專案失敗:', error)
        toast.error('載入失敗', {
          description: '請檢查網路連線或稍後再試',
        })
        return
      }

      setProjects(data || [])
    } catch (error) {
      console.error('載入我創建的專案時發生錯誤:', error)
      toast.error('系統錯誤', {
        description: '發生未預期的錯誤，請稍後再試',
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadMyProjects()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  return (
    <ProtectedRoute>
      <div className="space-y-6">
        {/* 頁面標題 */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold">我創建的專案</h1>
            <p className="text-muted-foreground">管理和編輯你創建的創業專案</p>
          </div>
          <Button asChild>
            <Link href="/projects/create">
              <Plus className="h-4 w-4 mr-2" />
              創建專案
            </Link>
          </Button>
        </div>

        {/* 專案列表 */}
        {loading ? (
          <PageLoading />
        ) : (
          <div className="space-y-4">
            {projects.length === 0 ? (
              <div className="bg-muted/50 p-8 rounded-lg text-center space-y-4">
                <FolderOpen className="h-16 w-16 mx-auto text-muted-foreground" />
                <div className="space-y-2">
                  <p className="text-lg font-medium">還沒有專案</p>
                  <p className="text-muted-foreground">
                    開始創建您的第一個創業專案，招募志同道合的創業夥伴
                  </p>
                </div>
                <Button asChild>
                  <Link href="/projects/create">
                    <Plus className="h-4 w-4 mr-2" />
                    創建你的第一個專案
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {projects.map((project) => (
                  <div key={project.id} className="relative">
                    <ProjectCard project={project} />
                    <div className="absolute top-2 right-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        className="h-6 px-2 text-xs"
                        asChild
                      >
                        <Link href={`/projects/${project.id}/edit`}>
                          編輯
                        </Link>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 統計資訊 */}
        {projects.length > 0 && (
          <div className="grid gap-4 md:grid-cols-3">
            <div className="bg-card p-4 rounded-lg border">
              <div className="text-2xl font-bold">{projects.length}</div>
              <div className="text-sm text-muted-foreground">總專案數</div>
            </div>
            <div className="bg-card p-4 rounded-lg border">
              <div className="text-2xl font-bold">
                {projects.filter(p => p.is_recruiting).length}
              </div>
              <div className="text-sm text-muted-foreground">招募中</div>
            </div>
            <div className="bg-card p-4 rounded-lg border">
              <div className="text-2xl font-bold">
                {projects.reduce((sum, p) => sum + p.current_team_size, 0)}
              </div>
              <div className="text-sm text-muted-foreground">總團隊人數</div>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  )
}