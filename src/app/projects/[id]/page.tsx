'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/auth'
import { createClient } from '@/lib/supabase/browser'
import { Project, ProjectMember } from '@/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { PageLoading } from '@/components/ui/loading'
import { 
  Users, 
  Calendar, 
  Target,
  Settings,
  UserPlus,
  ArrowLeft
} from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

const stageLabels = {
  idea: '構想階段',
  prototype: '原型開發', 
  beta: '測試階段',
  launched: '已上線'
}

const stageColors = {
  idea: 'bg-blue-100 text-blue-800',
  prototype: 'bg-orange-100 text-orange-800',
  beta: 'bg-purple-100 text-purple-800', 
  launched: 'bg-green-100 text-green-800'
}

export default function ProjectDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user, isAuthenticated } = useAuthStore()
  const [project, setProject] = useState<Project | null>(null)
  const [teamMembers, setTeamMembers] = useState<ProjectMember[]>([])
  const [loading, setLoading] = useState(true)
  const [isApplying, setIsApplying] = useState(false)

  const projectId = params.id as string

  const loadProject = async () => {
    try {
      const supabase = createClient()
      
      // 載入專案詳情
      const { data: projectData, error: projectError } = await supabase
        .from('projects')
        .select(`
          *,
          creator:users!creator_id(
            id,
            name,
            avatar_url,
            skills,
            experience_description
          )
        `)
        .eq('id', projectId)
        .single()

      if (projectError) {
        console.error('載入專案失敗:', projectError)
        toast.error('載入專案失敗', {
          description: '找不到指定的專案',
        })
        router.push('/projects')
        return
      }

      // 載入團隊成員
      const { data: membersData, error: membersError } = await supabase
        .from('project_members')
        .select(`
          *,
          user:users!user_id(
            id,
            name,
            avatar_url,
            skills
          )
        `)
        .eq('project_id', projectId)
        .order('joined_at', { ascending: true })

      if (membersError) {
        console.error('載入團隊成員失敗:', membersError)
      } else {
        setTeamMembers(membersData || [])
      }

      setProject(projectData)
    } catch (error) {
      console.error('載入專案時發生錯誤:', error)
      toast.error('系統錯誤', {
        description: '發生未預期的錯誤，請稍後再試',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleApply = async () => {
    if (!user || !project) return

    setIsApplying(true)
    try {
      const supabase = createClient()
      
      // 檢查是否已經申請過
      const { data: existingApplication } = await supabase
        .from('applications')
        .select('id')
        .eq('project_id', project.id)
        .eq('applicant_id', user.id)
        .single()

      if (existingApplication) {
        toast.warning('您已經申請過此專案')
        return
      }

      // 檢查是否已經是成員
      const isMember = teamMembers.some(member => member.user_id === user.id)
      if (isMember) {
        toast.info('您已經是此專案的成員')
        return
      }

      // 創建申請
      const { error } = await supabase
        .from('applications')
        .insert([{
          project_id: project.id,
          applicant_id: user.id,
          message: `我想加入「${project.title}」專案！`
        }])

      if (error) {
        console.error('申請加入失敗:', error)
        toast.error('申請失敗', {
          description: '請檢查網路連線或稍後再試',
        })
        return
      }

      toast.success('申請已發送！', {
        description: '專案創建者會收到您的申請，請耐心等待回覆',
      })
    } catch (error) {
      console.error('申請加入時發生錯誤:', error)
      toast.error('系統錯誤', {
        description: '發生未預期的錯誤，請稍後再試',
      })
    } finally {
      setIsApplying(false)
    }
  }

  useEffect(() => {
    if (projectId) {
      loadProject()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId])

  if (loading) {
    return <PageLoading />
  }

  if (!project) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">專案不存在或已被刪除</p>
        <Button asChild className="mt-4">
          <Link href="/projects">返回專案列表</Link>
        </Button>
      </div>
    )
  }

  const isCreator = user && project.creator_id === user.id
  const isMember = user && teamMembers.some(member => member.user_id === user.id)
  const canApply = isAuthenticated && !isCreator && !isMember && project.is_recruiting

  return (
    <div className="space-y-6">
      {/* 返回按鈕 */}
      <Button variant="ghost" asChild className="gap-2">
        <Link href="/projects">
          <ArrowLeft className="h-4 w-4" />
          返回專案列表
        </Link>
      </Button>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* 左側 - 專案主要信息 */}
        <div className="lg:col-span-2 space-y-6">
          {/* 專案標題和基本信息 */}
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div className="space-y-3">
                  <CardTitle className="text-2xl">{project.title}</CardTitle>
                  <div className="flex flex-wrap gap-2">
                    <Badge 
                      variant="secondary" 
                      className={`${stageColors[project.project_stage]}`}
                    >
                      {stageLabels[project.project_stage]}
                    </Badge>
                    {project.is_recruiting && (
                      <Badge variant="default" className="bg-green-600">
                        招募中
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  {canApply && (
                    <Button 
                      onClick={handleApply}
                      disabled={isApplying}
                      className="gap-2"
                    >
                      <UserPlus className="h-4 w-4" />
                      {isApplying ? '申請中...' : '申請加入'}
                    </Button>
                  )}
                  {isCreator && (
                    <Button variant="outline" className="gap-2" onClick={() => router.push(`/projects/${project.id}/edit`)}>
                      <Settings className="h-4 w-4" />
                      編輯專案
                    </Button>
                    
                  )}
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* 專案描述 */}
          <Card>
            <CardHeader>
              <CardTitle>專案描述</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed whitespace-pre-wrap">
                {project.description}
              </p>
            </CardContent>
          </Card>

          {/* 所需職位和技能 */}
          <div className="grid gap-6 md:grid-cols-2">
            {project.required_roles && project.required_roles.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Target className="h-5 w-5" />
                    所需職位
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {project.required_roles.map((role, index) => (
                      <Badge key={index} variant="default" className="px-3 py-1">
                        {role}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {project.required_skills && project.required_skills.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Settings className="h-5 w-5" />
                    所需技能
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {project.required_skills.map((skill, index) => (
                      <Badge key={index} variant="secondary" className="px-3 py-1">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* 右側 - 創建者和團隊信息 */}
        <div className="space-y-6">
          {/* 專案統計 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">專案資訊</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  團隊人數：{project.current_team_size}/{project.target_team_size}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  創建時間：{new Date(project.created_at).toLocaleDateString('zh-TW')}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* 專案創建者 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">專案創建者</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={project.creator?.avatar_url} />
                  <AvatarFallback>
                    {project.creator?.name?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="font-medium">{project.creator?.name}</p>
                  {project.creator?.skills && project.creator.skills.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {project.creator.skills.slice(0, 3).map((skill, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              {project.creator?.experience_description && (
                <>
                  <Separator className="my-3" />
                  <p className="text-xs text-muted-foreground line-clamp-3">
                    {project.creator.experience_description}
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          {/* 團隊成員 */}
          {teamMembers.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">團隊成員</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {teamMembers.map((member) => (
                  <div key={member.id} className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={member.user?.avatar_url} />
                      <AvatarFallback className="text-xs">
                        {member.user?.name?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {member.user?.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {member.role === 'creator' ? '創建者' : member.role}
                      </p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}