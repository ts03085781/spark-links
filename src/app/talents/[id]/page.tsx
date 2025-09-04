'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/browser'
import { User } from '@/types'
import { TalentDetail } from '@/components/talents/TalentDetail'
import { PageLoading } from '@/components/ui/loading'
import { Button } from '@/components/ui/button'
import { ArrowLeft, UserX, Lock } from 'lucide-react'
import { toast } from 'sonner'


export default function TalentDetailPage() {
  const params = useParams()
  const router = useRouter()
  const userId = params.id as string
  
  const [talent, setTalent] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [isPrivate, setIsPrivate] = useState(false)

  const loadTalent = async () => {
    if (!userId) return

    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          setNotFound(true)
        } else {
          console.error('載入人才詳情失敗:', error)
          toast.error('載入失敗', {
            description: '請檢查網路連線或稍後再試',
          })
        }
        return
      }

      if (!data) {
        setNotFound(true)
        return
      }

      if (!(data as User).is_public) {
        setIsPrivate(true)
        return
      }

      setTalent(data)
    } catch (error) {
      console.error('載入人才詳情時發生錯誤:', error)
      toast.error('系統錯誤', {
        description: '發生未預期的錯誤，請稍後再試',
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadTalent()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId])

  if (loading) {
    return <PageLoading />
  }

  if (notFound) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center space-y-4">
        <UserX className="h-16 w-16 text-muted-foreground" />
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold">用戶不存在</h1>
          <p className="text-muted-foreground">
            抱歉，找不到此用戶或用戶資料不存在
          </p>
        </div>
        <Button 
          variant="outline" 
          onClick={() => router.back()}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          返回
        </Button>
      </div>
    )
  }

  if (isPrivate) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center space-y-4">
        <Lock className="h-16 w-16 text-muted-foreground" />
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold">資料設為私人</h1>
          <p className="text-muted-foreground">
            此用戶已將個人資料設為私人，無法查看詳細資訊
          </p>
        </div>
        <Button 
          variant="outline" 
          onClick={() => router.back()}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          返回
        </Button>
      </div>
    )
  }

  if (!talent) {
    return null
  }

  return (
    <div className="space-y-6">
      {/* 返回按鈕 */}
      <div className="flex items-center gap-4">
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => router.back()}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          返回
        </Button>
      </div>

      {/* 人才詳細資訊 */}
      <TalentDetail talent={talent} />
    </div>
  )
}