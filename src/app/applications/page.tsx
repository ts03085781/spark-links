'use client'

import { useState, useEffect } from 'react'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { useAuthStore } from '@/stores/auth'
import { createClient } from '@/lib/supabase/browser'
import { Application } from '@/types'
import { ApplicationCard } from '@/components/applications/ApplicationCard'
import { Button } from '@/components/ui/button'
import { PageLoading } from '@/components/ui/loading'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  ClipboardList, 
  Clock, 
  CheckCircle, 
  XCircle,
  Search
} from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

export default function ApplicationsPage() {
  const { user } = useAuthStore()
  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('all')

  const loadApplications = async () => {
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
        console.error('載入申請狀態失敗:', error)
        toast.error('載入失敗', {
          description: '請檢查網路連線或稍後再試',
        })
        return
      }

      setApplications(data || [])
    } catch (error) {
      console.error('載入申請狀態時發生錯誤:', error)
      toast.error('系統錯誤', {
        description: '發生未預期的錯誤，請稍後再試',
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadApplications()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  const filteredApplications = applications.filter(app => {
    if (activeTab === 'all') return true
    return app.status === activeTab
  })

  const getStatusStats = () => {
    return {
      all: applications.length,
      pending: applications.filter(app => app.status === 'pending').length,
      accepted: applications.filter(app => app.status === 'accepted').length,
      rejected: applications.filter(app => app.status === 'rejected').length,
    }
  }

  const stats = getStatusStats()

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
            <p className="text-muted-foreground">查看和管理你的專案申請</p>
          </div>
          <Button asChild>
            <Link href="/projects">
              <Search className="h-4 w-4 mr-2" />
              瀏覽更多專案
            </Link>
          </Button>
        </div>

        {/* 統計卡片 */}
        <div className="grid gap-4 md:grid-cols-4">
          <div className="bg-card p-4 rounded-lg border">
            <div className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-muted-foreground" />
              <div className="text-2xl font-bold">{stats.all}</div>
            </div>
            <div className="text-sm text-muted-foreground">總申請數</div>
          </div>
          <div className="bg-card p-4 rounded-lg border">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-yellow-600" />
              <div className="text-2xl font-bold">{stats.pending}</div>
            </div>
            <div className="text-sm text-muted-foreground">待審核</div>
          </div>
          <div className="bg-card p-4 rounded-lg border">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div className="text-2xl font-bold">{stats.accepted}</div>
            </div>
            <div className="text-sm text-muted-foreground">已通過</div>
          </div>
          <div className="bg-card p-4 rounded-lg border">
            <div className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-600" />
              <div className="text-2xl font-bold">{stats.rejected}</div>
            </div>
            <div className="text-sm text-muted-foreground">已拒絕</div>
          </div>
        </div>

        {/* 申請列表 */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all">全部 ({stats.all})</TabsTrigger>
            <TabsTrigger value="pending">待審核 ({stats.pending})</TabsTrigger>
            <TabsTrigger value="accepted">已通過 ({stats.accepted})</TabsTrigger>
            <TabsTrigger value="rejected">已拒絕 ({stats.rejected})</TabsTrigger>
          </TabsList>
          
          <TabsContent value={activeTab} className="mt-6">
            {filteredApplications.length === 0 ? (
              <div className="bg-muted/50 p-8 rounded-lg text-center space-y-4">
                <ClipboardList className="h-16 w-16 mx-auto text-muted-foreground" />
                <div className="space-y-2">
                  <p className="text-lg font-medium">
                    {activeTab === 'all' ? '還沒有申請紀錄' : `沒有${activeTab === 'pending' ? '待審核' : activeTab === 'accepted' ? '已通過' : '已拒絕'}的申請`}
                  </p>
                  <p className="text-muted-foreground">
                    {activeTab === 'all' 
                      ? '開始瀏覽專案並申請加入心儀的創業團隊' 
                      : '切換到其他分類查看申請狀態'
                    }
                  </p>
                </div>
                {activeTab === 'all' && (
                  <Button asChild>
                    <Link href="/projects">
                      <Search className="h-4 w-4 mr-2" />
                      瀏覽專案
                    </Link>
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredApplications.map((application) => (
                  <ApplicationCard 
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