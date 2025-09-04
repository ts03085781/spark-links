'use client'

import { useState, useEffect } from 'react'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { useAuthStore } from '@/stores/auth'
import { createClient } from '@/lib/supabase/browser'
import { Project } from '@/types'
import { ProjectCard } from '@/components/projects/ProjectCard'
import { Button } from '@/components/ui/button'
import { PageLoading } from '@/components/ui/loading'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { 
  Users, 
  Search,
  Crown,
  UserCheck
} from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

interface ProjectWithRole extends Project {
  member_role: string
  joined_at: string
}

export default function MyProjectsPage() {
  const { user } = useAuthStore()
  const [projects, setProjects] = useState<ProjectWithRole[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('all')

  const loadMyParticipatingProjects = async () => {
    if (!user) return

    try {
      const supabase = createClient()
      
      // 獲取用戶參與的所有專案（包含創建的和加入的）
      const { data, error } = await supabase
        .from('project_members')
        .select(`
          role,
          joined_at,
          project:projects!project_id(
            *,
            creator:users!creator_id(
              id,
              name,
              avatar_url
            )
          )
        `)
        .eq('user_id', user.id)
        .order('joined_at', { ascending: false })

      if (error) {
        console.error('載入參與的專案失敗:', error)
        toast.error('載入失敗', {
          description: '請檢查網路連線或稍後再試',
        })
        return
      }

      // 轉換數據格式
      const projectsWithRole = (data as Array<{
        role: string
        joined_at: string
        project: Project
      }>)?.map(item => ({
        ...item.project,
        member_role: item.role,
        joined_at: item.joined_at
      })).filter(project => project.id) || []

      setProjects(projectsWithRole as ProjectWithRole[])
    } catch (error) {
      console.error('載入參與的專案時發生錯誤:', error)
      toast.error('系統錯誤', {
        description: '發生未預期的錯誤，請稍後再試',
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadMyParticipatingProjects()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  const filteredProjects = projects.filter(project => {
    if (activeTab === 'all') return true
    if (activeTab === 'created') return project.member_role === 'creator'
    if (activeTab === 'joined') return project.member_role !== 'creator'
    return true
  })

  const getStats = () => {
    return {
      all: projects.length,
      created: projects.filter(p => p.member_role === 'creator').length,
      joined: projects.filter(p => p.member_role !== 'creator').length,
    }
  }

  const stats = getStats()

  if (loading) {
    return (
      <ProtectedRoute>
        <PageLoading />
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <div className="space-y-6">
        {/* 頁面標題 */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold">我參與的專案</h1>
            <p className="text-muted-foreground">管理你創建和參與的所有創業專案</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link href="/projects">
                <Search className="h-4 w-4 mr-2" />
                瀏覽專案
              </Link>
            </Button>
            <Button asChild>
              <Link href="/projects/create">
                <Users className="h-4 w-4 mr-2" />
                創建專案
              </Link>
            </Button>
          </div>
        </div>

        {/* 統計卡片 */}
        <div className="grid gap-4 md:grid-cols-3">
          <div className="bg-card p-4 rounded-lg border">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-muted-foreground" />
              <div className="text-2xl font-bold">{stats.all}</div>
            </div>
            <div className="text-sm text-muted-foreground">總參與專案</div>
          </div>
          <div className="bg-card p-4 rounded-lg border">
            <div className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-yellow-600" />
              <div className="text-2xl font-bold">{stats.created}</div>
            </div>
            <div className="text-sm text-muted-foreground">我創建的</div>
          </div>
          <div className="bg-card p-4 rounded-lg border">
            <div className="flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-blue-600" />
              <div className="text-2xl font-bold">{stats.joined}</div>
            </div>
            <div className="text-sm text-muted-foreground">我加入的</div>
          </div>
        </div>

        {/* 專案列表 */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="all">全部 ({stats.all})</TabsTrigger>
            <TabsTrigger value="created">我創建的 ({stats.created})</TabsTrigger>
            <TabsTrigger value="joined">我加入的 ({stats.joined})</TabsTrigger>
          </TabsList>
          
          <TabsContent value={activeTab} className="mt-6">
            {filteredProjects.length === 0 ? (
              <div className="bg-muted/50 p-8 rounded-lg text-center space-y-4">
                <Users className="h-16 w-16 mx-auto text-muted-foreground" />
                <div className="space-y-2">
                  <p className="text-lg font-medium">
                    {activeTab === 'all' ? '還沒有參與任何專案' : 
                     activeTab === 'created' ? '還沒有創建任何專案' : 
                     '還沒有加入任何專案'}
                  </p>
                  <p className="text-muted-foreground">
                    {activeTab === 'created' 
                      ? '開始創建您的第一個創業專案'
                      : '瀏覽專案並申請加入您感興趣的創業團隊'
                    }
                  </p>
                </div>
                <div className="flex gap-2 justify-center">
                  {activeTab !== 'joined' && (
                    <Button asChild>
                      <Link href="/projects/create">
                        <Users className="h-4 w-4 mr-2" />
                        創建專案
                      </Link>
                    </Button>
                  )}
                  <Button variant="outline" asChild>
                    <Link href="/projects">
                      <Search className="h-4 w-4 mr-2" />
                      瀏覽專案
                    </Link>
                  </Button>
                </div>
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filteredProjects.map((project) => (
                  <div key={project.id} className="relative">
                    <ProjectCard project={project} />
                    {/* 角色標認 */}
                    <div className="absolute top-2 right-2">
                      <Badge 
                        variant={project.member_role === 'creator' ? 'default' : 'secondary'}
                        className="text-xs flex items-center gap-1"
                      >
                        {project.member_role === 'creator' ? (
                          <>
                            <Crown className="h-3 w-3" />
                            創建者
                          </>
                        ) : (
                          <>
                            <UserCheck className="h-3 w-3" />
                            {project.member_role === 'member' ? '成員' : project.member_role}
                          </>
                        )}
                      </Badge>
                    </div>
                    {/* 加入時間 */}
                    {/* <div className="absolute top-2 right-2">
                      <Badge variant="outline" className="text-xs">
                        {new Date(project.joined_at).toLocaleDateString('zh-TW')}
                      </Badge>
                    </div> */}
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </ProtectedRoute>
  )
}