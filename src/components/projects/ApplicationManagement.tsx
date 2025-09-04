'use client'

import { useState, useEffect } from 'react'
import { useAuthStore } from '@/stores/auth'
import { createClient } from '@/lib/supabase/browser'
import { Application } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import { 
  Users,
  Clock,
  CheckCircle,
  XCircle,
  MessageSquare,
  User
} from 'lucide-react'
import { toast } from 'sonner'

interface ApplicationManagementProps {
  projectId: string
  isCreator: boolean
  onMemberChange?: () => void
}

export function ApplicationManagement({ 
  projectId, 
  isCreator, 
  onMemberChange 
}: ApplicationManagementProps) {
  const { user } = useAuthStore()
  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [responseMessages, setResponseMessages] = useState<{[key: string]: string}>({})

  const loadApplications = async () => {
    if (!user || !isCreator) return

    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('applications')
        .select(`
          *,
          applicant:users!applicant_id(
            id,
            name,
            avatar_url,
            skills,
            experience_description
          )
        `)
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('載入申請失敗:', error)
        return
      }

      setApplications(data || [])
    } catch (error) {
      console.error('載入申請時發生錯誤:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleApplicationResponse = async (
    applicationId: string, 
    status: 'accepted' | 'rejected'
  ) => {
    if (!user) return

    const responseMessage = responseMessages[applicationId]?.trim()
    if (!responseMessage) {
      toast.error('請輸入回覆訊息')
      return
    }

    setProcessingId(applicationId)
    try {
      const supabase = createClient()
      
      // 更新申請狀態
      const { error: updateError } = await supabase
        .from('applications')
        .update({
          status,
          response_message: responseMessage
        } as never)
        .eq('id', applicationId)

      if (updateError) {
        console.error('更新申請狀態失敗:', updateError)
        toast.error('操作失敗', {
          description: '請稍後再試',
        })
        return
      }

      // 如果接受申請，將申請者加入專案團隊
      if (status === 'accepted') {
        const application = applications.find(app => app.id === applicationId)
        if (application) {
          const { error: memberError } = await supabase
            .from('project_members')
            .insert([{
              project_id: projectId,
              user_id: application.applicant_id,
              role: 'member'
            } as never])

          if (memberError) {
            console.error('加入團隊失敗:', memberError)
            toast.error('加入團隊失敗', {
              description: '申請已通過但加入團隊時發生錯誤',
            })
            return
          }

          onMemberChange?.()
        }
      }

      toast.success(
        status === 'accepted' ? '申請已通過！' : '申請已拒絕',
        {
          description: status === 'accepted' 
            ? '申請者已加入專案團隊' 
            : '已發送拒絕通知給申請者',
        }
      )

      // 清除回覆訊息並重新載入
      setResponseMessages(prev => ({ ...prev, [applicationId]: '' }))
      loadApplications()
    } catch (error) {
      console.error('處理申請時發生錯誤:', error)
      toast.error('系統錯誤')
    } finally {
      setProcessingId(null)
    }
  }

  const handleResponseMessageChange = (applicationId: string, message: string) => {
    setResponseMessages(prev => ({ ...prev, [applicationId]: message }))
  }

  useEffect(() => {
    loadApplications()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, isCreator, user])

  if (!isCreator) {
    return null
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            申請管理
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <div className="text-sm text-muted-foreground">載入中...</div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const pendingApplications = applications.filter(app => app.status === 'pending')
  const processedApplications = applications.filter(app => app.status !== 'pending')

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          申請管理
          {pendingApplications.length > 0 && (
            <Badge variant="destructive" className="ml-2">
              {pendingApplications.length} 待處理
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {applications.length === 0 ? (
          <div className="text-center py-8">
            <Users className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
            <p className="text-muted-foreground">尚無申請</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* 待處理申請 */}
            {pendingApplications.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Clock className="h-4 w-4 text-yellow-600" />
                  待處理申請 ({pendingApplications.length})
                </div>
                {pendingApplications.map((application) => (
                  <Card key={application.id} className="bg-yellow-50 border-yellow-200">
                    <CardContent className="pt-4 space-y-4">
                      {/* 申請者信息 */}
                      <div className="flex items-start gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={application.applicant?.avatar_url} />
                          <AvatarFallback>
                            {application.applicant?.name?.charAt(0) || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium">{application.applicant?.name}</h4>
                            <Badge variant="outline" className="text-xs">
                              {new Date(application.created_at).toLocaleDateString('zh-TW')}
                            </Badge>
                          </div>
                          
                          {/* 申請者技能 */}
                          {application.applicant?.skills && application.applicant.skills.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {application.applicant.skills.slice(0, 5).map((skill, index) => (
                                <Badge key={index} variant="secondary" className="text-xs">
                                  {skill}
                                </Badge>
                              ))}
                            </div>
                          )}
                          
                          {/* 申請者經驗 */}
                          {application.applicant?.experience_description && (
                            <p className="text-xs text-muted-foreground line-clamp-2">
                              {application.applicant.experience_description}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* 申請訊息 */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
                          <MessageSquare className="h-3 w-3" />
                          申請訊息
                        </div>
                        <div className="text-sm bg-background p-3 rounded border">
                          {application.message}
                        </div>
                      </div>

                      {/* 回覆區域 */}
                      <div className="space-y-3">
                        <Textarea
                          placeholder="輸入回覆訊息..."
                          value={responseMessages[application.id] || ''}
                          onChange={(e) => handleResponseMessageChange(application.id, e.target.value)}
                          className="min-h-[80px]"
                        />
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleApplicationResponse(application.id, 'accepted')}
                            disabled={processingId === application.id || !responseMessages[application.id]?.trim()}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            {processingId === application.id ? '處理中...' : '通過'}
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleApplicationResponse(application.id, 'rejected')}
                            disabled={processingId === application.id || !responseMessages[application.id]?.trim()}
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            {processingId === application.id ? '處理中...' : '拒絕'}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* 已處理申請 */}
            {processedApplications.length > 0 && (
              <div className="space-y-4">
                {pendingApplications.length > 0 && <Separator />}
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <User className="h-4 w-4" />
                  已處理申請 ({processedApplications.length})
                </div>
                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {processedApplications.map((application) => (
                    <div key={application.id} className="flex items-center justify-between p-3 bg-muted/30 rounded border">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={application.applicant?.avatar_url} />
                          <AvatarFallback className="text-xs">
                            {application.applicant?.name?.charAt(0) || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm font-medium">{application.applicant?.name}</span>
                        <Badge 
                          variant={application.status === 'accepted' ? 'default' : 'destructive'}
                          className="text-xs"
                        >
                          {application.status === 'accepted' ? '已通過' : '已拒絕'}
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(application.updated_at).toLocaleDateString('zh-TW')}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}