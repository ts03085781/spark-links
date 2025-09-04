'use client'

import { useState, useEffect } from 'react'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { useAuthStore } from '@/stores/auth'
import { createClient } from '@/lib/supabase/browser'
import { Invitation } from '@/types'
import { SentInvitationCard } from '@/components/invitations/SentInvitationCard'
import { ReceivedInvitationCard } from '@/components/invitations/ReceivedInvitationCard'
import { Button } from '@/components/ui/button'
import { PageLoading } from '@/components/ui/loading'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  UserPlus, 
  Send, 
  Inbox,
  Clock, 
  CheckCircle, 
  // XCircle,
  Search
} from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

export default function InvitationsPage() {
  const { user } = useAuthStore()
  const [sentInvitations, setSentInvitations] = useState<Invitation[]>([])
  const [receivedInvitations, setReceivedInvitations] = useState<Invitation[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('received')

  const loadSentInvitations = async () => {
    if (!user) return

    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('invitations')
        .select(`
          *,
          project:projects!project_id(
            id,
            title,
            description,
            project_stage
          ),
          invitee:users!invitee_id(
            id,
            name,
            avatar_url
          )
        `)
        .eq('inviter_id', user.id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('載入發出的邀請失敗:', error)
        toast.error('載入發出的邀請失敗')
        return
      }

      setSentInvitations(data || [])
    } catch (error) {
      console.error('載入發出的邀請時發生錯誤:', error)
      toast.error('系統錯誤')
    }
  }

  const loadReceivedInvitations = async () => {
    if (!user) return

    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('invitations')
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
          ),
          inviter:users!inviter_id(
            id,
            name,
            avatar_url
          )
        `)
        .eq('invitee_id', user.id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('載入收到的邀請失敗:', error)
        toast.error('載入收到的邀請失敗')
        return
      }

      setReceivedInvitations(data || [])
    } catch (error) {
      console.error('載入收到的邀請時發生錯誤:', error)
      toast.error('系統錯誤')
    }
  }

  const loadInvitations = async () => {
    setLoading(true)
    await Promise.all([
      loadSentInvitations(),
      loadReceivedInvitations()
    ])
    setLoading(false)
  }

  useEffect(() => {
    loadInvitations()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  const getSentStats = () => {
    return {
      total: sentInvitations.length,
      pending: sentInvitations.filter(inv => inv.status === 'pending').length,
      accepted: sentInvitations.filter(inv => inv.status === 'accepted').length,
      rejected: sentInvitations.filter(inv => inv.status === 'rejected').length,
    }
  }

  const getReceivedStats = () => {
    return {
      total: receivedInvitations.length,
      pending: receivedInvitations.filter(inv => inv.status === 'pending').length,
      accepted: receivedInvitations.filter(inv => inv.status === 'accepted').length,
      rejected: receivedInvitations.filter(inv => inv.status === 'rejected').length,
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
            <h1 className="text-3xl font-bold">邀請狀態</h1>
            <p className="text-muted-foreground">管理你的邀請和被邀請狀態</p>
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
                <UserPlus className="h-4 w-4 mr-2" />
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
            <div className="text-sm text-muted-foreground">發出邀請</div>
          </div>
          <div className="bg-card p-4 rounded-lg border">
            <div className="flex items-center gap-2">
              <Inbox className="h-5 w-5 text-green-600" />
              <div className="text-2xl font-bold">{receivedStats.total}</div>
            </div>
            <div className="text-sm text-muted-foreground">收到邀請</div>
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
            <div className="text-sm text-muted-foreground">成功邀請</div>
          </div>
        </div>

        {/* 邀請列表 */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="received" className="gap-2">
              <Inbox className="h-4 w-4" />
              收到的邀請 ({receivedStats.total})
            </TabsTrigger>
            <TabsTrigger value="sent" className="gap-2">
              <Send className="h-4 w-4" />
              發出的邀請 ({sentStats.total})
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="received" className="mt-6">
            {receivedInvitations.length === 0 ? (
              <div className="bg-muted/50 p-8 rounded-lg text-center space-y-4">
                <Inbox className="h-16 w-16 mx-auto text-muted-foreground" />
                <div className="space-y-2">
                  <p className="text-lg font-medium">沒有收到任何邀請</p>
                  <p className="text-muted-foreground">
                    完善你的個人資料，讓更多創業者找到並邀請你
                  </p>
                </div>
                <div className="flex gap-2 justify-center">
                  <Button asChild>
                    <Link href="/profile">
                      完善個人資料
                    </Link>
                  </Button>
                  <Button variant="outline" asChild>
                    <Link href="/talents">
                      尋找夥伴
                    </Link>
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {receivedInvitations.map((invitation) => (
                  <ReceivedInvitationCard
                    key={invitation.id}
                    invitation={invitation}
                    onUpdate={loadInvitations}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="sent" className="mt-6">
            {sentInvitations.length === 0 ? (
              <div className="bg-muted/50 p-8 rounded-lg text-center space-y-4">
                <Send className="h-16 w-16 mx-auto text-muted-foreground" />
                <div className="space-y-2">
                  <p className="text-lg font-medium">還沒有發出任何邀請</p>
                  <p className="text-muted-foreground">
                    瀏覽人才夥伴，邀請合適的創業夥伴加入你的專案
                  </p>
                </div>
                <div className="flex gap-2 justify-center">
                  <Button asChild>
                    <Link href="/talents">
                      <Search className="h-4 w-4 mr-2" />
                      尋找夥伴
                    </Link>
                  </Button>
                  <Button variant="outline" asChild>
                    <Link href="/projects/create">
                      創建專案
                    </Link>
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {sentInvitations.map((invitation) => (
                  <SentInvitationCard
                    key={invitation.id}
                    invitation={invitation}
                    onUpdate={loadInvitations}
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