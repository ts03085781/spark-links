'use client'

import { useState, useEffect } from 'react'
import { User, Project } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { 
  MapPin, 
  Briefcase, 
  Mail,
  MessageSquare,
  Globe,
  User as UserIcon,
  Target,
  Phone,
  ExternalLink,
  Plus,
  FolderOpen
} from 'lucide-react'
import { useAuthStore } from '@/stores/auth'
import { createClient } from '@/lib/supabase/browser'
import Link from 'next/link'
import { toast } from 'sonner'

interface TalentDetailProps {
  talent: User
}

export function TalentDetail({ talent }: TalentDetailProps) {
  const { user } = useAuthStore()
  const [myProjects, setMyProjects] = useState<Project[]>([])
  const [showInviteDialog, setShowInviteDialog] = useState(false)
  const [showNoProjectDialog, setShowNoProjectDialog] = useState(false)
  const [loading, setLoading] = useState(false)
  const [inviting, setInviting] = useState(false)

  const loadMyProjects = async () => {
    if (!user) return

    try {
      setLoading(true)
      const supabase = createClient()
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('creator_id', user.id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('載入我創建的專案失敗:', error)
        toast.error('載入專案失敗')
        return
      }

      return data

    } catch (error) {
      console.error('載入我創建的專案時發生錯誤:', error)
      toast.error('系統錯誤')
    } finally {
      setLoading(false)
    }
  }

  const handleInviteToProject = async () => {
    if (!user) {
      toast.error('請先登入')
      return
    }

    const data: Project[] = await loadMyProjects() || []
    setMyProjects(data || [])
    
    console.log('載入的專案數量:', myProjects.length)
    console.log('專案列表:', myProjects)
    
    if (data.length === 0) {
      setShowNoProjectDialog(true)
    } else {
      setShowInviteDialog(true)
    }
  }

  const handleSelectProject = async (project: Project) => {
    if (!user) return

    try {
      setInviting(true)
      const supabase = createClient()
      
      // 創建邀請記錄
      const { error } = await supabase
        .from('invitations')
        .insert({
          project_id: project.id,
          inviter_id: user.id,
          invitee_id: talent.id,
          message: `邀請您加入「${project.title}」專案`,
          status: 'pending'
        })

      if (error) {
        console.error('發送邀請失敗:', error)
        toast.error('發送邀請失敗', {
          description: '請稍後再試或檢查網路連線',
        })
        return
      }

      toast.success('邀請已發送！', {
        description: `已成功邀請 ${talent.name} 加入「${project.title}」專案`,
      })

      setShowInviteDialog(false)
    } catch (error) {
      console.error('發送邀請時發生錯誤:', error)
      toast.error('系統錯誤', {
        description: '發生未預期的錯誤，請稍後再試',
      })
    } finally {
      setInviting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* 基本資訊卡片 */}
      <Card>
        <CardHeader className="text-center pb-6">
          <div className="mx-auto w-32 h-32 mb-4">
            <Avatar className="w-32 h-32">
              <AvatarImage 
                src={talent.avatar_url} 
                alt={talent.name}
                className="object-cover"
              />
              <AvatarFallback className="text-2xl">
                {talent.name.charAt(0) || <UserIcon className="w-12 h-12" />}
              </AvatarFallback>
            </Avatar>
          </div>
          
          <CardTitle className="text-2xl">{talent.name || '匿名用戶'}</CardTitle>
          
          <div className="flex items-center justify-center gap-2">
            <Globe className="h-4 w-4 text-green-600" />
            <span className="text-sm text-green-600 font-medium">公開資料</span>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* 基本資訊 */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex items-center gap-3">
              <Briefcase className="h-5 w-5 text-muted-foreground flex-shrink-0" />
              <div>
                <div className="font-medium">工作模式</div>
                <div className="text-sm text-muted-foreground">
                  {talent.work_mode === 'fulltime' ? '全職' : '兼職'}
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <MapPin className="h-5 w-5 text-muted-foreground flex-shrink-0" />
              <div>
                <div className="font-medium">地點偏好</div>
                <div className="text-sm text-muted-foreground">
                  {talent.location_preference === 'remote' 
                    ? '遠端合作' 
                    : talent.specific_location || '特定地點'}
                </div>
              </div>
            </div>
            
            {talent.contact_info && (
              <div className="flex items-center gap-3 md:col-span-2">
                <Phone className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="font-medium">聯絡方式</div>
                  <div className="text-sm text-muted-foreground break-all">
                    {talent.contact_info}
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 技能專長 */}
      {talent.skills && talent.skills.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              技能專長
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {talent.skills.map((skill, index) => (
                <Badge 
                  key={index} 
                  variant="secondary" 
                  className="px-3 py-1.5 text-sm"
                >
                  {skill}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 工作經驗 */}
      {talent.experience_description && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="h-5 w-5" />
              工作經驗
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm max-w-none">
              <p className="whitespace-pre-wrap text-muted-foreground leading-relaxed">
                {talent.experience_description}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 理想夥伴 */}
      {talent.partner_description && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserIcon className="h-5 w-5" />
              尋找的創業夥伴
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm max-w-none">
              <p className="whitespace-pre-wrap text-muted-foreground leading-relaxed">
                {talent.partner_description}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 操作區域 */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <Button className="flex-1 gap-2">
              <MessageSquare className="h-4 w-4" />
              發送私訊
            </Button>
            <Button 
              variant="outline" 
              className="flex-1 gap-2"
              onClick={handleInviteToProject}
              disabled={loading}
            >
              <ExternalLink className="h-4 w-4" />
              邀請加入專案
            </Button>
          </div>
          <div className="mt-4 text-xs text-muted-foreground text-center">
            與 {talent.name} 合作，開始您的創業之旅
          </div>
        </CardContent>
      </Card>

      {/* 沒有專案的提示對話框 */}
      <Dialog open={showNoProjectDialog} onOpenChange={setShowNoProjectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              需要先創建專案
            </DialogTitle>
            <DialogDescription>
              您還沒有創建任何專案。要邀請 {talent.name} 加入專案，請先創建您的第一個創業專案。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setShowNoProjectDialog(false)}
            >
              取消
            </Button>
            <Button asChild>
              <Link href="/projects/create">
                <Plus className="h-4 w-4 mr-2" />
                創建專案
              </Link>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 選擇專案的對話框 */}
      <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              選擇您要邀請 {talent.name} 加入的專案。
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-3 max-h-96 overflow-y-auto pb-3">
            {myProjects.map((project) => (
              <Card 
                key={project.id} 
                className="cursor-pointer hover:shadow-md transition-shadow px-6"
                onClick={() => handleSelectProject(project)}
              >
                  <div className="space-y-2">
                    <div className="flex justify-between items-start">
                      <h4 className="font-medium text-lg">{project.title}</h4>
                      <Badge variant="secondary" className="text-xs">
                        {project.project_stage === 'idea' ? '構想階段' :
                         project.project_stage === 'prototype' ? '原型開發' :
                         project.project_stage === 'beta' ? '測試階段' : '已上線'}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {project.description}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>團隊人數: {project.current_team_size}/{project.target_team_size}</span>
                      <span>所需職位: {project.required_roles.length}</span>
                    </div>
                  </div>
              </Card>
            ))}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowInviteDialog(false)}
              disabled={inviting}
            >
              取消
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}