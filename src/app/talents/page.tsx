'use client'

import { useState, useEffect } from 'react'
import { useAuthStore } from '@/stores/auth'
import { createClient } from '@/lib/supabase/browser'
import { User, UserFilters } from '@/types'
import { TalentCard } from '@/components/talents/TalentCard'
import { TalentFilters } from '@/components/talents/TalentFilters'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PageLoading } from '@/components/ui/loading'
import { Users, Search, UserPlus } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

export default function TalentsPage() {
  const { user: currentUser } = useAuthStore()
  const [talents, setTalents] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchKeyword, setSearchKeyword] = useState('')
  const [filters, setFilters] = useState<UserFilters>({})

  const loadTalents = async () => {
    try {
      const supabase = createClient()
      let query = supabase
        .from('users')
        .select('*')
        .eq('is_public', true)
        .order('created_at', { ascending: false })

      // 不顯示自己
      if (currentUser) {
        query = query.neq('id', currentUser.id)
      }

      // 應用關鍵字篩選
      if (searchKeyword.trim()) {
        query = query.or(`name.ilike.%${searchKeyword}%,experience_description.ilike.%${searchKeyword}%,partner_description.ilike.%${searchKeyword}%`)
      }

      // 應用技能篩選
      if (filters.skills && filters.skills.length > 0) {
        query = query.overlaps('skills', filters.skills)
      }

      // 應用工作模式篩選
      if (filters.work_mode && filters.work_mode.length > 0) {
        query = query.in('work_mode', filters.work_mode)
      }

      // 應用地點偏好篩選
      if (filters.location_preference && filters.location_preference.length > 0) {
        query = query.in('location_preference', filters.location_preference)
      }

      const { data, error } = await query

      if (error) {
        console.error('載入人才失敗:', error)
        toast.error('載入人才失敗', {
          description: '請檢查網路連線或稍後再試',
        })
        return
      }

      setTalents(data || [])
    } catch (error) {
      console.error('載入人才時發生錯誤:', error)
      toast.error('系統錯誤', {
        description: '發生未預期的錯誤，請稍後再試',
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadTalents()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchKeyword, filters, currentUser])

  const handleSearch = (keyword: string) => {
    setSearchKeyword(keyword)
  }

  const handleFiltersChange = (newFilters: UserFilters) => {
    setFilters(newFilters)
  }

  if (loading) {
    return <PageLoading />
  }

  return (
    <div className="space-y-6">
      {/* 頁面標題 */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">創業夥伴</h1>
          <p className="text-muted-foreground">探索和連結志同道合的創業夥伴</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/profile">
              <UserPlus className="h-4 w-4 mr-2" />
              編輯我的資料
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

      {/* 搜尋和篩選 */}
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="搜尋夥伴名稱、經驗或專長..."
              value={searchKeyword}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
        <TalentFilters
          filters={filters}
          onFiltersChange={handleFiltersChange}
        />
      </div>

      {/* 統計資訊 */}
      <div className="bg-card p-4 rounded-lg border">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-muted-foreground" />
          <span className="text-2xl font-bold">{talents.length}</span>
          <span className="text-sm text-muted-foreground">位公開的創業夥伴</span>
        </div>
      </div>

      {/* 人才列表 */}
      <div className="space-y-4">
        {talents.length === 0 ? (
          <div className="bg-muted/50 p-8 rounded-lg text-center">
            <Users className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <p className="text-lg font-medium mb-2">
              {searchKeyword || Object.keys(filters).length > 0
                ? '沒有符合條件的創業夥伴'
                : '目前還沒有公開的創業夥伴'}
            </p>
            <p className="text-muted-foreground mb-4">
              {searchKeyword || Object.keys(filters).length > 0
                ? '試試調整搜尋條件或瀏覽專案找到合適的創業夢伴'
                : '鼓勵用戶公開個人資料以增加曝光度'}
            </p>
            <div className="flex gap-2 justify-center">
              <Button variant="outline" asChild>
                <Link href="/profile">
                  <UserPlus className="h-4 w-4 mr-2" />
                  編輯我的資料
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
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {talents.map((talent) => (
              <TalentCard key={talent.id} talent={talent} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}