'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Invitation } from '@/types'
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
  Calendar, 
  Clock,
  CheckCircle,
  XCircle,
  ExternalLink,
  User as UserIcon,
  MessageSquare,
  Trash2
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/browser'
import { useAuthStore } from '@/stores/auth'
import { toast } from 'sonner'
import dayjs from 'dayjs'
import 'dayjs/locale/zh-tw'

interface SentInvitationCardProps {
  invitation: Invitation
  onUpdate?: () => void
}

const statusConfig = {
  pending: {
    label: '待回應',
    icon: Clock,
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    bgColor: 'bg-yellow-50'
  },
  accepted: {
    label: '已接受',
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

export function SentInvitationCard({ invitation, onUpdate }: SentInvitationCardProps) {
  const { user } = useAuthStore()
  const [showWithdrawDialog, setShowWithdrawDialog] = useState(false)
  const [withdrawing, setWithdrawing] = useState(false)

  const status = statusConfig[invitation.status as keyof typeof statusConfig]
  const StatusIcon = status.icon

  const formatDate = (dateString: string) => {
    try {
      return dayjs(dateString).locale('zh-tw').format('YYYY年MM月DD日 HH:mm')
    } catch {
      return dateString
    }
  }

  const handleWithdrawInvitation = async () => {
    if (!user) return

    try {
      setWithdrawing(true)
      const supabase = createClient()
      
      const { error } = await supabase
        .from('invitations')
        .delete()
        .eq('id', invitation.id)
        .eq('inviter_id', user.id)
        .eq('status', 'pending')

      if (error) {
        console.error('撤回邀請失敗:', error)
        toast.error('撤回邀請失敗', {
          description: '請稍後再試或檢查網路連線',
        })
        return
      }

      toast.success('邀請已撤回', {
        description: `已成功撤回對 ${invitation.invitee?.name} 的邀請`,
      })

      setShowWithdrawDialog(false)
      onUpdate?.()
    } catch (error) {
      console.error('撤回邀請時發生錯誤:', error)
      toast.error('系統錯誤', {
        description: '發生未預期的錯誤，請稍後再試',
      })
    } finally {
      setWithdrawing(false)
    }
  }

  return (
    <>
      <Card className={cn("transition-all duration-200 hover:shadow-md", status.bgColor)}>
        <CardHeader className="pb-3">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-3">
              <Avatar className="w-12 h-12">
                <AvatarImage 
                  src={invitation.invitee?.avatar_url} 
                  alt={invitation.invitee?.name}
                />
                <AvatarFallback>
                  {invitation.invitee?.name?.charAt(0) || <UserIcon className="w-6 h-6" />}
                </AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-lg">{invitation.invitee?.name || '未知用戶'}</CardTitle>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  <span>{formatDate(invitation.created_at)}</span>
                </div>
              </div>
            </div>
            
            <Badge className={cn("px-2 py-1 text-xs border", status.color)}>
              <StatusIcon className="w-3 h-3 mr-1" />
              {status.label}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* 專案資訊 */}
          <div className="bg-background/50 p-3 rounded-lg">
            <div className="flex justify-between items-start mb-2">
              <h4 className="font-medium">邀請加入專案</h4>
              <Badge variant="secondary" className="text-xs">
                {invitation.project?.project_stage === 'idea' ? '構想階段' :
                 invitation.project?.project_stage === 'prototype' ? '原型開發' :
                 invitation.project?.project_stage === 'beta' ? '測試階段' : '已上線'}
              </Badge>
            </div>
            <h5 className="font-medium text-primary mb-1">{invitation.project?.title}</h5>
            <p className="text-sm text-muted-foreground line-clamp-2">
              {invitation.project?.description}
            </p>
          </div>

          {/* 邀請訊息 */}
          {invitation.message && (
            <div className="bg-muted/30 p-3 rounded-lg">
              <div className="flex items-center gap-1 mb-2">
                <MessageSquare className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium text-muted-foreground">邀請訊息</span>
              </div>
              <p className="text-sm">{invitation.message}</p>
            </div>
          )}

          {/* 回應訊息 */}
          {invitation.response_message && invitation.status !== 'pending' && (
            <div className="bg-muted/30 p-3 rounded-lg">
              <div className="flex items-center gap-1 mb-2">
                <StatusIcon className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium text-muted-foreground">
                  {invitation.status === 'accepted' ? '接受回應' : '拒絕原因'}
                </span>
              </div>
              <p className="text-sm">{invitation.response_message}</p>
            </div>
          )}

          <Separator />

          {/* 操作按鈕 */}
          <div className="flex gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href={`/talents/${invitation.invitee_id}`}>
                <ExternalLink className="w-4 h-4 mr-2" />
                查看資料
              </Link>
            </Button>
            
            <Button variant="outline" size="sm" asChild>
              <Link href={`/projects/${invitation.project_id}`}>
                <ExternalLink className="w-4 h-4 mr-2" />
                查看專案
              </Link>
            </Button>

            {invitation.status === 'pending' && (
              <Button 
                variant="destructive" 
                size="sm"
                onClick={() => setShowWithdrawDialog(true)}
                className="ml-auto"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                撤回邀請
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 撤回邀請確認對話框 */}
      <Dialog open={showWithdrawDialog} onOpenChange={setShowWithdrawDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>確認撤回邀請</DialogTitle>
            <DialogDescription>
              你確定要撤回對 <strong>{invitation.invitee?.name}</strong> 的專案邀請嗎？
              撤回後將無法恢復。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setShowWithdrawDialog(false)}
              disabled={withdrawing}
            >
              取消
            </Button>
            <Button
              variant="destructive"
              onClick={handleWithdrawInvitation}
              disabled={withdrawing}
            >
              {withdrawing ? '撤回中...' : '確認撤回'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}