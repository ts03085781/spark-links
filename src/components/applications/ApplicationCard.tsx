'use client'

import Link from 'next/link'
import { Application } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { 
  Calendar, 
  Clock,
  CheckCircle,
  XCircle,
  MessageSquare,
  ExternalLink,
  Trash2
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/browser'
import { useAuthStore } from '@/stores/auth'
import { toast } from 'sonner'
import { useState } from 'react'

interface ApplicationCardProps {
  application: Application
  onUpdate?: () => void
}

const statusConfig = {
  pending: {
    label: '待審核',
    icon: Clock,
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    bgColor: 'bg-yellow-50'
  },
  accepted: {
    label: '已通過',
    icon: CheckCircle,
    color: 'bg-green-100 text-green-800 border-green-200',
    bgColor: 'bg-green-50'
  },
  rejected: {
    label: '已拒絕',
    icon: XCircle,
    color: 'bg-red-100 text-red-800 border-red-200',
    bgColor: 'bg-red-50'
  }
}

const stageLabels = {
  idea: '構想階段',
  prototype: '原型開發', 
  beta: '測試階段',
  launched: '已上線'
}

export function ApplicationCard({ application, onUpdate }: ApplicationCardProps) {
  const { user } = useAuthStore()
  const [isDeleting, setIsDeleting] = useState(false)
  
  const config = statusConfig[application.status]
  const Icon = config.icon

  const handleDeleteApplication = async () => {
    if (!user || application.status !== 'pending') return

    if (!confirm('確定要撤回此申請嗎？此操作無法復原。')) {
      return
    }

    setIsDeleting(true)
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('applications')
        .delete()
        .eq('id', application.id)
        .eq('applicant_id', user.id)

      if (error) {
        console.error('刪除申請失敗:', error)
        toast.error('撤回失敗', {
          description: '請稍後再試',
        })
        return
      }

      toast.success('申請已撤回')
      onUpdate?.()
    } catch (error) {
      console.error('刪除申請時發生錯誤:', error)
      toast.error('系統錯誤')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Card className={cn('transition-all duration-200', config.bgColor)}>
      <CardHeader>
        <div className="flex justify-between items-start gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <CardTitle className="text-lg truncate">
                {application.project?.title || '專案名稱'}
              </CardTitle>
              <Badge variant="secondary" className="text-xs flex-shrink-0">
                {stageLabels[application.project?.project_stage || 'idea']}
              </Badge>
            </div>
            
            <div className="flex items-center gap-3 mb-2">
              <div className={cn('flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border', config.color)}>
                <Icon className="h-3 w-3" />
                <span>{config.label}</span>
              </div>
              
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Calendar className="h-3 w-3" />
                <span>{new Date(application.created_at).toLocaleDateString('zh-TW')}</span>
              </div>
            </div>

                        {/* 專案描述預覽 */}
            {application.project?.description && (
                <div className="space-y-2">
                  <div className="text-base font-medium text-muted-foreground">專案描述:</div>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {application.project.description}
                  </p>
                </div>
            )}
            
          </div>
          
          <div className="flex items-center gap-2 flex-shrink-0">
            <Button
              variant="outline"
              size="sm"
              asChild
              className="h-8"
            >
              <Link href={`/projects/${application.project?.id}`}>
                <ExternalLink className="h-3 w-3 mr-1" />
                查看
              </Link>
            </Button>
            
            {application.status === 'pending' && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDeleteApplication}
                disabled={isDeleting}
                className="h-8 text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0 space-y-4">
        {/* 專案創建者信息 */}
        {/* <div className="flex items-center gap-2">
          <Avatar className="h-6 w-6">
            <AvatarImage src={application.project?.creator?.avatar_url} />
            <AvatarFallback className="text-xs">
              {application.project?.creator?.name?.charAt(0) || 'U'}
            </AvatarFallback>
          </Avatar>
          <span className="text-sm text-muted-foreground">
            專案創建者：{application.project?.creator?.name || '未知'}
          </span>
        </div> */}

        {/* 專案描述預覽 */}
        {/* {application.project?.description && (
          <>
            <div className="space-y-2">
              <div className="text-base font-medium text-muted-foreground">專案描述:</div>
              <p className="text-sm text-muted-foreground line-clamp-2">
                {application.project.description}
              </p>
            </div>
          </>
        )} */}

        <Separator />

        {/* 申請訊息 */}
        <div className="space-y-2">
          <div className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
            <MessageSquare className="h-3 w-3" />
            <span>申請訊息</span>
          </div>
          <div className="text-sm bg-background/50 p-3 rounded-lg border">
            {application.message}
          </div>
        </div>

        {/* 回覆訊息（如果有的話） */}
        {application.response_message && (
          <>
            <Separator />
            <div className="space-y-2">
              <div className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
                <MessageSquare className="h-3 w-3" />
                <span>回覆訊息</span>
              </div>
              <div className={cn(
                'text-sm p-3 rounded-lg border',
                application.status === 'accepted' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
              )}>
                {application.response_message}
              </div>
            </div>
          </>
        )}


      </CardContent>
    </Card>
  )
}