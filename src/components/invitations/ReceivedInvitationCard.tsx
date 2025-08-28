'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Invitation } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
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
  Crown
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/browser'
import { useAuthStore } from '@/stores/auth'
import { toast } from 'sonner'
import dayjs from 'dayjs'
import 'dayjs/locale/zh-tw'

interface ReceivedInvitationCardProps {
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

export function ReceivedInvitationCard({ invitation, onUpdate }: ReceivedInvitationCardProps) {
  const { user } = useAuthStore()
  const [showRejectDialog, setShowRejectDialog] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [processing, setProcessing] = useState(false)

  const status = statusConfig[invitation.status as keyof typeof statusConfig]
  const StatusIcon = status.icon

  const formatDate = (dateString: string) => {
    try {
      return dayjs(dateString).locale('zh-tw').format('YYYY年MM月DD日 HH:mm')
    } catch {
      return dateString
    }
  }

  const handleAcceptInvitation = async () => {
    if (!user) return

    try {
      setProcessing(true)
      const supabase = createClient()
      
      // 開始交易：同時更新邀請狀態和加入專案成員
      const { error: invitationError } = await supabase
        .from('invitations')
        .update({
          status: 'accepted',
          response_message: '感謝邀請，我很樂意加入這個專案！',
          updated_at: new Date().toISOString()
        })
        .eq('id', invitation.id)
        .eq('invitee_id', user.id)
        .eq('status', 'pending')

      if (invitationError) {
        console.error('接受邀請失敗:', invitationError)
        toast.error('接受邀請失敗', {
          description: '請稍後再試或檢查網路連線',
        })
        return
      }

      // 將用戶加入專案成員
      const { error: memberError } = await supabase
        .from('project_members')
        .insert({
          project_id: invitation.project_id,
          user_id: user.id,
          role: 'member'
        })

      if (memberError) {
        console.error('加入專案成員失敗:', memberError)
        // 如果加入成員失敗，嘗試回滾邀請狀態
        await supabase
          .from('invitations')
          .update({ status: 'pending' })
          .eq('id', invitation.id)
        
        toast.error('加入專案失敗', {
          description: '可能已經是專案成員或專案已滿',
        })
        return
      }

      // 更新專案的當前團隊人數
      const { error: projectError } = await supabase
        .rpc('increment_team_size', { project_id: invitation.project_id })

      if (projectError) {
        console.error('更新專案團隊人數失敗:', projectError)
        // 不需要回滾，因為這不是關鍵錯誤
      }

      toast.success('已接受邀請！', {
        description: `成功加入「${invitation.project?.title}」專案`,
      })

      onUpdate?.()
    } catch (error) {
      console.error('接受邀請時發生錯誤:', error)
      toast.error('系統錯誤', {
        description: '發生未預期的錯誤，請稍後再試',
      })
    } finally {
      setProcessing(false)
    }
  }

  const handleRejectInvitation = async () => {
    if (!user || !rejectReason.trim()) {
      toast.error('請填寫拒絕原因')
      return
    }

    try {
      setProcessing(true)
      const supabase = createClient()
      
      const { error } = await supabase
        .from('invitations')
        .update({
          status: 'rejected',
          response_message: rejectReason.trim(),
          updated_at: new Date().toISOString()
        })
        .eq('id', invitation.id)
        .eq('invitee_id', user.id)
        .eq('status', 'pending')

      if (error) {
        console.error('拒絕邀請失敗:', error)
        toast.error('拒絕邀請失敗', {
          description: '請稍後再試或檢查網路連線',
        })
        return
      }

      toast.success('已拒絕邀請', {
        description: '已成功拒絕專案邀請',
      })

      setShowRejectDialog(false)
      setRejectReason('')
      onUpdate?.()
    } catch (error) {
      console.error('拒絕邀請時發生錯誤:', error)
      toast.error('系統錯誤', {
        description: '發生未預期的錯誤，請稍後再試',
      })
    } finally {
      setProcessing(false)
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
                  src={invitation.inviter?.avatar_url} 
                  alt={invitation.inviter?.name}
                />
                <AvatarFallback>
                  {invitation.inviter?.name?.charAt(0) || <UserIcon className="w-6 h-6" />}
                </AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  {invitation.inviter?.name || '未知用戶'}
                  <Crown className="w-4 h-4 text-yellow-600" />
                </CardTitle>
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
              <h4 className="font-medium">邀請你加入專案</h4>
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

          {/* 回應訊息（如果已回應） */}
          {invitation.response_message && invitation.status !== 'pending' && (
            <div className="bg-muted/30 p-3 rounded-lg">
              <div className="flex items-center gap-1 mb-2">
                <StatusIcon className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium text-muted-foreground">我的回應</span>
              </div>
              <p className="text-sm">{invitation.response_message}</p>
            </div>
          )}

          <Separator />

          {/* 操作按鈕 */}
          <div className="flex gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href={`/talents/${invitation.inviter_id}`}>
                <ExternalLink className="w-4 h-4 mr-2" />
                查看邀請者
              </Link>
            </Button>
            
            <Button variant="outline" size="sm" asChild>
              <Link href={`/projects/${invitation.project_id}`}>
                <ExternalLink className="w-4 h-4 mr-2" />
                查看專案
              </Link>
            </Button>

            {invitation.status === 'pending' && (
              <div className="flex gap-2 ml-auto">
                <Button 
                  variant="destructive" 
                  size="sm"
                  onClick={() => setShowRejectDialog(true)}
                  disabled={processing}
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  拒絕
                </Button>
                <Button 
                  size="sm"
                  onClick={handleAcceptInvitation}
                  disabled={processing}
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  {processing ? '處理中...' : '接受'}
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 拒絕邀請對話框 */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>拒絕專案邀請</DialogTitle>
            <DialogDescription>
              請告訴 <strong>{invitation.inviter?.name}</strong> 你拒絕加入專案的原因，
              這有助於他們改善專案或尋找更適合的夥伴。
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">拒絕原因 *</label>
            <Textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="請簡單說明拒絕的原因..."
              className="min-h-[100px]"
            />
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowRejectDialog(false)
                setRejectReason('')
              }}
              disabled={processing}
            >
              取消
            </Button>
            <Button
              variant="destructive"
              onClick={handleRejectInvitation}
              disabled={processing || !rejectReason.trim()}
            >
              {processing ? '送出中...' : '確認拒絕'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}