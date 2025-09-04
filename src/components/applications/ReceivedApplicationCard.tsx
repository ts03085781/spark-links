'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Application } from '@/types'
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
  MessageSquare,
  ExternalLink,
  User as UserIcon,
  MapPin,
  Briefcase
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/browser'
import { useAuthStore } from '@/stores/auth'
import { toast } from 'sonner'
import dayjs from 'dayjs'
import 'dayjs/locale/zh-tw'

interface ReceivedApplicationCardProps {
  application: Application
  onUpdate?: () => void
}

const statusConfig = {
  pending: {
    label: '待處理',
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

export function ReceivedApplicationCard({ application, onUpdate }: ReceivedApplicationCardProps) {
  const { user } = useAuthStore()
  const [showRejectDialog, setShowRejectDialog] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [processing, setProcessing] = useState(false)

  const status = statusConfig[application.status as keyof typeof statusConfig]
  const StatusIcon = status.icon

  const formatDate = (dateString: string) => {
    try {
      return dayjs(dateString).locale('zh-tw').format('YYYY年MM月DD日 HH:mm')
    } catch {
      return dateString
    }
  }

  const handleAcceptApplication = async () => {
    if (!user) return

    try {
      setProcessing(true)
      const supabase = createClient()
      
      // 開始交易：同時更新申請狀態和加入專案成員
      const { error: applicationError } = await supabase
        .from('applications')
        .update({
          status: 'accepted',
          response_message: '恭喜！你的申請已通過，歡迎加入我們的專案！',
          updated_at: new Date().toISOString()
        } as never)
        .eq('id', application.id)
        .eq('status', 'pending')

      if (applicationError) {
        console.error('接受申請失敗:', applicationError)
        toast.error('接受申請失敗', {
          description: '請稍後再試或檢查網路連線',
        })
        return
      }

      // 將申請者加入專案成員
      const { error: memberError } = await supabase
        .from('project_members')
        .insert({
          project_id: application.project_id,
          user_id: application.applicant_id,
          role: 'member'
        } as never)

      if (memberError) {
        console.error('加入專案成員失敗:', memberError)
        // 如果加入成員失敗，嘗試回滾申請狀態
        await supabase
          .from('applications')
          .update({ status: 'pending' } as never)
          .eq('id', application.id)
        
        toast.error('加入專案失敗', {
          description: '申請者可能已經是專案成員或專案已滿',
        })
        return
      }

      // 更新專案的當前團隊人數
      const { error: projectError } = await supabase
        .rpc('increment_team_size', { project_id: application.project_id } as never)

      if (projectError) {
        console.error('更新專案團隊人數失敗:', projectError)
        // 不需要回滾，因為這不是關鍵錯誤
      }

      toast.success('申請已通過！', {
        description: `${application.applicant?.name} 已成功加入專案`,
      })

      onUpdate?.()
    } catch (error) {
      console.error('接受申請時發生錯誤:', error)
      toast.error('系統錯誤', {
        description: '發生未預期的錯誤，請稍後再試',
      })
    } finally {
      setProcessing(false)
    }
  }

  const handleRejectApplication = async () => {
    if (!user || !rejectReason.trim()) {
      toast.error('請填寫拒絕原因')
      return
    }

    try {
      setProcessing(true)
      const supabase = createClient()
      
      const { error } = await supabase
        .from('applications')
        .update({
          status: 'rejected',
          response_message: rejectReason.trim(),
          updated_at: new Date().toISOString()
        } as never)
        .eq('id', application.id)
        .eq('status', 'pending')

      if (error) {
        console.error('拒絕申請失敗:', error)
        toast.error('拒絕申請失敗', {
          description: '請稍後再試或檢查網路連線',
        })
        return
      }

      toast.success('申請已拒絕', {
        description: '已成功回應申請',
      })

      setShowRejectDialog(false)
      setRejectReason('')
      onUpdate?.()
    } catch (error) {
      console.error('拒絕申請時發生錯誤:', error)
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
                  src={application.applicant?.avatar_url} 
                  alt={application.applicant?.name}
                />
                <AvatarFallback>
                  {application.applicant?.name?.charAt(0) || <UserIcon className="w-6 h-6" />}
                </AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-lg">{application.applicant?.name || '匿名申請者'}</CardTitle>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  <span>{formatDate(application.created_at)}</span>
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
          {/* 申請者基本資訊 */}
          <div className="bg-background/50 p-3 rounded-lg">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-muted-foreground" />
                <span>{application.applicant?.work_mode === 'fulltime' ? '全職' : '兼職'}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-muted-foreground" />
                <span>
                  {application.applicant?.location_preference === 'remote' 
                    ? '遠端' 
                    : '實地工作'}
                </span>
              </div>
            </div>
            {/* 技能標籤 */}
            {application.applicant?.skills && application.applicant.skills.length > 0 && (
              <div className="mt-3">
                <div className="text-xs font-medium text-muted-foreground mb-2">技能專長</div>
                <div className="flex flex-wrap gap-1">
                  {application.applicant.skills.slice(0, 6).map((skill, index) => (
                    <Badge key={index} variant="outline" className="text-xs px-2 py-0">
                      {skill}
                    </Badge>
                  ))}
                  {application.applicant.skills.length > 6 && (
                    <Badge variant="outline" className="text-xs px-2 py-0">
                      +{application.applicant.skills.length - 6}
                    </Badge>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* 申請訊息 */}
          {application.message && (
            <div className="bg-muted/30 p-3 rounded-lg">
              <div className="flex items-center gap-1 mb-2">
                <MessageSquare className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium text-muted-foreground">申請訊息</span>
              </div>
              <p className="text-sm">{application.message}</p>
            </div>
          )}

          {/* 回應訊息（如果已回應） */}
          {application.response_message && application.status !== 'pending' && (
            <div className="bg-muted/30 p-3 rounded-lg">
              <div className="flex items-center gap-1 mb-2">
                <StatusIcon className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium text-muted-foreground">我的回應</span>
              </div>
              <p className="text-sm">{application.response_message}</p>
            </div>
          )}

          <Separator />

          {/* 操作按鈕 */}
          <div className="flex gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href={`/talents/${application.applicant_id}`}>
                <ExternalLink className="w-4 h-4 mr-2" />
                查看申請者
              </Link>
            </Button>
            
            <Button variant="outline" size="sm" asChild>
              <Link href={`/projects/${application.project_id}`}>
                <ExternalLink className="w-4 h-4 mr-2" />
                查看專案
              </Link>
            </Button>

            {application.status === 'pending' && (
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
                  onClick={handleAcceptApplication}
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

      {/* 拒絕申請對話框 */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>拒絕專案申請</DialogTitle>
            <DialogDescription>
              請告訴 <strong>{application.applicant?.name}</strong> 你拒絕申請的原因，
              這有助於他們改善申請或尋找更適合的專案。
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
              onClick={handleRejectApplication}
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