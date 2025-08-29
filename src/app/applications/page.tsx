'use client'

import { useState, useEffect } from 'react'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { useAuthStore } from '@/stores/auth'
import { createClient } from '@/lib/supabase/browser'
import { Application } from '@/types'
import { SentApplicationCard } from '@/components/applications/SentApplicationCard'
import { ReceivedApplicationCard } from '@/components/applications/ReceivedApplicationCard'
import { Button } from '@/components/ui/button'
import { PageLoading } from '@/components/ui/loading'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  ClipboardList, 
  Send,
  Inbox,
  Clock, 
  CheckCircle, 
  XCircle,
  Search
} from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

export default function ApplicationsPage() {
  const { user } = useAuthStore()
  const [sentApplications, setSentApplications] = useState<Application[]>([])
  const [receivedApplications, setReceivedApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('sent')

  const loadSentApplications = async () => {
    if (!user) return

    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('applications')
        .select(`
          *,
          project:projects!project_id(
            id,
            title,
            description,
            project_stage,
            creator:users!creator_id(
              id,
              name,
              avatar_url
            )
          )
        `)
        .eq('applicant_id', user.id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('載入發出的申請失敗:', error)
        toast.error('載入發出的申請失敗')
        return
      }

      setSentApplications(data || [])
    } catch (error) {
      console.error('載入發出的申請時發生錯誤:', error)
      toast.error('系統錯誤')
    }
  }

  const loadReceivedApplications = async () => {
    if (!user) return

    try {
      const supabase = createClient()
      
      // 首先獲取用戶創建的專案 ID 列表
      const { data: projects, error: projectsError } = await supabase
        .from('projects')
        .select('id')
        .eq('creator_id', user.id)

      if (projectsError) {
        console.error('載入用戶專案失敗:', projectsError)
        toast.error('載入收到的申請失敗')
        return
      }

      const projectIds = projects?.map(p => p.id) || []
      
      if (projectIds.length === 0) {
        setReceivedApplications([])
        return
      }

      // 然後根據專案 ID 獲取申請
      const { data, error } = await supabase
        .from('applications')
        .select(`
          *,
          project:projects!project_id(
            id,
            title,
            description,
            project_stage
          ),
          applicant:users!applicant_id(
            id,
            name,
            avatar_url,
            skills,
            work_mode,
            location_preference
          )
        `)
        .in('project_id', projectIds)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('載入收到的申請失敗:', error)
        toast.error('載入收到的申請失敗')
        return
      }

      setReceivedApplications(data || [])
    } catch (error) {
      console.error('載入收到的申請時發生錯誤:', error)
      toast.error('系統錯誤')
    }
  }

  const loadApplications = async () => {
    setLoading(true)
    await Promise.all([
      loadSentApplications(),
      loadReceivedApplications()
    ])
    setLoading(false)
  }

  useEffect(() => {
    loadApplications()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  const getSentStats = () => {
    return {
      total: sentApplications.length,
      pending: sentApplications.filter(app => app.status === 'pending').length,
      accepted: sentApplications.filter(app => app.status === 'accepted').length,
      rejected: sentApplications.filter(app => app.status === 'rejected').length,
    }
  }

  const getReceivedStats = () => {
    return {
      total: receivedApplications.length,
      pending: receivedApplications.filter(app => app.status === 'pending').length,
      accepted: receivedApplications.filter(app => app.status === 'accepted').length,
      rejected: receivedApplications.filter(app => app.status === 'rejected').length,
    }
  }

  const sentStats = getSentStats()
  const receivedStats = getReceivedStats()

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
            <h1 className="text-3xl font-bold">申請狀態</h1>
            <p className="text-muted-foreground">管理你的申請和收到的申請</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link href="/talents">
                <Search className="h-4 w-4 mr-2" />
                尋找夥伴
              </Link>
            </Button>
            <Button asChild>
              <Link href="/projects">
                <Search className="h-4 w-4 mr-2" />
                瀏覽專案
              </Link>
            </Button>
          </div>
        </div>

        {/* 統計卡片 */}
        <div className="grid gap-4 md:grid-cols-4">
          <div className="bg-card p-4 rounded-lg border">
            <div className="flex items-center gap-2">
              <Send className="h-5 w-5 text-blue-600" />
              <div className="text-2xl font-bold">{sentStats.total}</div>
            </div>
            <div className="text-sm text-muted-foreground">發出申請</div>
          </div>
          <div className="bg-card p-4 rounded-lg border">
            <div className="flex items-center gap-2">
              <Inbox className="h-5 w-5 text-green-600" />
              <div className="text-2xl font-bold">{receivedStats.total}</div>
            </div>
            <div className="text-sm text-muted-foreground">收到申請</div>
          </div>
          <div className="bg-card p-4 rounded-lg border">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-yellow-600" />
              <div className="text-2xl font-bold">{receivedStats.pending}</div>
            </div>
            <div className="text-sm text-muted-foreground">待處理</div>
          </div>
          <div className="bg-card p-4 rounded-lg border">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div className="text-2xl font-bold">{sentStats.accepted + receivedStats.accepted}</div>
            </div>
            <div className="text-sm text-muted-foreground">成功申請</div>
          </div>
        </div>

        {/* 申請列表 */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="sent" className="gap-2">
              <Send className="h-4 w-4" />
              我發出的申請 ({sentStats.total})
            </TabsTrigger>
            <TabsTrigger value="received" className="gap-2">
              <Inbox className="h-4 w-4" />
              收到的申請 ({receivedStats.total})
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="sent" className="mt-6">
            {sentApplications.length === 0 ? (
              <div className="bg-muted/50 p-8 rounded-lg text-center space-y-4">
                <Send className="h-16 w-16 mx-auto text-muted-foreground" />
                <div className="space-y-2">
                  <p className="text-lg font-medium">還沒有申請紀錄</p>
                  <p className="text-muted-foreground">
                    開始瀏覽專案並申請加入心儀的創業團隊
                  </p>
                </div>
                <div className="flex gap-2 justify-center">
                  <Button asChild>
                    <Link href="/projects">
                      <Search className="h-4 w-4 mr-2" />
                      瀏覽專案
                    </Link>
                  </Button>
                  <Button variant="outline" asChild>
                    <Link href="/profile">
                      完善個人資料
                    </Link>
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {sentApplications.map((application) => (
                  <SentApplicationCard
                    key={application.id}
                    application={application}
                    onUpdate={loadApplications}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="received" className="mt-6">
            {receivedApplications.length === 0 ? (
              <div className="bg-muted/50 p-8 rounded-lg text-center space-y-4">
                <Inbox className="h-16 w-16 mx-auto text-muted-foreground" />
                <div className="space-y-2">
                  <p className="text-lg font-medium">沒有收到任何申請</p>
                  <p className="text-muted-foreground">
                    創建有吸引力的專案，吸引更多人才申請加入
                  </p>
                </div>
                <div className="flex gap-2 justify-center">
                  <Button asChild>
                    <Link href="/projects/create">
                      創建專案
                    </Link>
                  </Button>
                  <Button variant="outline" asChild>
                    <Link href="/projects/manage">
                      管理專案
                    </Link>
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {receivedApplications.map((application) => (
                  <ReceivedApplicationCard
                    key={application.id}
                    application={application}
                    onUpdate={loadApplications}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </ProtectedRoute>
  )
}